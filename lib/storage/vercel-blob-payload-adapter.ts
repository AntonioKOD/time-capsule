import { put, del } from '@vercel/blob'

/**
 * Vercel Blob Upload Handler for Payload CMS
 * 
 * This provides a custom upload handler that integrates with Payload's upload system
 * to store files in Vercel Blob storage instead of local filesystem
 */

interface UploadHandlerParams {
  data: Buffer
  file: {
    name: string
    size: number
    type: string
  }
  req: {
    payload: unknown
    user?: unknown
  }
}

export async function createVercelBlobHandler(collection: string) {
  const token = process.env.BLOB_READ_WRITE_TOKEN

  if (!token) {
    console.warn(`⚠️ BLOB_READ_WRITE_TOKEN not found for ${collection} collection`)
    return null
  }

  return async ({ data, file }: UploadHandlerParams) => {
    try {
      // Generate unique filename with collection prefix
      const timestamp = Date.now()
      const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
      const uniqueFileName = `${collection}/${timestamp}-${cleanName}`

      console.log(`📤 Uploading to Vercel Blob: ${uniqueFileName}`)

      // Upload to Vercel Blob
      const blob = await put(uniqueFileName, data, {
        access: 'public',
        token,
        contentType: file.type,
      })

      console.log(`✅ Upload successful: ${blob.url}`)

      // Return the data in the format Payload expects
      return {
        filename: blob.pathname.split('/').pop() || uniqueFileName,
        filesize: file.size,
        mimeType: file.type,
        url: blob.url,
        // Add blob-specific metadata
        blobUrl: blob.url,
        blobPathname: blob.pathname,
      }

    } catch (error) {
      console.error('❌ Vercel Blob upload failed:', error)
      throw new Error(`Failed to upload file: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
}

/**
 * Delete handler for Vercel Blob
 */
export async function deleteFromVercelBlob(url: string) {
  const token = process.env.BLOB_READ_WRITE_TOKEN

  if (!token) {
    console.warn('Vercel Blob token not configured for deletion')
    return false
  }

  try {
    console.log(`🗑️ Deleting from Vercel Blob: ${url}`)
    
    await del(url, { token })
    
    console.log(`✅ Deletion successful`)
    return true
    
  } catch (error) {
    console.error('❌ Vercel Blob deletion failed:', error)
    return false
  }
} 