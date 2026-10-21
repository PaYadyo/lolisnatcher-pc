import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, CheckSquare, X, Check, Loader2 } from 'lucide-react';
import { BooruPost } from '../types/booru';
import { downloadManager } from '../services/downloader';

interface BatchActionBarProps {
  selectedPosts: BooruPost[];
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onCloseSelectionMode: () => void;
  totalLoaded: number;
}

export const BatchActionBar: React.FC<BatchActionBarProps> = ({
  selectedPosts,
  onSelectAll,
  onDeselectAll,
  onCloseSelectionMode,
  totalLoaded,
}) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const count = selectedPosts.length;
  if (count === 0) return null;

  const handleBatchDownload = async () => {
    if (isDownloading || count === 0) return;
    setIsDownloading(true);
    try {
      await downloadManager.downloadBatch(selectedPosts);
      setDownloadSuccess(true);
      setTimeout(() => {
        setDownloadSuccess(false);
        onDeselectAll();
      }, 2000);
    } catch (err) {
      console.error('Batch download error:', err);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 80, opacity: 0 }}
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 px-4 py-2.5 rounded-2xl glass-dropdown border border-pink-500/30 shadow-2xl shadow-black/80 select-none"
      >
        <div className="flex items-center gap-2 pr-2 border-r border-white/10">
          <div className="w-7 h-7 rounded-lg bg-pink-500 text-white flex items-center justify-center font-bold text-xs shadow-md shadow-pink-500/30">
            {count}
          </div>
          <span className="text-xs font-semibold text-gray-200">
            Selected
          </span>
        </div>

        {/* Quick select buttons */}
        <div className="flex items-center gap-1.5 text-xs">
          <button
            onClick={onSelectAll}
            className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-colors"
          >
            All Loaded ({totalLoaded})
          </button>
          <button
            onClick={onDeselectAll}
            className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-colors"
          >
            Clear
          </button>
        </div>

        {/* Download Button */}
        <button
          onClick={handleBatchDownload}
          disabled={isDownloading}
          className={`flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs font-semibold shadow-lg transition-all ${
            downloadSuccess
              ? 'bg-emerald-500 text-white shadow-emerald-500/30'
              : 'bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white shadow-pink-500/30'
          }`}
        >
          {isDownloading ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Queueing {count} Images...</span>
            </>
          ) : downloadSuccess ? (
            <>
              <Check className="w-3.5 h-3.5 stroke-[3]" />
              <span>Queued Successfully!</span>
            </>
          ) : (
            <>
              <Download className="w-3.5 h-3.5" />
              <span>Download ({count})</span>
            </>
          )}
        </button>

        {/* Close Selection */}
        <button
          onClick={onCloseSelectionMode}
          className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors ml-1"
          title="Exit Selection Mode"
        >
          <X className="w-4 h-4" />
        </button>
      </motion.div>
    </AnimatePresence>
  );
};
