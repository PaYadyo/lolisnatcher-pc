import { BooruEngine } from './booru';
import { DownloadConfig } from './download';

export interface UserSettings {
  danbooruUsername: string;
  danbooruApiKey: string;
  defaultEngine: BooruEngine;
  previewQuality: 'sample' | 'original';
  columnCount: number; // 0 = dynamic responsive, 2, 3, 4, 5, 6
  safeMode: boolean;
  blurExplicit: boolean;
  downloadConfig: DownloadConfig;
}

export const DEFAULT_SETTINGS: UserSettings = {
  danbooruUsername: '',
  danbooruApiKey: '',
  defaultEngine: 'danbooru',
  previewQuality: 'sample',
  columnCount: 4,
  safeMode: false,
  blurExplicit: false,
  downloadConfig: {
    downloadFolder: '',
    namingTemplate: '{engine}_{id}_{artist}_{character}',
    downloadQuality: 'original',
    saveTagsAsText: false,
    maxConcurrent: 3,
  },
};
