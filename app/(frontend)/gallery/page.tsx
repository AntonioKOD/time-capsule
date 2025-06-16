'use client'

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Search, 
  Filter, 
  Heart, 
  MessageCircle, 
  Calendar, 
  Tag, 
  ArrowLeft, 
  Sparkles,
  Clock,
  Globe,
  TrendingUp,
  Eye,
  RefreshCw,
  Star,
  Users,
  Zap,
  BookOpen,
  Flame,
  Award,
  ChevronDown,
  X,
  Share2,
  Copy,
  ExternalLink
} from 'lucide-react';

interface PublicCapsule {
  id: string;
  textContent: string;
  tags: { tag: string }[];
  sentiment: 'positive' | 'neutral' | 'negative';
  wordCount: number;
  likes: number;
  views: number;
  createdAt: string;
  featured: boolean;
  timeAgo: string;
  category?: string;
}

interface GalleryFilters {
  search: string;
  sentiment: 'all' | 'positive' | 'neutral' | 'negative';
  sortBy: 'recent' | 'popular' | 'trending' | 'featured';
  tag: string;
  category: string;
}

interface GalleryStats {
  totalCapsules: number;
  totalViews: number;
  totalLikes: number;
  activeUsers: number;
  todaysCapsules: number;
  featuredCount: number;
}

