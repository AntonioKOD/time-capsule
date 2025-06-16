/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { getPayload } from 'payload';
import config from '@payload-config';

/**
 * POST /api/capsules/[uniqueLink]/make-public
 * Make a text capsule public by creating an entry in PublicCapsules collection
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ uniqueLink: string }> }
) {
  try {
    const payload = await getPayload({ config });
    const { uniqueLink } = await params;

    // Find the original capsule
    const capsulesResult = await payload.find({
      collection: 'capsules' as any,
      where: {
        uniqueLink: { equals: uniqueLink }
      },
      limit: 1,
    });

    if (capsulesResult.docs.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Capsule not found' },
        { status: 404 }
      );
    }

    const capsule = capsulesResult.docs[0] as any;

    // Validate that it's a text capsule and not already public
    if (capsule.contentType !== 'text') {
      return NextResponse.json(
        { success: false, error: 'Only text capsules can be made public' },
        { status: 400 }
      );
    }

    if (capsule.isPublic) {
      return NextResponse.json(
        { success: false, error: 'Capsule is already public' },
        { status: 400 }
      );
    }

    if (!capsule.textContent) {
      return NextResponse.json(
        { success: false, error: 'No text content to share' },
        { status: 400 }
      );
    }

    // Check if already exists in public collection
    const existingPublic = await payload.find({
      collection: 'publicCapsules' as any,
      where: {
        originalCapsuleId: { equals: capsule.id }
      },
      limit: 1,
    });

    if (existingPublic.docs.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Capsule is already in public gallery' },
        { status: 400 }
      );
    }

    // Extract tags from text content (simple keyword extraction)
    const extractTags = (text: string): string[] => {
      const commonWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them', 'my', 'your', 'his', 'her', 'its', 'our', 'their'];
      
      const words = text.toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter(word => word.length > 3 && !commonWords.includes(word));
      
      // Get most frequent words as tags
      const wordCount: { [key: string]: number } = {};
      words.forEach(word => {
        wordCount[word] = (wordCount[word] || 0) + 1;
      });
      
      return Object.entries(wordCount)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([word]) => word);
    };

    // Simple sentiment analysis
    const detectSentiment = (text: string): 'positive' | 'neutral' | 'negative' => {
      const positiveWords = ['happy', 'joy', 'love', 'excited', 'amazing', 'wonderful', 'great', 'fantastic', 'awesome', 'beautiful', 'perfect', 'excellent', 'brilliant', 'incredible', 'outstanding', 'hope', 'dream', 'grateful', 'thankful', 'blessed', 'lucky', 'proud', 'confident', 'optimistic', 'peaceful', 'content', 'satisfied', 'delighted', 'thrilled', 'ecstatic'];
      const negativeWords = ['sad', 'angry', 'hate', 'terrible', 'awful', 'horrible', 'bad', 'worst', 'disappointed', 'frustrated', 'worried', 'anxious', 'depressed', 'lonely', 'scared', 'afraid', 'angry', 'upset', 'hurt', 'pain', 'suffering', 'struggle', 'difficult', 'hard', 'challenging', 'stressful', 'overwhelming', 'exhausted', 'tired'];
      
      const words = text.toLowerCase().split(/\s+/);
      let positiveCount = 0;
      let negativeCount = 0;
      
      words.forEach(word => {
        if (positiveWords.some(pw => word.includes(pw))) positiveCount++;
        if (negativeWords.some(nw => word.includes(nw))) negativeCount++;
      });
      
      if (positiveCount > negativeCount) return 'positive';
      if (negativeCount > positiveCount) return 'negative';
      return 'neutral';
    };

    const tags = extractTags(capsule.textContent);
    const sentiment = detectSentiment(capsule.textContent);
    const wordCount = capsule.textContent.trim().split(/\s+/).length;

    // Create public capsule entry
    const publicCapsule = await payload.create({
      collection: 'publicCapsules' as any,
      data: {
        originalCapsuleId: capsule.id,
        textContent: capsule.textContent,
        tags: tags.map(tag => ({ tag })),
        sentiment,
        wordCount,
        likes: 0,
        views: 0,
        featured: false,
        reportCount: 0,
        isHidden: false,
      } as any,
    });

    // Update original capsule to mark as public
    await payload.update({
      collection: 'capsules' as any,
      id: capsule.id,
      data: {
        isPublic: true,
      } as any,
    });

    return NextResponse.json({
      success: true,
      message: 'Capsule has been made public',
      publicCapsuleId: publicCapsule.id,
    });

  } catch (error) {
    console.error('❌ Error making capsule public:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to make capsule public' },
      { status: 500 }
    );
  }
} 