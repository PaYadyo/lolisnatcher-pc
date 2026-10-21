import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Key,
  Folder,
  Sliders,
  Shield,
  Eye,
  EyeOff,
  Check,
  AlertCircle,
  ExternalLink,
  Sparkles,
  Layers,
  Save,
  HelpCircle
} from 'lucide-react';
import { UserSettings } from '../types/settings';
import { storageService } from '../services/storage';
import { booruApiService } from '../services/api';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSettingsSaved: (settings: UserSettings) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  onSettingsSaved,
}) => {
  const [settings, setSettings] = useState<UserSettings>(() => storageService.getSettings());
  const [showApiKey, setShowApiKey] = useState(false);
  const [activeTab, setActiveTab] = useState<'api' | 'download' | 'appearance'>('api');
  const [testStatus, setTestStatus] = useState<{ loading: boolean; success?: boolean; message?: string }>({
    loading: false,
  });
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSelectDirectory = async () => {
    if (window.electronAPI) {
      const selected = await window.electronAPI.selectDirectory(settings.downloadConfig.downloadFolder);
      if (selected) {
        setSettings(prev => ({
          ...prev,
          downloadConfig: {
            ...prev.downloadConfig,
            downloadFolder: selected,
          },
        }));
      }
    } else {
      alert('Native folder selection is available in the desktop Electron app. In browser mode, files are saved directly to your browser default Downloads folder.');
    }
  };

  const handleTestApi = async () => {
    if (!settings.danbooruUsername || !settings.danbooruApiKey) {
      setTestStatus({
        loading: false,
        success: false,
        message: 'Please provide both Danbooru Username and API Key first.',
      });
      return;
    }

    setTestStatus({ loading: true });
    try {
      const credentials = btoa(`${settings.danbooruUsername.trim()}:${settings.danbooruApiKey.trim()}`);
      const headers = { Authorization: `Basic ${credentials}` };
      const url = `https://danbooru.donmai.us/profile.json?login=${encodeURIComponent(settings.danbooruUsername.trim())}&api_key=${encodeURIComponent(settings.danbooruApiKey.trim())}`;
      
      const res = await booruApiService.request<any>(url, headers);
      if (res && res.name) {
        setTestStatus({
          loading: false,
          success: true,
          message: `Connected successfully as "${res.name}" (Level: ${res.level_string || 'User'})!`,
        });
      } else {
        throw new Error('Invalid response structure');
      }
    } catch (err: any) {
      setTestStatus({
        loading: false,
        success: false,
        message: err.message || 'API connection failed. Please check your credentials.',
      });
    }
  };

  const handleSave = () => {
    storageService.saveSettings(settings);
    onSettingsSaved(settings);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 800);
  };

  const appendTemplateToken = (token: string) => {
    setSettings(prev => ({
      ...prev,
      downloadConfig: {
        ...prev.downloadConfig,
        namingTemplate: `${prev.downloadConfig.namingTemplate}_${token}`,
      },
    }));
  };

  // Preview generated filename
  const getPreviewFilename = () => {
    const tmpl = settings.downloadConfig.namingTemplate || '{engine}_{id}_{artist}_{character}';
    return tmpl
      .replace(/{id}/g, '12423812')
      .replace(/{engine}/g, 'danbooru')
      .replace(/{artist}/g, 'anjohink')
      .replace(/{character}/g, 'hatsune_miku')
      .replace(/{copyright}/g, 'vocaloid')
      .replace(/{rating}/g, 'g')
      .replace(/{score}/g, '42') + '.jpg';
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 select-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-2xl bg-[#141622] border border-[#272d42] rounded-2xl shadow-2xl flex flex-col overflow-hidden max-h-[90vh]"
        >
          {/* Top Bar */}
          <div className="p-4 border-b border-[#24293d] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-pink-500/20 text-pink-400 flex items-center justify-center border border-pink-500/30">
                <Sliders className="w-4 h-4" />
              </div>
              <h2 className="text-base font-semibold text-gray-100">Preferences & API Settings</h2>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="px-4 pt-2 border-b border-[#24293d] flex items-center gap-2">
            {[
              { id: 'api', label: 'Danbooru API Auth', icon: Key },
              { id: 'download', label: 'Download Settings', icon: Folder },
              { id: 'appearance', label: 'View & Filters', icon: Shield },
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold border-b-2 transition-all ${
                    activeTab === tab.id
                      ? 'border-pink-500 text-pink-400'
                      : 'border-transparent text-gray-400 hover:text-gray-200'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Tab Body */}
          <div className="p-5 flex-1 overflow-y-auto space-y-5 text-xs text-gray-300">
            {activeTab === 'api' && (
              <div className="space-y-4">
                <div className="p-3.5 rounded-xl bg-pink-500/10 border border-pink-500/20 text-pink-300 space-y-1.5">
                  <div className="flex items-center gap-1.5 font-semibold text-xs">
                    <Sparkles className="w-4 h-4 text-pink-400" />
                    <span>Why connect your Danbooru API?</span>
                  </div>
                  <p className="text-[11px] text-pink-300/80 leading-relaxed">
                    Connecting your Danbooru account unlocks higher search limits, access to your favorites, high-resolution original file downloads, and removes guest rate-limiting.
                  </p>
                </div>

                {/* Username */}
                <div className="space-y-1.5">
                  <label className="font-semibold text-gray-200">Danbooru Username</label>
                  <input
                    type="text"
                    value={settings.danbooruUsername}
                    onChange={e => setSettings(prev => ({ ...prev, danbooruUsername: e.target.value }))}
                    placeholder="e.g. animefan42"
                    className="w-full px-3 py-2 rounded-xl bg-[#1c1f2e] border border-[#2d3247] text-gray-100 placeholder-gray-500 outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500"
                  />
                </div>

                {/* API Key */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="font-semibold text-gray-200">Danbooru API Key</label>
                    <a
                      href="https://danbooru.donmai.us/profile"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-pink-400 hover:text-pink-300 flex items-center gap-1"
                    >
                      <span>Find your API Key here</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <div className="relative flex items-center">
                    <input
                      type={showApiKey ? 'text' : 'password'}
                      value={settings.danbooruApiKey}
                      onChange={e => setSettings(prev => ({ ...prev, danbooruApiKey: e.target.value }))}
                      placeholder="Paste your Danbooru API Key..."
                      className="w-full px-3 py-2 pr-10 rounded-xl bg-[#1c1f2e] border border-[#2d3247] text-gray-100 placeholder-gray-500 outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="absolute right-3 text-gray-400 hover:text-gray-200"
                    >
                      {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Test Connection Button */}
                <div className="pt-2">
                  <button
                    onClick={handleTestApi}
                    disabled={testStatus.loading}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#222638] hover:bg-[#2b3047] border border-[#343b56] text-gray-200 text-xs font-semibold transition-colors"
                  >
                    <Key className="w-3.5 h-3.5 text-pink-400" />
                    <span>{testStatus.loading ? 'Testing...' : 'Test API Connection'}</span>
                  </button>

                  {testStatus.message && (
                    <div
                      className={`mt-2.5 p-2.5 rounded-lg text-xs flex items-center gap-2 border ${
                        testStatus.success
                          ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                          : 'bg-rose-500/10 text-rose-300 border-rose-500/20'
                      }`}
                    >
                      {testStatus.success ? (
                        <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                      )}
                      <span>{testStatus.message}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'download' && (
              <div className="space-y-4">
                {/* Download Folder */}
                <div className="space-y-1.5">
                  <label className="font-semibold text-gray-200">Download Directory</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={settings.downloadConfig.downloadFolder || 'Default (Pictures/LoliSnatcher)'}
                      className="flex-1 px-3 py-2 rounded-xl bg-[#1c1f2e] border border-[#2d3247] text-gray-300 font-mono text-xs"
                    />
                    <button
                      onClick={handleSelectDirectory}
                      className="px-3.5 py-2 rounded-xl bg-[#222638] hover:bg-[#2b3047] border border-[#343b56] text-gray-200 font-semibold transition-colors flex items-center gap-1.5 shrink-0"
                    >
                      <Folder className="w-3.5 h-3.5 text-pink-400" />
                      <span>Browse...</span>
                    </button>
                  </div>
                </div>

                {/* Filename Formatting Template */}
                <div className="space-y-2">
                  <label className="font-semibold text-gray-200">Filename Formatting Template</label>
                  <input
                    type="text"
                    value={settings.downloadConfig.namingTemplate}
                    onChange={e =>
                      setSettings(prev => ({
                        ...prev,
                        downloadConfig: {
                          ...prev.downloadConfig,
                          namingTemplate: e.target.value,
                        },
                      }))
                    }
                    className="w-full px-3 py-2 rounded-xl bg-[#1c1f2e] border border-[#2d3247] text-gray-100 font-mono text-xs outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500"
                  />

                  {/* Token helper chips */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[11px] text-gray-400 mr-1">Insert token:</span>
                    {['{id}', '{artist}', '{character}', '{copyright}', '{rating}', '{score}'].map(t => (
                      <button
                        key={t}
                        onClick={() => appendTemplateToken(t)}
                        className="px-2 py-0.5 rounded-md bg-white/5 hover:bg-pink-500/20 text-gray-300 hover:text-pink-300 text-[11px] font-mono border border-white/5 transition-colors"
                      >
                        {t}
                      </button>
                    ))}
                  </div>

                  {/* Filename Live Preview */}
                  <div className="p-2.5 rounded-lg bg-[#181a26] border border-white/5 text-[11px]">
                    <span className="text-gray-500 block mb-0.5">Example filename preview:</span>
                    <span className="font-mono text-pink-400 break-all">{getPreviewFilename()}</span>
                  </div>
                </div>

                {/* Default Download Quality */}
                <div className="space-y-1.5">
                  <label className="font-semibold text-gray-200">Default Download Quality</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() =>
                        setSettings(prev => ({
                          ...prev,
                          downloadConfig: { ...prev.downloadConfig, downloadQuality: 'original' },
                        }))
                      }
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        settings.downloadConfig.downloadQuality === 'original'
                          ? 'bg-pink-500/20 border-pink-500/40 text-pink-300'
                          : 'bg-[#1c1f2e] border-[#2d3247] text-gray-400 hover:bg-[#222638]'
                      }`}
                    >
                      <div className="font-semibold text-xs">Original Resolution</div>
                      <div className="text-[10px] text-gray-400 mt-0.5">Highest quality, uncompressed file</div>
                    </button>

                    <button
                      onClick={() =>
                        setSettings(prev => ({
                          ...prev,
                          downloadConfig: { ...prev.downloadConfig, downloadQuality: 'sample' },
                        }))
                      }
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        settings.downloadConfig.downloadQuality === 'sample'
                          ? 'bg-pink-500/20 border-pink-500/40 text-pink-300'
                          : 'bg-[#1c1f2e] border-[#2d3247] text-gray-400 hover:bg-[#222638]'
                      }`}
                    >
                      <div className="font-semibold text-xs">Sample Resolution</div>
                      <div className="text-[10px] text-gray-400 mt-0.5">Faster download, smaller file size</div>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'appearance' && (
              <div className="space-y-4">
                {/* Column Count */}
                <div className="space-y-1.5">
                  <label className="font-semibold text-gray-200">Grid Column Count</label>
                  <div className="grid grid-cols-6 gap-1.5">
                    {[
                      { val: 0, label: 'Auto' },
                      { val: 2, label: '2' },
                      { val: 3, label: '3' },
                      { val: 4, label: '4' },
                      { val: 5, label: '5' },
                      { val: 6, label: '6' },
                    ].map(col => (
                      <button
                        key={col.val}
                        onClick={() => setSettings(prev => ({ ...prev, columnCount: col.val }))}
                        className={`py-2 rounded-xl border text-xs font-semibold transition-all ${
                          settings.columnCount === col.val
                            ? 'bg-pink-500/20 border-pink-500/40 text-pink-300'
                            : 'bg-[#1c1f2e] border-[#2d3247] text-gray-400 hover:bg-[#222638]'
                        }`}
                      >
                        {col.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Safe Mode Toggle */}
                <div className="p-3 rounded-xl bg-[#1c1f2e] border border-[#2d3247] flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-xs text-gray-200">Safe Mode (SFW Only)</div>
                    <div className="text-[11px] text-gray-400">Hide Questionable and Explicit content completely</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.safeMode}
                    onChange={e => setSettings(prev => ({ ...prev, safeMode: e.target.checked }))}
                    className="w-4 h-4 accent-pink-500 cursor-pointer"
                  />
                </div>

                {/* Blur Explicit Toggle */}
                <div className="p-3 rounded-xl bg-[#1c1f2e] border border-[#2d3247] flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-xs text-gray-200">Blur Explicit Thumbnails</div>
                    <div className="text-[11px] text-gray-400">Blurs sensitive thumbnails in the feed until opened</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.blurExplicit}
                    onChange={e => setSettings(prev => ({ ...prev, blurExplicit: e.target.checked }))}
                    className="w-4 h-4 accent-pink-500 cursor-pointer"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Bottom Actions */}
          <div className="p-4 border-t border-[#24293d] flex items-center justify-end gap-2 bg-[#12141e]">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 text-xs font-semibold transition-colors"
            >
              Cancel
            </button>

            <button
              onClick={handleSave}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-pink-500 hover:bg-pink-600 text-white text-xs font-semibold shadow-lg shadow-pink-500/25 transition-all"
            >
              {savedSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                  <span>Saved!</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Preferences</span>
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
