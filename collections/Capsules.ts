import { CollectionConfig } from 'payload'
import { v4 as uuidv4 } from 'uuid'
import bcrypt from 'bcryptjs'

/**
 * Capsules Collection
 * Stores user-created memory capsules with text, photos, or voice messages
 * Supports scheduled delivery, password protection, and public sharing
 */
export const Capsules: CollectionConfig = {
  slug: 'capsules',
  
  // Allow creation without authentication for no-signup flow
  access: {
    create: () => true,
    read: ({ req, data }) => {
      // Allow reading via uniqueLink in API routes
      // Access control will be handled in API routes with password verification
      return true
    },
    update: () => false, // Capsules are immutable once created
    delete: ({ req }) => {
      // Only allow admin users to delete capsules
      return !!req.user
    },
  },

  // Admin panel configuration
  admin: {
    useAsTitle: 'uniqueLink',
    defaultColumns: ['contentType', 'deliveryDate', 'isPublic', 'isPaid', 'createdAt'],
    description: 'Digital time capsules created by users',
  },

  // Hooks
  hooks: {
    afterDelete: [
      async ({ req, doc }) => {
        // Delete related public capsule entry if it exists
        if (doc.isPublic) {
          try {
            const publicCapsules = await req.payload.find({
              collection: 'publicCapsules',
              where: {
                originalCapsuleId: {
                  equals: doc.id,
                },
              },
              limit: 1,
            });

            if (publicCapsules.docs.length > 0) {
              await req.payload.delete({
                collection: 'publicCapsules',
                id: publicCapsules.docs[0].id,
              });
              console.log(`🗑️ Also deleted public capsule entry for: ${doc.uniqueLink}`);
            }
          } catch (error) {
            console.error('⚠️ Error deleting related public capsule:', error);
          }
        }
      },
    ],
  },

  // Collection fields
  fields: [
    {
      name: 'contentType',
      type: 'select',
      required: true,
      options: [
        { label: 'Text Message', value: 'text' },
        { label: 'Photo Memory', value: 'photo' },
        { label: 'Voice Recording', value: 'voice' },
      ],
      admin: {
        description: 'Type of content stored in this capsule',
      },
    },
    {
      name: 'textContent',
      type: 'textarea',
      maxLength: 2500, // Approximately 500 words
      admin: {
        description: 'Written message content (max 500 words)',
        condition: (data) => data.contentType === 'text' || data.isPublic,
      },
      validate: (value, { data }) => {
        // Validate word count (approximately 5 characters per word)
        if (value && value.length > 0) {
          const wordCount = value.trim().split(/\s+/).length
          if (wordCount > 500) {
            return `Text content must be 500 words or less (currently ${wordCount} words)`
          }
        }
        
        // Require text content for public capsules
        if (data?.isPublic && (!value || value.trim().length === 0)) {
          return 'Text content is required for public capsules'
        }
        
        return true
      },
    },
    {
      name: 'media',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description: 'Photo (JPEG/PNG, max 5MB) or voice recording (MP3/WAV, max 5MB)',
        condition: (data) => data.contentType === 'photo' || data.contentType === 'voice',
      },
      validate: (value, { data }) => {
        // Require media for photo/voice capsules if no text content
        if ((data?.contentType === 'photo' || data?.contentType === 'voice') && 
            !value && (!data?.textContent || data.textContent.trim().length === 0)) {
          return 'Media file is required for photo and voice capsules'
        }
        return true
      },
    },
    {
      name: 'deliveryDate',
      type: 'date',
      required: true,
      admin: {
        description: 'Date when the capsule will be delivered via email',
        date: {
          pickerAppearance: 'dayAndTime',
        },
      },
      validate: (value, { data }) => {
        if (!value) return 'Delivery date is required'
        
        const date = new Date(value)
        const now = new Date()
        const maxDate = new Date()
        
        // Set maximum date to 20 years from now
        maxDate.setFullYear(maxDate.getFullYear() + 20)
        
        // Always enforce the upper limit
        if (date > maxDate) {
          return 'Delivery date cannot be more than 20 years in the future'
        }
        
        // Skip minimum date validation if testMode is enabled
        const isTestMode = data?.testMode === true
        if (!isTestMode) {
          const minDate = new Date()
          minDate.setMonth(minDate.getMonth() + 1)
          
          if (date < minDate) {
            return 'Delivery date must be at least 1 month in the future'
          }
        }
        
        return true
      },
    },
    {
      name: 'recipients',
      type: 'array',
      maxRows: 3,
      admin: {
        description: 'Email addresses to receive the capsule (max 3, optional)',
      },
      fields: [
        {
          name: 'email',
          type: 'email',
          required: true,
          validate: (value) => {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
            if (!emailRegex.test(value)) {
              return 'Please enter a valid email address'
            }
            return true
          },
        },
      ],
    },
    // SMS functionality commented out
    /*
    {
      name: 'phoneRecipients',
      type: 'array',
      maxRows: 3,
      admin: {
        description: 'Phone numbers to receive SMS notifications (max 3, optional)',
      },
      fields: [
        {
          name: 'phone',
          type: 'text',
          required: true,
          validate: (value) => {
            // Remove all non-digit characters for validation
            const digitsOnly = value.replace(/\D/g, '');
            
            // Check for valid length (7-15 digits for international numbers)
            if (digitsOnly.length < 7 || digitsOnly.length > 15) {
              return 'Please enter a valid phone number (7-15 digits)';
            }
            
            return true;
          },
        },
      ],
    },
    */
    {
      name: 'uniqueLink',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: {
        readOnly: true,
        description: 'Auto-generated unique identifier for accessing the capsule',
      },
    },
    {
      name: 'password',
      type: 'text',
      admin: {
        description: 'Optional password to secure the capsule (will be hashed)',
      },
      validate: (value) => {
        if (value && value.length < 6) {
          return 'Password must be at least 6 characters long'
        }
        return true
      },
    },
    {
      name: 'isPublic',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Share anonymously in public gallery (text-only capsules)',
      },
      validate: (value, { data }) => {
        if (value && data?.contentType !== 'text') {
          return 'Only text capsules can be made public'
        }
        return true
      },
    },
    {
      name: 'isPaid',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Indicates if this capsule was purchased for $1',
      },
    },
    {
      name: 'stripePaymentId',
      type: 'text',
      admin: {
        description: 'Stripe Checkout session ID for paid capsules',
        condition: (data) => data.isPaid,
      },
    },
    {
      name: 'userEmail',
      type: 'email',
      admin: {
        description: 'Creator email for notifications and payment confirmation',
      },
    },
    // SMS functionality commented out
    /*
    {
      name: 'userPhone',
      type: 'text',
      admin: {
        description: 'Creator phone number for SMS notifications',
      },
      validate: (value) => {
        if (value) {
          // Remove all non-digit characters for validation
          const digitsOnly = value.replace(/\D/g, '');
          
          // Check for valid length (7-15 digits for international numbers)
          if (digitsOnly.length < 7 || digitsOnly.length > 15) {
            return 'Please enter a valid phone number (7-15 digits)';
          }
        }
        return true;
      },
    },
    */
    {
      name: 'status',
      type: 'select',
      defaultValue: 'scheduled',
      options: [
        { label: 'Scheduled', value: 'scheduled' },
        { label: 'Delivered', value: 'delivered' },
        { label: 'Failed', value: 'failed' },
      ],
      admin: {
        description: 'Current delivery status of the capsule',
      },
    },
    {
      name: 'scheduledJobId',
      type: 'text',
      admin: {
        description: 'ID of the scheduled email delivery job',
      },
    },
    {
      name: 'deliveredAt',
      type: 'date',
      admin: {
        description: 'Timestamp when the capsule was successfully delivered',
        condition: (data) => data.status === 'delivered',
      },
    },
    {
      name: 'testMode',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Enables flexible date validation for testing purposes',
        hidden: true, // Hide from admin UI as this is API-only
      },
    },
    {
      name: 'notificationsSent',
      type: 'text',
      admin: {
        description: 'Comma-separated list of pre-opening notifications sent (1hour,30min,10min)',
        readOnly: true,
      },
    },
  ],

  // Hooks for auto-generation and processing
  hooks: {
    beforeCreate: [
      async ({ data }) => {
        // Generate unique link using UUID
        if (!data.uniqueLink) {
          data.uniqueLink = uuidv4()
        }
        
        // Hash password if provided
        if (data.password) {
          const saltRounds = 12
          data.password = await bcrypt.hash(data.password, saltRounds)
        }
        
        // Set creation timestamp
        data.createdAt = new Date()
        
        return data
      },
    ],
    
    afterCreate: [
      async ({ doc, req }) => {
        // Create public capsule entry if marked as public
        if (doc.isPublic && doc.textContent) {
          try {
            // Generate simple tags from text content
            const tags = generateTagsFromText(doc.textContent)
            
            await req.payload.create({
              collection: 'publicCapsules',
              data: {
                originalCapsuleId: doc.id,
                textContent: doc.textContent,
                tags,
                createdAt: new Date(),
              },
            })
            
            console.log(`✅ Created public capsule entry for capsule: ${doc.id}`)
          } catch (error) {
            console.error('❌ Failed to create public capsule entry:', error)
          }
        }
      },
    ],
  },

  // Timestamps
  timestamps: true,
}

