import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  X,
  Heart,
  Download,
  Settings,
  Layers,
  Sparkles,
  ChevronDown,
  Flame,
  Clock,
  CheckSquare,
  ShieldCheck,
  Tag as TagIcon
} from 'lucide-react';
import { BooruEngine, TAG_CATEGORY_MAP, TAG_COLOR_MAP } from '../types/booru';
import { useTagAutocomplete } from '../hooks/useTagAutocomplete';
import { storageService } from '../services/storage';

interface HeaderProps {
  engine: BooruEngine;
  onEngineChange: (engine: BooruEngine) => void;
  searchQuery: string;
  onSearchSubmit: (query: string) => void;
  ratingFilter: string;
  onRatingChange: (rating: string) => void;
  sortOrder: string;
  onSortChange: (order: string) => void;
  currentTab: 'feed' | 'favorites';
  onTabChange: (tab: 'feed' | 'favorites') => void;
  favoritesCount: number;
  downloadCount: number;
  activeDownloads: number;
  onOpenDownloads: () => void;
  onOpenSettings: () => void;
  isSelectionMode: boolean;
  onToggleSelectionMode: () => void;
  selectedCount: number;
}

const ENGINES: { id: BooruEngine; name: string; tag: string }[] = [
  { id: 'danbooru', name: 'Danbooru', tag: 'API Auth Ready' },
  { id: 'safebooru', name: 'Safebooru', tag: 'SFW Safe' },
  { id: 'gelbooru', name: 'Gelbooru', tag: 'Popular' },
  { id: 'yandere', name: 'Yande.re', tag: 'High-res' },
  { id: 'konachan', name: 'Konachan', tag: 'Wallpapers' },
];

const RATINGS = [
  { id: 'all', label: 'All' },
  { id: 'g', label: 'General' },
  { id: 's', label: 'Sensitive' },
  { id: 'q', label: 'Questionable' },
  { id: 'e', label: 'Explicit' },
];

