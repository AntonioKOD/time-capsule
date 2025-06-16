/* eslint-disable @typescript-eslint/no-unused-vars */
import { getPayloadClient } from './payload'

/**
 * Email Templates for Memory Capsule Creator
 * Using Resend adapter for reliable email delivery
 */

export interface CapsuleEmailData {
  uniqueLink: string
  deliveryDate: string
  contentType: string
  recipientEmail: string
  creatorEmail?: string
  hasPassword: boolean
  isPreOpeningNotification?: boolean
  timeframe?: '1hour' | '30min' | '10min'
}

export interface PaymentConfirmationData {
  uniqueLink: string
  deliveryDate: string
  contentType: string
  customerEmail: string
  sessionId: string
  amountPaid: number
}

/**
 * Send capsule delivery email when the time arrives
 */
export async function sendCapsuleDeliveryEmail(data: CapsuleEmailData): Promise<boolean> {
  try {
    const payload = await getPayloadClient()
    
    const capsuleUrl = `${process.env.NEXT_PUBLIC_APP_URL}/capsule/${data.uniqueLink}`
    
    console.log(`🔍 Attempting to send email to: ${data.recipientEmail}`)
    console.log(`🔍 Capsule URL: ${capsuleUrl}`)
    console.log(`🔍 Resend API Key exists: ${!!process.env.RESEND_API_KEY}`)
    console.log(`🔍 From email: ${process.env.RESEND_FROM_EMAIL}`)
    
    await payload.sendEmail({
      to: data.recipientEmail,
      subject: `🎁 Your Memory Capsule is Ready to Open!`,
      html: generateCapsuleDeliveryHTML(data, capsuleUrl),
      text: generateCapsuleDeliveryText(data, capsuleUrl),
    })
    
    console.log(`📧 Capsule delivery email sent successfully to: ${data.recipientEmail}`)
    return true
  } catch (error) {
    console.error('❌ Failed to send capsule delivery email:', error)
    console.error('❌ Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      recipientEmail: data.recipientEmail
    })
    return false
  }
}

/**
 * Send pre-opening notification email
 */
export async function sendCapsulePreOpeningEmail(data: CapsuleEmailData): Promise<boolean> {
  try {
    const payload = await getPayloadClient()
    
    const capsuleUrl = `${process.env.NEXT_PUBLIC_APP_URL}/capsule/${data.uniqueLink}`
    const timeframeText = getTimeframeText(data.timeframe!)
    
    console.log(`🔍 Attempting to send ${data.timeframe} notification to: ${data.recipientEmail}`)
    console.log(`🔍 Capsule URL: ${capsuleUrl}`)
    
    await payload.sendEmail({
      to: data.recipientEmail,
      subject: `⏰ Your Time Capsule Opens ${timeframeText}!`,
      html: generatePreOpeningNotificationHTML(data, capsuleUrl, timeframeText),
      text: generatePreOpeningNotificationText(data, capsuleUrl, timeframeText),
    })
    
    console.log(`📧 Pre-opening notification (${data.timeframe}) sent successfully to: ${data.recipientEmail}`)
    return true
  } catch (error) {
    console.error(`❌ Failed to send pre-opening notification (${data.timeframe}):`, error)
    console.error('❌ Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      recipientEmail: data.recipientEmail
    })
    return false
  }
}

/**
 * Send payment confirmation email for paid capsules
 */
export async function sendPaymentConfirmationEmail(data: PaymentConfirmationData): Promise<boolean> {
  try {
    const payload = await getPayloadClient()
    
    const capsuleUrl = `${process.env.NEXT_PUBLIC_APP_URL}/capsule/${data.uniqueLink}`
    
    await payload.sendEmail({
      to: data.customerEmail,
      subject: `✅ Payment Confirmed - Your Memory Capsule is Sealed`,
      html: generatePaymentConfirmationHTML(data, capsuleUrl),
      text: generatePaymentConfirmationText(data, capsuleUrl),
    })
    
    console.log(`📧 Payment confirmation email sent to: ${data.customerEmail}`)
    return true
  } catch (error) {
    console.error('❌ Failed to send payment confirmation email:', error)
    return false
  }
}

/**
 * Send notification to recipients when someone creates a capsule for them
 */
