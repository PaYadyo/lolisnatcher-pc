import { BooruEngine, BooruPost, BooruTagItem, PostRating } from '../types/booru';
import { storageService } from './storage';

// Base URLs
const DANBOORU_ORIGIN = 'https://danbooru.donmai.us';
const SAFEBOORU_ORIGIN = 'https://safebooru.donmai.us';
const YANDERE_ORIGIN = 'https://yande.re';
const KONACHAN_ORIGIN = 'https://konachan.net';
const GELBOORU_ORIGIN = 'https://gelbooru.com';

export interface FetchPostsParams {
  engine: BooruEngine;
  tags?: string;
  page?: number;
  limit?: number;
  rating?: string;
  order?: string;
}

export const booruApiService = {
  /**
   * Universal fetch helper handling Electron IPC (no CORS) or Vite proxy in browser
   */
  async request<T>(fullUrl: string, headers: Record<string, string> = {}): Promise<T> {
    if (window.electronAPI) {
      const res = await window.electronAPI.fetchBooru<T>({
        url: fullUrl,
        options: { headers },
      });
      if (!res.ok) {
        throw new Error(res.error || `Request failed with status ${res.status}`);
      }
      return res.data as T;
    }

    // In web browser dev environment, route through Vite proxy
    let proxyUrl = fullUrl;
    if (fullUrl.startsWith(DANBOORU_ORIGIN)) {
      proxyUrl = fullUrl.replace(DANBOORU_ORIGIN, '/danbooru-api');
    } else if (fullUrl.startsWith(SAFEBOORU_ORIGIN)) {
      proxyUrl = fullUrl.replace(SAFEBOORU_ORIGIN, '/safebooru-api');
    } else if (fullUrl.startsWith(YANDERE_ORIGIN)) {
      proxyUrl = fullUrl.replace(YANDERE_ORIGIN, '/yandere-api');
    } else if (fullUrl.startsWith(KONACHAN_ORIGIN)) {
      proxyUrl = fullUrl.replace(KONACHAN_ORIGIN, '/konachan-api');
    }

    const response = await fetch(proxyUrl, {
      headers: {
        'Accept': 'application/json',
        ...headers,
      },
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  },

  /**
   * Fetch posts from selected booru
   */
  async getPosts(params: FetchPostsParams): Promise<BooruPost[]> {
    const { engine, tags = '', page = 1, limit = 30, rating, order } = params;
    const settings = storageService.getSettings();

    // Construct final tags string
    const tagTokens = tags.trim() ? tags.trim().split(/\s+/) : [];
    if (rating && rating !== 'all') {
      tagTokens.push(`rating:${rating}`);
    }
    if (order && order !== 'default') {
      tagTokens.push(`order:${order}`);
    }

    const queryTags = encodeURIComponent(tagTokens.join(' '));

    switch (engine) {
      case 'danbooru':
      case 'safebooru': {
        const origin = engine === 'danbooru' ? DANBOORU_ORIGIN : SAFEBOORU_ORIGIN;
        const queryParams = new URLSearchParams({
          page: String(page),
          limit: String(limit),
        });

        if (tagTokens.length > 0) {
          queryParams.set('tags', tagTokens.join(' '));
        }

        // Apply API Key & Login if available for Danbooru
        const headers: Record<string, string> = {};
        if (engine === 'danbooru' && settings.danbooruUsername && settings.danbooruApiKey) {
          queryParams.set('login', settings.danbooruUsername.trim());
          queryParams.set('api_key', settings.danbooruApiKey.trim());
          // Also set basic auth header for reliability
          const credentials = btoa(`${settings.danbooruUsername.trim()}:${settings.danbooruApiKey.trim()}`);
          headers['Authorization'] = `Basic ${credentials}`;
        }

        const url = `${origin}/posts.json?${queryParams.toString()}`;
        const rawPosts = await this.request<any[]>(url, headers);

        if (!Array.isArray(rawPosts)) return [];

        return rawPosts.map(p => this.normalizeDanbooruPost(p, engine));
      }

      case 'yandere':
      case 'konachan': {
        const origin = engine === 'yandere' ? YANDERE_ORIGIN : KONACHAN_ORIGIN;
        const url = `${origin}/post.json?tags=${queryTags}&page=${page}&limit=${limit}`;
        const rawPosts = await this.request<any[]>(url);
        if (!Array.isArray(rawPosts)) return [];
        return rawPosts.map(p => this.normalizeMoebooruPost(p, engine));
      }

      case 'gelbooru': {
        // Gelbooru json API
        const pid = page - 1;
        const url = `${GELBOORU_ORIGIN}/index.php?page=dapi&s=post&q=index&json=1&tags=${queryTags}&pid=${pid}&limit=${limit}`;
        const res = await this.request<any>(url);
        const posts = res?.post || [];
        if (!Array.isArray(posts)) return [];
        return posts.map(p => this.normalizeGelbooruPost(p));
      }

      default:
        return [];
    }
  },

  /**
   * Search tags autocomplete
   */
  async searchTags(query: string, engine: BooruEngine = 'danbooru'): Promise<BooruTagItem[]> {
    if (!query || query.trim().length === 0) return [];
    const cleanQuery = query.trim().toLowerCase();

    try {
      if (engine === 'danbooru' || engine === 'safebooru') {
        const origin = engine === 'danbooru' ? DANBOORU_ORIGIN : SAFEBOORU_ORIGIN;
        const searchPattern = cleanQuery.includes('*') ? cleanQuery : `*${cleanQuery}*`;
        const url = `${origin}/tags.json?search[name_matches]=${encodeURIComponent(searchPattern)}&search[order]=count&limit=10`;
        const tags = await this.request<any[]>(url);

        if (!Array.isArray(tags)) return [];
        return tags.map(t => ({
          id: t.id,
          name: t.name,
          postCount: t.post_count || 0,
          category: t.category ?? 0,
        }));
      } else {
        // Fallback or Moebooru tag API
        const origin = engine === 'yandere' ? YANDERE_ORIGIN : KONACHAN_ORIGIN;
        const url = `${origin}/tag.json?name=${encodeURIComponent(cleanQuery)}&order=count&limit=10`;
        const tags = await this.request<any[]>(url);
        if (!Array.isArray(tags)) return [];
        return tags.map(t => ({
          id: t.id,
          name: t.name,
          postCount: t.count || 0,
          category: t.type ?? 0,
        }));
      }
    } catch (err) {
      console.warn('Tag autocomplete failed:', err);
      return [];
    }
  },

  /**
   * Fetch single post detail
   */
  async getPostById(id: number | string, engine: BooruEngine = 'danbooru'): Promise<BooruPost | null> {
    try {
      const settings = storageService.getSettings();
      const origin = engine === 'safebooru' ? SAFEBOORU_ORIGIN : DANBOORU_ORIGIN;
      const headers: Record<string, string> = {};
      let url = `${origin}/posts/${id}.json`;
      if (settings.danbooruUsername && settings.danbooruApiKey) {
        url += `?login=${encodeURIComponent(settings.danbooruUsername)}&api_key=${encodeURIComponent(settings.danbooruApiKey)}`;
      }
      const raw = await this.request<any>(url, headers);
      if (raw && raw.id) {
        return this.normalizeDanbooruPost(raw, engine);
      }
    } catch (e) {
      console.error('Failed to get post by id:', e);
    }
    return null;
  },

  /**
   * Normalize Danbooru post format
   */
  normalizeDanbooruPost(p: any, engine: BooruEngine): BooruPost {
    const splitTags = (str?: string) => (str ? str.trim().split(/\s+/).filter(Boolean) : []);

    const artist = splitTags(p.tag_string_artist);
    const character = splitTags(p.tag_string_character);
    const copyright = splitTags(p.tag_string_copyright);
    const general = splitTags(p.tag_string_general);
    const meta = splitTags(p.tag_string_meta);
    const all = splitTags(p.tag_string);

    const variants = p.media_asset?.variants || [];
    const originalVariant = variants.find((v: any) => v.type === 'original');
    const sampleVariant = variants.find((v: any) => v.type === 'sample' || v.type === '720x720');
    const previewVariant = variants.find((v: any) => v.type === '360x360' || v.type === '180x180');

    const fileUrl = p.file_url || originalVariant?.url || p.large_file_url || '';
    const sampleUrl = p.large_file_url || sampleVariant?.url || fileUrl;
    const previewUrl = p.preview_file_url || previewVariant?.url || sampleUrl;

    const width = p.image_width || 1000;
    const height = p.image_height || 1000;

    let rating: PostRating = 'g';
    if (p.rating === 's') rating = 's';
    else if (p.rating === 'q') rating = 'q';
    else if (p.rating === 'e') rating = 'e';

    return {
      id: p.id,
      engine,
      previewUrl,
      sampleUrl,
      fileUrl,
      width,
      height,
      aspectRatio: width / height,
      rating,
      score: p.score ?? 0,
      favCount: p.fav_count ?? 0,
      fileExt: p.file_ext || 'jpg',
      fileSize: p.file_size || 0,
      source: p.source || '',
      createdAt: p.created_at || '',
      tags: {
        artist,
        character,
        copyright,
        general,
        meta,
        all,
      },
      raw: p,
    };
  },

  /**
   * Normalize Moebooru (Yande.re, Konachan) format
   */
  normalizeMoebooruPost(p: any, engine: BooruEngine): BooruPost {
    const all = p.tags ? p.tags.split(/\s+/).filter(Boolean) : [];
    let rating: PostRating = 'g';
    if (p.rating === 's') rating = 's';
    else if (p.rating === 'q') rating = 'q';
    else if (p.rating === 'e') rating = 'e';

    const width = p.width || 1000;
    const height = p.height || 1000;

    return {
      id: p.id,
      engine,
      previewUrl: p.preview_url || p.sample_url || p.file_url,
      sampleUrl: p.sample_url || p.file_url,
      fileUrl: p.file_url,
      width,
      height,
      aspectRatio: width / height,
      rating,
      score: p.score ?? 0,
      favCount: 0,
      fileExt: (p.file_url && p.file_url.split('.').pop()) || 'jpg',
      fileSize: p.file_size || 0,
      source: p.source || '',
      createdAt: p.created_at ? new Date(p.created_at * 1000).toISOString() : '',
      tags: {
        artist: [],
        character: [],
        copyright: [],
        general: all,
        meta: [],
        all,
      },
      raw: p,
    };
  },

  /**
   * Normalize Gelbooru format
   */
  normalizeGelbooruPost(p: any): BooruPost {
    const all = p.tags ? p.tags.split(/\s+/).filter(Boolean) : [];
    let rating: PostRating = 'g';
    if (p.rating === 'sensitive') rating = 's';
    else if (p.rating === 'questionable') rating = 'q';
    else if (p.rating === 'explicit') rating = 'e';

    const width = p.width || 1000;
    const height = p.height || 1000;

    return {
      id: p.id,
      engine: 'gelbooru',
      previewUrl: p.preview_url || p.file_url,
      sampleUrl: p.sample_url || p.file_url,
      fileUrl: p.file_url,
      width,
      height,
      aspectRatio: width / height,
      rating,
      score: p.score ?? 0,
      favCount: 0,
      fileExt: (p.file_url && p.file_url.split('.').pop()) || 'jpg',
      fileSize: 0,
      source: p.source || '',
      createdAt: p.created_at || '',
      tags: {
        artist: [],
        character: [],
        copyright: [],
        general: all,
        meta: [],
        all,
      },
      raw: p,
    };
  },
};
