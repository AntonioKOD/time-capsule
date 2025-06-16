import { NextRequest, NextResponse } from 'next/server'
import { getPayloadClient } from '@/lib/payload'

interface RouteParams {
  params: Promise<{
    path: string[]
  }>
}

/**
 * GET /api/media/[...path] - Serve media files
 * Handles both Vercel Blob URLs and local file serving
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const resolvedParams = await params
    const filePath = resolvedParams.path.join('/')
    
    console.log(`📁 Media request: ${filePath}`)

    // Get payload client to access media collection
    const payload = await getPayloadClient()
    
    // Find media document by filename or URL
    const mediaResult = await payload.find({
      collection: 'media',
      where: {
        or: [
          {
            filename: {
              equals: filePath,
            },
          },
          {
            url: {
              contains: filePath,
            },
          },
        ],
      },
      limit: 1,
    })

    if (mediaResult.docs.length === 0) {
      console.log(`❌ Media not found: ${filePath}`)
      return new NextResponse('File not found', { status: 404 })
    }

    const media = mediaResult.docs[0]

    // If we have a URL (Vercel Blob), redirect to it
    if (media.url && media.url.startsWith('http')) {
      console.log(`🔗 Redirecting to Vercel Blob: ${media.url}`)
      return NextResponse.redirect(media.url, 302)
    }

    // For local files in development
    if (process.env.NODE_ENV === 'development') {
      try {
        const fs = await import('fs')
        const path = await import('path')
        
        const localPath = path.join(process.cwd(), 'media', media.filename || filePath)
        
        if (fs.existsSync(localPath)) {
          const fileBuffer = fs.readFileSync(localPath)
          
          return new NextResponse(fileBuffer, {
            headers: {
              'Content-Type': media.mimeType || 'application/octet-stream',
              'Content-Length': fileBuffer.length.toString(),
              'Cache-Control': 'public, max-age=31536000', // 1 year
            },
          })
        }
      } catch {
        console.error('Error serving local file')
      }
    }

    console.log(`❌ Unable to serve media: ${filePath}`)
    return new NextResponse('File not accessible', { status: 404 })

  } catch (error) {
    console.error('❌ Media API error:', error)
    return new NextResponse('Internal server error', { status: 500 })
  }
}

/**
 * HEAD /api/media/[...path] - Get file info without content
 */
export async function HEAD(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const resolvedParams = await params
    const filePath = resolvedParams.path.join('/')
    
    const payload = await getPayloadClient()
    
    const mediaResult = await payload.find({
      collection: 'media',
      where: {
        or: [
          {
            filename: {
              equals: filePath,
            },
          },
          {
            url: {
              contains: filePath,
            },
          },
        ],
      },
      limit: 1,
    })

    if (mediaResult.docs.length === 0) {
      return new NextResponse(null, { status: 404 })
    }

    const media = mediaResult.docs[0]

    return new NextResponse(null, {
      status: 200,
      headers: {
        'Content-Type': media.mimeType || 'application/octet-stream',
        'Content-Length': (media.filesize || 0).toString(),
        'Cache-Control': 'public, max-age=31536000',
      },
    })

  } catch (error) {
    console.error('Media HEAD error:', error)
    return new NextResponse(null, { status: 500 })
  }
} 