export async function sendCapsuleRecipientNotification(
  recipientEmail: string,
  deliveryDate: string,
  contentType: string,
  uniqueLink: string,
  hasPassword: boolean = false
): Promise<boolean> {
  try {
    const payload = await getPayloadClient()
    
    const capsuleUrl = `${process.env.NEXT_PUBLIC_APP_URL}/capsule/${uniqueLink}`
    const deliveryDateFormatted = new Date(deliveryDate).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZoneName: 'short'
    })
    
    // Calculate days until opening
    const now = new Date()
    const openingDate = new Date(deliveryDate)
    const daysUntilOpening = Math.ceil((openingDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    
    const daysText = daysUntilOpening === 1 ? '1 day' : `${daysUntilOpening} days`
    
    await payload.sendEmail({
      to: recipientEmail,
      subject: `🎁 Someone anonymous sealed a time capsule that you can open in ${daysText}!`,
      html: generateNeobrutalistRecipientNotificationHTML(recipientEmail, deliveryDateFormatted, contentType, capsuleUrl, hasPassword, daysText),
      text: `
🎁 You've Received an Anonymous Time Capsule!

Someone anonymous sealed a ${contentType.charAt(0).toUpperCase() + contentType.slice(1)} Memory that you can open in ${daysText}!

Opening Date: ${deliveryDateFormatted}

What happens next?
Your mystery time capsule is safely sealed and will automatically be delivered to you on the scheduled date. You'll receive another email when it's ready to open!

${hasPassword ? '🔒 This capsule is password protected. The sender will provide you with the password when needed!' : ''}

Capsule Link (for when it opens): ${capsuleUrl}

This anonymous memory capsule was created by someone who cares about you.

Memory Capsule Creator - Preserving memories for the future
      `,
    })
    
    console.log(`📧 Anonymous recipient notification sent to: ${recipientEmail}`)
    return true
  } catch (error) {
    console.error('❌ Failed to send anonymous recipient notification:', error)
    return false
  }
}

/**
 * Send capsule creation confirmation (for free capsules)
 */
export async function sendCapsuleCreationConfirmation(
  uniqueLink: string,
  userEmail: string,
  deliveryDate: string,
  contentType: string
): Promise<boolean> {
  try {
    const payload = await getPayloadClient()
    
    const capsuleUrl = `${process.env.NEXT_PUBLIC_APP_URL}/capsule/${uniqueLink}`
    const deliveryDateFormatted = new Date(deliveryDate).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZoneName: 'short'
    })
    
    await payload.sendEmail({
      to: userEmail,
      subject: `🎭 Your Memory Capsule Has Been Created`,
      html: generateNeobrutalistCreationConfirmationHTML(userEmail, deliveryDateFormatted, contentType, capsuleUrl),
      text: `
Memory Capsule Created!

Your ${contentType} capsule has been safely stored and will be delivered on ${deliveryDateFormatted}.

Capsule Details:
- Type: ${contentType.charAt(0).toUpperCase() + contentType.slice(1)} Memory
- Opens on: ${deliveryDateFormatted}
- Access Link: ${capsuleUrl}

Keep this email safe! You'll need the link to access your capsule when it's ready.

Memory Capsule Creator - Preserving memories for the future
      `,
    })
    
    console.log(`📧 Capsule creation confirmation sent to: ${userEmail}`)
    return true
  } catch (error) {
    console.error('❌ Failed to send capsule creation confirmation:', error)
    return false
  }
}

/**
 * Generate neobrutalist HTML for recipient notification email
 */