/**
 * Generate tags from text content using simple keyword extraction
 * @param text - Text content to analyze
 * @returns Array of relevant tags
 */
function generateTagsFromText(text: string): string[] {
  // Common emotional and thematic keywords
  const keywordMap: Record<string, string[]> = {
    love: ['love', 'heart', 'romance', 'relationship', 'partner', 'boyfriend', 'girlfriend', 'husband', 'wife'],
    family: ['family', 'mom', 'dad', 'mother', 'father', 'parent', 'child', 'kids', 'baby', 'sibling'],
    friendship: ['friend', 'friendship', 'buddy', 'pal', 'companion'],
    gratitude: ['thank', 'grateful', 'appreciate', 'blessing', 'thankful'],
    hope: ['hope', 'dream', 'wish', 'future', 'goal', 'aspiration'],
    achievement: ['success', 'achievement', 'accomplish', 'goal', 'victory', 'win', 'graduate'],
    memory: ['memory', 'remember', 'nostalgia', 'past', 'childhood', 'moment'],
    growth: ['learn', 'grow', 'change', 'improve', 'better', 'progress'],
    challenge: ['difficult', 'hard', 'struggle', 'challenge', 'overcome'],
    celebration: ['celebrate', 'party', 'birthday', 'anniversary', 'holiday', 'wedding'],
  }
  
  const lowerText = text.toLowerCase()
  const foundTags: string[] = []
  
  // Check for keyword matches
  Object.entries(keywordMap).forEach(([tag, keywords]) => {
    if (keywords.some(keyword => lowerText.includes(keyword))) {
      foundTags.push(tag)
    }
  })
  
  // Add some general tags based on content length and style
  if (text.length > 1000) foundTags.push('detailed')
  if (text.includes('?')) foundTags.push('reflective')
  if (text.includes('!')) foundTags.push('emotional')
  
  // Return unique tags, max 5
  return [...new Set(foundTags)].slice(0, 5)
} 