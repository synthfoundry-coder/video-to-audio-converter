import { useState, useEffect, useRef, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { Header } from './components/Header';
import { DropZone } from './components/DropZone';
import { GlobalSettings } from './components/GlobalSettings';
import { BatchItem } from './components/BatchItem';
import { BatchToolbar } from './components/BatchToolbar';
import { InfoModal } from './components/InfoModal';
import { BatchItemData, ConversionSettings, AudioFormat, AudioBitrate } from './types';
import { ffmpegService } from './services/ffmpegService';
import { extractVideoMetadata } from './utils/thumbnail';
import { downloadBatchAsZip } from './services/zipService';
import { getBaseFileName, FORMAT_OPTIONS } from './utils/formatters';
import { dbService, PersistedItemRecord } from './services/dbService';
import { CheckCircle2, X } from 'lucide-react';

const DEFAULT_SETTINGS: ConversionSettings = {
  format: 'mp3',
  bitrate: '256k',
  sampleRate: 'original',
  channels: 'original',
  volume: '1.0',
};

export function App() {
  const [items, setItems] = useState<BatchItemData[]>([]);
  const [globalSettings, setGlobalSettings] = useState<ConversionSettings>(DEFAULT_SETTINGS);
  const [isConverting, setIsConverting] = useState(false);
  const [isDownloadingZip, setIsDownloadingZip] = useState(false);
  const [engineStatus, setEngineStatus] = useState({ isLoaded: false, isLoading: false });
  const [theme, setTheme] = useState<'system' | 'dark' | 'light'>(() => {
    const saved = localStorage.getItem('audioextract_theme') as 'system' | 'dark' | 'light' | null;
    return saved || 'system';
  });
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [restoredBannerText, setRestoredBannerText] = useState<string | null>(null);

  const cancelRequestedRef = useRef(false);

  // Helper to persist an item to IndexedDB
  const persistItemToStorage = useCallback(async (item: BatchItemData) => {
    try {
      const record: PersistedItemRecord = {
        id: item.id,
        name: item.name,
        size: item.size,
        duration: item.duration,
        thumbnailUrl: item.thumbnailUrl,
        width: item.width,
        height: item.height,
        settings: item.settings,
        status: item.status,
        progress: item.progress,
        errorMessage: item.errorMessage,
        convertedBlob: item.convertedBlob,
        convertedSize: item.convertedSize,
        outputFileName: item.outputFileName,
        originalFileBlob: item.file,
        createdAt: item.createdAt,
      };
      await dbService.saveItem(record);
    } catch (err) {
      console.warn('Failed to persist item to IndexedDB:', err);
    }
  }, []);

  // 1. Initial Load: Restore items from IndexedDB
  useEffect(() => {
    let isMounted = true;
    dbService
      .getAllItems()
      .then((records) => {
        if (!isMounted) return;
        if (records && records.length > 0) {
          let unfinishedCount = 0;
          let completedCount = 0;

          const restoredItems: BatchItemData[] = records.map((rec) => {
            const file = new File([rec.originalFileBlob], rec.name, {
              type: rec.originalFileBlob.type || 'video/mp4',
              lastModified: rec.createdAt,
            });

            let convertedUrl: string | undefined;
            if (rec.convertedBlob) {
              convertedUrl = URL.createObjectURL(rec.convertedBlob);
              completedCount++;
            }

            // If a file was in the middle of converting when refreshed, restore to idle
            let status = rec.status;
            let progress = rec.progress;
            if (status === 'converting') {
              status = 'idle';
              progress = 0;
              unfinishedCount++;
              // Update in database to clean idle state
              dbService.saveItem({
                ...rec,
                status: 'idle',
                progress: 0,
              }).catch(() => {});
            }

            return {
              id: rec.id,
              file,
              name: rec.name,
              size: rec.size,
              duration: rec.duration,
              thumbnailUrl: rec.thumbnailUrl,
              width: rec.width,
              height: rec.height,
              settings: rec.settings,
              status,
              progress,
              errorMessage: rec.errorMessage,
              convertedBlob: rec.convertedBlob,
              convertedUrl,
              convertedSize: rec.convertedSize,
              outputFileName: rec.outputFileName,
              createdAt: rec.createdAt,
            };
          });

          setItems(restoredItems);

          if (unfinishedCount > 0) {
            setRestoredBannerText(
              `Restored ${restoredItems.length} file(s) across browser refresh. ${unfinishedCount} unfinished task(s) are ready to resume.`
            );
          } else if (completedCount > 0) {
            setRestoredBannerText(
              `Restored ${restoredItems.length} file(s) across browser refresh (${completedCount} already converted & ready to play/download).`
            );
          } else {
            setRestoredBannerText(
              `Restored ${restoredItems.length} queued file(s) across browser refresh.`
            );
          }
        }
      })
      .catch((err) => {
        console.warn('Failed to load items from IndexedDB:', err);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Prevent accidental browser close/refresh during active conversion
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isConverting) {
        e.preventDefault();
        e.returnValue = 'Conversion in progress. If you leave or reload, active processing will be interrupted.';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isConverting]);

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'system') {
      root.removeAttribute('data-theme');
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.style.colorScheme = prefersDark ? 'dark' : 'light';
    } else {
      root.setAttribute('data-theme', theme);
      root.style.colorScheme = theme;
    }
    localStorage.setItem('audioextract_theme', theme);
  }, [theme]);

  // Listen to system theme changes when in 'system' mode
  useEffect(() => {
    if (theme !== 'system') return;
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => {
      document.documentElement.style.colorScheme = e.matches ? 'dark' : 'light';
    };
    media.addEventListener('change', handler);
    return () => media.removeEventListener('change', handler);
  }, [theme]);

  // Pre-load FFmpeg WebAssembly in the background
  useEffect(() => {
    let isMounted = true;
    setEngineStatus({ isLoaded: false, isLoading: true });

    ffmpegService
      .init()
      .then((ready) => {
        if (isMounted) {
          setEngineStatus({ isLoaded: ready, isLoading: false });
        }
      })
      .catch(() => {
        if (isMounted) {
          setEngineStatus({ isLoaded: false, isLoading: false });
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Handle file addition
  const handleFilesSelected = async (newFiles: File[]) => {
    if (newFiles.length === 0) return;

    const timestamp = Date.now();
    const newItems: BatchItemData[] = newFiles.map((file, idx) => {
      const id = `${timestamp}-${idx}-${Math.random().toString(36).substring(2, 7)}`;
      return {
        id,
        file,
        name: file.name,
        size: file.size,
        duration: 0,
        settings: { ...globalSettings },
        status: 'idle',
        progress: 0,
        createdAt: timestamp + idx,
      };
    });

    setItems((prev) => [...prev, ...newItems]);

    // Save initial items immediately to IndexedDB
    for (const item of newItems) {
      persistItemToStorage(item);
    }

    // Extract metadata & thumbnails in parallel
    for (const item of newItems) {
      extractVideoMetadata(item.file).then((meta) => {
        setItems((current) =>
          current.map((curr) => {
            if (curr.id === item.id) {
              const updated = {
                ...curr,
                duration: meta.duration,
                width: meta.width,
                height: meta.height,
                thumbnailUrl: meta.thumbnailUrl,
              };
              persistItemToStorage(updated);
              return updated;
            }
            return curr;
          })
        );
      });
    }
  };

  // Remove individual item from queue and storage
  const handleRemoveItem = (id: string) => {
    setItems((prev) => {
      const target = prev.find((item) => item.id === id);
      if (target?.convertedUrl) {
        URL.revokeObjectURL(target.convertedUrl);
      }
      return prev.filter((item) => item.id !== id);
    });
    dbService.deleteItem(id).catch(console.error);
  };

  // Clear entire queue and storage
  const handleClearAll = () => {
    if (isConverting) return;
    items.forEach((item) => {
      if (item.convertedUrl) {
        URL.revokeObjectURL(item.convertedUrl);
      }
    });
    setItems([]);
    setRestoredBannerText(null);
    dbService.clearAll().catch(console.error);
  };

  // Apply current global settings to all queued items
  const handleApplyToAll = () => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.status === 'idle') {
          const updated = {
            ...item,
            settings: { ...globalSettings },
          };
          persistItemToStorage(updated);
          return updated;
        }
        return item;
      })
    );
  };

  // Update settings for an individual file
  const handleUpdateItemSettings = (id: string, format: AudioFormat, bitrate: AudioBitrate) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const updated = {
            ...item,
            settings: {
              ...item.settings,
              format,
              bitrate,
            },
          };
          persistItemToStorage(updated);
          return updated;
        }
        return item;
      })
    );
  };

  // Convert a single item
  const convertSingleItem = useCallback(
    async (item: BatchItemData): Promise<BatchItemData> => {
      const baseName = getBaseFileName(item.name);
      const formatMeta =
        FORMAT_OPTIONS.find((f) => f.id === item.settings.format) || FORMAT_OPTIONS[0];
      const outputFileName = `${baseName}${formatMeta.extension}`;

      try {
        const blob = await ffmpegService.convertVideoToAudio(
          item.file,
          item.settings,
          item.duration,
          (progress) => {
            setItems((current) =>
              current.map((curr) => (curr.id === item.id ? { ...curr, progress } : curr))
            );
          }
        );

        const convertedUrl = URL.createObjectURL(blob);

        const completedItem: BatchItemData = {
          ...item,
          status: 'completed',
          progress: 100,
          convertedBlob: blob,
          convertedUrl,
          convertedSize: blob.size,
          outputFileName,
          errorMessage: undefined,
        };

        await persistItemToStorage(completedItem);
        return completedItem;
      } catch (err: unknown) {
        console.error(`Error converting ${item.name}:`, err);
        const message = err instanceof Error ? err.message : 'Conversion failed.';
        const failedItem: BatchItemData = {
          ...item,
          status: 'error',
          progress: 0,
          errorMessage: message,
        };
        await persistItemToStorage(failedItem);
        return failedItem;
      }
    },
    [persistItemToStorage]
  );

  // Convert all queued items sequentially
  const handleConvertAll = async () => {
    if (isConverting) return;
    const itemsToConvert = items.filter((i) => i.status === 'idle' || i.status === 'error');
    if (itemsToConvert.length === 0) return;

    setIsConverting(true);
    cancelRequestedRef.current = false;

    for (const item of itemsToConvert) {
      if (cancelRequestedRef.current) break;

      // Mark current as converting in state and storage
      const convertingState: BatchItemData = {
        ...item,
        status: 'converting',
        progress: 5,
        errorMessage: undefined,
      };

      setItems((current) =>
        current.map((c) => (c.id === item.id ? convertingState : c))
      );
      persistItemToStorage(convertingState);

      const updated = await convertSingleItem(item);

      setItems((current) =>
        current.map((c) => (c.id === item.id ? updated : c))
      );
    }

    setIsConverting(false);

    // If all finished successfully, celebrate!
    const allDone = items.every(
      (item) => item.status === 'completed' || itemsToConvert.find((i) => i.id === item.id)
    );
    if (!cancelRequestedRef.current && allDone) {
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.8 },
          colors: ['#3b82f6', '#10b981', '#6366f1', '#f59e0b'],
        });
      } catch {
        // Safe ignore
      }
    }
  };

  // Retry an individual failed item
  const handleRetryItem = async (id: string) => {
    if (isConverting) return;
    const target = items.find((i) => i.id === id);
    if (!target) return;

    setIsConverting(true);
    const convertingState: BatchItemData = {
      ...target,
      status: 'converting',
      progress: 5,
      errorMessage: undefined,
    };
    setItems((current) => current.map((c) => (c.id === id ? convertingState : c)));
    persistItemToStorage(convertingState);

    const updated = await convertSingleItem(target);
    setItems((current) => current.map((c) => (c.id === id ? updated : c)));
    setIsConverting(false);
  };

  // Cancel conversion
  const handleCancel = () => {
    cancelRequestedRef.current = true;
    setIsConverting(false);
  };

  // Download all converted files as ZIP
  const handleDownloadZip = async () => {
    setIsDownloadingZip(true);
    try {
      await downloadBatchAsZip(items, 'audio_extracted_batch.zip');
    } catch (err: unknown) {
      console.error('ZIP packaging failed:', err);
      alert('Failed to package ZIP. You can still download files individually.');
    } finally {
      setIsDownloadingZip(false);
    }
  };

  return (
    <div className="app-shell">
      <Header
        theme={theme}
        onThemeChange={setTheme}
        engineStatus={engineStatus}
        onOpenInfo={() => setIsInfoOpen(true)}
        itemsCount={items.length}
      />

      <main className="app-main">
        {/* Restored items notice */}
        {restoredBannerText && items.length > 0 && (
          <div className="restore-notification-banner" role="status" aria-live="polite">
            <div className="restore-banner-content">
              <CheckCircle2 size={16} className="restore-banner-icon" />
              <span>{restoredBannerText}</span>
            </div>
            <button
              type="button"
              className="btn-close-banner"
              onClick={() => setRestoredBannerText(null)}
              aria-label="Dismiss restore notice"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* Hero Section */}
        <div className="hero-banner">
          <h1 className="hero-heading">Instant Video to Audio Converter</h1>
          <p className="hero-lead">
            Extract studio-grade audio from any video container right inside your browser. No
            uploads, no servers, limitless batch processing.
          </p>
        </div>

        {/* Global Format & Settings Controller */}
        <GlobalSettings
          settings={globalSettings}
          onChange={setGlobalSettings}
          onApplyToAll={handleApplyToAll}
          itemsCount={items.filter((i) => i.status === 'idle').length}
          disabled={isConverting}
        />

        {/* Drag and Drop Zone */}
        <DropZone
          onFilesSelected={handleFilesSelected}
          disabled={isConverting}
          hasFiles={items.length > 0}
        />

        {/* Batch Queue Section */}
        {items.length > 0 && (
          <section className="batch-section" aria-label="Batch Conversion Queue">
            <BatchToolbar
              items={items}
              isConverting={isConverting}
              onConvertAll={handleConvertAll}
              onDownloadZip={handleDownloadZip}
              onClearAll={handleClearAll}
              onCancel={handleCancel}
              isDownloadingZip={isDownloadingZip}
            />

            <div className="batch-list">
              {items.map((item) => (
                <BatchItem
                  key={item.id}
                  item={item}
                  onRemove={handleRemoveItem}
                  onUpdateSettings={handleUpdateItemSettings}
                  onRetry={handleRetryItem}
                  isConvertingAny={isConverting}
                />
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="app-footer">
        <p className="footer-note">
          AudioExtract Pro • Powered by WebAssembly &amp; FFmpeg Core • Persistent Local IndexedDB Storage
        </p>
      </footer>

      {/* Info & Help Dialog */}
      <InfoModal isOpen={isInfoOpen} onClose={() => setIsInfoOpen(false)} />
    </div>
  );
}

export default App;