function generateNeobrutalistRecipientNotificationHTML(
  recipientEmail: string,
  deliveryDateFormatted: string,
  contentType: string,
  capsuleUrl: string,
  hasPassword: boolean,
  daysText: string
): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Memory Capsule Received</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: 'Courier New', monospace;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 6px solid #000000; box-shadow: 12px 12px 0px #000000;">
        
        <!-- Neobrutalist Header -->
        <div style="background-color: #1E90FF; border-bottom: 6px solid #000000; padding: 30px; text-align: center;">
          <div style="background-color: #ffffff; border: 4px solid #000000; padding: 20px; display: inline-block; box-shadow: 8px 8px 0px #000000;">
            <h1 style="margin: 0; font-size: 32px; font-weight: 900; color: #000000; text-transform: uppercase; letter-spacing: 2px; line-height: 1.2;">
              🔮 MYSTERY<br/>TIME CAPSULE<br/>SEALED!
            </h1>
          </div>
        </div>
        
        <!-- Main Content -->
        <div style="padding: 40px 30px;">
          
          <!-- Brutalist Info Card -->
          <div style="background-color: #000000; border: 4px solid #000000; padding: 30px; margin-bottom: 30px; box-shadow: 8px 8px 0px #1E90FF;">
            <h2 style="margin: 0 0 20px 0; font-size: 24px; font-weight: 900; color: #ffffff; text-transform: uppercase; letter-spacing: 1px;">
              🔮 MYSTERY CAPSULE DETAILS
            </h2>
            <div style="background-color: #ffffff; border: 3px solid #1E90FF; padding: 20px; margin-bottom: 20px;">
              <p style="margin: 0 0 10px 0; font-size: 18px; font-weight: bold; color: #000000;">
                TYPE: ${contentType.toUpperCase()} MEMORY
              </p>
              <p style="margin: 0 0 10px 0; font-size: 18px; font-weight: bold; color: #000000;">
                OPENS IN: ${daysText.toUpperCase()}
              </p>
              <p style="margin: 0; font-size: 16px; font-weight: bold; color: #000000;">
                DATE: ${deliveryDateFormatted}
              </p>
            </div>
            
            ${hasPassword ? `
              <div style="background-color: #1E90FF; border: 3px solid #000000; padding: 15px; margin-bottom: 20px;">
                <p style="margin: 0; font-size: 16px; font-weight: bold; color: #ffffff; text-transform: uppercase;">
                  🔒 PASSWORD PROTECTED MYSTERY
                </p>
                <p style="margin: 5px 0 0 0; font-size: 14px; color: #ffffff;">
                  The anonymous sender will provide the password when needed!
                </p>
              </div>
            ` : ''}
            
            <div style="background-color: #f5f5f5; border: 3px solid #000000; padding: 20px;">
              <p style="margin: 0 0 15px 0; font-size: 16px; font-weight: bold; color: #000000; text-transform: uppercase;">
                🔮 WHAT HAPPENS NEXT?
              </p>
              <p style="margin: 0; font-size: 14px; font-weight: bold; color: #000000; line-height: 1.5;">
                Your mystery time capsule is SEALED and will automatically unlock on the scheduled date. 
                We'll send you another BRUTAL email when it's ready to reveal its secrets!
              </p>
            </div>
          </div>
          
          <!-- Brutalist Action Button -->
          <div style="text-align: center; margin: 40px 0;">
            <div style="background-color: #1E90FF; border: 4px solid #000000; padding: 20px; display: inline-block; box-shadow: 8px 8px 0px #000000;">
              <p style="margin: 0 0 15px 0; font-size: 16px; font-weight: bold; color: #ffffff; text-transform: uppercase;">
                📌 BOOKMARK THIS MYSTERY LINK
              </p>
              <a href="${capsuleUrl}" style="color: #ffffff; font-size: 14px; font-weight: bold; text-decoration: underline; word-break: break-all;">
                ${capsuleUrl}
              </a>
            </div>
          </div>
          
          <!-- Anonymous Info -->
          <div style="background-color: #f5f5f5; border: 4px solid #000000; padding: 25px; text-align: center; box-shadow: 6px 6px 0px #000000;">
            <p style="margin: 0; font-size: 16px; font-weight: bold; color: #000000; text-transform: uppercase;">
              🔮 FROM: SOMEONE ANONYMOUS
            </p>
            <p style="margin: 10px 0 0 0; font-size: 14px; font-weight: bold; color: #666666;">
              This mystery time capsule was sealed just for you!
            </p>
          </div>
          
        </div>
        
        <!-- Neobrutalist Footer -->
        <div style="background-color: #000000; border-top: 6px solid #000000; padding: 25px; text-align: center;">
          <p style="margin: 0; font-size: 14px; font-weight: bold; color: #ffffff; text-transform: uppercase; letter-spacing: 1px;">
            ⚡ TIME CAPSULE CREATOR ⚡
          </p>
          <p style="margin: 5px 0 0 0; font-size: 12px; color: #1E90FF; text-transform: uppercase;">
            PRESERVING MEMORIES FOR THE FUTURE
          </p>
        </div>
        
      </div>
    </body>
    </html>
  `
}

/**
 * Generate neobrutalist HTML for creation confirmation email
 */
function generateNeobrutalistCreationConfirmationHTML(
  userEmail: string,
  deliveryDateFormatted: string,
  contentType: string,
  capsuleUrl: string
): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Memory Capsule Created</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: 'Courier New', monospace;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 6px solid #000000; box-shadow: 12px 12px 0px #000000;">
        
        <!-- Neobrutalist Header -->
        <div style="background-color: #1E90FF; border-bottom: 6px solid #000000; padding: 30px; text-align: center;">
          <div style="background-color: #ffffff; border: 4px solid #000000; padding: 20px; display: inline-block; box-shadow: 8px 8px 0px #000000;">
            <h1 style="margin: 0; font-size: 32px; font-weight: 900; color: #000000; text-transform: uppercase; letter-spacing: 2px; line-height: 1.2;">
              🎭 MEMORY<br/>CAPSULE<br/>CREATED!
            </h1>
          </div>
        </div>
        
        <!-- Main Content -->
        <div style="padding: 40px 30px;">
          
          <!-- Brutalist Success Card -->
          <div style="background-color: #000000; border: 4px solid #000000; padding: 30px; margin-bottom: 30px; box-shadow: 8px 8px 0px #1E90FF;">
            <h2 style="margin: 0 0 20px 0; font-size: 24px; font-weight: 900; color: #ffffff; text-transform: uppercase; letter-spacing: 1px;">
              ✅ CAPSULE SEALED SUCCESSFULLY
            </h2>
            <div style="background-color: #ffffff; border: 3px solid #1E90FF; padding: 20px; margin-bottom: 20px;">
              <p style="margin: 0 0 10px 0; font-size: 18px; font-weight: bold; color: #000000;">
                TYPE: ${contentType.toUpperCase()} MEMORY
              </p>
              <p style="margin: 0 0 10px 0; font-size: 18px; font-weight: bold; color: #000000;">
                OPENS ON: ${deliveryDateFormatted}
              </p>
              <p style="margin: 0; font-size: 16px; font-weight: bold; color: #000000;">
                STATUS: SAFELY STORED
              </p>
            </div>
            
            <div style="background-color: #f5f5f5; border: 3px solid #000000; padding: 20px;">
              <p style="margin: 0 0 15px 0; font-size: 16px; font-weight: bold; color: #000000; text-transform: uppercase;">
                🔗 YOUR CAPSULE ACCESS LINK
              </p>
              <a href="${capsuleUrl}" style="color: #1E90FF; font-size: 14px; font-weight: bold; text-decoration: underline; word-break: break-all;">
                ${capsuleUrl}
              </a>
            </div>
          </div>
          
          <!-- Brutalist Warning Card -->
          <div style="background-color: #ff6b35; border: 4px solid #000000; padding: 25px; margin-bottom: 30px; box-shadow: 6px 6px 0px #000000;">
            <h3 style="margin: 0 0 15px 0; font-size: 18px; font-weight: bold; color: #ffffff; text-transform: uppercase;">
              ⚠️ IMPORTANT: SAVE THIS EMAIL!
            </h3>
            <p style="margin: 0; font-size: 14px; font-weight: bold; color: #ffffff; line-height: 1.5;">
              You'll need this link to access your capsule when it's ready to open. 
              Bookmark it or keep this email safe!
            </p>
          </div>
          
          <!-- What's Next -->
          <div style="background-color: #f5f5f5; border: 4px solid #000000; padding: 25px; text-align: center; box-shadow: 6px 6px 0px #000000;">
            <h3 style="margin: 0 0 15px 0; font-size: 18px; font-weight: bold; color: #000000; text-transform: uppercase;">
              🚀 WHAT HAPPENS NEXT?
            </h3>
            <p style="margin: 0; font-size: 14px; font-weight: bold; color: #000000; line-height: 1.5;">
              Your memory is now sealed in our digital vault. We'll send you reminder emails 
              before it opens, and a special notification when it's ready to unlock!
            </p>
          </div>
          
        </div>
        
        <!-- Neobrutalist Footer -->
        <div style="background-color: #000000; border-top: 6px solid #000000; padding: 25px; text-align: center;">
          <p style="margin: 0; font-size: 14px; font-weight: bold; color: #ffffff; text-transform: uppercase; letter-spacing: 1px;">
            ⚡ TIME CAPSULE CREATOR ⚡
          </p>
          <p style="margin: 5px 0 0 0; font-size: 12px; color: #1E90FF; text-transform: uppercase;">
            PRESERVING MEMORIES FOR THE FUTURE
          </p>
        </div>
        
      </div>
    </body>
    </html>
  `
}

