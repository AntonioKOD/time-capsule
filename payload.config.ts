import { mongooseAdapter } from '@payloadcms/db-mongodb'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { resendAdapter } from '@payloadcms/email-resend'
import { buildConfig } from 'payload'
import path from 'path'
import sharp from 'sharp'

// Import collections
import { Capsules } from './collections/Capsules'
import { PublicCapsules } from './collections/PublicCapsules'
import { Media } from './collections/Media'

/**
 * Payload CMS Configuration for Memory Capsule Creator
 * 
 * This configuration sets up:
 * - Capsules: Main collection for user-created time capsules
 * - PublicCapsules: Anonymous public capsules for the gallery
 * - Media: File uploads for photos and voice recordings
 * 
 * Features:
 * - No-signup flow (anonymous capsule creation)
 * - File upload support with validation
 * - MongoDB database with proper indexing
 * - TypeScript type generation
 * - Next.js App Router compatibility
 */
export default buildConfig({
  // Admin panel configuration
  admin: {
    user: 'users',
    meta: {
      titleSuffix: '- Memory Capsule Admin',
    },
  },

  // Collections configuration
  collections: [
    Capsules,
    PublicCapsules,
    Media,
    // Simple users collection for admin access
    {
      slug: 'users',
      auth: {
        tokenExpiration: 7200, // 2 hours
        verify: false, // No email verification needed for admin
        maxLoginAttempts: 5,
        lockTime: 600 * 1000, // 10 minutes
      },
      admin: {
        useAsTitle: 'email',
        description: 'Admin users for managing the Memory Capsule platform',
      },
      fields: [
        {
          name: 'firstName',
          type: 'text',
          required: true,
        },
        {
          name: 'lastName',
          type: 'text',
          required: true,
        },
      ],
      access: {
        create: () => true, // Allow first admin user creation
        read: () => true,
        update: () => true,
        delete: () => false, // Prevent accidental admin deletion
      },
    },
  ],

  // Rich text editor configuration
  editor: lexicalEditor({
    features: ({ defaultFeatures }) => [
      ...defaultFeatures,
    ],
  }),

  // Database configuration
  db: mongooseAdapter({
    url: process.env.DATABASE_URI || 'mongodb://localhost:27017/memory-capsule',
    connectOptions: {
      dbName: 'memory-capsule',
    },
  }),

  // TypeScript configuration
  typescript: {
    outputFile: path.resolve(__dirname, 'payload-types.ts'),
  },

  // GraphQL configuration
  graphQL: {
    schemaOutputFile: path.resolve(__dirname, 'generated-schema.graphql'),
  },

  // CORS configuration for Next.js integration
  cors: [
    'http://localhost:3000',
    'https://localhost:3000',
    process.env.NEXT_PUBLIC_APP_URL || '',
  ].filter(Boolean),

  // CSRF protection
  csrf: [
    'http://localhost:3000',
    'https://localhost:3000',
    process.env.NEXT_PUBLIC_APP_URL || '',
  ].filter(Boolean),

  // File upload configuration
  upload: {
    limits: {
      fileSize: 5000000, // 5MB limit
    },
  },

  // Sharp for image processing
  sharp,

  // Environment-specific configuration
  secret: process.env.PAYLOAD_SECRET || 'jkhdas0919391iosjkdasi00u30akjd',
})

// Helper functions for tag generation and sentiment analysis
export function generateTagsFromText(text: string): string[] {
  // Simple tag extraction based on common keywords
  const keywords = [
    'love', 'family', 'friend', 'hope', 'dream', 'future', 'past', 'memory',
    'happy', 'sad', 'excited', 'scared', 'grateful', 'proud', 'sorry',
    'work', 'school', 'travel', 'home', 'birthday', 'wedding', 'graduation',
    'baby', 'child', 'parent', 'grandparent', 'pet', 'health', 'success'
  ]
  
  const textLower = text.toLowerCase()
  const foundTags = keywords.filter(keyword => textLower.includes(keyword))
  
  // Limit to 5 tags maximum
  return foundTags.slice(0, 5)
}

export function detectSentiment(text: string): 'positive' | 'neutral' | 'negative' {
  const positiveWords = ['happy', 'love', 'excited', 'grateful', 'proud', 'amazing', 'wonderful', 'great', 'fantastic', 'perfect']
  const negativeWords = ['sad', 'angry', 'disappointed', 'worried', 'scared', 'terrible', 'awful', 'horrible', 'hate', 'regret']
  
  const textLower = text.toLowerCase()
  const positiveCount = positiveWords.filter(word => textLower.includes(word)).length
  const negativeCount = negativeWords.filter(word => textLower.includes(word)).length
  
  if (positiveCount > negativeCount) return 'positive'
  if (negativeCount > positiveCount) return 'negative'
  return 'neutral'
}

export function sanitizeText(text: string): string {
  // Basic XSS prevention
  return text
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
}
