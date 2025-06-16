/* eslint-disable @typescript-eslint/no-explicit-any */
// @ts-nocheck
import { CollectionConfig } from 'payload'

/**
 * PublicCapsules Collection
 * Stores anonymous text-only capsules for the public gallery
 * Created automatically when a Capsule is marked as public
 */
export const PublicCapsules: CollectionConfig = {
  slug: 'publicCapsules',
  
  // Access control - read-only for public, create only via hooks
  access: {
    create: () => false, // Only created via Capsules hook
    read: () => true,    // Public read access for gallery
    update: () => false, // Immutable once created
    delete: () => false, // Should not be deleted
  },

  // Admin panel configuration
  admin: {
    useAsTitle: 'textContent',
    defaultColumns: ['textContent', 'tags', 'createdAt'],
    description: 'Anonymous public capsules displayed in the gallery',
    listSearchableFields: ['textContent', 'tags'],
  },

  // Collection fields
  fields: [
    {
      name: 'originalCapsuleId',
      type: 'text',
      required: true,
      index: true,
      admin: {
        description: 'Reference to the original capsule (for admin purposes only)',
        readOnly: true,
      },
    },
    {
      name: 'textContent',
      type: 'textarea',
      required: true,
      maxLength: 2500, // Approximately 500 words
      admin: {
        description: 'Anonymous text content shared publicly',
        readOnly: true,
      },
      validate: (value) => {
        if (!value || value.trim().length === 0) {
          return 'Text content is required for public capsules'
        }
        
        const wordCount = value.trim().split(/\s+/).length
        if (wordCount > 500) {
          return `Text content must be 500 words or less (currently ${wordCount} words)`
        }
        
        return true
      },
    },
    {
      name: 'tags',
      type: 'array',
      maxRows: 10,
      admin: {
        description: 'Auto-generated tags for categorization and discovery',
      },
      fields: [
        {
          name: 'tag',
          type: 'text',
          required: true,
          validate: (value) => {
            if (!value || value.trim().length === 0) {
              return 'Tag cannot be empty'
            }
            if (value.length > 50) {
              return 'Tag must be 50 characters or less'
            }
            return true
          },
        },
      ],
    },
    {
      name: 'sentiment',
      type: 'select',
      options: [
        { label: 'Positive', value: 'positive' },
        { label: 'Neutral', value: 'neutral' },
        { label: 'Negative', value: 'negative' },
      ],
      admin: {
        description: 'Auto-detected emotional sentiment of the content',
      },
    },
    {
      name: 'wordCount',
      type: 'number',
      admin: {
        description: 'Number of words in the text content',
        readOnly: true,
      },
    },
    {
      name: 'featured',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Mark as featured for highlighting in the gallery',
      },
    },
    {
      name: 'reportCount',
      type: 'number',
      defaultValue: 0,
      admin: {
        description: 'Number of times this capsule has been reported',
      },
    },
    {
      name: 'isHidden',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Hide from public gallery (for moderation)',
      },
    },
  ],

  // Hooks for processing and validation
  hooks: {
    beforeCreate: [
      async ({ data }) => {
        // Calculate word count
        if (data.textContent) {
          data.wordCount = data.textContent.trim().split(/\s+/).length
        }
        
        // Auto-detect sentiment if not provided
        if (!data.sentiment && data.textContent) {
          data.sentiment = detectSentiment(data.textContent)
        }
        
        // Ensure creation timestamp
        if (!data.createdAt) {
          data.createdAt = new Date()
        }
        
        return data
      },
    ],
    
    beforeValidate: [
      async ({ data }) => {
        // Sanitize text content to prevent XSS
        if (data.textContent) {
          data.textContent = sanitizeText(data.textContent)
        }
        
        // Validate and clean tags
        if (data.tags && Array.isArray(data.tags)) {
          data.tags = data.tags
            .filter(tagObj => tagObj.tag && tagObj.tag.trim().length > 0)
            .map(tagObj => ({
              tag: tagObj.tag.toLowerCase().trim()
            }))
            // Remove duplicates
            .filter((tagObj, index, arr) => 
              arr.findIndex(t => t.tag === tagObj.tag) === index
            )
        }
        
        return data
      },
    ],
  },

  // Timestamps
  timestamps: true,
}

/**
 * Simple sentiment analysis based on keyword matching
 * @param text - Text content to analyze
 * @returns Detected sentiment
 */
function detectSentiment(text: string): 'positive' | 'neutral' | 'negative' {
  const positiveWords = [
    'happy', 'joy', 'love', 'excited', 'amazing', 'wonderful', 'great', 'fantastic',
    'awesome', 'brilliant', 'excellent', 'perfect', 'beautiful', 'grateful', 'thankful',
    'blessed', 'hope', 'dream', 'success', 'achievement', 'celebration', 'victory',
    'proud', 'accomplished', 'thrilled', 'delighted', 'optimistic', 'confident'
  ]
  
  const negativeWords = [
    'sad', 'angry', 'hate', 'terrible', 'awful', 'horrible', 'bad', 'worst',
    'disappointed', 'frustrated', 'worried', 'anxious', 'depressed', 'lonely',
    'scared', 'afraid', 'upset', 'hurt', 'pain', 'loss', 'failure', 'devastated',
    'heartbroken', 'miserable', 'hopeless', 'regret', 'sorry', 'difficult'
  ]
  
  const words = text.toLowerCase().split(/\s+/)
  let positiveScore = 0
  let negativeScore = 0
  
  words.forEach(word => {
    if (positiveWords.includes(word)) positiveScore++
    if (negativeWords.includes(word)) negativeScore++
  })
  
  // Determine sentiment based on scores
  if (positiveScore > negativeScore + 1) return 'positive'
  if (negativeScore > positiveScore + 1) return 'negative'
  return 'neutral'
}

/**
 * Sanitize text content to prevent XSS attacks
 * @param text - Text to sanitize
 * @returns Sanitized text
 */
function sanitizeText(text: string): string {
  return text
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .trim()
} 