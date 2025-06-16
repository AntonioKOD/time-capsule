/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { getPayload } from 'payload';
import config from '@payload-config';

/**
 * POST /api/gallery/[id]/like
 * Toggle like status for a public capsule
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const payload = await getPayload({ config });
    const { id } = await params;

    // Get current capsule
    const capsule = await payload.findByID({
      collection: 'publicCapsules' as any,
      id,
    });

    if (!capsule) {
      return NextResponse.json(
        { success: false, error: 'Capsule not found' },
        { status: 404 }
      );
    }

    // For simplicity, we'll just increment likes
    // In a real app, you'd track user likes to prevent duplicates
    const currentLikes = capsule.likes || 0;
    const newLikes = currentLikes + 1;
    // Update the capsule
    await payload.update({
      collection: 'publicCapsules' as any,
      id,
      data: {
        likes: newLikes,
      },
    });

    return NextResponse.json({
      success: true,
      likes: newLikes,
    });

  } catch (error) {
    console.error('❌ Error liking capsule:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to like capsule' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/gallery/[id]/like
 * Increment view count for a capsule
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const payload = await getPayload({ config });
    const { id } = await params;

    // Get current capsule
    const capsule = await payload.findByID({
      collection: 'publicCapsules' as any,
      id,
    });

    if (!capsule) {
      return NextResponse.json(
        { success: false, error: 'Capsule not found' },
        { status: 404 }
      );
    }
    // Increment view count
    const currentViews = (capsule as any).views || 0;
    const newViews = currentViews + 1;
    // Update the capsule
    await payload.update({
      collection: 'publicCapsules' as any,
      id,
      data: {
        views: newViews,
      },
    });

    return NextResponse.json({
      success: true,
      views: newViews,
    });

  } catch (error) {
    console.error('❌ Error incrementing view count:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to increment view count' },
      { status: 500 }
    );
  }
} 