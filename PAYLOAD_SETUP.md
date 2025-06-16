# Memory Capsule Creator - Payload CMS Setup Guide

This guide covers the complete setup and configuration of Payload CMS for the Memory Capsule Creator application.

## 📋 Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Collections](#collections)
- [API Integration](#api-integration)
- [Development](#development)
- [Production Deployment](#production-deployment)
- [Troubleshooting](#troubleshooting)

## 🎯 Overview

The Memory Capsule Creator uses Payload CMS with three main collections:

1. **Capsules** - Main collection for user-created time capsules
2. **PublicCapsules** - Anonymous public capsules for the gallery
3. **Media** - File uploads for photos and voice recordings

### Key Features

- ✅ No-signup flow (anonymous capsule creation)
- ✅ File upload support with validation
- ✅ MongoDB database with proper indexing
- ✅ TypeScript type generation
- ✅ Next.js App Router compatibility
- ✅ Automatic public capsule creation
- ✅ Password hashing and security
- ✅ Email scheduling integration

## 🔧 Prerequisites

Before setting up Payload CMS, ensure you have:

- Node.js 20.9.0 or higher
- MongoDB database (local or MongoDB Atlas)
- Next.js 15+ project
- TypeScript configured

## 📦 Installation

1. **Install Payload CMS packages:**

```bash
npm install payload @payloadcms/next @payloadcms/richtext-lexical @payloadcms/db-mongodb graphql uuid bcryptjs sharp
```

2. **Install TypeScript types:**

```bash
npm install --save-dev @types/uuid @types/bcryptjs
```

## ⚙️ Configuration

### 1. Environment Variables

Copy `env.example` to `.env.local` and configure:

```bash
# Required
MONGODB_URI=mongodb://localhost:27017/memory-capsule
PAYLOAD_SECRET=your-super-secure-secret-key-here-32-characters-minimum
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Optional (for full functionality)
AWS_ACCESS_KEY_ID=your-aws-access-key-id
AWS_SECRET_ACCESS_KEY=your-aws-secret-access-key
AWS_REGION=us-east-1
FROM_EMAIL=info@timecapsul.co
FROM_NAME=Memory Capsule Creator
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
```

### 2. Next.js Configuration

The `next.config.ts` is already configured with the Payload plugin:

```typescript
import { withPayload } from '@payloadcms/next/withPayload'
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    reactCompiler: false,
  },
};

export default withPayload(nextConfig);
```

### 3. TypeScript Configuration

The `tsconfig.json` includes the Payload config path:

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./*"],
      "@payload-config": ["./payload.config.ts"]
    }
  }
}
```

## 📊 Collections

### Capsules Collection

**Purpose:** Main collection for user-created memory capsules

**Key Fields:**
- `contentType`: Enum (text, photo, voice)
- `textContent`: Text field (max 500 words)
- `media`: Upload field for photos/voice recordings
- `deliveryDate`: Date field for email delivery
- `recipients`: Array of email addresses (max 3)
- `uniqueLink`: Auto-generated UUID for access
- `password`: Optional hashed password
- `isPublic`: Boolean for public gallery sharing
- `isPaid`: Boolean for $1 payment tracking
- `stripePaymentId`: Stripe session ID
- `userEmail`: Creator's email

**Access Control:**
- Create: Public (no authentication required)
- Read: Via uniqueLink and password verification
- Update/Delete: Disabled (immutable)

**Hooks:**
- `beforeCreate`: Generate UUID, hash password
- `afterCreate`: Create public capsule if `isPublic: true`

### PublicCapsules Collection

**Purpose:** Anonymous public capsules for the gallery

**Key Fields:**
- `originalCapsuleId`: Reference to original capsule
- `textContent`: Anonymous text content
- `tags`: Auto-generated categorization tags
- `sentiment`: Auto-detected emotional sentiment
- `wordCount`: Calculated word count
- `featured`: Admin-controlled featured status

**Access Control:**
- Create: Only via Capsules hook
- Read: Public access
- Update/Delete: Disabled

**Features:**
- Automatic sentiment analysis
- Tag generation from content
- XSS protection and sanitization

### Media Collection

**Purpose:** File uploads for photos and voice recordings

**Configuration:**
- Local storage: `./media` directory
- File size limit: 5MB
- Supported formats:
  - Images: JPEG, PNG
  - Audio: MP3, WAV, M4A
- Image optimization with WebP conversion

**Validation:**
- File size checking
- MIME type validation
- Duration limits for audio (client-side)

## 🔌 API Integration

### REST API Endpoints

Payload automatically generates REST API endpoints:

```
GET    /api/capsules              # List capsules (admin only)
POST   /api/capsules              # Create new capsule
GET    /api/capsules/:id          # Get specific capsule
PATCH  /api/capsules/:id          # Update capsule (disabled)
DELETE /api/capsules/:id          # Delete capsule (disabled)

GET    /api/publicCapsules        # List public capsules
GET    /api/publicCapsules/:id    # Get specific public capsule

POST   /api/media                 # Upload media file
GET    /api/media/:id             # Get media file
```

### GraphQL API

Available at `/api/graphql` with playground at `/api/graphql-playground`

### Custom Integration

The app includes custom API routes that integrate with Payload:

```typescript
// app/api/capsules/route.ts
import { getPayloadHMR } from '@payloadcms/next/utilities'

const payload = await getPayloadHMR({ config })

// Create capsule
const capsule = await payload.create({
  collection: 'capsules',
  data: capsuleData,
})
```

## 🚀 Development

### 1. Start MongoDB

```bash
# Local MongoDB
mongod

# Or use MongoDB Atlas connection string in .env.local
```

### 2. Start Development Server

```bash
npm run dev
```

### 3. Access Admin Panel

Visit `http://localhost:3000/admin` to access the Payload admin panel.

**First-time setup:**
1. Create your first admin user
2. Configure site settings in Globals
3. Test capsule creation

### 4. Generate Types

Payload automatically generates TypeScript types in `payload-types.ts`:

```bash
# Types are generated automatically, but you can force regeneration:
npx payload generate:types
```

## 🏭 Production Deployment

### 1. Environment Setup

```bash
# Production environment variables
NODE_ENV=production
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/memory-capsule
PAYLOAD_SECRET=your-production-secret-key
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

### 2. Database Migration

```bash
# Payload handles schema migrations automatically
# Ensure your MongoDB instance is accessible
```

### 3. File Storage

For production, configure cloud storage (AWS S3):

```typescript
// In payload.config.ts, add S3 adapter
import { s3Adapter } from '@payloadcms/plugin-cloud-storage/s3'

export default buildConfig({
  plugins: [
    s3Adapter({
      collections: {
        media: {
          bucket: process.env.AWS_S3_BUCKET,
          prefix: 'media',
        },
      },
      config: {
        region: process.env.AWS_S3_REGION,
        credentials: {
          accessKeyId: process.env.AWS_S3_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_S3_SECRET_ACCESS_KEY,
        },
      },
    }),
  ],
})
```

### 4. Build and Deploy

```bash
npm run build
npm start
```

## 🔍 Troubleshooting

### Common Issues

**1. MongoDB Connection Error**
```
Error: MongooseError: Operation `capsules.insertOne()` buffering timed out
```
**Solution:** Check MongoDB URI and network connectivity

**2. File Upload Issues**
```
Error: File size exceeds limit
```
**Solution:** Check file size (5MB limit) and MIME types

**3. TypeScript Errors**
```
Cannot find module '@payload-config'
```
**Solution:** Ensure tsconfig.json has the correct path mapping

**4. Admin Panel 404**
```
404 - Page not found at /admin
```
**Solution:** Verify Payload routes are properly set up in `app/(payload)/`

### Debug Mode

Enable debug logging:

```bash
DEBUG=true npm run dev
```

### Database Inspection

Use MongoDB Compass or CLI to inspect collections:

```bash
mongo memory-capsule
db.capsules.find().pretty()
db.publicCapsules.find().pretty()
```

## 📚 Additional Resources

- [Payload CMS Documentation](https://payloadcms.com/docs)
- [Next.js Integration Guide](https://payloadcms.com/docs/getting-started/installation#adding-to-an-existing-app)
- [MongoDB Atlas Setup](https://www.mongodb.com/cloud/atlas)
- [AWS SES Configuration](https://docs.aws.amazon.com/ses/)
- [Stripe Integration](https://stripe.com/docs)

## 🤝 Support

For issues specific to the Memory Capsule Creator:

1. Check this documentation
2. Review the troubleshooting section
3. Check the console for error messages
4. Verify environment variables are set correctly

For Payload CMS issues:
- [Payload Discord Community](https://discord.gg/payload)
- [GitHub Issues](https://github.com/payloadcms/payload/issues) 