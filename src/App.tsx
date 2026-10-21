import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Titlebar } from './components/Titlebar';
import { Header } from './components/Header';
import { PostGrid } from './components/PostGrid';
import { PostDetailModal } from './components/PostDetailModal';
import { DownloadManagerModal } from './components/DownloadManagerModal';
import { SettingsModal } from './components/SettingsModal';
import { BatchActionBar } from './components/BatchActionBar';
import { FavoritesView } from './components/FavoritesView';
import { BooruEngine, BooruPost } from './types/booru';
import { UserSettings } from './types/settings';
import { useBooruPosts } from './hooks/useBooruPosts';
import { storageService } from './services/storage';
import { downloadManager } from './services/downloader';

export function App() {
  const [settings, setSettings] = useState<UserSettings>(() => storageService.getSettings());
  const [engine, setEngine] = useState<BooruEngine>(settings.defaultEngine || 'danbooru');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [ratingFilter, setRatingFilter] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<string>('default');
  const [currentTab, setCurrentTab] = useState<'feed' | 'favorites'>('feed');

  // Favorites state
  const [favorites, setFavorites] = useState<BooruPost[]>(() => storageService.getFavorites());

  // Detail Modal state
  const [selectedPost, setSelectedPost] = useState<BooruPost | null>(null);

  // Modals
  const [isDownloadsOpen, setIsDownloadsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Download Manager tracking
  const [downloadCount, setDownloadCount] = useState(0);
  const [activeDownloads, setActiveDownloads] = useState(0);

  // Batch Selection Mode
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedPostsMap, setSelectedPostsMap] = useState<Map<string | number, BooruPost>>(new Map());

  // Fetch posts hook
  const { posts, loading, loadingMore, hasMore, error, loadMore, refresh } = useBooruPosts(
    engine,
    searchQuery,
    ratingFilter,
    sortOrder
  );

  // Subscribe to download manager
  useEffect(() => {
    const unsub = downloadManager.subscribe(items => {
      setDownloadCount(items.length);
      setActiveDownloads(items.filter(i => i.status === 'downloading').length);
    });
    return unsub;
  }, []);

  // Sync favorites
  const handleToggleFavorite = useCallback((post: BooruPost) => {
    storageService.toggleFavorite(post);
    setFavorites(storageService.getFavorites());
  }, []);

  // Selection toggle
  const handleToggleSelectPost = useCallback((post: BooruPost) => {
    setSelectedPostsMap(prev => {
      const next = new Map(prev);
      if (next.has(post.id)) {
        next.delete(post.id);
      } else {
        next.set(post.id, post);
      }
      return next;
    });
  }, []);

  const handleSelectAllLoaded = useCallback(() => {
    const next = new Map<string | number, BooruPost>();
    const currentList = currentTab === 'feed' ? posts : favorites;
    currentList.forEach(p => next.set(p.id, p));
    setSelectedPostsMap(next);
  }, [currentTab, posts, favorites]);

  const handleDeselectAll = useCallback(() => {
    setSelectedPostsMap(new Map());
  }, []);

  const handleToggleSelectionMode = useCallback(() => {
    setIsSelectionMode(prev => {
      if (prev) {
        setSelectedPostsMap(new Map());
      }
      return !prev;
    });
  }, []);

  // Next / Previous Post Navigation in Detail Modal
  const activePostList = currentTab === 'feed' ? posts : favorites;
  const currentPostIndex = useMemo(() => {
    if (!selectedPost) return -1;
    return activePostList.findIndex(p => p.id === selectedPost.id && p.engine === selectedPost.engine);
  }, [selectedPost, activePostList]);

  const handleNextPost = useCallback(() => {
    if (currentPostIndex >= 0 && currentPostIndex < activePostList.length - 1) {
      setSelectedPost(activePostList[currentPostIndex + 1]);
    }
  }, [currentPostIndex, activePostList]);

  const handlePrevPost = useCallback(() => {
    if (currentPostIndex > 0) {
      setSelectedPost(activePostList[currentPostIndex - 1]);
    }
  }, [currentPostIndex, activePostList]);

  const handleSearchTagFromDetail = useCallback((tag: string) => {
    setCurrentTab('feed');
    setSearchQuery(tag);
  }, []);

  const selectedPostIds = useMemo(() => new Set(selectedPostsMap.keys()), [selectedPostsMap]);
  const selectedPostsArray = useMemo(() => Array.from(selectedPostsMap.values()), [selectedPostsMap]);

  return (
    <div className="min-h-screen bg-[#0f1015] text-gray-100 flex flex-col selection:bg-pink-500 selection:text-white">
      {/* PC Frameless Custom Titlebar */}
      <Titlebar />

      {/* Main Header with Engine Switcher, Tag Autocomplete Search, and Actions */}
      <Header
        engine={engine}
        onEngineChange={e => {
          setEngine(e);
          setSelectedPostsMap(new Map());
        }}
        searchQuery={searchQuery}
        onSearchSubmit={q => {
          setSearchQuery(q);
          setSelectedPostsMap(new Map());
        }}
        ratingFilter={ratingFilter}
        onRatingChange={r => setRatingFilter(r)}
        sortOrder={sortOrder}
        onSortChange={s => setSortOrder(s)}
        currentTab={currentTab}
        onTabChange={tab => {
          setCurrentTab(tab);
          setSelectedPostsMap(new Map());
        }}
        favoritesCount={favorites.length}
        downloadCount={downloadCount}
        activeDownloads={activeDownloads}
        onOpenDownloads={() => setIsDownloadsOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        isSelectionMode={isSelectionMode}
        onToggleSelectionMode={handleToggleSelectionMode}
        selectedCount={selectedPostsArray.length}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {currentTab === 'feed' ? (
          <PostGrid
            posts={posts}
            loading={loading}
            loadingMore={loadingMore}
            hasMore={hasMore}
            error={error}
            onLoadMore={loadMore}
            onRefresh={refresh}
            favorites={favorites}
            onToggleFavorite={handleToggleFavorite}
            onSelectPost={p => setSelectedPost(p)}
            columnCount={settings.columnCount}
            isSelectionMode={isSelectionMode}
            selectedPostIds={selectedPostIds}
            onToggleSelectPost={handleToggleSelectPost}
            blurExplicit={settings.blurExplicit}
          />
        ) : (
          <FavoritesView
            favorites={favorites}
            onToggleFavorite={handleToggleFavorite}
            onSelectPost={p => setSelectedPost(p)}
            columnCount={settings.columnCount}
            isSelectionMode={isSelectionMode}
            selectedPostIds={selectedPostIds}
            onToggleSelectPost={handleToggleSelectPost}
            blurExplicit={settings.blurExplicit}
            onExploreFeed={() => setCurrentTab('feed')}
          />
        )}
      </main>

      {/* Fullscreen Post Detail Viewer with Zoom/Pan & Animated Tag Sheet */}
      <PostDetailModal
        post={selectedPost}
        onClose={() => setSelectedPost(null)}
        onNext={handleNextPost}
        onPrev={handlePrevPost}
        hasNext={currentPostIndex >= 0 && currentPostIndex < activePostList.length - 1}
        hasPrev={currentPostIndex > 0}
        isFavorite={selectedPost ? storageService.isFavorite(selectedPost.id, selectedPost.engine) : false}
        onToggleFavorite={handleToggleFavorite}
        onSearchTag={handleSearchTagFromDetail}
      />

      {/* Floating Batch Selection Action Bar */}
      <BatchActionBar
        selectedPosts={selectedPostsArray}
        onSelectAll={handleSelectAllLoaded}
        onDeselectAll={handleDeselectAll}
        onCloseSelectionMode={() => {
          setIsSelectionMode(false);
          setSelectedPostsMap(new Map());
        }}
        totalLoaded={activePostList.length}
      />

      {/* Download Manager Modal / Slide-over */}
      <DownloadManagerModal
        isOpen={isDownloadsOpen}
        onClose={() => setIsDownloadsOpen(false)}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* Preferences & Danbooru API Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onSettingsSaved={s => setSettings(s)}
      />
    </div>
  );
}

export default App;
