import { NextRequest, NextResponse } from "next/server";
import { testSMSConfiguration, sendCapsuleCreationSMS } from "@/lib/sms-service";

/**
 * GET /api/test-sms - Test SMS configuration
 */
export async function GET(): Promise<NextResponse> {
  try {
    console.log('🧪 Testing SMS configuration...')
    console.log(`🔍 TWILIO_ACCOUNT_SID exists: ${!!process.env.TWILIO_ACCOUNT_SID}`)
    console.log(`🔍 TWILIO_AUTH_TOKEN exists: ${!!process.env.TWILIO_AUTH_TOKEN}`)
    console.log(`🔍 TWILIO_PHONE_NUMBER: ${process.env.TWILIO_PHONE_NUMBER}`)
    
    const testResult = await testSMSConfiguration()
    
    if (testResult.success) {
      console.log('✅ SMS configuration test passed!')
      
      return NextResponse.json({
        success: true,
        message: 'SMS configuration test passed',
        details: testResult.messageId,
        config: {
          hasAccountSid: !!process.env.TWILIO_ACCOUNT_SID,
          hasAuthToken: !!process.env.TWILIO_AUTH_TOKEN,
          phoneNumber: process.env.TWILIO_PHONE_NUMBER,
        }
      })
    } else {
      console.log('❌ SMS configuration test failed:', testResult.error)
      
      return NextResponse.json({
        success: false,
        error: testResult.error,
        config: {
          hasAccountSid: !!process.env.TWILIO_ACCOUNT_SID,
          hasAuthToken: !!process.env.TWILIO_AUTH_TOKEN,
          phoneNumber: process.env.TWILIO_PHONE_NUMBER,
        }
      }, { status: 500 })
    }
    
  } catch (error) {
    console.error('❌ SMS test failed:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      config: {
        hasAccountSid: !!process.env.TWILIO_ACCOUNT_SID,
        hasAuthToken: !!process.env.TWILIO_AUTH_TOKEN,
        phoneNumber: process.env.TWILIO_PHONE_NUMBER,
      }
    }, { status: 500 })
  }
}

/**
 * POST /api/test-sms - Test with custom phone number
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const { phoneNumber } = await request.json()
    
    if (!phoneNumber) {
      return NextResponse.json({
        success: false,
        error: 'Phone number is required'
      }, { status: 400 })
    }
    
    console.log(`🧪 Testing SMS to custom number: ${phoneNumber}`)
    
    const result = await sendCapsuleCreationSMS(
      phoneNumber,
      new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
      'text',
      'test-link-123'
    )
    
    if (result.success) {
      console.log(`✅ Test SMS sent successfully to: ${phoneNumber}`)
      
      return NextResponse.json({
        success: true,
        message: `Test SMS sent successfully to ${phoneNumber}`,
        messageId: result.messageId,
        phoneNumber
      })
    } else {
      console.log(`❌ Test SMS failed for ${phoneNumber}:`, result.error)
      
      return NextResponse.json({
        success: false,
        error: result.error,
        phoneNumber
      }, { status: 500 })
    }
    
  } catch (error) {
    console.error('❌ Custom test SMS failed:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 