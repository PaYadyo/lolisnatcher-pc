import { UserSettings, DEFAULT_SETTINGS } from '../types/settings';
import { BooruPost } from '../types/booru';

const SETTINGS_KEY = 'lolisnatcher_user_settings_v1';
const FAVORITES_KEY = 'lolisnatcher_favorites_v1';
const SEARCH_HISTORY_KEY = 'lolisnatcher_search_history_v1';

export const storageService = {
  getSettings(): UserSettings {
    try {
      const data = localStorage.getItem(SETTINGS_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        return {
          ...DEFAULT_SETTINGS,
          ...parsed,
          downloadConfig: {
            ...DEFAULT_SETTINGS.downloadConfig,
            ...(parsed.downloadConfig || {}),
          },
        };
      }
    } catch (e) {
      console.error('Failed to load settings:', e);
    }
    return DEFAULT_SETTINGS;
  },

  saveSettings(settings: UserSettings): void {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch (e) {
      console.error('Failed to save settings:', e);
    }
  },

  getFavorites(): BooruPost[] {
    try {
      const data = localStorage.getItem(FAVORITES_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  saveFavorites(favorites: BooruPost[]): void {
    try {
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
    } catch (e) {
      console.error('Failed to save favorites:', e);
    }
  },

  toggleFavorite(post: BooruPost): boolean {
    const list = this.getFavorites();
    const index = list.findIndex(p => p.id === post.id && p.engine === post.engine);
    let isFav = false;
    if (index >= 0) {
      list.splice(index, 1);
      isFav = false;
    } else {
      list.unshift(post);
      isFav = true;
    }
    this.saveFavorites(list);
    return isFav;
  },

  isFavorite(postId: number | string, engine: string): boolean {
    const list = this.getFavorites();
    return list.some(p => p.id === postId && p.engine === engine);
  },

  getSearchHistory(): string[] {
    try {
      const data = localStorage.getItem(SEARCH_HISTORY_KEY);
      return data ? JSON.parse(data) : ['1girl', 'hatsune_miku', 'original', 'scenery', 'blue_archive'];
    } catch {
      return [];
    }
  },

  addSearchHistory(tag: string): void {
    if (!tag || !tag.trim()) return;
    const clean = tag.trim();
    let history = this.getSearchHistory().filter(t => t.toLowerCase() !== clean.toLowerCase());
    history.unshift(clean);
    history = history.slice(0, 30);
    try {
      localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(history));
    } catch (e) {
      console.error('Failed to save search history:', e);
    }
  },

  clearSearchHistory(): void {
    try {
      localStorage.removeItem(SEARCH_HISTORY_KEY);
    } catch {}
  },
};
