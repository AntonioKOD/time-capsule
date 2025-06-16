# Memory Capsule Creator - Setup Guide

## Overview
A Next.js application for creating digital time capsules with text, photos, or voice messages, inspired by FutureMe.org's nostalgic aesthetic.

## Features
- ✨ Create text, photo, or voice memory capsules
- 📅 Schedule delivery up to 20 years in the future
- 📧 Email delivery to multiple recipients
- 🔒 Optional password protection
- 🌍 Public gallery for text capsules
- 📱 Mobile-responsive design
- ♿ WCAG 2.1 AA accessibility compliance

## Tech Stack
- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS v4
- **UI Components**: Shadcn UI, Radix UI primitives
- **Backend**: Payload CMS, MongoDB
- **Email**: AWS SES
- **Styling**: Modern gradient design with violet/indigo/cyan theme

## Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```bash
# Application
NEXT_PUBLIC_BASE_URL=http://localhost:3000

# Payload CMS
PAYLOAD_SECRET=your-payload-secret-key-here
DATABASE_URI=mongodb://localhost:27017/memory-capsule

# AWS SES Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-aws-access-key-id
AWS_SECRET_ACCESS_KEY=your-aws-secret-access-key
SES_FROM_EMAIL=info@timecapsul.co

# Optional: For production deployment
# PAYLOAD_PUBLIC_SERVER_URL=https://your-domain.com
# NODE_ENV=production
```

## Installation

1. **Clone and install dependencies:**
```bash
npm install
```

2. **Set up MongoDB:**
   - Install MongoDB locally or use MongoDB Atlas
   - Update the `DATABASE_URI` in your `.env.local`

3. **Configure AWS SES:**
   - Create an AWS account and set up SES
   - Verify your sender email address
   - Create IAM credentials with SES permissions
   - Update AWS variables in `.env.local`

4. **Start the development server:**
```bash
npm run dev
```

## Payload CMS Collections

The application uses these Payload CMS collections:

### Capsules Collection
```typescript
{
  contentType: 'text' | 'photo' | 'voice',
  textContent?: string,
  media?: File,
  deliveryDate: Date,
  recipients: string[],
  uniqueLink: string,
  password?: string (hashed),
  isPublic: boolean,
  creatorEmail?: string,
  status: 'scheduled' | 'delivered',
  scheduledJobId?: string,
  createdAt: Date,
  updatedAt: Date
}
```

### PublicCapsules Collection
```typescript
{
  originalCapsuleId: string,
  textContent: string,
  tags: string[],
  sentiment: 'positive' | 'neutral' | 'negative',
  createdAt: Date
}
```

## API Endpoints

### POST /api/capsules
Create a new memory capsule with form data (supports file uploads).

**Request Body (FormData):**
- `contentType`: 'text' | 'photo' | 'voice'
- `textContent`: string (optional, max 500 words)
- `media`: File (optional, max 5MB)
- `deliveryDate`: string (ISO date)
- `recipients`: string (comma-separated emails, max 3)
- `password`: string (optional, min 6 chars)
- `isPublic`: 'true' | 'false'
- `creatorEmail`: string (optional)

**Response:**
```typescript
{
  success: boolean,
  data?: {
    uniqueLink: string,
    shareableImageUrl: string,
    capsuleId: string
  },
  error?: string
}
```

### GET /api/capsules?link=uniqueLink&password=password
Retrieve a capsule for viewing (when delivery date is reached).

## File Structure

```
app/
├── create/
│   └── page.tsx              # Capsule creation form
├── api/
│   └── capsules/
│       └── route.ts          # Capsule API endpoints
├── (frontend)/
│   ├── page.tsx              # Landing page
│   ├── layout.tsx            # Root layout
│   └── globals.css           # Global styles
types/
└── capsule.ts                # TypeScript interfaces
lib/
├── email.ts                  # AWS SES email functions
├── validation.ts             # Form validation utilities
└── utils.ts                  # Utility functions
components/
└── ui/                       # Shadcn UI components
```

## Key Features Implementation

### Form Validation
- Client-side validation with real-time feedback
- Server-side validation for security
- File type and size validation
- Email format validation
- Date range validation (1 month to 20 years)

### Email Scheduling
- AWS SES integration for reliable delivery
- Scheduled email jobs (implement with cron or AWS Lambda)
- Beautiful HTML email templates
- Confirmation emails for creators

### Security
- Password hashing with bcrypt
- Input sanitization to prevent XSS
- File upload validation
- Unique link generation with UUID

### Accessibility
- WCAG 2.1 AA compliance
- Proper ARIA labels and roles
- Keyboard navigation support
- High contrast mode support
- Screen reader friendly

### Mobile Responsiveness
- Mobile-first design approach
- Touch-friendly interface
- Optimized for various screen sizes
- Progressive enhancement

## Deployment

### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Other Platforms
- Ensure Node.js 18+ support
- Set up MongoDB connection
- Configure AWS SES credentials
- Set all required environment variables

## Development Notes

### Styling
- Uses Tailwind CSS v4 with custom theme
- Violet/indigo/cyan gradient color scheme
- Caveat font for handwritten prompts
- Inter font for body text
- Custom animations (fadeIn, glow, pulse)

### Performance
- Image optimization with Next.js
- Lazy loading for components
- Efficient file upload handling
- Optimized bundle size

### Testing
Run the development server and test:
- Form validation with various inputs
- File upload with different formats
- Email delivery (check AWS SES console)
- Mobile responsiveness
- Accessibility with screen readers

## Troubleshooting

### Common Issues
1. **MongoDB Connection**: Ensure MongoDB is running and connection string is correct
2. **AWS SES**: Verify email addresses and check SES sending limits
3. **File Uploads**: Check file size limits and MIME types
4. **Environment Variables**: Ensure all required variables are set

### Debug Mode
Set `NODE_ENV=development` for detailed error messages and logging.

## Contributing
1. Follow the existing code style
2. Add TypeScript types for new features
3. Test accessibility compliance
4. Update this documentation for new features

## License
MIT License - see LICENSE file for details. 