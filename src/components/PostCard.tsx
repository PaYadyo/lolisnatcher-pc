import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Heart, Download, Check, ExternalLink, Image as ImageIcon } from 'lucide-react';
import { BooruPost } from '../types/booru';
import { downloadManager } from '../services/downloader';

interface PostCardProps {
  post: BooruPost;
  isFavorite: boolean;
  onToggleFavorite: (post: BooruPost) => void;
  onSelectPost: (post: BooruPost) => void;
  isSelected?: boolean;
  isSelectionMode?: boolean;
  onToggleSelect?: (post: BooruPost) => void;
  blurExplicit?: boolean;
}

const RATING_BADGES: Record<string, { label: string; bg: string; text: string; border: string }> = {
  g: { label: 'G', bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/30' },
  s: { label: 'S', bg: 'bg-yellow-500/20', text: 'text-yellow-400', border: 'border-yellow-500/30' },
  q: { label: 'Q', bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/30' },
  e: { label: 'E', bg: 'bg-rose-500/20', text: 'text-rose-400', border: 'border-rose-500/30' },
};

export const PostCard: React.FC<PostCardProps> = ({
  post,
  isFavorite,
  onToggleFavorite,
  onSelectPost,
  isSelected = false,
  isSelectionMode = false,
  onToggleSelect,
  blurExplicit = false,
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const ratingBadge = RATING_BADGES[post.rating] || RATING_BADGES.g;
  const isBlurred = blurExplicit && (post.rating === 'q' || post.rating === 'e');

  const handleQuickDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isDownloading) return;
    setIsDownloading(true);
    try {
      await downloadManager.downloadPost(post);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 2000);
    } catch (err) {
      console.error('Quick download failed:', err);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleCardClick = () => {
    if (isSelectionMode && onToggleSelect) {
      onToggleSelect(post);
    } else {
      onSelectPost(post);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.25 }}
      onClick={handleCardClick}
      className={`group relative rounded-xl overflow-hidden cursor-pointer bg-[#181a26] border transition-all duration-200 select-none ${
        isSelected
          ? 'ring-2 ring-pink-500 border-pink-500 shadow-lg shadow-pink-500/20'
          : 'border-[#262b3d] hover:border-pink-500/50 hover:shadow-xl hover:shadow-black/40'
      }`}
    >
      {/* Aspect Ratio Container */}
      <div
        className="relative w-full overflow-hidden bg-[#12141d]"
        style={{ paddingBottom: `${Math.min(Math.max((1 / post.aspectRatio) * 100, 70), 160)}%` }}
      >
        {/* Placeholder skeleton loader */}
        {!imageLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#151722] animate-pulse">
            <ImageIcon className="w-8 h-8 text-gray-700" />
          </div>
        )}

        {/* Post Image */}
        <img
          src={post.previewUrl || post.sampleUrl}
          alt={`Booru Post ${post.id}`}
          loading="lazy"
          onLoad={() => setImageLoaded(true)}
          className={`absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 ${
            imageLoaded ? 'opacity-100' : 'opacity-0'
          } ${isBlurred ? 'filter blur-xl scale-110' : ''}`}
        />

        {/* Top Badges: Rating & Resolution */}
        <div className="absolute top-2 left-2 right-2 flex items-center justify-between pointer-events-none z-10">
          <span
            className={`px-1.5 py-0.5 rounded text-[10px] font-bold border backdrop-blur-md ${ratingBadge.bg} ${ratingBadge.text} ${ratingBadge.border}`}
          >
            {ratingBadge.label}
          </span>

          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-black/60 backdrop-blur-md text-gray-300 border border-white/10">
            {post.width}×{post.height}
          </span>
        </div>

        {/* Selection Checkbox (always visible in selection mode, or on hover) */}
        {(isSelectionMode || isSelected) && (
          <div
            onClick={(e) => {
              e.stopPropagation();
              onToggleSelect?.(post);
            }}
            className="absolute top-2 right-2 z-20"
          >
            <div
              className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all ${
                isSelected
                  ? 'bg-pink-500 text-white shadow-md shadow-pink-500/50'
                  : 'bg-black/60 text-white border border-white/20 hover:border-pink-400'
              }`}
            >
              {isSelected && <Check className="w-4 h-4 stroke-[3]" />}
            </div>
          </div>
        )}

        {/* Hover overlay with quick actions */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-end p-2.5 z-10">
          {/* Tags preview snippet */}
          <div className="text-[11px] text-gray-200 font-medium truncate mb-1">
            {post.tags.character.length > 0
              ? post.tags.character.join(', ').replace(/_/g, ' ')
              : post.tags.artist.length > 0
              ? `by ${post.tags.artist.join(', ').replace(/_/g, ' ')}`
              : post.tags.general.slice(0, 3).join(', ').replace(/_/g, ' ')}
          </div>

          {/* Quick buttons */}
          <div className="flex items-center justify-between pt-1 border-t border-white/10">
            <span className="text-[10px] font-mono text-gray-300">
              ★ {post.score}
            </span>

            <div className="flex items-center gap-1.5">
              {/* Favorite button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleFavorite(post);
                }}
                className={`p-1.5 rounded-lg transition-transform active:scale-90 ${
                  isFavorite
                    ? 'bg-rose-500 text-white shadow-md shadow-rose-500/30'
                    : 'bg-black/60 text-gray-300 hover:text-white hover:bg-rose-500/50'
                }`}
                title={isFavorite ? 'Remove Favorite' : 'Add to Favorites'}
              >
                <Heart className={`w-3.5 h-3.5 ${isFavorite ? 'fill-current' : ''}`} />
              </button>

              {/* Quick Download button */}
              <button
                onClick={handleQuickDownload}
                disabled={isDownloading}
                className={`p-1.5 rounded-lg transition-transform active:scale-90 ${
                  downloadSuccess
                    ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30'
                    : 'bg-black/60 text-gray-300 hover:text-white hover:bg-pink-500/60'
                }`}
                title="Quick Download"
              >
                {downloadSuccess ? (
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                ) : (
                  <Download className={`w-3.5 h-3.5 ${isDownloading ? 'animate-bounce' : ''}`} />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
