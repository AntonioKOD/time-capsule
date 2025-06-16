/* eslint-disable @typescript-eslint/no-explicit-any */
// @ts-nocheck
import { CollectionConfig } from 'payload'
import { createVercelBlobHandler, deleteFromVercelBlob } from '../lib/storage/vercel-blob-payload-adapter'

/**
 * Media Collection
 * Handles file uploads for photos and voice recordings in capsules
 * Supports local storage for development and can be configured for cloud storage
 */
export const Media: CollectionConfig = {
  slug: 'media',
  
  // File upload configuration
  upload: {
    // Use Vercel Blob in production, local storage in development
    ...(process.env.NODE_ENV === 'production' && process.env.BLOB_READ_WRITE_TOKEN ? {
      // Vercel Blob configuration (production)
      disableLocalStorage: true,
      staticURL: '/api/media',
    } : {
      // Local storage configuration (development)
      staticDir: process.env.MEDIA_DIR || './media',
      staticURL: '/media',
    }),
    
    // Image resizing and optimization
    imageSizes: [
      {
        name: 'thumbnail',
        width: 300,
        height: 300,
        position: 'centre',
        formatOptions: {
          format: 'webp',
          options: {
            quality: 80,
          },
        },
      },
      {
        name: 'preview',
        width: 800,
        height: 600,
        position: 'centre',
        formatOptions: {
          format: 'webp',
          options: {
            quality: 85,
          },
        },
      },
    ],
    
    // File validation
    mimeTypes: [
      // Image formats
      'image/jpeg',
      'image/jpg', 
      'image/png',
      // Audio formats
      'audio/mpeg',
      'audio/mp3',
      'audio/wav',
      'audio/m4a',
      'audio/x-m4a',
    ],
  },

  // Access control
  access: {
    create: () => true,  // Allow uploads for capsule creation
    read: () => true,    // Allow reading for serving files
    update: () => false, // Files are immutable once uploaded
    delete: () => false, // Files should not be deleted (for data integrity)
  },

  // Admin panel configuration
  admin: {
    useAsTitle: 'filename',
    defaultColumns: ['filename', 'filesize', 'mimeType', 'createdAt'],
    description: 'Photos and voice recordings uploaded for memory capsules',
  },

  // Collection fields
  fields: [
    {
      name: 'alt',
      type: 'text',
      admin: {
        description: 'Alternative text for accessibility (auto-generated for photos)',
      },
    },
    {
      name: 'caption',
      type: 'text',
      admin: {
        description: 'Optional caption or description',
      },
    },
    {
      name: 'contentType',
      type: 'select',
      options: [
        { label: 'Photo', value: 'photo' },
        { label: 'Voice Recording', value: 'voice' },
      ],
      admin: {
        description: 'Type of media content',
      },
    },
    {
      name: 'duration',
      type: 'number',
      admin: {
        description: 'Duration in seconds (for audio files)',
        condition: (data) => data.contentType === 'voice',
      },
    },
    {
      name: 'isProcessed',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Indicates if the file has been processed and optimized',
      },
    },
    {
      name: 'originalFilename',
      type: 'text',
      admin: {
        description: 'Original filename when uploaded',
        readOnly: true,
      },
    },
  ],

  // Hooks for file processing and validation
  hooks: {
    beforeCreate: [
      async ({ data, req }) => {
        // Store original filename
        if (req.file && req.file.name) {
          data.originalFilename = req.file.name
        }
        
        // Auto-detect content type based on MIME type
        if (req.file && req.file.mimetype) {
          if (req.file.mimetype.startsWith('image/')) {
            data.contentType = 'photo'
            // Generate alt text for photos
            data.alt = `Photo uploaded for memory capsule - ${req.file.name}`
          } else if (req.file.mimetype.startsWith('audio/')) {
            data.contentType = 'voice'
            data.alt = `Voice recording for memory capsule - ${req.file.name}`
          }
        }
        
        return data
      },
    ],
    
    beforeValidate: [
      async ({ data, req }) => {
        // Validate file size (5MB limit)
        if (req.file && req.file.size) {
          const maxSize = 5 * 1024 * 1024 // 5MB in bytes
          if (req.file.size > maxSize) {
            throw new Error('File size must be less than 5MB')
          }
        }
        
        // Additional validation for audio files
        if (data.contentType === 'voice' && req.file) {
          // Note: Duration validation would require audio processing library
          // For now, we rely on client-side validation for 30-second limit
          
          // Validate audio MIME types
          const allowedAudioTypes = [
            'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/m4a', 'audio/x-m4a'
          ]
          if (!allowedAudioTypes.includes(req.file.mimetype)) {
            throw new Error('Voice recordings must be MP3, WAV, or M4A format')
          }
        }
        
        // Additional validation for image files
        if (data.contentType === 'photo' && req.file) {
          // Validate image MIME types
          const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png']
          if (!allowedImageTypes.includes(req.file.mimetype)) {
            throw new Error('Photos must be JPEG or PNG format')
          }
        }
        
        return data
      },
    ],
    
    afterCreate: [
      async ({ doc, req }) => {
        console.log(`✅ Media uploaded successfully: ${doc.filename} (${doc.filesize} bytes)`)
        
        // Handle Vercel Blob upload in production
        if (process.env.NODE_ENV === 'production' && process.env.BLOB_READ_WRITE_TOKEN && req.file?.data) {
          try {
            console.log(`📤 Uploading to Vercel Blob: ${doc.filename}`)
            
            const handler = await createVercelBlobHandler('media')
            if (handler) {
              const uploadResult = await handler({
                data: req.file.data,
                file: {
                  name: req.file.name,
                  size: req.file.size,
                  type: req.file.mimetype,
                },
                req,
              })

              // Update the document with Vercel Blob URL and metadata
              let updateData: Record<string, unknown> = {
                url: uploadResult.url,
                filename: uploadResult.filename,
                isProcessed: true,
              }

              // Add image dimensions if this is an image
              if (doc.mimeType?.startsWith('image/')) {
                try {
                  const sharp = await import('sharp')
                  const metadata = await sharp.default(req.file.data).metadata()
                  if (metadata.width && metadata.height) {
                    updateData.width = metadata.width
                    updateData.height = metadata.height
                  }
                } catch {
                  console.warn('Sharp not available for image dimensions')
                }
              }

              await req.payload.update({
                collection: 'media',
                id: doc.id,
                data: updateData,
              })

              console.log(`✅ Vercel Blob upload successful: ${uploadResult.url}`)
            }
          } catch (error) {
            console.error('❌ Vercel Blob upload failed:', error)
            // Mark as processed anyway to prevent loops
            await req.payload.update({
              collection: 'media',
              id: doc.id,
              data: { isProcessed: true },
            })
          }
        } else {
          // Local storage or no blob token - just add image dimensions and mark processed
          let updateData: Record<string, unknown> = { isProcessed: true }

          if (doc.mimeType?.startsWith('image/') && req.file?.data) {
            try {
              const sharp = await import('sharp')
              const metadata = await sharp.default(req.file.data).metadata()
              if (metadata.width && metadata.height) {
                updateData.width = metadata.width
                updateData.height = metadata.height
              }
            } catch {
              console.warn('Sharp not available for image dimensions')
            }
          }

          await req.payload.update({
            collection: 'media',
            id: doc.id,
            data: updateData,
          })
        }
      },
    ],
    
    afterDelete: [
      async ({ doc }) => {
        // Delete from Vercel Blob if URL exists and we're in production
        if (process.env.NODE_ENV === 'production' && process.env.BLOB_READ_WRITE_TOKEN && doc.url && doc.url.startsWith('http')) {
          await deleteFromVercelBlob(doc.url)
        }
      },
    ],
  },

  // Timestamps
  timestamps: true,
}
