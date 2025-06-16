import { getPayloadClient } from './payload'
import { sendCapsuleDeliveryEmail, sendCapsulePreOpeningEmail, CapsuleEmailData } from './email-templates'
import { sendCapsuleDeliverySMS } from './sms-service'

/**
 * Email Scheduler for Memory Capsule Delivery
 * Handles scheduled delivery of memory capsules via Resend
 */

export interface CapsuleForDelivery {
  id: string
  uniqueLink: string
  deliveryDate: string
  contentType: string
  recipients?: Array<{ email: string }>
  phoneRecipients?: Array<{ phone: string }>
  userEmail?: string
  userPhone?: string
  password?: string
  status: string
}

/**
 * Check for capsules that need pre-opening notifications
 * Sends 3 notifications: 1 hour before, 30 minutes before, and 10 minutes before opening
 */
export async function processPreOpeningNotifications(): Promise<{
  processed: number
  succeeded: number
  failed: string[]
}> {
  try {
    const payload = await getPayloadClient()
    const now = new Date()
    
    // Calculate time windows for notifications
    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000)
    const thirtyMinutesFromNow = new Date(now.getTime() + 30 * 60 * 1000)
    const tenMinutesFromNow = new Date(now.getTime() + 10 * 60 * 1000)
    
    const results = {
      processed: 0,
      succeeded: 0,
      failed: [] as string[],
    }
    
    // Find capsules that need 1-hour notification
    const capsulesFor1Hour = await payload.find({
      collection: 'capsules',
      where: {
        and: [
          {
            deliveryDate: {
              greater_than: now.toISOString(),
              less_than_equal: oneHourFromNow.toISOString(),
            },
          },
          {
            status: {
              equals: 'scheduled',
            },
          },
          {
            or: [
              { notificationsSent: { exists: false } },
              { notificationsSent: { not_equals: '1hour,30min,10min' } },
            ],
          },
        ],
      },
      limit: 50,
    })
    
    // Process 1-hour notifications
    for (const capsule of capsulesFor1Hour.docs) {
      try {
        const notifications = capsule.notificationsSent || ''
        if (!notifications.includes('1hour')) {
          await sendPreOpeningNotification(capsule as CapsuleForDelivery, '1hour')
          const newNotifications = notifications ? `${notifications},1hour` : '1hour'
          await payload.update({
            collection: 'capsules',
            id: capsule.id,
            data: { notificationsSent: newNotifications },
          })
          results.succeeded++
        }
        results.processed++
      } catch (error) {
        console.error(`❌ Failed 1-hour notification for ${capsule.uniqueLink}:`, error)
        results.failed.push(`${capsule.uniqueLink} (1hour)`)
      }
    }
    
    // Find capsules that need 30-minute notification
    const capsulesFor30Min = await payload.find({
      collection: 'capsules',
      where: {
        and: [
          {
            deliveryDate: {
              greater_than: now.toISOString(),
              less_than_equal: thirtyMinutesFromNow.toISOString(),
            },
          },
          {
            status: {
              equals: 'scheduled',
            },
          },
          {
            notificationsSent: {
              contains: '1hour',
            },
          },
          {
            notificationsSent: {
              not_contains: '30min',
            },
          },
        ],
      },
      limit: 50,
    })
    
    // Process 30-minute notifications
    for (const capsule of capsulesFor30Min.docs) {
      try {
        await sendPreOpeningNotification(capsule as CapsuleForDelivery, '30min')
        const notifications = capsule.notificationsSent || ''
        await payload.update({
          collection: 'capsules',
          id: capsule.id,
          data: { notificationsSent: `${notifications},30min` },
        })
        results.succeeded++
        results.processed++
      } catch (error) {
        console.error(`❌ Failed 30-min notification for ${capsule.uniqueLink}:`, error)
        results.failed.push(`${capsule.uniqueLink} (30min)`)
      }
    }
    
    // Find capsules that need 10-minute notification
    const capsulesFor10Min = await payload.find({
      collection: 'capsules',
      where: {
        and: [
          {
            deliveryDate: {
              greater_than: now.toISOString(),
              less_than_equal: tenMinutesFromNow.toISOString(),
            },
          },
          {
            status: {
              equals: 'scheduled',
            },
          },
          {
            notificationsSent: {
              contains: '30min',
            },
          },
          {
            notificationsSent: {
              not_contains: '10min',
            },
          },
        ],
      },
      limit: 50,
    })
    
    // Process 10-minute notifications
    for (const capsule of capsulesFor10Min.docs) {
      try {
        await sendPreOpeningNotification(capsule as CapsuleForDelivery, '10min')
        const notifications = capsule.notificationsSent || ''
        await payload.update({
          collection: 'capsules',
          id: capsule.id,
          data: { notificationsSent: `${notifications},10min` },
        })
        results.succeeded++
        results.processed++
      } catch (error) {
        console.error(`❌ Failed 10-min notification for ${capsule.uniqueLink}:`, error)
        results.failed.push(`${capsule.uniqueLink} (10min)`)
      }
    }
    
    if (results.processed > 0) {
      console.log(`🔔 Pre-opening notifications: ${results.succeeded}/${results.processed} succeeded`)
    }
    
    return results
    
  } catch (error) {
    console.error('❌ Error processing pre-opening notifications:', error)
    throw error
  }
}

