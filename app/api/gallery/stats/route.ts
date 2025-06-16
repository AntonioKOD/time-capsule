import { NextResponse } from 'next/server';
import { getPayload } from 'payload';
import config from '@payload-config';

/**
 * GET /api/gallery/stats
 * Get aggregate statistics for the public gallery
 */
export async function GET() {
  try {
    const payload = await getPayload({ config });

    // Get total public capsules count
    const totalCapsulesResult = await payload.count({
      collection: 'publicCapsules',
      where: {
        isHidden: { not_equals: true }
      }
    });

    // Get total views and likes
    const capsulesWithStats = await payload.find({
      collection: 'publicCapsules',
      where: {
        isHidden: { not_equals: true }
      },
      limit: 1000, // Adjust based on your needs
    });

    const totalViews = capsulesWithStats.docs.reduce((sum: number, capsule: any) => 
      sum + (capsule.views || 0), 0
    );

    const totalLikes = capsulesWithStats.docs.reduce((sum: number, capsule: any) => 
      sum + (capsule.likes || 0), 0
    );

    // Get active users today (capsules created today)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const activeUsersResult = await payload.count({
      collection: 'publicCapsules',
      where: {
        isHidden: { not_equals: true },
        createdAt: {
          greater_than: today.toISOString()
        }
      }
    });

    const stats = {
      totalCapsules: totalCapsulesResult.totalDocs,
      totalViews,
      totalLikes,
      activeUsers: activeUsersResult.totalDocs,
    };

    return NextResponse.json({
      success: true,
      stats
    });

  } catch (error) {
    console.error('❌ Error fetching gallery stats:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
} 