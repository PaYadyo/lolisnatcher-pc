export type DownloadStatus = 'queued' | 'downloading' | 'completed' | 'failed';

export interface DownloadItem {
  id: string; // unique download task id
  postId: number | string;
  url: string;
  filename: string;
  targetFolder: string;
  progress: number;
  status: DownloadStatus;
  downloadedBytes: number;
  totalBytes: number;
  error?: string;
  filePath?: string;
  thumbnailUrl: string;
  timestamp: number;
}

export interface DownloadConfig {
  downloadFolder: string;
  namingTemplate: string;
  downloadQuality: 'original' | 'sample';
  saveTagsAsText: boolean; // creates a companion .txt file with tags
  maxConcurrent: number;
}
