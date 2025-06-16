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
    user: 'users', // We'll create a simple users collection for admin access
    bundler: undefined, // Use default bundler
    meta: {
      titleSuffix: '- Memory Capsule Admin',
      favicon: '/favicon.ico',
      ogImage: '/og-image.jpg',
    },
    css: path.resolve(__dirname, './admin.css'), // Custom admin styles (optional)
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
          name: 'role',
          type: 'select',
          required: true,
          defaultValue: 'admin',
          options: [
            { label: 'Admin', value: 'admin' },
            { label: 'Moderator', value: 'moderator' },
          ],
        },
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
      // Add any additional rich text features here
    ],
  }),

  // Database configuration
  db: mongooseAdapter({
    url: process.env.MONGODB_URI || 'mongodb://localhost:27017/memory-capsule',
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
    // Add your production domain here
    process.env.NEXT_PUBLIC_APP_URL || '',
  ].filter(Boolean),

  // CSRF protection
  csrf: [
    'http://localhost:3000',
    'https://localhost:3000',
    // Add your production domain here
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
  secret: process.env.PAYLOAD_SECRET || 'your-secret-key-here',

  // Localization (optional - can be expanded for multi-language support)
  localization: false,

  // Rate limiting (optional - for production security)
  rateLimit: {
    max: 1000, // Limit each IP to 1000 requests per windowMs
    window: 15 * 60 * 1000, // 15 minutes
    skip: (req) => {
      // Skip rate limiting for admin panel
      return req.url?.startsWith('/admin')
    },
  },

  // Email configuration with Resend
  email: resendAdapter({
    defaultFromAddress: process.env.RESEND_FROM_EMAIL || 'info@wanderingbartender.com',
    defaultFromName: 'Memory Capsule Creator',
    apiKey: process.env.RESEND_API_KEY || '',
  }),

  // Plugins (can be extended with additional Payload plugins)
  plugins: [
    // Add plugins here as needed
  ],

  // Global configuration
  globals: [
    // Add global configurations here (e.g., site settings)
    {
      slug: 'settings',
      fields: [
        {
          name: 'siteName',
          type: 'text',
          defaultValue: 'Memory Capsule Creator',
        },
        {
          name: 'siteDescription',
          type: 'textarea',
          defaultValue: 'Create digital time capsules with your thoughts, photos, and voice messages.',
        },
        {
          name: 'maintenanceMode',
          type: 'checkbox',
          defaultValue: false,
          admin: {
            description: 'Enable maintenance mode to temporarily disable capsule creation',
          },
        },
        {
          name: 'maxCapsulesPerDay',
          type: 'number',
          defaultValue: 10,
          admin: {
            description: 'Maximum number of capsules that can be created per IP per day',
          },
        },
        {
          name: 'stripePublishableKey',
          type: 'text',
          admin: {
            description: 'Stripe publishable key for $1 capsule payments',
          },
        },
      ],
      access: {
        read: () => true,
        update: ({ req }) => {
          // Only admins can update settings
          return req.user?.role === 'admin'
        },
      },
    },
  ],

  // Hooks (global)
  hooks: {
    beforeChange: [
      async ({ req }) => {
        // Log all changes for audit purposes
        if (req.user) {
          console.log(`🔄 Change initiated by user: ${req.user.email}`)
        }
      },
    ],
  },

  // Custom endpoints (optional)
  endpoints: [
    // Add custom API endpoints here if needed
    {
      path: '/health',
      method: 'get',
      handler: async (req, res) => {
        res.status(200).json({
          status: 'healthy',
          timestamp: new Date().toISOString(),
          version: '1.0.0',
        })
      },
    },
  ],
})
