/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextRequest, NextResponse } from 'next/server'
import { getPayloadClient } from '@/lib/payload'
import fs from 'fs'
import nextPackage from 'next/package.json'

export async function GET(_request: NextRequest) {
  try {
    console.log('🔍 Debug endpoint called')

    // Basic environment check
    const envCheck = {
      NODE_ENV: process.env.NODE_ENV,
      hasDatabase: !!process.env.DATABASE_URI,
      hasSecret: !!process.env.PAYLOAD_SECRET,
      hasAppUrl: !!process.env.NEXT_PUBLIC_APP_URL,
      hasVercelBlob: !!process.env.BLOB_READ_WRITE_TOKEN,
      appUrl: process.env.NEXT_PUBLIC_APP_URL,
      databaseUrlPrefix: process.env.DATABASE_URI?.substring(0, 20) + '...',
      blobTokenPrefix: process.env.BLOB_READ_WRITE_TOKEN?.substring(0, 20) + '...',
    }

    console.log('📋 Environment check:', envCheck)

    // Test payload client
    let payloadStatus = 'unknown'
    let collections: string[] = []
    let dbConnection = 'unknown'

    try {
      console.log('⏳ Testing payload client...')
      const payload = await getPayloadClient()
      payloadStatus = 'initialized'
      
      // Get collection names
      collections = Object.keys(payload.config.collections || {})
      console.log('📊 Collections found:', collections)

      // Test database connection
      try {
        await payload.db.connection.db.admin().ping()
        dbConnection = 'connected'
        console.log('✅ Database connection successful')
      } catch (dbError) {
        dbConnection = `error: ${dbError instanceof Error ? dbError.message : 'unknown'}`
        console.error('❌ Database connection failed:', dbError)
      }

    } catch (payloadError) {
      payloadStatus = `error: ${payloadError instanceof Error ? payloadError.message : 'unknown'}`
      console.error('❌ Payload initialization failed:', payloadError)
    }

    // Check file system
    let fileSystemCheck = 'unknown'
    try {
      const mediaDir = process.env.MEDIA_DIR || './media'
      
      if (!fs.existsSync(mediaDir)) {
        fs.mkdirSync(mediaDir, { recursive: true })
      }
      
      const testFile = `${mediaDir}/test.txt`
      fs.writeFileSync(testFile, 'test')
      fs.unlinkSync(testFile)
      fileSystemCheck = 'writable'
    } catch (fsError) {
      fileSystemCheck = `error: ${fsError instanceof Error ? fsError.message : 'unknown'}`
    }

    // Check Vercel Blob
    let blobCheck = 'disabled'
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      try {
        const { createVercelBlobHandler } = await import('@/lib/storage/vercel-blob-payload-adapter')
        // Simple test - just check if handler can be created
        const handler = await createVercelBlobHandler('test')
        blobCheck = handler ? 'configured' : 'error'
      } catch (blobError) {
        blobCheck = `error: ${blobError instanceof Error ? blobError.message : 'unknown'}`
      }
    }

    const debugInfo = {
      timestamp: new Date().toISOString(),
      environment: envCheck,
      payload: {
        status: payloadStatus,
        collections,
        dbConnection,
      },
      fileSystem: fileSystemCheck,
      vercelBlob: blobCheck,
      routes: {
        admin: '/admin',
        api: '/api',
        graphql: '/api/graphql',
        debug: '/api/debug',
        health: '/api/health',
      },
             next: {
        version: nextPackage.version,
        mode: process.env.NODE_ENV,
      }
    }

    console.log('📊 Debug info compiled:', debugInfo)

    return NextResponse.json(debugInfo, { status: 200 })

  } catch (error) {
    console.error('❌ Debug endpoint error:', error)
    
    return NextResponse.json({
      error: 'Debug endpoint failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
    }, { status: 500 })
  }
}

// Also allow POST for testing
export async function POST() {
  return GET({} as NextRequest)
} 