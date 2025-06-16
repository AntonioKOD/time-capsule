/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';
import { getPayloadClient } from '@/lib/payload';

/**
 * GET /api/gallery/stats - Get public gallery statistics
 */
export async function GET() {
  try {
    const payload = await getPayloadClient();
    
    // Get total count of public capsules
    const totalResult = await payload.count({
      collection: 'publicCapsules' as any,
      where: {
        isHidden: {
          not_equals: true,
        },
      },
    });
    
    // Get featured count
    const featuredResult = await payload.count({
      collection: 'publicCapsules' as any,
      where: {
        and: [
          {
            featured: {
              equals: true,
            },
          },
          {
            isHidden: {
              not_equals: true,
            },
          },
        ],
      },
    });
    
    // Get sentiment distribution and calculate views/likes
    const capsulesWithStats = await payload.find({
      collection: 'publicCapsules' as any,
      where: {
        isHidden: {
          not_equals: true,
        },
      },
      limit: 1000, // Reasonable limit for stats
    });
    
    const sentimentCounts = {
      positive: 0,
      neutral: 0,
      negative: 0,
    };
    
    let totalViews = 0;
    let totalLikes = 0;
    
    capsulesWithStats.docs.forEach((capsule: any) => {
      // Count sentiment
      if (capsule.sentiment && sentimentCounts.hasOwnProperty(capsule.sentiment)) {
        sentimentCounts[capsule.sentiment as keyof typeof sentimentCounts]++;
      }
      
      // Sum views and likes
      totalViews += capsule.views || 0;
      totalLikes += capsule.likes || 0;
    });
    
    // Get active users today (capsules created today)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const activeUsersResult = await payload.count({
      collection: 'publicCapsules' as any,
      where: {
        isHidden: { not_equals: true },
        createdAt: {
          greater_than: today.toISOString()
        }
      }
    });
    
    return NextResponse.json({
      success: true,
      stats: {
        totalCapsules: totalResult.totalDocs,
        todaysCapsules: activeUsersResult.totalDocs,
        featured: featuredResult.totalDocs,
        sentiment: sentimentCounts,
        totalViews,
        totalLikes,
      },
      data: {
        total: totalResult.totalDocs,
        featured: featuredResult.totalDocs,
        sentiment: sentimentCounts,
        totalViews,
        totalLikes,
        activeUsers: activeUsersResult.totalDocs,
      },
    });
    
  } catch (error) {
    console.error('❌ Error fetching gallery stats:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch gallery statistics' },
      { status: 500 }
    );
  }
} 