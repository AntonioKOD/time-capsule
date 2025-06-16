/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcryptjs";
import { getPayloadClient } from "@/lib/payload";
import { sanitizeTextContent, generateUniqueFilename } from "@/lib/validation";
import { sendCapsuleCreationConfirmation, sendCapsuleRecipientNotification } from "@/lib/email-templates";
// import { sendCapsuleCreationSMS, sendCapsuleRecipientSMS } from "@/lib/sms-service"; // SMS functionality commented out
import { scheduleCapsuleDelivery } from "@/lib/email-scheduler";
import { CapsuleApiResponse, ContentType } from "@/types/capsule";

/**
 * POST /api/capsules-custom - Create a new memory capsule
 * Handles form data with optional file upload, validation, and email scheduling
 */
export async function POST(request: NextRequest): Promise<NextResponse<CapsuleApiResponse>> {
  try {
    // Rate limiting check (basic implementation)
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    console.log(`📝 Capsule creation request from IP: ${ip}`);
    
    // Parse form data (supports file uploads)
    const formData = await request.formData();
    
    // Extract form fields
    const contentType = formData.get("contentType") as string;
    const textContent = formData.get("textContent") as string;
    const deliveryDate = formData.get("deliveryDate") as string;
    const recipientsString = formData.get("recipients") as string;
    // const phoneRecipientsString = formData.get("phoneRecipients") as string; // SMS functionality commented out
    const password = formData.get("password") as string;
    const isPublic = formData.get("isPublic") === "true";
    const isPaid = formData.get("isPaid") === "true";
    const userEmail = formData.get("userEmail") as string;
    // const userPhone = formData.get("userPhone") as string; // SMS functionality commented out
    const userPhone: string | undefined = undefined; // SMS functionality disabled
    
    // Parse recipients array
    const recipients = recipientsString 
      ? recipientsString.split(',').map(email => email.trim()).filter(Boolean)
      : [];
    
    // Parse phone recipients array
    // SMS functionality commented out
    const phoneRecipients: string[] = []; // Empty array since SMS is disabled
    
    // Handle media file
    const mediaFile = formData.get("media") as File | null;
    
    console.log(`📝 Creating capsule: ${contentType}, delivery: ${deliveryDate}, recipients: ${recipients.length}`);
    
    // Basic validation
    if (!contentType || !deliveryDate) {
      return NextResponse.json({
        success: false,
        error: "Content type and delivery date are required",
      }, { status: 400 });
    }
    
    // Validate content type
    if (!['text', 'photo', 'voice', 'video'].includes(contentType)) {
      return NextResponse.json({
        success: false,
        error: "Invalid content type",
      }, { status: 400 });
    }
    
    // Validate delivery date (with test mode support)
    const testMode = formData.get('testMode') === 'true';
    const deliveryDateTime = new Date(deliveryDate);
    
    console.log(`🔍 Date validation - testMode: ${testMode}, deliveryDate: ${deliveryDate}, parsed: ${deliveryDateTime.toISOString()}`);
    console.log(`🔍 Current time: ${new Date().toISOString()}, Is past date: ${deliveryDateTime < new Date()}`);
    const oneMonthFromNow = new Date();
    oneMonthFromNow.setMonth(oneMonthFromNow.getMonth() + 1);
    const twentyYearsFromNow = new Date();
    twentyYearsFromNow.setFullYear(twentyYearsFromNow.getFullYear() + 20);
    
    // Allow immediate dates for testing, but normal validation for production
    if (!testMode && (deliveryDateTime < oneMonthFromNow || deliveryDateTime > twentyYearsFromNow)) {
      return NextResponse.json({
        success: false,
        error: "Delivery date must be between 1 month and 20 years from now",
      }, { status: 400 });
    }
    
    // Even in test mode, enforce the upper limit
    if (deliveryDateTime > twentyYearsFromNow) {
      return NextResponse.json({
        success: false,
        error: "Delivery date cannot be more than 20 years from now",
      }, { status: 400 });
    }
    
    // Validate recipients
    if (recipients.length > 3) {
      return NextResponse.json({
        success: false,
        error: "Maximum 3 recipients allowed",
      }, { status: 400 });
    }
    
    // Validate recipient emails
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    for (const email of recipients) {
      if (!emailRegex.test(email)) {
        return NextResponse.json({
          success: false,
          error: `Invalid email format: ${email}`,
        }, { status: 400 });
      }
    }
    
    // Validate user email if provided
    if (userEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userEmail)) {
      return NextResponse.json({
        success: false,
        error: "Invalid user email format",
      }, { status: 400 });
    }

    // Validate phone recipients
    // SMS functionality commented out
    /*
    if (phoneRecipients.length > 3) {
      return NextResponse.json({
        success: false,
        error: "Maximum 3 phone recipients allowed",
      }, { status: 400 });
    }

    // Validate phone numbers
    for (const phone of phoneRecipients) {
      const digitsOnly = phone.replace(/\D/g, '');
      if (digitsOnly.length < 7 || digitsOnly.length > 15) {
        return NextResponse.json({
          success: false,
          error: `Invalid phone number format: ${phone}`,
        }, { status: 400 });
      }
    }

    // Validate user phone if provided
    if (userPhone) {
      const digitsOnly = userPhone.replace(/\D/g, '');
      if (digitsOnly.length < 7 || digitsOnly.length > 15) {
        return NextResponse.json({
          success: false,
          error: "Invalid user phone number format",
        }, { status: 400 });
      }
    }
    */

    // Validate paid capsule requirements
    if (isPaid && !userEmail) {
      return NextResponse.json({
        success: false,
        error: "Email is required for paid capsules",
      }, { status: 400 });
    }
    
    // Validate text content
    if (textContent && textContent.length > 2500) { // ~500 words
      return NextResponse.json({
        success: false,
        error: "Text content too long (max 500 words)",
      }, { status: 400 });
    }
    
    // Validate media file
    let mediaData: Record<string, unknown> | undefined;
    if (mediaFile && mediaFile.size > 0) {
      // Check file size with different limits based on content type
      let maxSize: number;
      if (contentType === 'photo') {
        maxSize = 10 * 1024 * 1024; // 10MB for photos
      } else if (contentType === 'voice') {
        maxSize = 25 * 1024 * 1024; // 25MB for voice (3 minutes)
      } else if (contentType === 'video') {
        maxSize = 50 * 1024 * 1024; // 50MB for video (3 minutes)
      } else {
        maxSize = 5 * 1024 * 1024; // Default 5MB
      }
      
      if (mediaFile.size > maxSize) {
        const maxSizeMB = Math.round(maxSize / (1024 * 1024));
        return NextResponse.json({
          success: false,
          error: `File size too large (max ${maxSizeMB}MB for ${contentType})`,
        }, { status: 400 });
      }
      
      // Check file type
      const allowedTypes = {
        photo: ['image/jpeg', 'image/jpg', 'image/png'],
        voice: ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/m4a'],
        video: ['video/mp4', 'video/mov', 'video/avi', 'video/quicktime']
      };
      
      const expectedTypes = allowedTypes[contentType as keyof typeof allowedTypes];
      if (expectedTypes && !expectedTypes.includes(mediaFile.type)) {
        return NextResponse.json({
          success: false,
          error: `Invalid file type for ${contentType}. Expected: ${expectedTypes.join(', ')}`,
        }, { status: 400 });
      }
      
      try {
        // Upload media file to Payload CMS
        const payload = await getPayloadClient();
        const uploadedMedia = await payload.create({
          collection: 'media',
          data: {
            alt: `${contentType} for memory capsule`,
          },
          file: {
            data: Buffer.from(await mediaFile.arrayBuffer()),
            mimetype: mediaFile.type,
            name: generateUniqueFilename(mediaFile.name, contentType as ContentType),
            size: mediaFile.size,
          },
        });
        mediaData = uploadedMedia;
        console.log(`📁 Media uploaded successfully: ${uploadedMedia.id}`);
      } catch (error) {
        console.error("❌ Error uploading media:", error);
        return NextResponse.json({
          success: false,
          error: "Failed to upload media file",
        }, { status: 500 });
      }
    }
    
    // Generate unique link for the capsule
    const uniqueLink = uuidv4();
    
    // Hash password if provided
    let hashedPassword: string | undefined;
    if (password) {
      hashedPassword = await bcrypt.hash(password, 12);
    }
    
    // Sanitize text content
    const sanitizedTextContent = textContent ? sanitizeTextContent(textContent) : undefined;
    
    try {
      // Create capsule in Payload CMS
      const payload = await getPayloadClient();
      const capsule = await payload.create({
        collection: "capsules",
        data: {
          contentType,
          textContent: sanitizedTextContent,
          media: mediaData?.id,
          deliveryDate: deliveryDateTime.toISOString(),
          recipients: recipients.map(email => ({ email })),
          // phoneRecipients: phoneRecipients.map(phone => ({ phone })), // SMS functionality commented out
          uniqueLink,
          password: hashedPassword,
          isPublic,
          isPaid,
          userEmail,
          // userPhone, // SMS functionality commented out
          status: 'scheduled',
          testMode,
        },
      });
      
      console.log(`✅ Capsule created successfully: ${capsule.id}`);
      
      // Create public capsule entry if it's public
      if (isPublic && sanitizedTextContent) {
        try {
          const tags = generateTagsFromText(sanitizedTextContent);
          const sentiment = analyzeSentiment(sanitizedTextContent);
          
          await payload.create({
            collection: "publicCapsules",
            data: {
              originalCapsuleId: capsule.id,
              textContent: sanitizedTextContent,
              tags: tags.map(tag => ({ tag })),
              sentiment,
              wordCount: sanitizedTextContent.split(/\s+/).length,
              featured: false,
              likes: 0,
              views: 0,
              reportCount: 0,
              isHidden: false,
            },
          });
          
          console.log(`🌍 Public capsule entry created for: ${capsule.id}`);
        } catch (publicError) {
          console.error("⚠️ Failed to create public capsule entry:", publicError);
          // Don't fail the main request if public capsule creation fails
        }
      }
      
      // Schedule delivery
      try {
        await scheduleCapsuleDelivery(capsule.id, deliveryDateTime, recipients, phoneRecipients, deliveryDate);
        console.log(`📅 Scheduled capsule ${capsule.id} for delivery on ${deliveryDate}`);
        console.log(`📅 Capsule scheduled for delivery on: ${deliveryDate}`);
      } catch (scheduleError) {
        console.error("⚠️ Failed to schedule capsule delivery:", scheduleError);
        // Don't fail the main request if scheduling fails
      }
      
      // Send confirmation emails
      try {
        if (userEmail) {
          await sendCapsuleCreationConfirmation(
            uniqueLink,
            userEmail,
            deliveryDateTime.toISOString(),
            contentType
          );
          console.log(`📧 Capsule creation confirmation sent to: ${userEmail}`);
        }
        
        // Send notifications to recipients
        for (const email of recipients) {
          try {
            await sendCapsuleRecipientNotification(
              email,
              deliveryDateTime.toISOString(),
              contentType,
              uniqueLink,
              !!password
            );
            console.log(`📧 Recipient notification sent to: ${email}`);
          } catch (emailError) {
            console.error(`⚠️ Failed to send notification to ${email}:`, emailError);
            // Continue with other recipients
          }
        }
      } catch (emailError) {
        console.error("⚠️ Failed to send confirmation emails:", emailError);
        // Don't fail the main request if email fails
      }
      
      // Send SMS notifications
      // SMS functionality commented out
      /*
      try {
        if (userPhone) {
          await sendCapsuleCreationSMS(userPhone, {
            uniqueLink,
            deliveryDate: deliveryDateTime,
          });
          console.log(`📱 Capsule creation SMS sent to: ${userPhone}`);
        }
        
        // Send SMS notifications to phone recipients
        for (const phone of phoneRecipients) {
          try {
            await sendCapsuleRecipientSMS(phone, {
              deliveryDate: deliveryDateTime,
              senderPhone: userPhone || 'anonymous',
            });
            console.log(`📱 Recipient SMS sent to: ${phone}`);
          } catch (smsError) {
            console.error(`⚠️ Failed to send SMS to ${phone}:`, smsError);
            // Continue with other recipients
          }
        }
      } catch (smsError) {
        console.error("⚠️ Failed to send SMS notifications:", smsError);
        // Don't fail the main request if SMS fails
      }
      */
      
      // Generate shareable image URL (placeholder for now)
      // In production, you would generate an actual image using html2canvas or similar
      const shareableImageUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/api/share-image/${capsule.id}`;
      
      // Return success response
      return NextResponse.json({
        success: true,
        data: {
          uniqueLink,
          shareableImageUrl,
          capsuleId: capsule.id,
        },
      });
      
    } catch (error) {
      console.error("❌ Error creating capsule in Payload CMS:", error);
      return NextResponse.json({
        success: false,
        error: "Failed to create capsule. Please try again.",
      }, { status: 500 });
    }
    
  } catch (error) {
    console.error("❌ Error in capsule creation API:", error);
    return NextResponse.json({
      success: false,
      error: "Internal server error. Please try again.",
    }, { status: 500 });
  }
}

/**
 * Simple tag generation from text content
 * In production, you might use a more sophisticated NLP service
 * @param text - Text to analyze
 * @returns string[] - Array of tags
 */
function generateTagsFromText(text: string): string[] {
  const commonWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
    'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did',
    'will', 'would', 'could', 'should', 'may', 'might', 'can', 'must', 'i', 'you', 'he', 'she',
    'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them', 'my', 'your', 'his', 'her', 'its',
    'our', 'their', 'this', 'that', 'these', 'those'
  ]);
  
  const words = text
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 3 && !commonWords.has(word));
  
  // Count word frequency
  const wordCount = words.reduce((acc, word) => {
    acc[word] = (acc[word] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  // Return top 5 most frequent words as tags
  return Object.entries(wordCount)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([word]) => word);
}

/**
 * Simple sentiment analysis
 * In production, you might use Hugging Face API or similar service
 * @param text - Text to analyze
 * @returns string - Sentiment classification
 */
function analyzeSentiment(text: string): 'positive' | 'neutral' | 'negative' {
  const positiveWords = [
    'happy', 'joy', 'love', 'excited', 'amazing', 'wonderful', 'great', 'fantastic',
    'awesome', 'brilliant', 'excellent', 'perfect', 'beautiful', 'grateful', 'thankful',
    'blessed', 'hope', 'dream', 'success', 'achievement', 'celebration', 'victory'
  ];
  
  const negativeWords = [
    'sad', 'angry', 'hate', 'terrible', 'awful', 'horrible', 'bad', 'worst',
    'disappointed', 'frustrated', 'worried', 'anxious', 'depressed', 'lonely',
    'scared', 'afraid', 'angry', 'upset', 'hurt', 'pain', 'loss', 'failure'
  ];
  
  const words = text.toLowerCase().split(/\s+/);
  let positiveScore = 0;
  let negativeScore = 0;
  
  words.forEach(word => {
    if (positiveWords.includes(word)) positiveScore++;
    if (negativeWords.includes(word)) negativeScore++;
  });
  
  if (positiveScore > negativeScore) return 'positive';
  if (negativeScore > positiveScore) return 'negative';
  return 'neutral';
} 