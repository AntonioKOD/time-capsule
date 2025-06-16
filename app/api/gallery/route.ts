/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { getPayloadClient } from '@/lib/payload';

/**
 * GET /api/gallery - Get public capsules for the gallery
 * Supports search, filtering, sorting, and pagination
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse query parameters
    const search = searchParams.get('search') || '';
    const sentiment = searchParams.get('sentiment') || '';
    const sortBy = searchParams.get('sortBy') || 'newest';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    
    console.log(`🔍 Gallery query: search="${search}", sentiment="${sentiment}", sortBy="${sortBy}", page=${page}`);
    
    const payload = await getPayloadClient();
    
    // Build where clause
    const where: any = {
      isHidden: {
        not_equals: true,
      },
    };
    
    // Add search filter
    if (search) {
      where.textContent = {
        contains: search,
      };
    }
    
    // Add sentiment filter
    if (sentiment && sentiment !== 'all') {
      where.sentiment = {
        equals: sentiment,
      };
    }
    
    // Build sort clause
    let sort: string;
    switch (sortBy) {
      case 'oldest':
        sort = 'createdAt';
        break;
      case 'popular':
        sort = '-likes';
        break;
      case 'views':
        sort = '-views';
        break;
      case 'newest':
      default:
        sort = '-createdAt';
        break;
    }
    
    // Calculate pagination
    const skip = (page - 1) * limit;
    
    console.log(`📊 Query params: where=${JSON.stringify(where)}, sort=${sort}, limit=${limit}, skip=${skip}`);
    
    // Fetch public capsules
    const result = await payload.find({
      collection: 'publicCapsules' as any,
      where,
      sort,
      limit,
      page,
    });
    
    console.log(`✅ Found ${result.docs.length} capsules (total: ${result.totalDocs})`);
    
    return NextResponse.json({
      success: true,
      capsules: result.docs,
      pagination: {
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
        totalDocs: result.totalDocs,
        hasNextPage: result.hasNextPage,
        hasPrevPage: result.hasPrevPage,
      },
    });
    
  } catch (error) {
    console.error('❌ Error fetching gallery capsules:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch gallery capsules' },
      { status: 500 }
    );
  }
} 