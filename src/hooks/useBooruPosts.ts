import { useState, useEffect, useCallback, useRef } from 'react';
import { BooruEngine, BooruPost } from '../types/booru';
import { booruApiService } from '../services/api';
import { storageService } from '../services/storage';

export function useBooruPosts(
  engine: BooruEngine,
  searchTags: string,
  rating: string,
  order: string = 'default'
) {
  const [posts, setPosts] = useState<BooruPost[]>([]);
  const [page, setPage] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchPosts = useCallback(async (targetPage: number, isInitial: boolean) => {
    if (targetPage === 1) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }
    setError(null);

    try {
      const fetched = await booruApiService.getPosts({
        engine,
        tags: searchTags,
        page: targetPage,
        limit: 30,
        rating,
        order,
      });

      const settings = storageService.getSettings();
      let filtered = fetched;
      if (settings.safeMode) {
        filtered = filtered.filter(p => p.rating === 'g' || p.rating === 's');
      }

      if (isInitial) {
        setPosts(filtered);
      } else {
        setPosts(prev => {
          // Deduplicate by ID
          const existingIds = new Set(prev.map(p => p.id));
          const uniqueNew = filtered.filter(p => !existingIds.has(p.id));
          return [...prev, ...uniqueNew];
        });
      }

      setHasMore(fetched.length >= 20);
      setPage(targetPage);
    } catch (err: any) {
      console.error('Failed to fetch booru posts:', err);
      setError(err.message || 'Failed to fetch posts. Please check your network or API settings.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [engine, searchTags, rating, order]);

  // Initial load and on query change
  useEffect(() => {
    setPosts([]);
    setPage(1);
    setHasMore(true);
    fetchPosts(1, true);
  }, [fetchPosts]);

  const loadMore = useCallback(() => {
    if (!loading && !loadingMore && hasMore) {
      fetchPosts(page + 1, false);
    }
  }, [loading, loadingMore, hasMore, page, fetchPosts]);

  const refresh = useCallback(() => {
    fetchPosts(1, true);
  }, [fetchPosts]);

  return {
    posts,
    loading,
    loadingMore,
    hasMore,
    error,
    loadMore,
    refresh,
  };
}