export const Header: React.FC<HeaderProps> = ({
  engine,
  onEngineChange,
  searchQuery,
  onSearchSubmit,
  ratingFilter,
  onRatingChange,
  sortOrder,
  onSortChange,
  currentTab,
  onTabChange,
  favoritesCount,
  downloadCount,
  activeDownloads,
  onOpenDownloads,
  onOpenSettings,
  isSelectionMode,
  onToggleSelectionMode,
  selectedCount,
}) => {
  const [inputVal, setInputVal] = useState(searchQuery);
  const [engineDropdownOpen, setEngineDropdownOpen] = useState(false);
  const [searchHistoryOpen, setSearchHistoryOpen] = useState(false);
  const [historyList, setHistoryList] = useState<string[]>([]);

  const searchContainerRef = useRef<HTMLDivElement>(null);
  const { suggestions, isOpen: autocompleteOpen, closeSuggestions } = useTagAutocomplete(inputVal, engine);

  useEffect(() => {
    setInputVal(searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    setHistoryList(storageService.getSearchHistory());
  }, []);

  // Handle outside clicks to close autocomplete
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        closeSuggestions();
        setSearchHistoryOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [closeSuggestions]);

  const handleFormSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    closeSuggestions();
    setSearchHistoryOpen(false);
    storageService.addSearchHistory(inputVal);
    setHistoryList(storageService.getSearchHistory());
    onSearchSubmit(inputVal);
  };

  const handleSelectSuggestion = (tagName: string) => {
    // Replace current incomplete word with tag
    const words = inputVal.trim().split(/\s+/);
    words.pop();
    words.push(tagName);
    const updated = words.join(' ') + ' ';
    setInputVal(updated);
    closeSuggestions();
    storageService.addSearchHistory(updated.trim());
    setHistoryList(storageService.getSearchHistory());
    onSearchSubmit(updated.trim());
  };

  const handleSelectHistoryTag = (tag: string) => {
    setInputVal(tag);
    setSearchHistoryOpen(false);
    onSearchSubmit(tag);
  };

  const currentEngineObj = ENGINES.find(e => e.id === engine) || ENGINES[0];

  return (
    <div className="w-full bg-[#13151f]/90 backdrop-blur-md border-b border-[#232738] sticky top-9 z-40 px-4 py-2.5 transition-all">
      <div className="max-w-[1920px] mx-auto flex flex-col gap-2.5">
        {/* Main top row: Brand/Engine, Search, Actions */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          {/* Left: Engine Selector dropdown */}
          <div className="relative">
            <button
              onClick={() => setEngineDropdownOpen(!engineDropdownOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#1c1f2e] hover:bg-[#252a3d] border border-[#2d3247] text-sm font-medium text-gray-200 transition-colors shadow-sm"
            >
              <div className="w-2 h-2 rounded-full bg-pink-500 animate-pulse" />
              <span>{currentEngineObj.name}</span>
              <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
            </button>

            {engineDropdownOpen && (
              <div className="absolute left-0 mt-2 w-56 rounded-xl glass-dropdown p-1.5 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-2.5 py-1 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                  Booru Engine
                </div>
                {ENGINES.map(item => (
                  <button
                    key={item.id}
                    onClick={() => {
                      onEngineChange(item.id);
                      setEngineDropdownOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium transition-colors ${
                      engine === item.id
                        ? 'bg-pink-500/20 text-pink-300 font-semibold border border-pink-500/30'
                        : 'text-gray-300 hover:bg-white/5'
                    }`}
                  >
                    <span>{item.name}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-black/40 text-gray-400">
                      {item.tag}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Center: Search Bar with Autocomplete */}
          <div ref={searchContainerRef} className="relative flex-1 min-w-[280px] max-w-2xl">
            <form onSubmit={handleFormSubmit} className="relative flex items-center">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 pointer-events-none" />
              <input
                type="text"
                value={inputVal}
                onChange={e => setInputVal(e.target.value)}
                onFocus={() => {
                  if (historyList.length > 0 && !inputVal.trim()) {
                    setSearchHistoryOpen(true);
                  }
                }}
                placeholder="Search tags (e.g. hatsune_miku 1girl rating:g)..."
                className="w-full pl-9 pr-16 py-1.5 rounded-xl bg-[#1c1f2e] border border-[#2d3247] focus:border-pink-500/60 focus:ring-1 focus:ring-pink-500/50 text-sm text-gray-100 placeholder-gray-500 outline-none transition-all"
              />

              {inputVal && (
                <button
                  type="button"
                  onClick={() => {
                    setInputVal('');
                    onSearchSubmit('');
                  }}
                  className="absolute right-9 p-1 text-gray-400 hover:text-gray-200 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}

              <button
                type="submit"
                className="absolute right-2 px-2 py-0.5 rounded-md bg-pink-500/20 hover:bg-pink-500/30 text-pink-400 text-xs font-medium border border-pink-500/30 transition-colors"
              >
                Go
              </button>
            </form>

            {/* Tag Autocomplete Dropdown */}
            {autocompleteOpen && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1.5 rounded-xl glass-dropdown p-1.5 shadow-2xl z-50 max-h-72 overflow-y-auto">
                <div className="px-2.5 py-1 text-[11px] font-semibold text-gray-400 flex items-center gap-1">
                  <TagIcon className="w-3 h-3 text-pink-400" />
                  <span>Danbooru Tags Autocomplete</span>
                </div>
                {suggestions.map(tag => {
                  const catName = TAG_CATEGORY_MAP[tag.category] || 'general';
                  const style = TAG_COLOR_MAP[catName];
                  return (
                    <button
                      key={tag.id}
                      onClick={() => handleSelectSuggestion(tag.name)}
                      className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg hover:bg-white/10 text-xs transition-colors group"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono capitalize border ${style.bg} ${style.text} ${style.border}`}>
                          {catName}
                        </span>
                        <span className="text-gray-200 group-hover:text-pink-300 font-medium">
                          {tag.name.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <span className="text-[11px] text-gray-500 group-hover:text-gray-300 font-mono ml-2">
                        {tag.postCount.toLocaleString()}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Recent Searches Dropdown */}
            {searchHistoryOpen && !autocompleteOpen && historyList.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1.5 rounded-xl glass-dropdown p-2 shadow-2xl z-50">
                <div className="flex items-center justify-between px-2 py-1 text-[11px] font-semibold text-gray-400 border-b border-white/5 mb-1">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3 h-3 text-pink-400" />
                    <span>Recent Searches</span>
                  </span>
                  <button
                    onClick={() => {
                      storageService.clearSearchHistory();
                      setHistoryList([]);
                      setSearchHistoryOpen(false);
                    }}
                    className="text-gray-500 hover:text-rose-400 transition-colors text-[10px]"
                  >
                    Clear
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5 p-1 max-h-48 overflow-y-auto">
                  {historyList.map((tag, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSelectHistoryTag(tag)}
                      className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-pink-500/20 text-gray-300 hover:text-pink-300 text-xs border border-white/5 transition-all"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right: Actions (Feed/Favs, Batch Select, Download Manager, Settings) */}
          <div className="flex items-center gap-2">
            {/* Tab: Feed */}
            <button
              onClick={() => onTabChange('feed')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                currentTab === 'feed'
                  ? 'bg-pink-500 text-white shadow-md shadow-pink-500/25'
                  : 'bg-[#1c1f2e] text-gray-300 hover:bg-[#252a3d] border border-[#2d3247]'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Feed</span>
            </button>

            {/* Tab: Favorites */}
            <button
              onClick={() => onTabChange('favorites')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                currentTab === 'favorites'
                  ? 'bg-pink-500 text-white shadow-md shadow-pink-500/25'
                  : 'bg-[#1c1f2e] text-gray-300 hover:bg-[#252a3d] border border-[#2d3247]'
              }`}
            >
              <Heart className={`w-3.5 h-3.5 ${favoritesCount > 0 ? 'text-rose-400 fill-rose-400' : ''}`} />
              <span>Favorites</span>
              {favoritesCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20 font-mono">
                  {favoritesCount}
                </span>
              )}
            </button>

            {/* Selection mode toggle */}
            <button
              onClick={onToggleSelectionMode}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                isSelectionMode
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'bg-[#1c1f2e] text-gray-300 hover:bg-[#252a3d] border border-[#2d3247]'
              }`}
              title="Batch select multiple images to download"
            >
              <CheckSquare className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Select</span>
              {selectedCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20 font-mono">
                  {selectedCount}
                </span>
              )}
            </button>

            {/* Download Manager Drawer button */}
            <button
              onClick={onOpenDownloads}
              className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1c1f2e] hover:bg-[#252a3d] border border-[#2d3247] text-xs font-medium text-gray-200 transition-all"
              title="Download Manager"
            >
              <Download className={`w-3.5 h-3.5 ${activeDownloads > 0 ? 'text-pink-400 animate-bounce' : 'text-gray-400'}`} />
              <span className="hidden sm:inline">Downloads</span>
              {downloadCount > 0 && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${activeDownloads > 0 ? 'bg-pink-500 text-white animate-pulse' : 'bg-gray-700 text-gray-300'}`}>
                  {downloadCount}
                </span>
              )}
            </button>

            {/* Settings button */}
            <button
              onClick={onOpenSettings}
              className="p-1.5 rounded-lg bg-[#1c1f2e] hover:bg-[#252a3d] border border-[#2d3247] text-gray-300 hover:text-white transition-colors"
              title="Settings & Danbooru API Key"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Second row: Quick rating filters & Sort order (if in feed mode) */}
        {currentTab === 'feed' && (
          <div className="flex items-center justify-between gap-2 flex-wrap text-xs pt-1 border-t border-white/5">
            {/* Rating pills */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] text-gray-400 mr-1 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-pink-400" />
                <span>Rating:</span>
              </span>
              {RATINGS.map(r => (
                <button
                  key={r.id}
                  onClick={() => onRatingChange(r.id)}
                  className={`px-2.5 py-0.8 rounded-md text-[11px] font-medium transition-colors ${
                    ratingFilter === r.id
                      ? 'bg-pink-500/25 text-pink-300 border border-pink-500/40 shadow-sm'
                      : 'bg-white/5 text-gray-400 hover:text-gray-200 hover:bg-white/10 border border-transparent'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>

            {/* Sort orders */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-gray-400 flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-amber-400" />
                <span>Sort:</span>
              </span>
              {[
                { id: 'default', label: 'Latest' },
                { id: 'score', label: 'Top Score' },
                { id: 'favcount', label: 'Most Favs' },
                { id: 'rank', label: 'Rank' },
              ].map(s => (
                <button
                  key={s.id}
                  onClick={() => onSortChange(s.id)}
                  className={`px-2 py-0.5 rounded-md text-[11px] font-medium transition-colors ${
                    sortOrder === s.id
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'text-gray-400 hover:text-gray-200'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
