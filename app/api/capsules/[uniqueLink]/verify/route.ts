import { NextRequest, NextResponse } from 'next/server';
import { getPayloadClient } from '@/lib/payload';
import bcrypt from 'bcryptjs';

/**
 * POST /api/capsules/[uniqueLink]/verify - Verify password for protected capsule
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ uniqueLink: string }> }
) {
  try {
    const { uniqueLink } = await params;
    const { password } = await request.json();
    
    if (!uniqueLink) {
      return NextResponse.json(
        { success: false, error: 'Unique link is required' },
        { status: 400 }
      );
    }

    if (!password) {
      return NextResponse.json(
        { success: false, error: 'Password is required' },
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

    // Check if capsule has a password
    if (!capsule.password) {
      return NextResponse.json(
        { success: false, error: 'This capsule is not password protected' },
        { status: 400 }
      );
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, capsule.password);
    
    if (!isPasswordValid) {
      return NextResponse.json(
        { success: false, error: 'Incorrect password' },
        { status: 401 }
      );
    }

    // Check if capsule is ready to be opened (delivery date has passed)
    const now = new Date();
    const deliveryDate = new Date(capsule.deliveryDate);
    
    if (now < deliveryDate) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'This time capsule is not ready to be opened yet',
          deliveryDate: capsule.deliveryDate 
        },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Password verified successfully',
    });

  } catch (error) {
    console.error('❌ Error verifying capsule password:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to verify password' },
      { status: 500 }
    );
  }
} 