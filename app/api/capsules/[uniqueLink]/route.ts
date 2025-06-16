import { NextRequest, NextResponse } from 'next/server';
import { getPayloadClient } from '@/lib/payload';

/**
 * GET /api/capsules/[uniqueLink] - Fetch capsule by unique link
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ uniqueLink: string }> }
) {
  try {
    const { uniqueLink } = await params;
    
    if (!uniqueLink) {
      return NextResponse.json(
        { success: false, error: 'Unique link is required' },
        { status: 400 }
      );
    }

    const payload = await getPayloadClient();

    // Find capsule by unique link
    const capsules = await payload.find({
      collection: 'capsules',
      where: {
        uniqueLink: {
          equals: uniqueLink,
        },
      },
      limit: 1,
    });

    if (capsules.docs.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Capsule not found' },
        { status: 404 }
      );
    }

    const capsule = capsules.docs[0];

    // Check if capsule is ready to be opened (delivery date has passed)
    const now = new Date();
    const deliveryDate = new Date(capsule.deliveryDate);
    const isReady = now >= deliveryDate;
    
    // Return capsule data with ready status instead of blocking access
    if (!isReady) {
      const capsuleData = {
        id: capsule.id,
        contentType: capsule.contentType,
        deliveryDate: capsule.deliveryDate,
        recipients: capsule.recipients,
        uniqueLink: capsule.uniqueLink,
        password: !!capsule.password,
        isPublic: capsule.isPublic,
        isPaid: capsule.isPaid,
        userEmail: capsule.userEmail,
        createdAt: capsule.createdAt,
        updatedAt: capsule.updatedAt,
        isReady: false,
        // Don't include actual content when not ready
        textContent: null,
        media: null,
      };

      return NextResponse.json({
        success: true,
        capsule: capsuleData,
      });
    }

    // Return capsule data (excluding sensitive information)
    const capsuleData = {
      id: capsule.id,
      contentType: capsule.contentType,
      textContent: capsule.textContent,
      media: capsule.media,
      deliveryDate: capsule.deliveryDate,
      recipients: capsule.recipients,
      uniqueLink: capsule.uniqueLink,
      password: !!capsule.password, // Only return boolean to indicate if password exists
      isPublic: capsule.isPublic,
      isPaid: capsule.isPaid,
      userEmail: capsule.userEmail,
      createdAt: capsule.createdAt,
      updatedAt: capsule.updatedAt,
      isReady: true,
    };

    return NextResponse.json({
      success: true,
      capsule: capsuleData,
    });

  } catch (error) {
    console.error('❌ Error fetching capsule:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch capsule' },
      { status: 500 }
    );
  }
}

 