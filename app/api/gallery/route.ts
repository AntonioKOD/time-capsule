import { NextRequest, NextResponse } from 'next/server';
import { getPayload } from 'payload';
import config from '@payload-config';

/**
 * GET /api/gallery
 * Fetch public capsules for the gallery with filtering and sorting
 */
export async function GET(request: NextRequest) {
  try {
    const payload = await getPayload({ config });
    const { searchParams } = new URL(request.url);
    
    // Extract query parameters
    const search = searchParams.get('search') || '';
    const sentiment = searchParams.get('sentiment') || 'all';
    const sortBy = searchParams.get('sortBy') || 'recent';
    const tag = searchParams.get('tag') || '';
    const limit = parseInt(searchParams.get('limit') || '20');
    const page = parseInt(searchParams.get('page') || '1');

    // Build query conditions
    const where: any = {
      isHidden: { not_equals: true }, // Exclude hidden capsules
    };

    // Search in text content
    if (search) {
      where.textContent = {
        contains: search,
      };
    }

    // Filter by sentiment
    if (sentiment !== 'all') {
      where.sentiment = { equals: sentiment };
    }

    // Filter by tag
    if (tag) {
      where.tags = {
        tag: { equals: tag }
      };
    }

    // Build sort options
    let sort: string;
    switch (sortBy) {
      case 'popular':
        sort = '-likes';
        break;
      case 'trending':
        // Trending = high likes + recent (within last 7 days)
        where.createdAt = {
          greater_than: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
        };
        sort = '-likes';
        break;
      case 'featured':
        where.featured = { equals: true };
        sort = '-createdAt';
        break;
      case 'recent':
      default:
        sort = '-createdAt';
        break;
    }

    // Fetch public capsules
    const result = await payload.find({
      collection: 'publicCapsules',
      where,
      sort,
      limit,
      page,
    });

    // Format response data
    const capsules = result.docs.map((capsule: any) => ({
      id: capsule.id,
      textContent: capsule.textContent,
      tags: capsule.tags || [],
      sentiment: capsule.sentiment || 'neutral',
      wordCount: capsule.wordCount || 0,
      likes: capsule.likes || 0,
      views: capsule.views || 0,
      createdAt: capsule.createdAt,
      featured: capsule.featured || false,
    }));

    return NextResponse.json({
      success: true,
      capsules,
      pagination: {
        page: result.page,
        totalPages: result.totalPages,
        totalDocs: result.totalDocs,
        hasNextPage: result.hasNextPage,
        hasPrevPage: result.hasPrevPage,
      }
    });

  } catch (error) {
    console.error('❌ Error fetching gallery capsules:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch capsules' },
      { status: 500 }
    );
  }
} 