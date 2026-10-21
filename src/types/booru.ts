export type BooruEngine = 'danbooru' | 'safebooru' | 'yandere' | 'konachan' | 'gelbooru';

export type PostRating = 'g' | 's' | 'q' | 'e';

export interface BooruTagGroups {
  artist: string[];
  character: string[];
  copyright: string[];
  general: string[];
  meta: string[];
  all: string[];
}

export interface BooruPost {
  id: number | string;
  engine: BooruEngine;
  previewUrl: string;
  sampleUrl: string;
  fileUrl: string;
  width: number;
  height: number;
  aspectRatio: number;
  rating: PostRating;
  score: number;
  favCount: number;
  fileExt: string;
  fileSize: number;
  source?: string;
  createdAt: string;
  tags: BooruTagGroups;
  raw?: any;
}

export interface BooruTagItem {
  id: number;
  name: string;
  postCount: number;
  category: number; // 0=general, 1=artist, 3=copyright, 4=character, 5=meta
}

export type TagCategoryName = 'artist' | 'copyright' | 'character' | 'general' | 'meta';

export const TAG_CATEGORY_MAP: Record<number, TagCategoryName> = {
  0: 'general',
  1: 'artist',
  3: 'copyright',
  4: 'character',
  5: 'meta',
};

export const TAG_COLOR_MAP: Record<TagCategoryName, {
  bg: string;
  text: string;
  border: string;
  badge: string;
}> = {
  artist: {
    bg: 'bg-rose-500/15',
    text: 'text-rose-400',
    border: 'border-rose-500/30',
    badge: 'bg-rose-500 text-white',
  },
  copyright: {
    bg: 'bg-purple-500/15',
    text: 'text-purple-400',
    border: 'border-purple-500/30',
    badge: 'bg-purple-500 text-white',
  },
  character: {
    bg: 'bg-emerald-500/15',
    text: 'text-emerald-400',
    border: 'border-emerald-500/30',
    badge: 'bg-emerald-500 text-white',
  },
  general: {
    bg: 'bg-sky-500/15',
    text: 'text-sky-400',
    border: 'border-sky-500/30',
    badge: 'bg-sky-500 text-white',
  },
  meta: {
    bg: 'bg-amber-500/15',
    text: 'text-amber-400',
    border: 'border-amber-500/30',
    badge: 'bg-amber-500 text-white',
  },
};
