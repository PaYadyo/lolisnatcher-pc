import React, { useState } from 'react';
import { BooruPost } from '../types/booru';
import { PostCard } from './PostCard';
import { Heart, Search, Trash2, Download, ImageOff, Sparkles } from 'lucide-react';
import { downloadManager } from '../services/downloader';

interface FavoritesViewProps {
  favorites: BooruPost[];
  onToggleFavorite: (post: BooruPost) => void;
  onSelectPost: (post: BooruPost) => void;
  columnCount: number;
  isSelectionMode: boolean;
  selectedPostIds: Set<string | number>;
  onToggleSelectPost: (post: BooruPost) => void;
  blurExplicit: boolean;
  onExploreFeed: () => void;
}

export const FavoritesView: React.FC<FavoritesViewProps> = ({
  favorites,
  onToggleFavorite,
  onSelectPost,
  columnCount,
  isSelectionMode,
  selectedPostIds,
  onToggleSelectPost,
  blurExplicit,
  onExploreFeed,
}) => {
  const [filterText, setFilterText] = useState('');
  const [isDownloadingAll, setIsDownloadingAll] = useState(false);

  const filtered = favorites.filter(p => {
    if (!filterText.trim()) return true;
    const term = filterText.toLowerCase();
    const tagMatch = p.tags.all.some(t => t.toLowerCase().includes(term));
    const idMatch = String(p.id).includes(term);
    return tagMatch || idMatch;
  });

  const handleDownloadAllFavorites = async () => {
    if (favorites.length === 0 || isDownloadingAll) return;
    setIsDownloadingAll(true);
    try {
      await downloadManager.downloadBatch(favorites);
    } finally {
      setIsDownloadingAll(false);
    }
  };

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
      default:
        return 'columns-2 sm:columns-3 md:columns-4 lg:columns-5 2xl:columns-6 gap-3 space-y-3';
    }
  };

  return (
    <div className="w-full max-w-[1920px] mx-auto px-4 py-4 min-h-[calc(100vh-140px)]">
      {/* Top Bar for Favorites */}
      <div className="flex items-center justify-between gap-3 mb-6 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center border border-rose-500/30">
            <Heart className="w-4 h-4 fill-current" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-gray-100 flex items-center gap-2">
              <span>Saved Favorites</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-mono">
                {favorites.length}
              </span>
            </h2>
            <p className="text-xs text-gray-400">Locally bookmarked Danbooru posts</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Quick Filter */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={filterText}
              onChange={e => setFilterText(e.target.value)}
              placeholder="Filter saved favorites..."
              className="pl-8 pr-3 py-1.5 rounded-xl bg-[#1c1f2e] border border-[#2d3247] text-xs text-gray-200 placeholder-gray-500 outline-none focus:border-rose-500 w-48 sm:w-64"
            />
          </div>

          {/* Download All Favorites */}
          {favorites.length > 0 && (
            <button
              onClick={handleDownloadAllFavorites}
              disabled={isDownloadingAll}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white text-xs font-semibold shadow-lg shadow-pink-500/20 transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download All ({favorites.length})</span>
            </button>
          )}
        </div>
      </div>

      {/* Empty State */}
      {favorites.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-4 text-rose-400">
            <Heart className="w-8 h-8" />
          </div>
          <h3 className="text-base font-semibold text-gray-200 mb-1">No Favorites Yet</h3>
          <p className="text-xs text-gray-400 max-w-sm mb-6">
            Click the heart icon on any Danbooru post in your feed to save it to your local favorites.
          </p>
          <button
            onClick={onExploreFeed}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-pink-500 hover:bg-pink-600 text-white text-xs font-semibold shadow-lg shadow-pink-500/25 transition-all"
          >
            <Sparkles className="w-4 h-4" />
            <span>Discover Anime Art</span>
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-500 text-xs">
          No favorites match "{filterText}".
        </div>
      ) : (
        /* Masonry Grid */
        <div className={getColumnClass()}>
          {filtered.map(post => (
            <div key={`${post.engine}-${post.id}`} className="break-inside-avoid mb-3">
              <PostCard
                post={post}
                isFavorite={true}
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
    </div>
  );
};