/**
 * Generate HTML for capsule delivery email
 */
function generateCapsuleDeliveryHTML(data: CapsuleEmailData, capsuleUrl: string): string {
  const deliveryDateFormatted = new Date(data.deliveryDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short'
  })

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Time Capsule Ready</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: 'Courier New', monospace;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 6px solid #000000; box-shadow: 12px 12px 0px #000000;">
        
        <!-- Neobrutalist Header -->
        <div style="background-color: #1E90FF; border-bottom: 6px solid #000000; padding: 30px; text-align: center;">
          <div style="background-color: #ffffff; border: 4px solid #000000; padding: 25px; display: inline-block; box-shadow: 8px 8px 0px #000000;">
            <h1 style="margin: 0; font-size: 36px; font-weight: 900; color: #000000; text-transform: uppercase; letter-spacing: 2px; line-height: 1.1;">
              🎁 TIME<br/>CAPSULE<br/>READY!
            </h1>
          </div>
        </div>
        
        <!-- Main Content -->
        <div style="padding: 40px 30px;">
          
          <!-- Brutalist Opening Card -->
          <div style="background-color: #000000; border: 4px solid #000000; padding: 30px; margin-bottom: 30px; box-shadow: 8px 8px 0px #1E90FF;">
            <h2 style="margin: 0 0 20px 0; font-size: 24px; font-weight: 900; color: #ffffff; text-transform: uppercase; letter-spacing: 1px;">
              ⚡ YOUR ${data.contentType.toUpperCase()} MEMORY
            </h2>
            <div style="background-color: #ffffff; border: 3px solid #1E90FF; padding: 20px; margin-bottom: 25px;">
              <p style="margin: 0 0 10px 0; font-size: 16px; font-weight: bold; color: #000000;">
                SEALED ON: ${deliveryDateFormatted}
              </p>
              <p style="margin: 0; font-size: 16px; font-weight: bold; color: #000000;">
                STATUS: READY TO UNLOCK
              </p>
            </div>
            
            ${data.hasPassword ? `
              <div style="background-color: #ff6b35; border: 3px solid #000000; padding: 15px; margin-bottom: 25px;">
                <p style="margin: 0; font-size: 16px; font-weight: bold; color: #ffffff; text-transform: uppercase;">
                  🔒 PASSWORD REQUIRED
                </p>
                <p style="margin: 5px 0 0 0; font-size: 14px; color: #ffffff;">
                  Enter the password you set when creating this capsule
                </p>
              </div>
            ` : ''}
            
            <div style="background-color: #f5f5f5; border: 3px solid #000000; padding: 20px;">
              <p style="margin: 0; font-size: 16px; font-weight: bold; color: #000000; text-transform: uppercase; line-height: 1.5;">
                🚀 A MESSAGE FROM YOUR PAST SELF AWAITS!<br/>
                Take a moment to reflect on your journey.
              </p>
            </div>
          </div>
          
          <!-- Brutalist Action Button -->
          <div style="text-align: center; margin: 40px 0;">
            <a href="${capsuleUrl}" style="text-decoration: none;">
              <div style="background-color: #1E90FF; border: 4px solid #000000; padding: 25px 40px; display: inline-block; box-shadow: 8px 8px 0px #000000; transition: all 0.2s;">
                <p style="margin: 0; font-size: 20px; font-weight: 900; color: #ffffff; text-transform: uppercase; letter-spacing: 1px;">
                  🔓 OPEN CAPSULE NOW
                </p>
              </div>
            </a>
          </div>
          
          <!-- Memory Quote -->
          <div style="background-color: #f5f5f5; border: 4px solid #000000; padding: 25px; text-align: center; box-shadow: 6px 6px 0px #000000;">
            <p style="margin: 0; font-size: 18px; font-weight: bold; color: #000000; text-transform: uppercase; line-height: 1.4;">
              "THE BEST THING ABOUT MEMORIES<br/>IS MAKING THEM"
            </p>
            <p style="margin: 15px 0 0 0; font-size: 14px; font-weight: bold; color: #666666;">
              - YOUR PAST SELF
            </p>
          </div>
          
        </div>
        
        <!-- Neobrutalist Footer -->
        <div style="background-color: #000000; border-top: 6px solid #000000; padding: 25px; text-align: center;">
          <p style="margin: 0; font-size: 14px; font-weight: bold; color: #ffffff; text-transform: uppercase; letter-spacing: 1px;">
            ⚡ TIME CAPSULE CREATOR ⚡
          </p>
          <p style="margin: 5px 0 0 0; font-size: 12px; color: #1E90FF; text-transform: uppercase;">
            PRESERVING MEMORIES FOR THE FUTURE
          </p>
        </div>
        
      </div>
    </body>
    </html>
  `
}

/**
 * Generate plain text for capsule delivery email
 */
function generateCapsuleDeliveryText(data: CapsuleEmailData, capsuleUrl: string): string {
  const deliveryDateFormatted = new Date(data.deliveryDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short'
  })

  return `
