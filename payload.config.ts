import { mongooseAdapter } from '@payloadcms/db-mongodb'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { buildConfig } from 'payload'
import path from 'path'

// Import collections
import { Capsules } from './collections/Capsules'
import { PublicCapsules } from './collections/PublicCapsules'
import { Media } from './collections/Media'

// Production environment check
const isProduction = process.env.NODE_ENV === 'production'

// Validate required environment variables
if (isProduction) {
  const requiredVars = ['DATABASE_URI', 'PAYLOAD_SECRET', 'NEXT_PUBLIC_APP_URL']
  const missing = requiredVars.filter(varName => !process.env[varName])
  
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:', missing.join(', '))
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`)
  }
}

console.log('🔧 Payload Config Loading:', {
  environment: process.env.NODE_ENV,
  hasDatabase: !!process.env.DATABASE_URI,
  hasSecret: !!process.env.PAYLOAD_SECRET,
  appUrl: process.env.NEXT_PUBLIC_APP_URL
})

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
    // Force admin routes in production
    disable: false,
    // Add base URL for production
    ...(isProduction && process.env.NEXT_PUBLIC_APP_URL && {
      baseURL: process.env.NEXT_PUBLIC_APP_URL,
    }),
  },

  // Server URL configuration
  serverURL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',

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
        useAPIKey: false, // Disable API key auth for simplicity
      },
      admin: {
        useAsTitle: 'email',
        description: 'Admin users for managing the Memory Capsule platform',
        defaultColumns: ['email', 'firstName', 'lastName', 'createdAt'],
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

  // Database configuration with production optimizations
  db: mongooseAdapter({
    url: process.env.DATABASE_URI || 'mongodb://localhost:27017/memory-capsule',
    connectOptions: {
      dbName: 'memory-capsule',
      // Production-specific options
      ...(isProduction && {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        family: 4, // Use IPv4, skip trying IPv6
        retryWrites: true,
        w: 'majority',
      }),
    },
  }),

  // TypeScript configuration
  typescript: {
    outputFile: path.resolve(__dirname, 'payload-types.ts'),
  },

  // GraphQL configuration
  graphQL: {
    schemaOutputFile: path.resolve(__dirname, 'generated-schema.graphql'),
    disable: false, // Enable GraphQL for admin panel
  },

  // CORS configuration for production
  cors: [
    'http://localhost:3000',
    'https://localhost:3000',
    ...(process.env.NEXT_PUBLIC_APP_URL ? [process.env.NEXT_PUBLIC_APP_URL] : []),
    // Add common deployment platforms
    ...(isProduction ? [
      '*.vercel.app',
      '*.netlify.app',
      '*.herokuapp.com',
      '*.railway.app',
    ] : []),
  ].filter(Boolean),

  // CSRF protection
  csrf: [
    'http://localhost:3000',
    'https://localhost:3000',
    ...(process.env.NEXT_PUBLIC_APP_URL ? [process.env.NEXT_PUBLIC_APP_URL] : []),
  ].filter(Boolean),

  // File upload configuration
  upload: {
    limits: {
      fileSize: 5000000, // 5MB limit
    },
  },

  // Email configuration disabled for now (configure separately if needed)

  // Sharp configuration - only in development
  ...(isProduction ? {} : (() => {
    try {
      const sharp = require('sharp')
      return { sharp }
    } catch (e) {
      console.warn('Sharp not available, image optimization disabled')
      return {}
    }
  })()),

  // Environment-specific configuration
  secret: process.env.PAYLOAD_SECRET || (() => {
    if (isProduction) {
      throw new Error('PAYLOAD_SECRET environment variable is required in production')
    }
    return 'development-secret-not-for-production'
  })(),

  // Disable telemetry in production
  telemetry: !isProduction,
})
