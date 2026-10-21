import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Download,
  Folder,
  FileCheck,
  AlertCircle,
  RotateCcw,
  Trash2,
  ExternalLink,
  CheckCircle2,
  Loader2
} from 'lucide-react';
import { DownloadItem } from '../types/download';
import { downloadManager } from '../services/downloader';

interface DownloadManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSettings: () => void;
}

export const DownloadManagerModal: React.FC<DownloadManagerModalProps> = ({
  isOpen,
  onClose,
  onOpenSettings,
}) => {
  const [items, setItems] = useState<DownloadItem[]>([]);

  useEffect(() => {
    const unsubscribe = downloadManager.subscribe(newItems => {
      setItems(newItems);
    });
    return unsubscribe;
  }, []);

  if (!isOpen) return null;

  const currentFolder = downloadManager.getTargetFolder();
  const completedCount = items.filter(i => i.status === 'completed').length;
  const activeCount = items.filter(i => i.status === 'downloading').length;

  const formatBytes = (bytes: number) => {
    if (!bytes) return '0 B';
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm select-none">
        {/* Backdrop click to close */}
        <div className="absolute inset-0" onClick={onClose} />

        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 250 }}
          className="relative w-full max-w-md h-full bg-[#12141f] border-l border-[#24293d] flex flex-col z-10 shadow-2xl"
        >
          {/* Header */}
          <div className="p-4 border-b border-[#24293d] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-pink-500/20 text-pink-400 flex items-center justify-center border border-pink-500/30">
                <Download className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-100 flex items-center gap-1.5">
                  <span>Download Manager</span>
                  {activeCount > 0 && (
                    <span className="w-2 h-2 rounded-full bg-pink-500 animate-ping" />
                  )}
                </h3>
                <p className="text-[11px] text-gray-400">
                  {items.length} tasks • {completedCount} completed
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {completedCount > 0 && (
                <button
                  onClick={() => downloadManager.clearCompleted()}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                  title="Clear completed tasks"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Download Directory Info Bar */}
          <div className="px-4 py-2 bg-[#171926] border-b border-[#24293d] flex items-center justify-between text-xs text-gray-300">
            <div className="flex items-center gap-1.5 truncate max-w-[280px]">
              <Folder className="w-3.5 h-3.5 text-pink-400 shrink-0" />
              <span className="truncate text-gray-400 text-[11px]">{currentFolder}</span>
            </div>
            <button
              onClick={() => {
                onClose();
                onOpenSettings();
              }}
              className="text-[11px] text-pink-400 hover:text-pink-300 hover:underline font-medium shrink-0 ml-2"
            >
              Change
            </button>
          </div>

          {/* Download Tasks List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-gray-500 py-16">
                <Download className="w-10 h-10 stroke-1 mb-2 text-gray-600" />
                <p className="text-sm font-medium text-gray-400">No downloads yet</p>
                <p className="text-xs text-gray-600 max-w-xs mt-1">
                  Click the download button on any post or select multiple posts to start downloading with high-speed API.
                </p>
              </div>
            ) : (
              items.map(item => (
                <div
                  key={item.id}
                  className="p-3 rounded-xl bg-[#191b29] border border-[#272d42] hover:border-[#384061] transition-all flex items-center gap-3"
                >
                  {/* Thumbnail */}
                  <img
                    src={item.thumbnailUrl}
                    alt={item.filename}
                    className="w-12 h-12 object-cover rounded-lg bg-black/40 shrink-0 border border-white/5"
                  />

                  {/* Task details & progress */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-gray-200 truncate pr-2">
                        {item.filename}
                      </span>
                      <span className="text-[10px] font-mono shrink-0">
                        {item.status === 'downloading' && (
                          <span className="text-pink-400 font-semibold">{item.progress}%</span>
                        )}
                        {item.status === 'completed' && (
                          <span className="text-emerald-400 font-medium">Done</span>
                        )}
                        {item.status === 'failed' && (
                          <span className="text-rose-400 font-medium">Failed</span>
                        )}
                        {item.status === 'queued' && (
                          <span className="text-gray-400 font-medium">Queued</span>
                        )}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-1.5 bg-black/40 rounded-full overflow-hidden mb-1.5">
                      <div
                        className={`h-full transition-all duration-200 rounded-full ${
                          item.status === 'completed'
                            ? 'bg-emerald-500'
                            : item.status === 'failed'
                            ? 'bg-rose-500'
                            : 'bg-gradient-to-r from-pink-500 to-rose-500'
                        }`}
                        style={{ width: `${item.progress}%` }}
                      />
                    </div>

                    {/* Secondary info row */}
                    <div className="flex items-center justify-between text-[10px] text-gray-400">
                      <span>
                        {item.downloadedBytes > 0 && formatBytes(item.downloadedBytes)}
                        {item.totalBytes > 0 && ` / ${formatBytes(item.totalBytes)}`}
                      </span>

                      {/* Action buttons */}
                      <div className="flex items-center gap-1.5">
                        {item.status === 'completed' && (
                          <button
                            onClick={() => downloadManager.openFolder(item)}
                            className="flex items-center gap-1 text-pink-400 hover:text-pink-300 font-medium transition-colors"
                            title="Show in Folder"
                          >
                            <Folder className="w-3 h-3" />
                            <span>Show</span>
                          </button>
                        )}
                        {item.status === 'failed' && (
                          <button
                            onClick={() => downloadManager.retry(item.id)}
                            className="flex items-center gap-1 text-amber-400 hover:text-amber-300 font-medium transition-colors"
                            title="Retry download"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>Retry</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
