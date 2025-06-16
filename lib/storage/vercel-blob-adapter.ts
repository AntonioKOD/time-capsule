import { put, del, head } from '@vercel/blob'

/**
 * Vercel Blob Storage Adapter for Payload CMS
 * Handles file upload, storage, and retrieval using Vercel Blob
 */

interface UploadedFile {
  buffer: Buffer
  mimetype: string
  name: string
  size: number
}

interface BlobStorageResult {
  filename: string
  filesize: number
  width?: number
  height?: number
  mimeType: string
  url: string
}

export class VercelBlobAdapter {
  private token: string
  private baseUrl: string

  constructor() {
    this.token = process.env.BLOB_READ_WRITE_TOKEN || ''
    this.baseUrl = 'https://blob.vercel-storage.com'
    
    if (!this.token) {
      console.warn('⚠️ BLOB_READ_WRITE_TOKEN not found, using local storage fallback')
    }
  }

  /**
   * Upload file to Vercel Blob
   */
  async uploadFile(file: UploadedFile, collection: string): Promise<BlobStorageResult> {
    if (!this.token) {
      throw new Error('Vercel Blob token not configured')
    }

    try {
      // Generate unique filename
      const timestamp = Date.now()
      const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
      const filename = `${collection}/${timestamp}-${cleanName}`

      console.log(`📤 Uploading to Vercel Blob: ${filename}`)

      // Upload to Vercel Blob
      const blob = await put(filename, file.buffer, {
        access: 'public',
        token: this.token,
        contentType: file.mimetype,
      })

      console.log(`✅ Upload successful: ${blob.url}`)

      // Get file dimensions for images
      let width: number | undefined
      let height: number | undefined

      if (file.mimetype.startsWith('image/')) {
        try {
          // Try to get image dimensions using sharp if available
          const sharp = await import('sharp')
          const metadata = await sharp.default(file.buffer).metadata()
          width = metadata.width
          height = metadata.height
        } catch {
          console.warn('Sharp not available for image dimensions')
        }
      }

      return {
        filename: blob.pathname.split('/').pop() || filename,
        filesize: file.size,
        width,
        height,
        mimeType: file.mimetype,
        url: blob.url,
      }

    } catch (error) {
      console.error('❌ Vercel Blob upload failed:', error)
      throw new Error(`Failed to upload file: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Delete file from Vercel Blob
   */
  async deleteFile(url: string): Promise<boolean> {
    if (!this.token) {
      console.warn('Vercel Blob token not configured for deletion')
      return false
    }

    try {
      console.log(`🗑️ Deleting from Vercel Blob: ${url}`)
      
      await del(url, { token: this.token })
      
      console.log(`✅ Deletion successful: ${url}`)
      return true
      
    } catch (error) {
      console.error('❌ Vercel Blob deletion failed:', error)
      return false
    }
  }

  /**
   * Check if file exists in Vercel Blob
   */
  async fileExists(url: string): Promise<boolean> {
    if (!this.token) {
      return false
    }

    try {
      await head(url, { token: this.token })
      return true
    } catch {
      return false
    }
  }

  /**
   * Get file info from Vercel Blob
   */
  async getFileInfo(url: string): Promise<{ size: number; contentType: string } | null> {
    if (!this.token) {
      return null
    }

    try {
      const response = await head(url, { token: this.token })
      return {
        size: response.size,
        contentType: response.contentType || 'application/octet-stream',
      }
    } catch {
      console.error('Failed to get file info')
      return null
    }
  }

  /**
   * Generate secure URL for file access (Vercel Blob URLs are already public)
   */
  generateUrl(filename: string): string {
    return filename.startsWith('http') ? filename : `${this.baseUrl}/${filename}`
  }
}

// Export singleton instance
export const vercelBlobAdapter = new VercelBlobAdapter() 