/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { headers } from "next/headers";
import { v4 as uuidv4 } from "uuid";
import payload from "payload";
import { sanitizeTextContent } from "@/lib/validation";
import { scheduleCapsuleDelivery } from "@/lib/email-scheduler";
import { sendCapsuleCreationConfirmation, sendCapsuleRecipientNotification } from "@/lib/email-templates";

// Initialize Stripe
const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2025-05-28.basil",
    })
  : null;

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

/**
 * POST /api/stripe/webhook - Handle Stripe webhook events
 * Processes successful payments and creates capsules
 */
export async function POST(request: NextRequest) {
  try {
    // Check if Stripe is configured
    if (!stripe || !webhookSecret) {
      console.error("❌ Stripe not configured");
      return NextResponse.json({ error: "Stripe not configured" }, { status: 500 });
    }
    
    const body = await request.text();
    const headersList = await headers();
    const signature = headersList.get("stripe-signature");

    if (!signature) {
      console.error("❌ No Stripe signature found");
      return NextResponse.json({ error: "No signature" }, { status: 400 });
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret!);
    } catch (err) {
      console.error("❌ Webhook signature verification failed:", err);
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    console.log(`🔔 Received Stripe webhook: ${event.type}`);

    // Handle successful payment
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      
      console.log(`💳 Payment completed for session: ${session.id}`);
      
      // Extract metadata from the session
      const metadata = session.metadata;
      if (!metadata) {
        console.error("❌ No metadata found in session");
        return NextResponse.json({ error: "No metadata" }, { status: 400 });
      }

      try {
        // Parse form data from metadata
        const contentType = metadata.contentType;
        const textContent = metadata.textContent;
        const deliveryDate = metadata.deliveryDate;
        const isPublic = metadata.isPublic === 'true';
        const userEmail = metadata.userEmail;
        const recipientsString = metadata.recipients || '';
        const hasPassword = metadata.hasPassword === 'true';
        
        // Parse recipients
        const recipients = recipientsString 
          ? recipientsString.split(',').map(email => email.trim()).filter(Boolean)
          : [];

        // Generate unique identifiers
        const uniqueLink = uuidv4();

        // Sanitize text content
        const sanitizedTextContent = textContent ? sanitizeTextContent(textContent) : undefined;

        // Prepare capsule data for Payload CMS
        const capsuleData: Record<string, unknown> = {
          contentType,
          textContent: sanitizedTextContent,
          deliveryDate: new Date(deliveryDate),
          recipients: recipients.map(email => ({ email })),
          uniqueLink,
          isPublic,
          isPaid: true,
          stripePaymentId: session.id,
          userEmail,
          status: 'scheduled',
        };

        // Add password if it was provided (we can't retrieve the actual password from metadata)
        // In a real implementation, you might store the form data temporarily during checkout
        if (hasPassword) {
          // For now, we'll indicate that a password was set but can't recreate it
          console.log("⚠️ Password was set but cannot be retrieved from webhook metadata");
          // You might want to implement a temporary storage solution for this
        }

        // Handle media file info if present
        if (metadata.mediaName && metadata.mediaSize && metadata.mediaType) {
          console.log(`📁 Media file info: ${metadata.mediaName} (${metadata.mediaSize} bytes)`);
          // Note: The actual file data is not available in the webhook
          // In a production setup, you'd need to store files temporarily during checkout
          // or implement a different flow for handling file uploads with payments
        }

        // Create capsule in Payload CMS
        const capsule = await payload.create({
          collection: 'capsules' as any,
          data: capsuleData as any,
        });

        console.log(`✅ Created paid capsule: ${capsule.id}`);

        // Create public capsule if requested
        if (isPublic && sanitizedTextContent) {
          try {
            await payload.create({
              collection: 'publicCapsules' as any,
              data: {
                originalCapsuleId: capsule.id,
                textContent: sanitizedTextContent,
                tags: [], // Tags will be auto-generated by hooks
              } as any,
            });
            console.log(`🌍 Created public capsule for: ${capsule.id}`);
          } catch (publicError) {
            console.error("❌ Error creating public capsule:", publicError);
            // Don't fail the main process if public capsule creation fails
          }
        }

        // Schedule email delivery
        try {
          const scheduledJobId = await scheduleCapsuleDelivery(
            capsule.id,
            new Date(deliveryDate),
            recipients.length > 0 ? recipients : [userEmail],
            [],
            deliveryDate
          );
          
          // Update capsule with scheduled job ID
          await payload.update({
            collection: 'capsules' as any,
            id: capsule.id,
            data: {
              scheduledJobId,
            } as any,
          });
          
          console.log(`📅 Scheduled delivery for capsule: ${capsule.id}`);
        } catch (scheduleError) {
          console.error("❌ Error scheduling delivery:", scheduleError);
        }

        // Send confirmation email
        try {
          await sendCapsuleCreationConfirmation(
            uniqueLink,
            userEmail,
            deliveryDate,
            contentType
          );
          console.log(`📧 Sent confirmation email to: ${userEmail}`);
        } catch (emailError) {
          console.error("❌ Error sending confirmation email:", emailError);
        }

        // Send notification emails to recipients
        if (recipients.length > 0) {
          for (const recipientEmail of recipients) {
            try {
              await sendCapsuleRecipientNotification(
                recipientEmail,
                deliveryDate,
                contentType,
                uniqueLink,
                hasPassword
              );
              console.log(`📧 Recipient notification sent to: ${recipientEmail}`);
            } catch (error) {
              console.error(`⚠️ Failed to send recipient notification to ${recipientEmail}:`, error);
              // Don't fail the main request if recipient notification fails
            }
          }
        }

        return NextResponse.json({ 
          success: true, 
          capsuleId: capsule.id 
        });

      } catch (error) {
        console.error("❌ Error processing paid capsule:", error);
        return NextResponse.json({ 
          error: "Failed to create capsule" 
        }, { status: 500 });
      }
    }

    // Handle other webhook events if needed
    console.log(`ℹ️ Unhandled webhook event: ${event.type}`);
    return NextResponse.json({ received: true });

  } catch (error) {
    console.error("❌ Webhook error:", error);
    return NextResponse.json({ 
      error: "Webhook processing failed" 
    }, { status: 500 });
  }
}

// Helper function moved inside the POST handler if needed
// export async function verifyWebhookSignature - REMOVED (not allowed in route files) 