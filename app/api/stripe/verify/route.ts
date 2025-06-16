import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getPayloadClient } from "@/lib/payload";
import { sendPaymentConfirmationEmail } from "@/lib/email-templates";

// Initialize Stripe
const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2024-12-18.acacia",
    })
  : null;

/**
 * GET /api/stripe/verify - Verify payment session and return capsule details
 * Used by the success page to confirm payment and display capsule information
 */
export async function GET(request: NextRequest) {
  try {
    // Check if Stripe is configured
    if (!stripe) {
      return NextResponse.json({
        success: false,
        error: "Stripe is not configured",
      }, { status: 500 });
    }
    
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('session_id');

    if (!sessionId) {
      return NextResponse.json({
        success: false,
        error: 'No session ID provided',
      }, { status: 400 });
    }

    // Retrieve the session from Stripe
    const session = await stripe?.checkout.sessions.retrieve(sessionId);

    if (!session) {
      return NextResponse.json({
        success: false,
        error: 'Session not found',
      }, { status: 404 });
    }

    // Check if payment was successful
    if (session.payment_status !== 'paid') {
      return NextResponse.json({
        success: false,
        error: 'Payment not completed',
      }, { status: 400 });
    }

    // Extract metadata
    const metadata = session.metadata;
    if (!metadata) {
      return NextResponse.json({
        success: false,
        error: 'No metadata found',
      }, { status: 400 });
    }

    // Try to find the capsule in the database
    let capsule = null;
    try {
      const payload = await getPayloadClient();
      const capsules = await payload.find({
        collection: 'capsules',
        where: {
          stripePaymentId: {
            equals: sessionId,
          },
        },
        limit: 1,
      });

      if (capsules.docs.length > 0) {
        capsule = capsules.docs[0];
      }
    } catch (dbError) {
      console.error("❌ Error finding capsule:", dbError);
      // Continue without capsule data if database lookup fails
    }

    // Prepare response data
    const responseData = {
      sessionId,
      paymentStatus: session.payment_status,
      customerEmail: session.customer_email,
      amountTotal: session.amount_total,
      currency: session.currency,
      contentType: metadata.contentType,
      deliveryDate: metadata.deliveryDate,
      isPublic: metadata.isPublic === 'true',
      recipientCount: parseInt(metadata.recipientCount || '0'),
      capsuleId: capsule?.id || metadata.userEmail?.split('@')[0] + '_' + Date.now(),
      created: session.created,
    };

    console.log(`✅ Verified payment session: ${sessionId}`);

    // Send payment confirmation email
    if (session.customer_email && capsule) {
      try {
        await sendPaymentConfirmationEmail({
          uniqueLink: capsule.uniqueLink,
          deliveryDate: capsule.deliveryDate,
          contentType: capsule.contentType,
          customerEmail: session.customer_email,
          sessionId,
          amountPaid: session.amount_total || 100,
        });
      } catch (emailError) {
        console.error("⚠️ Failed to send payment confirmation email:", emailError);
        // Don't fail the whole request if email fails
      }
    }

    return NextResponse.json({
      success: true,
      data: responseData,
    });

  } catch (error) {
    console.error("❌ Error verifying payment:", error);

    if (error instanceof Stripe.errors.StripeError) {
      return NextResponse.json({
        success: false,
        error: `Stripe error: ${error.message}`,
      }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      error: "Failed to verify payment",
    }, { status: 500 });
  }
} 