🎁 Your Memory Capsule is Ready!

A message from your past self awaits you.

Time to Open Your ${data.contentType.charAt(0).toUpperCase() + data.contentType.slice(1)} Memory
Originally sealed on ${deliveryDateFormatted}

Open your capsule here: ${capsuleUrl}

${data.hasPassword ? '🔒 This capsule is password protected. You\'ll need the password you set when creating it.' : ''}

This capsule was created just for you. Take a moment to reflect on your journey since then.

Memory Capsule Creator - Preserving memories for the future
  `
}

/**
 * Generate HTML for payment confirmation email
 */
function generatePaymentConfirmationHTML(data: PaymentConfirmationData, capsuleUrl: string): string {
  const deliveryDateFormatted = new Date(data.deliveryDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short'
  })

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #10B981; margin: 0;">✅ Payment Confirmed!</h1>
        <p style="color: #64748B; font-size: 16px; margin: 10px 0 0 0;">Your memory capsule is now sealed</p>
      </div>
      
      <div style="background: #F0FDF4; border-radius: 12px; padding: 24px; margin: 20px 0;">
        <h2 style="color: #065F46; margin: 0 0 16px 0; font-size: 18px;">Payment Details</h2>
        <p style="margin: 8px 0; color: #047857;"><strong>Amount:</strong> $${(data.amountPaid / 100).toFixed(2)}</p>
        <p style="margin: 8px 0; color: #047857;"><strong>Session ID:</strong> ${data.sessionId}</p>
        <p style="margin: 8px 0; color: #047857;"><strong>Capsule Type:</strong> ${data.contentType.charAt(0).toUpperCase() + data.contentType.slice(1)} Memory</p>
        <p style="margin: 8px 0; color: #047857;"><strong>Will open on:</strong> ${deliveryDateFormatted}</p>
      </div>
      
      <div style="background: #EFF6FF; border-radius: 12px; padding: 24px; margin: 20px 0;">
        <h3 style="color: #1E40AF; margin: 0 0 12px 0;">Your Capsule Access</h3>
        <p style="margin: 8px 0; color: #1E40AF;"><strong>Unique Link:</strong> <a href="${capsuleUrl}" style="color: #2563EB;">${capsuleUrl}</a></p>
        <p style="color: #3730A3; font-size: 14px; margin: 12px 0 0 0;">
          💡 Save this link! You'll need it to access your capsule when it's ready to open.
        </p>
      </div>
      
      <div style="text-align: center; margin: 30px 0;">
        <p style="color: #64748B; font-size: 14px; margin: 0;">
          Thank you for creating a memory capsule! Your moment is now preserved for the future.
        </p>
      </div>
      
      <div style="border-top: 1px solid #E2E8F0; padding-top: 20px; text-align: center;">
        <p style="color: #94A3B8; font-size: 12px; margin: 0;">
          Memory Capsule Creator - Preserving memories for the future
        </p>
      </div>
    </div>
  `
}

