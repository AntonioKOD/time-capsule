'use client'

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { 
  Search, 
  Filter, 
  Calendar, 
  ArrowLeft, 
  Sparkles,
  Clock,
  Globe,
  RefreshCw,
  ChevronDown,
  X
} from 'lucide-react';

interface PublicCapsule {
  id: string;
  textContent: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  wordCount: number;
  createdAt: string;
  timeAgo: string;
}

interface GalleryFilters {
  search: string;
  sentiment: 'all' | 'positive' | 'neutral' | 'negative';
  sortBy: 'recent' | 'popular' | 'trending' | 'featured';
}

interface GalleryStats {
  totalCapsules: number;
  todaysCapsules: number;
}

export default function GalleryPage() {
  const [capsules, setCapsules] = useState<PublicCapsule[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<GalleryFilters>({
    search: '',
    sentiment: 'all',
    sortBy: 'recent'
  });
  const [showFilters, setShowFilters] = useState(false);
  const [stats, setStats] = useState<GalleryStats>({
    totalCapsules: 0,
    todaysCapsules: 0
  });
  const [selectedCapsule, setSelectedCapsule] = useState<PublicCapsule | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    fetchCapsules();
    fetchStats();
  }, [filters]);

  const fetchCapsules = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        search: filters.search,
        sentiment: filters.sentiment,
        sortBy: filters.sortBy,
        page: page.toString(),
        limit: '12'
      });

      const response = await fetch(`/api/gallery?${queryParams}`);
      const data = await response.json();
      
      if (data.success) {
        if (page === 1) {
          setCapsules(data.capsules || []);
        } else {
          setCapsules(prev => [...prev, ...(data.capsules || [])]);
        }
        setHasMore((data.capsules || []).length === 12);
        setCurrentPage(page);
      }
    } catch (error) {
      console.error('Error fetching capsules:', error);
    } finally {
      setLoading(false);
    }
  }, [filters.search, filters.sentiment, filters.sortBy]);

  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch('/api/gallery/stats');
      const data = await response.json();
      
      if (data.success && data.stats) {
        setStats({
          totalCapsules: data.stats.totalCapsules || 0,
          todaysCapsules: data.stats.todaysCapsules || 0
        });
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  }, []);

  const getSentimentEmoji = useCallback((sentiment: string) => {
    switch (sentiment) {
      case 'positive': return '😊';
      case 'negative': return '😔';
      default: return '😐';
    }
  }, []);

  const getSentimentLabel = useCallback((sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'Hopeful';
      case 'negative': return 'Reflective';
      default: return 'Thoughtful';
    }
  }, []);

  const formatTimeAgo = useCallback((dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 30) return `${diffInDays}d ago`;
    const diffInMonths = Math.floor(diffInDays / 30);
    return `${diffInMonths}mo ago`;
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({
      search: '',
      sentiment: 'all',
      sortBy: 'recent'
    });
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <section className="py-16 bg-gray">
        <div className="container mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center mb-12">
            <Link 
              href="/" 
              className="inline-flex items-center gap-2 text-black hover:text-blue transition-colors mb-6 font-bold"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Link>
            
            <h1 className="text-5xl font-black text-black mb-6 font-retro uppercase leading-tight">
              Memory Gallery
            </h1>
            <p className="text-xl text-black font-bold leading-relaxed max-w-2xl mx-auto">
              Discover anonymous memories from people around the world. 
              Each capsule is a window into someone's thoughts and feelings.
            </p>
          </div>

          {/* Stats */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2 max-w-2xl mx-auto mb-12">
            <div className="brutalist-card brutalist-card-blue p-6 text-center">
              <div className="text-3xl font-black text-white mb-2">{stats.totalCapsules}</div>
              <div className="text-white font-bold">Total Memories</div>
            </div>
            <div className="brutalist-card brutalist-card-black p-6 text-center">
              <div className="text-3xl font-black text-white mb-2">{stats.todaysCapsules}</div>
              <div className="text-white font-bold">Added Today</div>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray" />
              <input
                type="text"
                placeholder="Search memories..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="brutalist-input pl-10 w-full"
              />
              {filters.search && (
                <button
                  onClick={() => setFilters(prev => ({ ...prev, search: '' }))}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray hover:text-black"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Filter Controls */}
            <div className="flex items-center gap-4">
              {/* Filter Toggle */}
              <button 
                onClick={() => setShowFilters(!showFilters)}
                className={`brutalist-button ${showFilters ? 'brutalist-button-primary' : 'brutalist-button-secondary'} brutalist-button-sm`}
              >
                <Filter className="h-4 w-4 mr-2" />
                <span style={{ color: 'inherit' }}>Filters</span>
                <ChevronDown className={`h-4 w-4 ml-2 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
              </button>

              {/* Sort */}
              <select
                value={filters.sortBy}
                onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value as any }))}
                className="brutalist-input brutalist-button-sm"
                style={{ color: '#000000' }}
              >
                <option value="recent">Most Recent</option>
                <option value="popular">Most Popular</option>
                <option value="trending">Trending</option>
                <option value="featured">Featured</option>
              </select>

              {/* Refresh */}
              <button 
                onClick={() => fetchCapsules(1)}
                className="brutalist-button brutalist-button-black brutalist-button-sm"
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </button>

              {/* Clear Filters */}
              {(filters.search || filters.sentiment !== 'all') && (
                <button 
                  onClick={clearFilters}
                  className="brutalist-button brutalist-button-white brutalist-button-sm"
                >
                  <X className="h-4 w-4 mr-2" />
                  <span style={{ color: 'inherit' }}>Clear</span>
                </button>
              )}
            </div>
          </div>

          {/* Extended Filters */}
          {showFilters && (
            <div className="mt-6 brutalist-card brutalist-card-white p-6 border-4 border-black shadow-brutalist">
              <div className="grid gap-6 md:grid-cols-2">
                {/* Sentiment Filter */}
                <div>
                  <label className="block text-sm font-black text-black mb-3 font-retro uppercase" style={{ color: '#000000' }}>Mood</label>
                  <select
                    value={filters.sentiment}
                    onChange={(e) => setFilters(prev => ({ ...prev, sentiment: e.target.value as any }))}
                    className="brutalist-input w-full"
                    style={{ color: '#000000' }}
                  >
                    <option value="all">All Moods</option>
                    <option value="positive">😊 Hopeful</option>
                    <option value="neutral">😐 Thoughtful</option>
                    <option value="negative">😔 Reflective</option>
                  </select>
                </div>

                {/* Quick Actions */}
                <div>
                  <label className="block text-sm font-black text-black mb-3 font-retro uppercase" style={{ color: '#000000' }}>Quick Filter</label>
                  <div className="flex flex-wrap gap-2">
                    <button 
                      onClick={() => setFilters(prev => ({ ...prev, sortBy: 'trending' }))}
                      className="brutalist-badge brutalist-badge-black cursor-pointer text-xs"
                    >
                      <span style={{ color: '#ffffff' }}>Trending</span>
                    </button>
                    <button 
                      onClick={() => setFilters(prev => ({ ...prev, sortBy: 'featured' }))}
                      className="brutalist-badge cursor-pointer text-xs"
                    >
                      <span style={{ color: '#000000' }}>Featured</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Capsules Grid */}
      <section className="py-12 bg-gray">
        <div className="container mx-auto max-w-7xl px-6 lg:px-8">
          {loading && currentPage === 1 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="brutalist-card brutalist-card-white p-6 animate-pulse">
                  <div className="h-4 bg-gray rounded mb-4"></div>
                  <div className="h-20 bg-gray rounded mb-4"></div>
                  <div className="flex justify-between">
                    <div className="h-4 bg-gray rounded w-20"></div>
                    <div className="h-4 bg-gray rounded w-16"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : capsules.length === 0 ? (
            <div className="text-center py-16">
              <div className="brutalist-card brutalist-card-white p-12 max-w-md mx-auto border-4 border-black shadow-brutalist">
                <div className="mb-6">
                  <div className="inline-flex h-16 w-16 items-center justify-center bg-gray border-3 border-black shadow-brutalist">
                    <Globe className="h-8 w-8 text-black" />
                  </div>
                </div>
                <h3 className="text-2xl font-black text-black mb-4 font-retro uppercase">No Memories Found</h3>
                <p className="text-black font-bold mb-6">
                  {filters.search || filters.sentiment !== 'all' 
                    ? 'Try adjusting your filters to discover more memories.'
                    : 'Be the first to share a memory in our public gallery!'
                  }
                </p>
                <button className="brutalist-button brutalist-button-primary">
                  <Link href="/create" className="no-underline text-inherit flex items-center">
                    <Sparkles className="h-4 w-4 mr-2" style={{ color: 'inherit' }} />
                    <span style={{ color: 'inherit' }}>Create First Memory</span>
                  </Link>
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {capsules.map((capsule) => (
                  <div key={capsule.id} className="brutalist-card brutalist-card-white p-6 hover:animate-brutalist-pop cursor-pointer"
                       onClick={() => setSelectedCapsule(capsule)}>
                    {/* Simple Header */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full border-3 border-black flex items-center justify-center bg-white">
                          <span className="text-lg">{getSentimentEmoji(capsule.sentiment)}</span>
                        </div>
                        <div>
                          <div className="text-xs font-black text-black font-retro uppercase" style={{ color: '#000000' }}>
                            {getSentimentLabel(capsule.sentiment)}
                          </div>
                        </div>
                      </div>
                      <div className="text-xs text-gray font-bold" style={{ color: '#6B7280' }}>
                        <Clock className="h-3 w-3 inline mr-1" style={{ color: 'inherit' }} />
                        <span style={{ color: 'inherit' }}>{formatTimeAgo(capsule.createdAt)}</span>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="mb-4">
                      <div className="text-black font-bold leading-relaxed line-clamp-4 text-base whitespace-pre-line">
                        "{capsule.textContent.replace(/&#x27;/g, "'").replace(/&#39;/g, "'").replace(/&apos;/g, "'")}"
                      </div>
                    </div>

                    {/* Simple Footer */}
                    <div className="flex items-center justify-between pt-4 border-t-3 border-black">
                      <div className="text-xs text-gray font-bold" style={{ color: '#6B7280' }}>
                        <span style={{ color: 'inherit' }}>{capsule.wordCount} words</span>
                      </div>
                      <div className="text-xs text-gray font-bold" style={{ color: '#6B7280' }}>
                        <Calendar className="h-3 w-3 inline mr-1" style={{ color: 'inherit' }} />
                        <span style={{ color: 'inherit' }}>Anonymous</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Load More */}
              {hasMore && (
                <div className="text-center mt-12">
                  <button 
                    onClick={() => fetchCapsules(currentPage + 1)}
                    disabled={loading}
                    className="brutalist-button brutalist-button-primary brutalist-button-lg"
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="h-5 w-5 mr-2 animate-spin" style={{ color: 'inherit' }} />
                        <span style={{ color: 'inherit' }}>Loading...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-5 w-5 mr-2" style={{ color: 'inherit' }} />
                        <span style={{ color: 'inherit' }}>Load More Memories</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-black text-white relative overflow-hidden">
        <div className="container mx-auto max-w-7xl px-6 lg:px-8 text-center relative">
          <h2 className="text-4xl md:text-5xl font-black mb-6 font-retro uppercase text-blue leading-tight" style={{ color: '#1E90FF' }}>
            Share Your Story
          </h2>
          <p className="text-xl font-bold mb-8 max-w-2xl mx-auto leading-relaxed" style={{ color: '#ffffff' }}>
            Create your own time capsule and choose to share it with the world. 
            Your story might inspire someone else's journey.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button className="brutalist-button brutalist-button-primary brutalist-button-lg">
              <Link href="/create" className="flex items-center gap-3 no-underline text-inherit">
                <Sparkles className="h-5 w-5" style={{ color: 'inherit' }} />
                <span style={{ color: 'inherit' }}>Create Your Memory Capsule</span>
              </Link>
            </button>
            
            <button className="brutalist-button brutalist-button-secondary brutalist-button-lg">
              <Link href="/" className="flex items-center gap-3 no-underline text-inherit">
                <ArrowLeft className="h-5 w-5" style={{ color: 'inherit' }} />
                <span style={{ color: 'inherit' }}>Back to Home</span>
              </Link>
            </button>
          </div>
        </div>
      </section>

      {/* Simple Memory Detail Modal */}
      {selectedCapsule && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="brutalist-card brutalist-card-white max-w-2xl w-full max-h-[80vh] overflow-y-auto border-4 border-black shadow-brutalist-lg">
            <div className="brutalist-window-header">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{getSentimentEmoji(selectedCapsule.sentiment)}</span>
                  <span className="font-black uppercase">{getSentimentLabel(selectedCapsule.sentiment)} Memory</span>
                </div>
                <button
                  onClick={() => setSelectedCapsule(null)}
                  className="text-black hover:text-blue transition-colors"
                  style={{ color: '#000000' }}
                >
                  <X className="h-6 w-6" style={{ color: 'inherit' }} />
                </button>
              </div>
            </div>
            
            <div className="brutalist-window-content p-8">
              <div className="mb-6">
                <div className="text-black font-bold leading-relaxed text-lg whitespace-pre-line">
                  "{selectedCapsule.textContent.replace(/&#x27;/g, "'").replace(/&#39;/g, "'").replace(/&apos;/g, "'")}"
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t-3 border-black">
                <div className="text-sm text-gray font-bold" style={{ color: '#6B7280' }}>
                  <span style={{ color: 'inherit' }}>{selectedCapsule.wordCount} words</span>
                </div>
                <div className="text-sm text-gray font-bold" style={{ color: '#6B7280' }}>
                  <span style={{ color: 'inherit' }}>{formatTimeAgo(selectedCapsule.createdAt)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 