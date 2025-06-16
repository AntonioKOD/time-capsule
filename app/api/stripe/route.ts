import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { CapsuleFormData, StripeCheckoutResponse } from "@/types/capsule";
import { validateCapsuleForm } from "@/lib/validation";

// Initialize Stripe
const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2025-05-28.basil",
    })
  : null;

/**
 * POST /api/stripe - Create Stripe Checkout session for $1 capsule purchase
 * Validates form data and creates a checkout session with metadata
 */
export async function POST(request: NextRequest): Promise<NextResponse<StripeCheckoutResponse>> {
  try {
    // Check if Stripe is configured
    if (!stripe) {
      return NextResponse.json({
        success: false,
        error: "Stripe is not configured",
      }, { status: 500 });
    }
    
    // Parse form data (supports file uploads)
    const formData = await request.formData();
    
    // Extract form fields
    const contentType = formData.get("contentType") as string;
    const textContent = formData.get("textContent") as string;
    const mediaFile = formData.get("media") as File | null;
    const deliveryDate = formData.get("deliveryDate") as string;
    const recipientsString = formData.get("recipients") as string;
    const password = formData.get("password") as string;
    const isPublic = formData.get("isPublic") === "true";
    const userEmail = formData.get("userEmail") as string;
    
    // Parse recipients array
    const recipients = recipientsString 
      ? recipientsString.split(",").map(email => email.trim()).filter(Boolean)
      : [];
    
    // Create FormData for validation
    const capsuleFormData: CapsuleFormData = {
      contentType: contentType as 'text' | 'photo' | 'voice' | 'video',
      textContent: textContent || undefined,
      media: mediaFile || undefined,
      deliveryDate,
      recipients,
      password: password || undefined,
      isPublic,
      isPaid: true,
      userEmail,
    };
    
    // Validate form data
    const validationErrors = validateCapsuleForm(capsuleFormData);
    
    // Additional validation for paid capsules
    if (!userEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userEmail)) {
      validationErrors.userEmail = 'Valid email is required for payment confirmation';
    }
    
    if (Object.keys(validationErrors).length > 0) {
      return NextResponse.json({
        success: false,
        error: Object.values(validationErrors)[0], // Return first error
      }, { status: 400 });
    }
    
    // Prepare capsule data for metadata (Stripe has 500 char limit per field)
    const capsuleMetadata: Record<string, string> = {
      contentType,
      deliveryDate,
      isPublic: isPublic.toString(),
      userEmail,
      recipientCount: recipients.length.toString(),
      hasPassword: (!!password).toString(),
    };
    
    // Add text content if present (truncated to fit metadata limits)
    if (textContent) {
      capsuleMetadata.textContent = textContent.substring(0, 450); // Leave room for other fields
    }
    
    // Add recipients if present
    if (recipients.length > 0) {
      capsuleMetadata.recipients = recipients.join(',').substring(0, 450);
    }
    
    // Store media file info if present
    if (mediaFile && mediaFile.size > 0) {
      capsuleMetadata.mediaName = mediaFile.name;
      capsuleMetadata.mediaSize = mediaFile.size.toString();
      capsuleMetadata.mediaType = mediaFile.type;
    }
    
    // Get base URL with fallback
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    
    // Create Stripe Checkout session
    const session = await stripe?.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID || 'price_1RaHDKG2ZSwowhaHl5zja369', // Pre-created price ID from Stripe dashboard
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${baseUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/create`,
      customer_email: userEmail,
      metadata: capsuleMetadata,
      expires_at: Math.floor(Date.now() / 1000) + (30 * 60), // 30 minutes
    });
    
    console.log(`💳 Created Stripe session: ${session?.id} for ${userEmail}`);
    
    return NextResponse.json({
      success: true,
      data: {
        sessionUrl: session?.url || '',
        sessionId: session?.id,
      },
    });
    
  } catch (error) {
    console.error("❌ Error creating Stripe session:", error);
    
    if (error instanceof Stripe.errors.StripeError) {
      return NextResponse.json({
        success: false,
        error: `Payment error: ${error.message}`,
      }, { status: 400 });
    }
    
    return NextResponse.json({
      success: false,
      error: "Failed to create payment session",
    }, { status: 500 });
  }
} 