/**
 * Generate plain text for payment confirmation email
 */
function generatePaymentConfirmationText(data: PaymentConfirmationData, capsuleUrl: string): string {
  const deliveryDateFormatted = new Date(data.deliveryDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short'
  })

  return `
✅ Payment Confirmed!

Your memory capsule is now sealed and will be delivered on ${deliveryDateFormatted}.

Payment Details:
- Amount: $${(data.amountPaid / 100).toFixed(2)}
- Session ID: ${data.sessionId}
- Capsule Type: ${data.contentType.charAt(0).toUpperCase() + data.contentType.slice(1)} Memory
- Will open on: ${deliveryDateFormatted}

Your Capsule Access:
- Unique Link: ${capsuleUrl}

💡 Save this link! You'll need it to access your capsule when it's ready to open.

Thank you for creating a memory capsule! Your moment is now preserved for the future.

Memory Capsule Creator - Preserving memories for the future
  `
}

/**
 * Get timeframe text for notifications
 */
function getTimeframeText(timeframe: '1hour' | '30min' | '10min'): string {
  switch (timeframe) {
    case '1hour':
      return 'in 1 Hour'
    case '30min':
      return 'in 30 Minutes'
    case '10min':
      return 'in 10 Minutes'
    default:
      return 'Soon'
  }
}