/**
 * Check for capsules ready to be delivered and send them
 * This function should be called periodically (e.g., via a cron job)
 */
export async function processScheduledDeliveries(): Promise<{
  processed: number
  succeeded: number
  failed: string[]
}> {
  try {
    const payload = await getPayloadClient()
    const now = new Date()
    
    // Find capsules that are due for delivery
    const capsules = await payload.find({
      collection: 'capsules',
      where: {
        and: [
          {
            deliveryDate: {
              less_than_equal: now.toISOString(),
            },
          },
          {
            status: {
              equals: 'scheduled',
            },
          },
        ],
      },
      limit: 100, // Process in batches
    })
    
    const results = {
      processed: capsules.docs.length,
      succeeded: 0,
      failed: [] as string[],
    }
    
    console.log(`📅 Found ${capsules.docs.length} capsules ready for delivery`)
    
    // Process each capsule
    for (const capsule of capsules.docs) {
      try {
        console.log(`🔍 Processing capsule ${capsule.uniqueLink} - userEmail: ${capsule.userEmail}, recipients: ${capsule.recipients?.length || 0}`)
        await deliverCapsule(capsule as CapsuleForDelivery)
        results.succeeded++
        
        // Update capsule status to delivered
        await payload.update({
          collection: 'capsules',
          id: capsule.id,
          data: {
            status: 'delivered',
            deliveredAt: new Date().toISOString(),
          },
        })
        
        console.log(`✅ Delivered capsule: ${capsule.uniqueLink}`)
        
      } catch (error) {
        console.error(`❌ Failed to deliver capsule ${capsule.uniqueLink}:`, error)
        results.failed.push(capsule.uniqueLink)
        
        // Update capsule status to failed
        await payload.update({
          collection: 'capsules',
          id: capsule.id,
          data: {
            status: 'failed',
            failureReason: error instanceof Error ? error.message : 'Unknown error',
          },
        })
      }
    }
    
    if (results.processed > 0) {
      console.log(`📧 Delivery batch complete: ${results.succeeded}/${results.processed} succeeded`)
    }
    
    return results
    
  } catch (error) {
    console.error('❌ Error processing scheduled deliveries:', error)
    throw error
  }
}

/**
 * Send pre-opening notification email
 */
