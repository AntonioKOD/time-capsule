import { NextResponse } from "next/server";
import { getPayloadClient } from "@/lib/payload";

/**
 * GET /api/test-email - Test Resend email functionality
 */
export async function GET(): Promise<NextResponse> {
  try {
    console.log('🧪 Testing Resend email configuration...')
    console.log(`🔍 RESEND_API_KEY exists: ${!!process.env.RESEND_API_KEY}`)
    console.log(`🔍 RESEND_FROM_EMAIL: ${process.env.RESEND_FROM_EMAIL}`)
    
    const payload = await getPayloadClient()
    
    const testEmail = {
      to: 'antonio_kodheli@icloud.com',
      subject: '🧪 Test Email from Memory Capsule',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #8B5CF6;">🧪 Test Email</h1>
          <p>This is a test email to verify Resend configuration.</p>
          <p><strong>Sent at:</strong> ${new Date().toISOString()}</p>
          <p><strong>From:</strong> ${process.env.RESEND_FROM_EMAIL}</p>
          <p><strong>API Key (first 10 chars):</strong> ${process.env.RESEND_API_KEY?.substring(0, 10)}...</p>
        </div>
      `,
      text: `
        Test Email
        
        This is a test email to verify Resend configuration.
        Sent at: ${new Date().toISOString()}
        From: ${process.env.RESEND_FROM_EMAIL}
      `,
    }
    
    console.log('🔍 Sending test email with payload.sendEmail...')
    await payload.sendEmail(testEmail)
    
    console.log('✅ Test email sent successfully!')
    
    return NextResponse.json({
      success: true,
      message: 'Test email sent successfully',
      config: {
        fromEmail: process.env.RESEND_FROM_EMAIL,
        hasApiKey: !!process.env.RESEND_API_KEY,
        apiKeyPrefix: process.env.RESEND_API_KEY?.substring(0, 10) + '...',
      }
    })
    
  } catch (error) {
    console.error('❌ Test email failed:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      config: {
        fromEmail: process.env.RESEND_FROM_EMAIL,
        hasApiKey: !!process.env.RESEND_API_KEY,
        apiKeyPrefix: process.env.RESEND_API_KEY?.substring(0, 10) + '...',
      }
    }, { status: 500 })
  }
}

/**
 * POST /api/test-email - Test with custom recipient
 */
export async function POST(request: Request): Promise<NextResponse> {
  try {
    const { email } = await request.json()
    
    if (!email) {
      return NextResponse.json({
        success: false,
        error: 'Email address is required'
      }, { status: 400 })
    }
    
    console.log(`🧪 Testing email to custom recipient: ${email}`)
    
    const payload = await getPayloadClient()
    
    const testEmail = {
      to: email,
      subject: '🧪 Custom Test Email from Memory Capsule',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #8B5CF6;">🧪 Custom Test Email</h1>
          <p>This is a test email sent to your custom email address!</p>
          <p><strong>Recipient:</strong> ${email}</p>
          <p><strong>Sent at:</strong> ${new Date().toISOString()}</p>
          <p><strong>Status:</strong> Resend configuration is working! ✅</p>
        </div>
      `,
      text: `
        Custom Test Email
        
        This is a test email sent to your custom email address!
        Recipient: ${email}
        Sent at: ${new Date().toISOString()}
        Status: Resend configuration is working!
      `,
    }
    
    await payload.sendEmail(testEmail)
    
    console.log(`✅ Custom test email sent successfully to: ${email}`)
    
    return NextResponse.json({
      success: true,
      message: `Test email sent successfully to ${email}`,
      recipient: email
    })
    
  } catch (error) {
    console.error('❌ Custom test email failed:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 