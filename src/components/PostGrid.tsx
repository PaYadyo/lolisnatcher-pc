import React, { useEffect, useRef } from 'react';
import { PostCard } from './PostCard';
import { BooruPost } from '../types/booru';
import { Loader2, AlertCircle, RefreshCw, Sparkles, ImageOff } from 'lucide-react';

interface PostGridProps {
  posts: BooruPost[];
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  error: string | null;
  onLoadMore: () => void;
  onRefresh: () => void;
  favorites: BooruPost[];
  onToggleFavorite: (post: BooruPost) => void;
  onSelectPost: (post: BooruPost) => void;
  columnCount: number; // 0 for auto, 2..6
  isSelectionMode: boolean;
  selectedPostIds: Set<string | number>;
  onToggleSelectPost: (post: BooruPost) => void;
  blurExplicit: boolean;
}

export const PostGrid: React.FC<PostGridProps> = ({
  posts,
  loading,
  loadingMore,
  hasMore,
  error,
  onLoadMore,
  onRefresh,
  favorites,
  onToggleFavorite,
  onSelectPost,
  columnCount,
  isSelectionMode,
  selectedPostIds,
  onToggleSelectPost,
  blurExplicit,
}) => {
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Intersection observer for smooth infinite scrolling
  useEffect(() => {
    if (!sentinelRef.current || loading || loadingMore || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          onLoadMore();
        }
      },
      { rootMargin: '600px' }
    );

    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [loading, loadingMore, hasMore, onLoadMore]);

  // Determine column classes
  const getColumnClass = () => {
    switch (columnCount) {
      case 2:
        return 'columns-2 gap-3 space-y-3';
      case 3:
        return 'columns-2 md:columns-3 gap-3 space-y-3';
      case 4:
        return 'columns-2 md:columns-3 lg:columns-4 gap-3 space-y-3';
      case 5:
        return 'columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-3 space-y-3';
      case 6:
        return 'columns-2 md:columns-4 lg:columns-5 2xl:columns-6 gap-3 space-y-3';
      default:
        // Responsive auto
        return 'columns-2 sm:columns-3 md:columns-4 lg:columns-5 2xl:columns-6 gap-3 space-y-3';
    }
  };

  const isFav = (p: BooruPost) => favorites.some(f => f.id === p.id && f.engine === p.engine);

  return (
    <div className="w-full max-w-[1920px] mx-auto px-4 py-4 min-h-[calc(100vh-140px)]">
      {/* Error banner */}
      {error && (
        <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            <div className="text-sm">
              <span className="font-semibold">Error:</span> {error}
            </div>
          </div>
          <button
            onClick={onRefresh}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 text-xs font-medium border border-rose-500/30 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry</span>
          </button>
        </div>
      )}

      {/* Initial Loading Skeleton */}
      {loading && posts.length === 0 && (
        <div className={getColumnClass()}>
          {Array.from({ length: 15 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl bg-[#181a26] border border-[#232738] p-2 break-inside-avoid animate-pulse"
            >
              <div
                className="w-full bg-[#1e2233] rounded-lg"
                style={{ height: `${200 + ((i * 47) % 180)}px` }}
              />
              <div className="mt-2.5 h-3 bg-[#1e2233] rounded w-3/4" />
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && posts.length === 0 && !error && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-4 text-pink-400">
            <ImageOff className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-semibold text-gray-200 mb-1">No Posts Found</h3>
          <p className="text-sm text-gray-400 max-w-sm mb-6">
            We couldn't find any images matching your current tags or rating filters.
          </p>
          <button
            onClick={onRefresh}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-pink-500 hover:bg-pink-600 text-white text-xs font-semibold shadow-lg shadow-pink-500/25 transition-all"
          >
            <Sparkles className="w-4 h-4" />
            <span>Explore Trending</span>
          </button>
        </div>
      )}

      {/* Masonry Grid */}
      {posts.length > 0 && (
        <div className={getColumnClass()}>
          {posts.map(post => (
            <div key={`${post.engine}-${post.id}`} className="break-inside-avoid mb-3">
              <PostCard
                post={post}
                isFavorite={isFav(post)}
                onToggleFavorite={onToggleFavorite}
                onSelectPost={onSelectPost}
                isSelected={selectedPostIds.has(post.id)}
                isSelectionMode={isSelectionMode}
                onToggleSelect={onToggleSelectPost}
                blurExplicit={blurExplicit}
              />
            </div>
          ))}
        </div>
      )}

      {/* Infinite Scroll Sentinel / Load More Indicator */}
      <div ref={sentinelRef} className="py-8 flex justify-center items-center">
        {loadingMore && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-full glass-panel text-pink-400 text-xs font-medium">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Loading more cute anime images...</span>
          </div>
        )}
        {!hasMore && posts.length > 0 && (
          <div className="text-xs text-gray-500 py-4 font-mono">
            — End of results —
          </div>
        )}
      </div>
    </div>
  );
};