async function sendPreOpeningNotification(
  capsule: CapsuleForDelivery,
  timeframe: '1hour' | '30min' | '10min'
): Promise<void> {
  // Determine all recipient emails
  const recipientEmails: string[] = []
  
  // Add user email (creator) if available
  if (capsule.userEmail) {
    recipientEmails.push(capsule.userEmail)
  }
  
  // Add additional recipients if available
  if (capsule.recipients && capsule.recipients.length > 0) {
    recipientEmails.push(...capsule.recipients.map(r => r.email))
  }
  
  if (recipientEmails.length === 0) {
    throw new Error('No recipient email available')
  }
  
  // Send notification to each recipient
  let successCount = 0
  const errors: string[] = []
  
  for (const recipientEmail of recipientEmails) {
    try {
      // Prepare email data
      const emailData: CapsuleEmailData = {
        uniqueLink: capsule.uniqueLink,
        deliveryDate: capsule.deliveryDate,
        contentType: capsule.contentType,
        recipientEmail,
        creatorEmail: capsule.userEmail,
        hasPassword: !!capsule.password,
        isPreOpeningNotification: true,
        timeframe,
      }
      
      // Send the pre-opening notification email
      const success = await sendCapsulePreOpeningEmail(emailData)
      
      if (success) {
        successCount++
        console.log(`🔔 Sent ${timeframe} notification for capsule ${capsule.uniqueLink} to ${recipientEmail}`)
      } else {
        errors.push(`Failed to send ${timeframe} notification to ${recipientEmail}`)
      }
    } catch (error) {
      errors.push(`Error sending ${timeframe} notification to ${recipientEmail}: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
  
  if (successCount === 0) {
    throw new Error(`Failed to send ${timeframe} notification to any recipients: ${errors.join(', ')}`)
  }
  
  if (errors.length > 0) {
    console.warn(`⚠️ Partial ${timeframe} notification success for capsule ${capsule.uniqueLink}. Errors: ${errors.join(', ')}`)
  }
}

/**
 * Deliver a single capsule via email and SMS
 */
async function deliverCapsule(capsule: CapsuleForDelivery): Promise<void> {
  // Determine all recipient emails
  const recipientEmails: string[] = []
  
  // Add user email (creator) if available
  if (capsule.userEmail) {
    recipientEmails.push(capsule.userEmail)
  }
  
  // Add additional recipients if available
  if (capsule.recipients && capsule.recipients.length > 0) {
    recipientEmails.push(...capsule.recipients.map(r => r.email))
  }

  // Determine all recipient phone numbers
  const recipientPhones: string[] = []
  
  // Add user phone (creator) if available
  if (capsule.userPhone) {
    recipientPhones.push(capsule.userPhone)
  }
  
  // Add additional phone recipients if available
  if (capsule.phoneRecipients && capsule.phoneRecipients.length > 0) {
    recipientPhones.push(...capsule.phoneRecipients.map(r => r.phone))
  }
  
  if (recipientEmails.length === 0 && recipientPhones.length === 0) {
    throw new Error('No recipient email or phone number available')
  }
  
  // Send email to each recipient
  let emailSuccessCount = 0
  let smsSuccessCount = 0
  const errors: string[] = []
  
  // Send emails
  for (const recipientEmail of recipientEmails) {
    try {
      // Prepare email data
      const emailData: CapsuleEmailData = {
        uniqueLink: capsule.uniqueLink,
        deliveryDate: capsule.deliveryDate,
        contentType: capsule.contentType,
        recipientEmail,
        creatorEmail: capsule.userEmail,
        hasPassword: !!capsule.password,
      }
      
      // Send the delivery email
      const success = await sendCapsuleDeliveryEmail(emailData)
      
      if (success) {
        emailSuccessCount++
        console.log(`📧 Delivered capsule ${capsule.uniqueLink} to ${recipientEmail}`)
      } else {
        errors.push(`Failed to send email to ${recipientEmail}`)
      }
    } catch (error) {
      errors.push(`Error sending email to ${recipientEmail}: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Send SMS to each phone recipient
  for (const recipientPhone of recipientPhones) {
    try {
      // Send the delivery SMS
      const result = await sendCapsuleDeliverySMS({
        phoneNumber: recipientPhone,
        message: '', // Message will be generated in the SMS service
        uniqueLink: capsule.uniqueLink,
      })
      
      if (result.success) {
        smsSuccessCount++
        console.log(`📱 Delivered capsule ${capsule.uniqueLink} to ${recipientPhone}`)
      } else {
        errors.push(`Failed to send SMS to ${recipientPhone}: ${result.error}`)
      }
    } catch (error) {
      errors.push(`Error sending SMS to ${recipientPhone}: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
  
  const totalSuccessCount = emailSuccessCount + smsSuccessCount
  
  if (totalSuccessCount === 0) {
    throw new Error(`Failed to deliver to any recipients: ${errors.join(', ')}`)
  }
  
  if (errors.length > 0) {
    console.warn(`⚠️ Partial delivery success for capsule ${capsule.uniqueLink}. Emails: ${emailSuccessCount}/${recipientEmails.length}, SMS: ${smsSuccessCount}/${recipientPhones.length}. Errors: ${errors.join(', ')}`)
  }
}

/**
 * Schedule a single capsule for future delivery
 * This is called when a capsule is created
 */
export async function scheduleCapsuleDelivery(
  capsuleId: string,
  deliveryDate: string
): Promise<boolean> {
  try {
    const payload = await getPayloadClient()
    
    // Update capsule status to scheduled
    await payload.update({
      collection: 'capsules',
      id: capsuleId,
      data: {
        status: 'scheduled',
      },
    })
    
    console.log(`📅 Scheduled capsule ${capsuleId} for delivery on ${deliveryDate}`)
    return true
    
  } catch (error) {
    console.error(`❌ Failed to schedule capsule ${capsuleId}:`, error)
    return false
  }
}

/**
 * Get delivery statistics
 */
export async function getDeliveryStats(): Promise<{
  scheduled: number
  delivered: number
  failed: number
  overdue: number
}> {
  try {
    const payload = await getPayloadClient()
    const now = new Date()
    
    // Count scheduled capsules
    const scheduled = await payload.count({
      collection: 'capsules',
      where: {
        status: {
          equals: 'scheduled',
        },
      },
    })
    
    // Count delivered capsules
    const delivered = await payload.count({
      collection: 'capsules',
      where: {
        status: {
          equals: 'delivered',
        },
      },
    })
    
    // Count failed capsules
    const failed = await payload.count({
      collection: 'capsules',
      where: {
        status: {
          equals: 'failed',
        },
      },
    })
    
    // Count overdue capsules (scheduled but past delivery date)
    const overdue = await payload.count({
      collection: 'capsules',
      where: {
        and: [
          {
            status: {
              equals: 'scheduled',
            },
          },
          {
            deliveryDate: {
              less_than: now.toISOString(),
            },
          },
        ],
      },
    })
    
    return {
      scheduled: scheduled.totalDocs,
      delivered: delivered.totalDocs,
      failed: failed.totalDocs,
      overdue: overdue.totalDocs,
    }
    
  } catch (error) {
    console.error('❌ Error getting delivery stats:', error)
    return {
      scheduled: 0,
      delivered: 0,
      failed: 0,
      overdue: 0,
    }
  }
}

/**
 * Retry failed deliveries
 */
export async function retryFailedDeliveries(): Promise<{
  processed: number
  succeeded: number
  failed: string[]
}> {
  try {
    const payload = await getPayloadClient()
    
    // Find failed capsules that are ready for delivery
    const capsules = await payload.find({
      collection: 'capsules',
      where: {
        and: [
          {
            status: {
              equals: 'failed',
            },
          },
          {
            deliveryDate: {
              less_than_equal: new Date().toISOString(),
            },
          },
        ],
      },
      limit: 50, // Process smaller batches for retries
    })
    
    const results = {
      processed: capsules.docs.length,
      succeeded: 0,
      failed: [] as string[],
    }
    
    console.log(`🔄 Retrying ${capsules.docs.length} failed deliveries`)
    
    // Process each failed capsule
    for (const capsule of capsules.docs) {
      try {
        await deliverCapsule(capsule as CapsuleForDelivery)
        results.succeeded++
        
        // Update capsule status to delivered
        await payload.update({
          collection: 'capsules',
          id: capsule.id,
          data: {
            status: 'delivered',
            deliveredAt: new Date().toISOString(),
            failureReason: null, // Clear failure reason on success
          },
        })
        
        console.log(`✅ Retry successful for capsule: ${capsule.uniqueLink}`)
        
      } catch (error) {
        console.error(`❌ Retry failed for capsule ${capsule.uniqueLink}:`, error)
        results.failed.push(capsule.uniqueLink)
        
        // Update failure reason
        await payload.update({
          collection: 'capsules',
          id: capsule.id,
          data: {
            failureReason: error instanceof Error ? error.message : 'Retry failed',
          },
        })
      }
    }
    
    if (results.processed > 0) {
      console.log(`🔄 Retry batch complete: ${results.succeeded}/${results.processed} succeeded`)
    }
    
    return results
    
  } catch (error) {
    console.error('❌ Error retrying failed deliveries:', error)
    throw error
  }
}

// Export types for external use
export type { CapsuleForDelivery } 