/**
 * Generate HTML for pre-opening notification email
 */
function generatePreOpeningNotificationHTML(data: CapsuleEmailData, capsuleUrl: string, timeframeText: string): string {
  const deliveryDateFormatted = new Date(data.deliveryDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short'
  })

  const urgencyColor = data.timeframe === '10min' ? '#EF4444' : data.timeframe === '30min' ? '#F59E0B' : '#8B5CF6'
  const urgencyBg = data.timeframe === '10min' ? '#FEF2F2' : data.timeframe === '30min' ? '#FEF3C7' : '#F3E8FF'
  const urgencyIcon = data.timeframe === '10min' ? '🚨' : data.timeframe === '30min' ? '⚡' : '⏰'

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Time Capsule Opening Soon</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: 'Courier New', monospace;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 6px solid #000000; box-shadow: 12px 12px 0px #000000;">
        
        <!-- Neobrutalist Header -->
        <div style="background-color: ${urgencyColor}; border-bottom: 6px solid #000000; padding: 30px; text-align: center;">
          <div style="background-color: #ffffff; border: 4px solid #000000; padding: 25px; display: inline-block; box-shadow: 8px 8px 0px #000000;">
            <h1 style="margin: 0; font-size: 28px; font-weight: 900; color: #000000; text-transform: uppercase; letter-spacing: 2px; line-height: 1.2;">
              ${urgencyIcon} CAPSULE<br/>OPENS<br/>${timeframeText.toUpperCase()}!
            </h1>
          </div>
        </div>
        
        <!-- Main Content -->
        <div style="padding: 40px 30px;">
          
          <!-- Brutalist Countdown Card -->
          <div style="background-color: #000000; border: 4px solid #000000; padding: 30px; margin-bottom: 30px; box-shadow: 8px 8px 0px ${urgencyColor};">
            <h2 style="margin: 0 0 20px 0; font-size: 24px; font-weight: 900; color: #ffffff; text-transform: uppercase; letter-spacing: 1px;">
              🎯 ${data.timeframe === '10min' ? 'FINAL COUNTDOWN!' : data.timeframe === '30min' ? 'ALMOST TIME!' : 'GET READY!'}
            </h2>
            <div style="background-color: #ffffff; border: 3px solid ${urgencyColor}; padding: 20px; margin-bottom: 25px;">
              <p style="margin: 0 0 10px 0; font-size: 18px; font-weight: bold; color: #000000;">
                TYPE: ${data.contentType.toUpperCase()} MEMORY
              </p>
              <p style="margin: 0 0 10px 0; font-size: 18px; font-weight: bold; color: #000000;">
                OPENS: ${deliveryDateFormatted}
              </p>
              <p style="margin: 0; font-size: 16px; font-weight: bold; color: ${urgencyColor};">
                STATUS: ${data.timeframe === '10min' ? 'OPENING NOW!' : data.timeframe === '30min' ? 'ALMOST READY' : 'PREPARING TO UNLOCK'}
              </p>
            </div>
            
            ${data.hasPassword ? `
              <div style="background-color: #ff6b35; border: 3px solid #000000; padding: 15px; margin-bottom: 25px;">
                <p style="margin: 0; font-size: 16px; font-weight: bold; color: #ffffff; text-transform: uppercase;">
                  🔒 PASSWORD REQUIRED
                </p>
                <p style="margin: 5px 0 0 0; font-size: 14px; color: #ffffff;">
                  Have your password ready!
                </p>
              </div>
            ` : ''}
            
            <div style="background-color: ${urgencyColor}; border: 3px solid #000000; padding: 20px;">
              <p style="margin: 0; font-size: 16px; font-weight: bold; color: #ffffff; text-transform: uppercase; line-height: 1.5;">
                ${data.timeframe === '10min' ? '🔥 YOUR TIME CAPSULE IS UNLOCKING RIGHT NOW!' : 
                  data.timeframe === '30min' ? '⚡ YOUR MEMORIES ARE WAITING FOR YOU!' : 
                  '⏰ YOUR TIME CAPSULE WILL BE READY IN ONE HOUR!'}
              </p>
            </div>
          </div>
          
          <!-- Brutalist Action Button -->
          <div style="text-align: center; margin: 40px 0;">
            <a href="${capsuleUrl}" style="text-decoration: none;">
              <div style="background-color: ${urgencyColor}; border: 4px solid #000000; padding: 25px 40px; display: inline-block; box-shadow: 8px 8px 0px #000000;">
                <p style="margin: 0; font-size: 20px; font-weight: 900; color: #ffffff; text-transform: uppercase; letter-spacing: 1px;">
                  ${data.timeframe === '10min' ? '🔓 OPEN NOW!' : data.timeframe === '30min' ? '🎁 GET READY!' : '⏰ PREPARE!'}
                </p>
              </div>
            </a>
          </div>
          
          <!-- Motivational Quote -->
          <div style="background-color: #f5f5f5; border: 4px solid #000000; padding: 25px; text-align: center; box-shadow: 6px 6px 0px #000000;">
            <p style="margin: 0; font-size: 18px; font-weight: bold; color: #000000; text-transform: uppercase; line-height: 1.4;">
              ${data.timeframe === '10min' ? '"THE MOMENT YOU\'VE BEEN WAITING FOR IS HERE!"' : 
                data.timeframe === '30min' ? '"SET A REMINDER - YOUR MEMORIES ARE ALMOST READY!"' : 
                '"MARK YOUR CALENDAR - YOUR PAST SELF HAS SOMETHING SPECIAL!"'}
            </p>
            <p style="margin: 15px 0 0 0; font-size: 14px; font-weight: bold; color: #666666;">
              - TIME CAPSULE SYSTEM
            </p>
          </div>
          
        </div>
        
        <!-- Neobrutalist Footer -->
        <div style="background-color: #000000; border-top: 6px solid #000000; padding: 25px; text-align: center;">
          <p style="margin: 0; font-size: 14px; font-weight: bold; color: #ffffff; text-transform: uppercase; letter-spacing: 1px;">
            ⚡ TIME CAPSULE CREATOR ⚡
          </p>
          <p style="margin: 5px 0 0 0; font-size: 12px; color: #1E90FF; text-transform: uppercase;">
            CONNECTING YOUR PAST AND FUTURE
          </p>
        </div>
        
      </div>
    </body>
    </html>
  `
}

/**
 * Generate plain text for pre-opening notification email
 */
function generatePreOpeningNotificationText(data: CapsuleEmailData, capsuleUrl: string, timeframeText: string): string {
  const deliveryDateFormatted = new Date(data.deliveryDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short'
  })

  const urgencyIcon = data.timeframe === '10min' ? '🚨' : data.timeframe === '30min' ? '⚡' : '⏰'
  const urgencyMessage = data.timeframe === '10min' ? 'Final countdown! Your time capsule is about to unlock!' : 
                        data.timeframe === '30min' ? 'Almost time! Your memories are waiting for you.' : 
                        'Your time capsule will be ready to open in just one hour!'

  return `
${urgencyIcon} Your Time Capsule Opens ${timeframeText}!

Get ready to unlock your memories

Your ${data.contentType.charAt(0).toUpperCase() + data.contentType.slice(1)} Time Capsule
Opens at ${deliveryDateFormatted}

${urgencyMessage}

${data.timeframe === '10min' ? 'Open now: ' : 'Get ready: '}${capsuleUrl}

${data.hasPassword ? '🔒 Remember: This capsule is password protected. Have your password ready!' : ''}

${data.timeframe === '10min' ? 'The moment you\'ve been waiting for is here!' : 
  data.timeframe === '30min' ? 'Set a reminder - your memories are almost ready!' : 
  'Mark your calendar - your past self has something special waiting for you.'}

Time Capsule Creator - Connecting your past and future
  `
} 