export default function GalleryPage() {
  const [capsules, setCapsules] = useState<PublicCapsule[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<GalleryFilters>({
    search: '',
    sentiment: 'all',
    sortBy: 'recent',
    tag: '',
    category: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [likedCapsules, setLikedCapsules] = useState<Set<string>>(new Set());
  const [stats, setStats] = useState<GalleryStats>({
    totalCapsules: 0,
    totalViews: 0,
    totalLikes: 0,
    activeUsers: 0,
    todaysCapsules: 0,
    featuredCount: 0
  });
  const [selectedCapsule, setSelectedCapsule] = useState<PublicCapsule | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    fetchCapsules();
    fetchStats();
  }, [filters]);

  const fetchCapsules = async (page = 1) => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        search: filters.search,
        sentiment: filters.sentiment,
        sortBy: filters.sortBy,
        tag: filters.tag,
        category: filters.category,
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
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/gallery/stats');
      const data = await response.json();
      
      if (data.success && data.stats) {
        setStats({
          totalCapsules: data.stats.totalCapsules || 0,
          totalViews: data.stats.totalViews || 0,
          totalLikes: data.stats.totalLikes || 0,
          activeUsers: data.stats.activeUsers || 0,
          todaysCapsules: data.stats.todaysCapsules || 0,
          featuredCount: data.stats.featuredCount || 0
        });
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleLike = async (capsuleId: string) => {
    try {
      const response = await fetch(`/api/gallery/${capsuleId}/like`, {
        method: 'POST'
      });
      
      if (response.ok) {
        const newLiked = new Set(likedCapsules);
        if (likedCapsules.has(capsuleId)) {
          newLiked.delete(capsuleId);
        } else {
          newLiked.add(capsuleId);
        }
        setLikedCapsules(newLiked);
        
        // Update capsule likes count
        setCapsules(prev => prev.map(capsule => 
          capsule.id === capsuleId 
            ? { ...capsule, likes: capsule.likes + (likedCapsules.has(capsuleId) ? -1 : 1) }
            : capsule
        ));
      }
    } catch (error) {
      console.error('Error liking capsule:', error);
    }
  };

  const handleShare = async (capsule: PublicCapsule) => {
    const shareText = `"${(capsule.textContent || 'Anonymous memory').slice(0, 100)}..." - Anonymous Memory from Time Capsule`;
    const shareUrl = `${window.location.origin}/gallery`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Anonymous Memory',
          text: shareText,
          url: shareUrl,
        });
      } catch (error) {
        // Fallback to clipboard
        await navigator.clipboard.writeText(`${shareText}\n\n${shareUrl}`);
      }
    } else {
      await navigator.clipboard.writeText(`${shareText}\n\n${shareUrl}`);
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'text-blue';
      case 'negative': return 'text-black';
      default: return 'text-gray';
    }
  };

  const getSentimentEmoji = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return '😊';
      case 'negative': return '😔';
      default: return '😐';
    }
  };

  const getSentimentLabel = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'Hopeful';
      case 'negative': return 'Reflective';
      default: return 'Thoughtful';
    }
  };

  const formatTimeAgo = (dateString: string) => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
    return `${Math.floor(diffInHours / 168)}w ago`;
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      sentiment: 'all',
      sortBy: 'recent',
      tag: '',
      category: ''
    });
  };

  const popularTags = ['memories', 'future', 'dreams', 'love', 'hope', 'reflection', 'goals', 'gratitude', 'family', 'career'];
  const categories = ['Personal Growth', 'Relationships', 'Dreams & Goals', 'Gratitude', 'Life Lessons', 'Adventures'];

  // Safe number formatting function
  const formatNumber = (num: number | undefined | null): string => {
    if (typeof num !== 'number' || isNaN(num)) return '0';
    return num.toLocaleString();
  };

  // Safe number display function
  const safeNumber = (num: number | undefined | null): number => {
    if (typeof num !== 'number' || isNaN(num)) return 0;
    return num;
  };

  // Safe text display function
  const safeText = (text: string | undefined | null): string => {
    if (!text || typeof text !== 'string') return '';
    return text.trim();
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Enhanced Brutalist Navigation */}
      <nav className="sticky top-0 z-50 w-full bg-white border-b-4 border-black shadow-brutalist">
        <div className="container mx-auto flex h-20 max-w-7xl items-center justify-between px-6 lg:px-8">
          <Link 
            href="/" 
            className="flex items-center space-x-3 text-2xl font-black text-black hover:text-blue transition-colors duration-200 font-retro uppercase"
          >
            <div className="flex h-12 w-12 items-center justify-center bg-blue border-4 border-black shadow-brutalist">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <span className="text-black" style={{ color: '#000000' }}>Time Capsule</span>
          </Link>
          
          <div className="flex items-center space-x-4">
            <button className="brutalist-button brutalist-button-secondary brutalist-button-sm">
              <Link href="/" className="flex items-center gap-2 no-underline text-inherit" style={{ color: 'inherit' }}>
                <ArrowLeft className="h-4 w-4" />
                <span style={{ color: 'inherit' }}>Home</span>
              </Link>
            </button>
            <button className="brutalist-button brutalist-button-primary brutalist-button-sm">
              <Link href="/create" className="flex items-center gap-2 no-underline text-inherit" style={{ color: 'inherit' }}>
                <span style={{ color: 'inherit' }}>Create Capsule</span>
                <Sparkles className="h-4 w-4" />
              </Link>
            </button>
          </div>
        </div>
      </nav>

      {/* Enhanced Hero Section */}
      <section className="py-20 bg-gray relative overflow-hidden">
        {/* Floating brutalist elements */}
        <div className="absolute top-10 left-10 w-20 h-20 bg-blue border-4 border-black shadow-brutalist animate-brutalist-float" />
        <div className="absolute bottom-10 right-10 w-24 h-24 bg-black border-4 border-black shadow-brutalist-lg animate-brutalist-bounce" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-white border-3 border-black shadow-brutalist" />
        
        <div className="container mx-auto max-w-7xl px-6 lg:px-8 relative">
          <div className="text-center mb-16">
            <div className="mb-8 inline-flex items-center">
              <div className="brutalist-window">
                <div className="brutalist-window-header">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue border border-black" />
                    <span className="text-black font-bold" style={{ color: '#000000' }}>Public Memory Gallery</span>
                  </div>
                </div>
                <div className="brutalist-window-content bg-white text-black">
                  <div className="flex items-center gap-4">
                    <Globe className="h-6 w-6 text-blue" />
                    <span className="font-bold text-black" style={{ color: '#000000' }}>Discover anonymous memories from around the world</span>
                  </div>
                </div>
              </div>
            </div>
            
            <h1 className="text-5xl md:text-6xl font-black text-black mb-6 font-retro uppercase leading-tight" style={{ color: '#000000' }}>
              <span className="text-blue" style={{ color: '#1E90FF' }}>Explore</span>
              <br />
              <span className="text-black" style={{ color: '#000000' }}>Human Stories</span>
            </h1>
            
            <p className="text-xl text-black font-bold max-w-3xl mx-auto leading-relaxed mb-8" style={{ color: '#000000' }}>
              Each memory capsule is a window into someone's thoughts, dreams, and reflections. 
              Discover the beautiful diversity of human experience through anonymous stories.
            </p>

            {/* Quick Stats Banner */}
            <div className="brutalist-card brutalist-card-blue p-6 max-w-2xl mx-auto">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-2xl font-black text-white font-retro" style={{ color: '#ffffff' }}>{formatNumber(stats?.totalCapsules)}</div>
                  <div className="text-xs text-white font-bold uppercase" style={{ color: '#ffffff' }}>Memories</div>
                </div>
                <div>
                  <div className="text-2xl font-black text-white font-retro" style={{ color: '#ffffff' }}>{safeNumber(stats?.todaysCapsules)}</div>
                  <div className="text-xs text-white font-bold uppercase" style={{ color: '#ffffff' }}>Today</div>
                </div>
                <div>
                  <div className="text-2xl font-black text-white font-retro" style={{ color: '#ffffff' }}>{formatNumber(stats?.totalLikes)}</div>
                  <div className="text-xs text-white font-bold uppercase" style={{ color: '#ffffff' }}>Hearts</div>
                </div>
                <div>
                  <div className="text-2xl font-black text-white font-retro" style={{ color: '#ffffff' }}>{safeNumber(stats?.activeUsers)}</div>
                  <div className="text-xs text-white font-bold uppercase" style={{ color: '#ffffff' }}>Active</div>
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { label: 'Total Memories', value: formatNumber(stats?.totalCapsules), icon: BookOpen, color: 'brutalist-card-blue', textColor: 'text-white' },
              { label: 'Views Today', value: formatNumber(stats?.totalViews), icon: Eye, color: 'brutalist-card-black', textColor: 'text-white' },
              { label: 'Hearts Given', value: formatNumber(stats?.totalLikes), icon: Heart, color: 'brutalist-card-white', textColor: 'text-black' },
              { label: 'Featured Stories', value: safeNumber(stats?.featuredCount).toString(), icon: Award, color: 'brutalist-card-blue', textColor: 'text-white' }
            ].map((stat, index) => (
              <div key={index} className={`brutalist-card ${stat.color} p-6 text-center hover:animate-brutalist-pop`}>
                <div className="mb-4">
                  <div className={`inline-flex h-12 w-12 items-center justify-center ${stat.color === 'brutalist-card-white' ? 'bg-blue' : 'bg-white'} border-3 border-black shadow-brutalist`}>
                    <stat.icon className={`h-6 w-6 ${stat.color === 'brutalist-card-white' ? 'text-white' : 'text-black'}`} />
                  </div>
                </div>
                <div 
                  className={`text-2xl font-black mb-2 font-retro ${stat.textColor}`}
                  style={{ color: stat.textColor === 'text-white' ? '#ffffff' : '#000000' }}
                >
                  {stat.value}
                </div>
                <div 
                  className={`text-sm font-bold uppercase ${stat.textColor}`}
                  style={{ color: stat.textColor === 'text-white' ? '#ffffff' : '#000000' }}
                >
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Enhanced Filters Section */}
      <section className="py-8 bg-white border-b-4 border-black">
        <div className="container mx-auto max-w-7xl px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row gap-6 items-center justify-between">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray" />
              <input
                type="text"
                placeholder="Search memories..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="brutalist-input pl-10 w-full"
                style={{ color: '#000000' }}
              />
              {filters.search && (
                <button
                  onClick={() => setFilters(prev => ({ ...prev, search: '' }))}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray hover:text-black"
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
              {(filters.search || filters.tag || filters.category || filters.sentiment !== 'all') && (
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
              <div className="grid gap-6 md:grid-cols-4">
                {/* Category Filter */}
                <div>
                  <label className="block text-sm font-black text-black mb-3 font-retro uppercase" style={{ color: '#000000' }}>Category</label>
                                      <select
                      value={filters.category}
                      onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                      className="brutalist-input w-full"
                      style={{ color: '#000000' }}
                    >
                    <option value="">All Categories</option>
                    {categories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>

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

                {/* Tag Filter */}
                <div>
                  <label className="block text-sm font-black text-black mb-3 font-retro uppercase" style={{ color: '#000000' }}>Topic</label>
                                      <select
                      value={filters.tag}
                      onChange={(e) => setFilters(prev => ({ ...prev, tag: e.target.value }))}
                      className="brutalist-input w-full"
                      style={{ color: '#000000' }}
                    >
                    <option value="">All Topics</option>
                    {popularTags.map(tag => (
                      <option key={tag} value={tag}>#{tag}</option>
                    ))}
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
                      <Flame className="h-3 w-3 mr-1" style={{ color: '#ffffff' }} />
                      <span style={{ color: '#ffffff' }}>Trending</span>
                    </button>
                    <button 
                      onClick={() => setFilters(prev => ({ ...prev, sortBy: 'featured' }))}
                      className="brutalist-badge cursor-pointer text-xs"
                    >
                      <Star className="h-3 w-3 mr-1" style={{ color: '#000000' }} />
                      <span style={{ color: '#000000' }}>Featured</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Popular Tags */}
              <div className="mt-6 pt-6 border-t-3 border-black">
                <label className="block text-sm font-black text-black mb-3 font-retro uppercase">Popular Tags</label>
                <div className="flex flex-wrap gap-2">
                  {popularTags.slice(0, 8).map(tag => (
                    <button
                      key={tag}
                      onClick={() => setFilters(prev => ({ ...prev, tag }))}
                      className={`brutalist-badge cursor-pointer text-xs ${
                        filters.tag === tag ? 'brutalist-badge-black' : ''
                      }`}
                      style={{ color: filters.tag === tag ? '#ffffff' : '#000000' }}
                    >
                      <span style={{ color: 'inherit' }}>#{tag}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Enhanced Capsules Grid */}
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
                  {filters.search || filters.tag || filters.category || filters.sentiment !== 'all' 
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
                    {/* Enhanced Header */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full border-3 border-black flex items-center justify-center ${getSentimentColor(capsule.sentiment)} bg-white`}>
                          <span className="text-lg">{getSentimentEmoji(capsule.sentiment)}</span>
                        </div>
                        <div>
                          <div className="text-xs font-black text-black font-retro uppercase" style={{ color: '#000000' }}>
                            {getSentimentLabel(capsule.sentiment)}
                          </div>
                          {capsule.category && (
                            <div className="text-xs text-gray font-bold" style={{ color: '#6B7280' }}>{capsule.category}</div>
                          )}
                        </div>
                        {capsule.featured && (
                          <div className="brutalist-badge text-xs">
                            <Award className="h-3 w-3 mr-1" style={{ color: '#000000' }} />
                            <span style={{ color: '#000000' }}>Featured</span>
                          </div>
                        )}
                      </div>
                      <div className="text-xs text-gray font-bold" style={{ color: '#6B7280' }}>
                        <Clock className="h-3 w-3 inline mr-1" style={{ color: 'inherit' }} />
                        <span style={{ color: 'inherit' }}>{formatTimeAgo(capsule.createdAt)}</span>
                      </div>
                    </div>

                    {/* Enhanced Content */}
                    <div className="mb-6">
                      <p className="text-black font-bold leading-relaxed line-clamp-4 text-base">
                        "{capsule.textContent}"
                      </p>
                    </div>

                    {/* Enhanced Tags */}
                    {capsule.tags && capsule.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {capsule.tags.slice(0, 3).map((tagObj, index) => (
                          <button
                            key={index}
                            onClick={(e) => {
                              e.stopPropagation();
                              setFilters(prev => ({ ...prev, tag: tagObj.tag }));
                            }}
                            className="brutalist-badge brutalist-badge-black text-xs cursor-pointer hover:bg-blue transition-colors"
                          >
                            <Tag className="h-2 w-2 mr-1" style={{ color: '#ffffff' }} />
                            <span style={{ color: '#ffffff' }}>{tagObj.tag}</span>
                          </button>
                        ))}
                        {capsule.tags.length > 3 && (
                          <span className="text-xs text-gray font-bold" style={{ color: '#6B7280' }}>+{capsule.tags.length - 3} more</span>
                        )}
                      </div>
                    )}

                    {/* Enhanced Actions */}
                    <div className="flex items-center justify-between pt-4 border-t-3 border-black">
                      <div className="flex items-center gap-4">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleLike(capsule.id);
                          }}
                          className={`flex items-center gap-1 transition-colors ${
                            likedCapsules.has(capsule.id) ? 'text-blue' : 'text-gray hover:text-blue'
                          }`}
                          style={{ color: likedCapsules.has(capsule.id) ? '#1E90FF' : '#6B7280' }}
                        >
                          <Heart className={`h-4 w-4 ${likedCapsules.has(capsule.id) ? 'fill-current' : ''}`} style={{ color: 'inherit' }} />
                          <span className="text-sm font-bold" style={{ color: 'inherit' }}>{safeNumber(capsule.likes)}</span>
                        </button>
                        
                        <div className="flex items-center gap-1 text-gray" style={{ color: '#6B7280' }}>
                          <Eye className="h-4 w-4" style={{ color: 'inherit' }} />
                          <span className="text-sm font-bold" style={{ color: 'inherit' }}>{safeNumber(capsule.views)}</span>
                        </div>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleShare(capsule);
                          }}
                          className="flex items-center gap-1 text-gray hover:text-blue transition-colors"
                          style={{ color: '#6B7280' }}
                        >
                          <Share2 className="h-4 w-4" style={{ color: 'inherit' }} />
                        </button>
                      </div>

                      <div className="text-xs text-gray font-bold" style={{ color: '#6B7280' }}>
                        <span style={{ color: 'inherit' }}>{safeNumber(capsule.wordCount)} words</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Enhanced Load More */}
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
                        <Zap className="h-5 w-5 mr-2" style={{ color: 'inherit' }} />
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

      {/* Enhanced CTA Section */}
      <section className="py-20 bg-black text-white relative overflow-hidden">
        {/* Floating elements */}
        <div className="absolute top-10 right-10 w-16 h-16 bg-blue border-4 border-white shadow-brutalist animate-brutalist-float" />
        <div className="absolute bottom-10 left-10 w-20 h-20 bg-white border-4 border-white shadow-brutalist-lg animate-brutalist-bounce" style={{ animationDelay: '0.5s' }} />
        
        <div className="container mx-auto max-w-7xl px-6 lg:px-8 text-center relative">
          <div className="mb-8 inline-flex items-center">
            <div className="brutalist-window">
              <div className="brutalist-window-header bg-blue">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-white border border-black" />
                  <span className="text-white" style={{ color: '#ffffff' }}>Create Your Story</span>
                </div>
              </div>
              <div className="brutalist-window-content bg-white text-black">
                <div className="flex items-center gap-4">
                  <Sparkles className="h-6 w-6 text-blue" style={{ color: '#1E90FF' }} />
                  <span className="font-bold" style={{ color: '#000000' }}>Join thousands sharing their memories</span>
                </div>
              </div>
            </div>
          </div>
          
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

      {/* Memory Detail Modal */}
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
                <p className="text-black font-bold leading-relaxed text-lg">
                  "{selectedCapsule.textContent}"
                </p>
              </div>

              {selectedCapsule.tags && selectedCapsule.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-6">
                  {selectedCapsule.tags.map((tagObj, index) => (
                    <div key={index} className="brutalist-badge brutalist-badge-black text-xs">
                      <Tag className="h-2 w-2 mr-1" style={{ color: '#ffffff' }} />
                      <span style={{ color: '#ffffff' }}>{tagObj.tag}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between pt-4 border-t-3 border-black">
                <div className="flex items-center gap-6">
                  <button
                    onClick={() => handleLike(selectedCapsule.id)}
                    className={`flex items-center gap-2 transition-colors ${
                      likedCapsules.has(selectedCapsule.id) ? 'text-blue' : 'text-gray hover:text-blue'
                    }`}
                    style={{ color: likedCapsules.has(selectedCapsule.id) ? '#1E90FF' : '#6B7280' }}
                  >
                    <Heart className={`h-5 w-5 ${likedCapsules.has(selectedCapsule.id) ? 'fill-current' : ''}`} style={{ color: 'inherit' }} />
                    <span className="font-bold" style={{ color: 'inherit' }}>{safeNumber(selectedCapsule.likes)}</span>
                  </button>
                  
                  <div className="flex items-center gap-2 text-gray" style={{ color: '#6B7280' }}>
                    <Eye className="h-5 w-5" style={{ color: 'inherit' }} />
                    <span className="font-bold" style={{ color: 'inherit' }}>{safeNumber(selectedCapsule.views)}</span>
                  </div>

                  <button
                    onClick={() => handleShare(selectedCapsule)}
                    className="flex items-center gap-2 text-gray hover:text-blue transition-colors"
                    style={{ color: '#6B7280' }}
                  >
                    <Share2 className="h-5 w-5" style={{ color: 'inherit' }} />
                    <span className="font-bold" style={{ color: 'inherit' }}>Share</span>
                  </button>
                </div>

                <div className="text-sm text-gray font-bold" style={{ color: '#6B7280' }}>
                  <span style={{ color: 'inherit' }}>{safeNumber(selectedCapsule.wordCount)} words • {formatTimeAgo(selectedCapsule.createdAt)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 