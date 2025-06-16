import { NextRequest, NextResponse } from 'next/server'
import { processPreOpeningNotifications } from '@/lib/email-scheduler'

/**
 * API endpoint for processing pre-opening notifications
 * This should be called periodically (e.g., every 5 minutes) via a cron job
 * 
 * Sends notifications:
 * - 1 hour before opening
 * - 30 minutes before opening  
 * - 10 minutes before opening
 */

export async function POST(request: NextRequest) {
  try {
    console.log('🔔 Starting pre-opening notifications processing...')
    
    const results = await processPreOpeningNotifications()
    
    console.log(`🔔 Pre-opening notifications complete:`, results)
    
    return NextResponse.json({
      success: true,
      message: 'Pre-opening notifications processed successfully',
      results,
    })
    
  } catch (error) {
    console.error('❌ Error processing pre-opening notifications:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process pre-opening notifications',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Pre-opening notifications endpoint',
    description: 'Use POST to trigger notification processing',
    schedule: 'Should be called every 5 minutes via cron job',
    notifications: [
      '1 hour before opening',
      '30 minutes before opening', 
      '10 minutes before opening'
    ]
  })
} 