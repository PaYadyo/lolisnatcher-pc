import { BooruPost } from '../types/booru';
import { DownloadItem, DownloadStatus } from '../types/download';
import { storageService } from './storage';

type DownloadListener = (items: DownloadItem[]) => void;

class DownloadManager {
  private queue: DownloadItem[] = [];
  private listeners: Set<DownloadListener> = new Set();
  private isProcessing = false;
  private defaultDirectory = '';

  constructor() {
    this.initDefaultFolder();
    this.setupElectronListeners();
  }

  private async initDefaultFolder() {
    if (window.electronAPI) {
      try {
        this.defaultDirectory = await window.electronAPI.getDefaultDownloadPath();
      } catch (e) {
        console.error('Failed to get default download path:', e);
      }
    }
  }

  private setupElectronListeners() {
    if (window.electronAPI) {
      window.electronAPI.onDownloadProgress((data) => {
        const item = this.queue.find(q => q.url === data.url && q.status === 'downloading');
        if (item) {
          item.progress = data.progress;
          item.downloadedBytes = data.downloadedBytes;
          item.totalBytes = data.totalBytes;
          this.notify();
        }
      });
    }
  }

  public subscribe(listener: DownloadListener): () => void {
    this.listeners.add(listener);
    listener([...this.queue]);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    const copy = [...this.queue];
    this.listeners.forEach(fn => fn(copy));
  }

  public getItems(): DownloadItem[] {
    return [...this.queue];
  }

  public getTargetFolder(): string {
    const settings = storageService.getSettings();
    return settings.downloadConfig.downloadFolder || this.defaultDirectory || 'Downloads/LoliSnatcher';
  }

  /**
   * Format filename according to template
   */
  public generateFilename(post: BooruPost, quality: 'original' | 'sample'): string {
    const settings = storageService.getSettings();
    const template = settings.downloadConfig.namingTemplate || '{engine}_{id}_{artist}_{character}';

    const artist = post.tags.artist.length > 0 ? post.tags.artist.join('_') : 'unknown';
    const character = post.tags.character.length > 0 ? post.tags.character.slice(0, 3).join('_') : 'original';
    const copyright = post.tags.copyright.length > 0 ? post.tags.copyright[0] : 'original';

    let ext = post.fileExt || 'jpg';
    if (quality === 'sample' && !post.sampleUrl.endsWith(`.${ext}`)) {
      const match = post.sampleUrl.match(/\.([a-zA-Z0-9]+)(\?|$)/);
      if (match) ext = match[1];
    }

    let filename = template
      .replace(/{id}/g, String(post.id))
      .replace(/{engine}/g, post.engine)
      .replace(/{artist}/g, artist)
      .replace(/{character}/g, character)
      .replace(/{copyright}/g, copyright)
      .replace(/{rating}/g, post.rating)
      .replace(/{score}/g, String(post.score));

    // Sanitize filename
    filename = filename.replace(/[<>:"/\\|?*]+/g, '_').trim();
    if (!filename) filename = `booru_${post.id}`;

    return `${filename}.${ext}`;
  }

  /**
   * Queue a single post for download
   */
  public async downloadPost(post: BooruPost, forceQuality?: 'original' | 'sample'): Promise<string> {
    const settings = storageService.getSettings();
    const quality = forceQuality || settings.downloadConfig.downloadQuality || 'original';
    
    // Choose best URL
    const url = quality === 'original' && post.fileUrl ? post.fileUrl : (post.sampleUrl || post.fileUrl);
    if (!url) {
      throw new Error('No valid download URL available for this post.');
    }

    const filename = this.generateFilename(post, quality);
    const targetFolder = this.getTargetFolder();

    const taskId = `dl_${post.engine}_${post.id}_${Date.now()}`;
    const newItem: DownloadItem = {
      id: taskId,
      postId: post.id,
      url,
      filename,
      targetFolder,
      progress: 0,
      status: 'queued',
      downloadedBytes: 0,
      totalBytes: post.fileSize || 0,
      thumbnailUrl: post.previewUrl,
      timestamp: Date.now(),
    };

    this.queue.unshift(newItem);
    this.notify();
    this.processQueue();

    return taskId;
  }

  /**
   * Batch download multiple posts
   */
  public async downloadBatch(posts: BooruPost[]): Promise<void> {
    for (const post of posts) {
      await this.downloadPost(post);
    }
  }

  /**
   * Process queue with concurrency limit
   */
  private async processQueue() {
    if (this.isProcessing) return;
    this.isProcessing = true;

    const settings = storageService.getSettings();
    const maxConcurrent = settings.downloadConfig.maxConcurrent || 3;

    try {
      while (true) {
        const activeCount = this.queue.filter(i => i.status === 'downloading').length;
        if (activeCount >= maxConcurrent) break;

        const next = this.queue.find(i => i.status === 'queued');
        if (!next) break;

        this.startDownload(next);
      }
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Execute actual download via Electron API or Web browser anchor
   */
  private async startDownload(item: DownloadItem) {
    item.status = 'downloading';
    item.progress = 5;
    this.notify();

    const settings = storageService.getSettings();

    // Prepare auth headers if Danbooru credentials are provided
    const authHeaders: Record<string, string> = {};
    if (settings.danbooruUsername && settings.danbooruApiKey) {
      authHeaders['Authorization'] = `Basic ${btoa(`${settings.danbooruUsername}:${settings.danbooruApiKey}`)}`;
    }

    if (window.electronAPI) {
      try {
        const res = await window.electronAPI.downloadImage({
          url: item.url,
          filename: item.filename,
          targetFolder: item.targetFolder,
          authHeaders,
        });

        if (res.success) {
          item.status = 'completed';
          item.progress = 100;
          item.filePath = res.filePath;
          if (res.fileSize) item.downloadedBytes = res.fileSize;
        } else {
          item.status = 'failed';
          item.error = res.error || 'Download failed';
        }
      } catch (err: any) {
        item.status = 'failed';
        item.error = err.message || 'Error executing download';
      }
    } else {
      // In Browser: fetch blob or trigger anchor download
      try {
        item.progress = 30;
        this.notify();

        // Browser fallback download
        const response = await fetch(item.url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const blob = await response.blob();
        
        item.progress = 80;
        this.notify();

        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = item.filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(blobUrl);

        item.status = 'completed';
        item.progress = 100;
        item.downloadedBytes = blob.size;
      } catch (err: any) {
        item.status = 'failed';
        item.error = err.message || 'Browser download blocked';
      }
    }

    this.notify();
    this.processQueue();
  }

  public clearCompleted() {
    this.queue = this.queue.filter(i => i.status !== 'completed');
    this.notify();
  }

  public retry(taskId: string) {
    const item = this.queue.find(i => i.id === taskId);
    if (item) {
      item.status = 'queued';
      item.progress = 0;
      item.error = undefined;
      this.notify();
      this.processQueue();
    }
  }

  public openFolder(item: DownloadItem) {
    if (window.electronAPI) {
      if (item.filePath) {
        window.electronAPI.showItem(item.filePath);
      } else {
        window.electronAPI.openFolder(item.targetFolder);
      }
    }
  }
}

export const downloadManager = new DownloadManager();
