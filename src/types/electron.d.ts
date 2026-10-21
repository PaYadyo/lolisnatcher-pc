export interface DownloadProgressData {
  url: string;
  progress: number;
  downloadedBytes: number;
  totalBytes: number;
}

export interface ElectronDownloadResult {
  success: boolean;
  filePath?: string;
  fileSize?: number;
  error?: string;
}

export interface ElectronFetchResponse<T = any> {
  ok: boolean;
  status: number;
  statusText?: string;
  data?: T;
  error?: string;
}

export interface IElectronAPI {
  isElectron: boolean;
  minimize: () => Promise<void>;
  maximize: () => Promise<boolean>;
  close: () => Promise<void>;
  isMaximized: () => Promise<boolean>;
  onMaximizedChange: (callback: (isMax: boolean) => void) => void;

  selectDirectory: (currentPath?: string) => Promise<string | null>;
  getDefaultDownloadPath: () => Promise<string>;
  openFolder: (folderPath: string) => Promise<boolean>;
  showItem: (filePath: string) => Promise<boolean>;

  downloadImage: (params: {
    url: string;
    filename: string;
    targetFolder: string;
    authHeaders?: Record<string, string>;
  }) => Promise<ElectronDownloadResult>;

  onDownloadProgress: (callback: (data: DownloadProgressData) => void) => () => void;
  fetchBooru: <T = any>(params: { url: string; options?: RequestInit }) => Promise<ElectronFetchResponse<T>>;
}

declare global {
  interface Window {
    electronAPI?: IElectronAPI;
  }
}
