import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Download,
  Heart,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  ExternalLink,
  Copy,
  Check,
  Tag as TagIcon,
  Layers,
  Sparkles,
  Info,
  Calendar,
  Maximize2
} from 'lucide-react';
import { BooruPost, TAG_COLOR_MAP } from '../types/booru';
import { downloadManager } from '../services/downloader';

interface PostDetailModalProps {
  post: BooruPost | null;
  onClose: () => void;
  onNext?: () => void;
  onPrev?: () => void;
  hasNext: boolean;
  hasPrev: boolean;
  isFavorite: boolean;
  onToggleFavorite: (post: BooruPost) => void;
  onSearchTag: (tag: string) => void;
}

export const PostDetailModal: React.FC<PostDetailModalProps> = ({
  post,
  onClose,
  onNext,
  onPrev,
  hasNext,
  hasPrev,
  isFavorite,
  onToggleFavorite,
  onSearchTag,
}) => {
  const [useOriginal, setUseOriginal] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [copiedTag, setCopiedTag] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<'tags' | 'info'>('tags');

  const imageContainerRef = useRef<HTMLDivElement>(null);

  // Reset zoom & pan when post changes
  useEffect(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setUseOriginal(false);
    setDownloadSuccess(false);
  }, [post?.id, post?.engine]);

  // Keyboard navigation
  useEffect(() => {
    if (!post) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight' && onNext && hasNext) onNext();
      if (e.key === 'ArrowLeft' && onPrev && hasPrev) onPrev();
      if (e.key === 'f' || e.key === 'F') onToggleFavorite(post);
      if (e.key === 'd' || e.key === 'D') handleDownload('original');
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [post, hasNext, hasPrev, onNext, onPrev, onClose, onToggleFavorite]);

  if (!post) return null;

  const currentDisplayUrl = useOriginal && post.fileUrl ? post.fileUrl : (post.sampleUrl || post.fileUrl);

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.35, 4));
  const handleZoomOut = () => {
    setZoom(prev => {
      const next = Math.max(prev - 0.35, 0.7);
      if (next <= 1) setPan({ x: 0, y: 0 });
      return next;
    });
  };
  const handleResetZoom = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      handleZoomIn();
    } else {
      handleZoomOut();
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && zoom > 1) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleCopyTag = (tag: string) => {
    navigator.clipboard.writeText(tag);
    setCopiedTag(tag);
    setTimeout(() => setCopiedTag(null), 1500);
  };

  const handleDownload = async (quality: 'original' | 'sample') => {
    if (isDownloading) return;
    setIsDownloading(true);
    try {
      await downloadManager.downloadPost(post, quality);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 2500);
    } catch (err) {
      console.error('Download post failed:', err);
    } finally {
      setIsDownloading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes) return 'Unknown';
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const tagGroups = [
    { title: 'Artist', items: post.tags.artist, style: TAG_COLOR_MAP.artist, count: post.tags.artist.length },
    { title: 'Copyright', items: post.tags.copyright, style: TAG_COLOR_MAP.copyright, count: post.tags.copyright.length },
    { title: 'Character', items: post.tags.character, style: TAG_COLOR_MAP.character, count: post.tags.character.length },
    { title: 'General', items: post.tags.general, style: TAG_COLOR_MAP.general, count: post.tags.general.length },
    { title: 'Meta', items: post.tags.meta, style: TAG_COLOR_MAP.meta, count: post.tags.meta.length },
  ];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex bg-black/90 backdrop-blur-xl select-none"
      >
        {/* Main Image Viewport Area */}
        <div className="relative flex-1 h-full flex flex-col justify-between overflow-hidden">
          {/* Top Floating Controls Bar */}
          <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between pointer-events-none">
            <div className="flex items-center gap-2 pointer-events-auto">
              {/* Back / Close button */}
              <button
                onClick={onClose}
                className="p-2 rounded-xl bg-black/60 hover:bg-black/90 text-white backdrop-blur-md border border-white/10 transition-transform active:scale-95"
                title="Close (Esc)"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Quality Switcher */}
              <button
                onClick={() => setUseOriginal(!useOriginal)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold backdrop-blur-md border transition-all ${
                  useOriginal
                    ? 'bg-pink-500 text-white border-pink-400 shadow-lg shadow-pink-500/30'
                    : 'bg-black/60 text-gray-300 hover:text-white border-white/10'
                }`}
                title="Toggle Sample / Original High-Resolution Image"
              >
                {useOriginal ? 'Full Original Res' : 'Sample View'}
              </button>
            </div>

            {/* Zoom & View Controls */}
            <div className="flex items-center gap-1.5 pointer-events-auto bg-black/60 backdrop-blur-md border border-white/10 rounded-xl p-1">
              <button
                onClick={handleZoomOut}
                className="p-1.5 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="text-[11px] font-mono text-gray-200 px-1 min-w-[42px] text-center">
                {Math.round(zoom * 100)}%
              </span>
              <button
                onClick={handleZoomIn}
                className="p-1.5 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                onClick={handleResetZoom}
                className="p-1.5 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
                title="Reset Zoom"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Center Image Container with Pan & Zoom */}
          <div
            ref={imageContainerRef}
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            className={`w-full h-full flex items-center justify-center p-8 overflow-hidden ${
              zoom > 1 ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'
            }`}
          >
            <motion.img
              src={currentDisplayUrl}
              alt={`Booru Post ${post.id}`}
              draggable={false}
              animate={{
                scale: zoom,
                x: pan.x,
                y: pan.y,
              }}
              transition={{ type: 'spring', damping: 25, stiffness: 250 }}
              className="max-h-full max-w-full object-contain rounded-md shadow-2xl pointer-events-auto select-none"
            />
          </div>

          {/* Navigation Arrows (Prev / Next) */}
          {hasPrev && (
            <button
              onClick={onPrev}
              className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/60 hover:bg-black/90 text-white backdrop-blur-md border border-white/10 transition-all hover:scale-110 active:scale-95 z-20"
              title="Previous Image (Left Arrow)"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}

          {hasNext && (
            <button
              onClick={onNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/60 hover:bg-black/90 text-white backdrop-blur-md border border-white/10 transition-all hover:scale-110 active:scale-95 z-20"
              title="Next Image (Right Arrow)"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          )}

          {/* Bottom Floating Action Bar */}
          <div className="absolute bottom-4 left-4 right-4 z-20 flex items-center justify-center pointer-events-none">
            <div className="flex items-center gap-2 pointer-events-auto bg-black/75 backdrop-blur-md border border-white/10 rounded-2xl p-2 shadow-2xl">
              {/* Favorite Button */}
              <button
                onClick={() => onToggleFavorite(post)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                  isFavorite
                    ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30'
                    : 'bg-white/10 text-gray-200 hover:bg-rose-500/30 hover:text-rose-300'
                }`}
              >
                <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
                <span>{isFavorite ? 'Favorited' : 'Favorite'}</span>
              </button>

              {/* Main Download Button */}
              <button
                onClick={() => handleDownload('original')}
                disabled={isDownloading}
                className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-semibold transition-all ${
                  downloadSuccess
                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                    : 'bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white shadow-lg shadow-pink-500/30'
                }`}
              >
                {downloadSuccess ? (
                  <>
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>Saved!</span>
                  </>
                ) : (
                  <>
                    <Download className={`w-4 h-4 ${isDownloading ? 'animate-bounce' : ''}`} />
                    <span>Download Original ({post.width}×{post.height})</span>
                  </>
                )}
              </button>

              {/* Sample Download Button */}
              <button
                onClick={() => handleDownload('sample')}
                disabled={isDownloading}
                className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white text-xs font-medium transition-colors"
                title="Download Sample (Faster/Smaller)"
              >
                Sample
              </button>
            </div>
          </div>
        </div>

        {/* Right Sliding Tag Sheet / Inspector Panel */}
        <div className="w-80 md:w-96 h-full bg-[#141620] border-l border-[#24293d] flex flex-col z-30 shadow-2xl">
          {/* Header tabs */}
          <div className="p-3 border-b border-[#24293d] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('tags')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  activeTab === 'tags'
                    ? 'bg-pink-500/20 text-pink-300 border border-pink-500/30'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                <TagIcon className="w-3.5 h-3.5" />
                <span>Tags ({post.tags.all.length})</span>
              </button>
              <button
                onClick={() => setActiveTab('info')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  activeTab === 'info'
                    ? 'bg-pink-500/20 text-pink-300 border border-pink-500/30'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                <Info className="w-3.5 h-3.5" />
                <span>Details</span>
              </button>
            </div>

            <div className="text-[11px] font-mono text-gray-400">
              #{post.id}
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-5">
            {activeTab === 'tags' ? (
              /* Grouped Tags (Lolisnatcher style) */
              tagGroups.map(group => {
                if (group.items.length === 0) return null;
                return (
                  <div key={group.title} className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-semibold text-gray-300">
                      <span className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${group.style.badge.split(' ')[0]}`} />
                        <span>{group.title}</span>
                      </span>
                      <span className="text-[11px] font-mono text-gray-500">{group.count}</span>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {group.items.map(tag => (
                        <div
                          key={tag}
                          className={`group/tag flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs border transition-all ${group.style.bg} ${group.style.text} ${group.style.border} hover:brightness-125`}
                        >
                          <button
                            onClick={() => {
                              onSearchTag(tag);
                              onClose();
                            }}
                            className="font-medium hover:underline text-left"
                            title={`Search tag: ${tag}`}
                          >
                            {tag.replace(/_/g, ' ')}
                          </button>

                          <button
                            onClick={() => handleCopyTag(tag)}
                            className="opacity-40 group-hover/tag:opacity-100 p-0.5 hover:text-white transition-opacity ml-0.5"
                            title="Copy tag name"
                          >
                            {copiedTag === tag ? (
                              <Check className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })
            ) : (
              /* Post Info & Metadata */
              <div className="space-y-4 text-xs">
                <div className="p-3 rounded-xl bg-white/5 border border-white/5 space-y-2.5">
                  <div className="flex items-center justify-between text-gray-400">
                    <span>Engine</span>
                    <span className="font-semibold text-pink-400 uppercase">{post.engine}</span>
                  </div>
                  <div className="flex items-center justify-between text-gray-400">
                    <span>Post ID</span>
                    <span className="font-mono text-gray-200">#{post.id}</span>
                  </div>
                  <div className="flex items-center justify-between text-gray-400">
                    <span>Rating</span>
                    <span className="font-semibold uppercase text-gray-200">{post.rating}</span>
                  </div>
                  <div className="flex items-center justify-between text-gray-400">
                    <span>Dimensions</span>
                    <span className="font-mono text-gray-200">{post.width} × {post.height}</span>
                  </div>
                  <div className="flex items-center justify-between text-gray-400">
                    <span>File Format</span>
                    <span className="font-mono uppercase text-gray-200">.{post.fileExt}</span>
                  </div>
                  <div className="flex items-center justify-between text-gray-400">
                    <span>File Size</span>
                    <span className="font-mono text-gray-200">{formatFileSize(post.fileSize)}</span>
                  </div>
                  <div className="flex items-center justify-between text-gray-400">
                    <span>Community Score</span>
                    <span className="font-mono text-amber-400">★ {post.score}</span>
                  </div>
                </div>

                {/* External Source Link */}
                {post.source && (
                  <div className="p-3 rounded-xl bg-white/5 border border-white/5 space-y-1.5">
                    <span className="text-gray-400 text-[11px] block">Source Link</span>
                    <a
                      href={post.source}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-pink-400 hover:text-pink-300 font-medium truncate"
                    >
                      <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{post.source}</span>
                    </a>
                  </div>
                )}

                {/* API Download Hint */}
                <div className="p-3 rounded-xl bg-pink-500/10 border border-pink-500/20 text-pink-300 space-y-1">
                  <span className="font-semibold text-[11px] block">✨ High-Speed API Download</span>
                  <p className="text-[11px] text-pink-300/80 leading-relaxed">
                    Downloads use direct streaming with custom Referer and User-Agent headers, saving directly to your PC without rate restrictions.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
