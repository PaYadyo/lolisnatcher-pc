import { useState, useEffect } from 'react';
import { Minus, Square, X, Copy, Sparkles } from 'lucide-react';

export const Titlebar = () => {
  const [isMaximized, setIsMaximized] = useState(false);
  const isElectron = Boolean(window.electronAPI?.isElectron);

  useEffect(() => {
    if (window.electronAPI) {
      window.electronAPI.isMaximized().then(setIsMaximized);
      window.electronAPI.onMaximizedChange(setIsMaximized);
    }
  }, []);

  const handleMinimize = () => window.electronAPI?.minimize();
  const handleMaximize = async () => {
    const val = await window.electronAPI?.maximize();
    if (typeof val === 'boolean') setIsMaximized(val);
  };
  const handleClose = () => window.electronAPI?.close();

  return (
    <header className="h-9 w-full bg-[#0d0e14] border-b border-[#232738] flex items-center justify-between select-none z-50 text-xs text-gray-300 app-drag-region sticky top-0">
      {/* Brand logo & title */}
      <div className="flex items-center space-x-2 px-3 app-no-drag">
        <div className="w-5 h-5 rounded-md bg-gradient-to-tr from-pink-500 via-rose-500 to-indigo-500 flex items-center justify-center shadow-sm shadow-pink-500/20">
          <Sparkles className="w-3 h-3 text-white" />
        </div>
        <span className="font-semibold text-gray-200 tracking-wide flex items-center gap-1.5">
          <span>LoliSnatcher</span>
          <span className="text-[10px] uppercase font-bold px-1.5 py-0.2 rounded bg-pink-500/20 text-pink-400 border border-pink-500/30">PC</span>
        </span>
      </div>

      {/* Middle status or drag hint */}
      <div className="text-gray-500 text-[11px] truncate px-4 pointer-events-none hidden sm:block">
        Danbooru & Anime Booru Image Viewer
      </div>

      {/* Window controls for desktop */}
      <div className="flex items-center h-full app-no-drag">
        {isElectron ? (
          <>
            <button
              onClick={handleMinimize}
              className="h-full px-3.5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors flex items-center justify-center"
              title="Minimize"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleMaximize}
              className="h-full px-3.5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors flex items-center justify-center"
              title={isMaximized ? "Restore" : "Maximize"}
            >
              {isMaximized ? (
                <Copy className="w-3.5 h-3.5 rotate-180" />
              ) : (
                <Square className="w-3.5 h-3.5" />
              )}
            </button>
            <button
              onClick={handleClose}
              className="h-full px-4 hover:bg-rose-600 text-gray-400 hover:text-white transition-colors flex items-center justify-center"
              title="Close"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </>
        ) : (
          <div className="px-3 text-[11px] text-pink-400/80 font-medium bg-pink-500/10 border border-pink-500/20 rounded-full my-1 mr-2 py-0.5">
            Web Preview Mode
          </div>
        )}
      </div>
    </header>
  );
};
