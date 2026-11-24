import { useState, useEffect, useRef, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { Header } from './components/Header';
import { DropZone } from './components/DropZone';
import { GlobalSettings } from './components/GlobalSettings';
import { BatchItem } from './components/BatchItem';
import { BatchToolbar } from './components/BatchToolbar';
import { InfoModal } from './components/InfoModal';
import { ConversionVisualizer } from './components/ConversionVisualizer';
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
  const [batchTrackIndex, setBatchTrackIndex] = useState(0);
  const [batchTotalToConvert, setBatchTotalToConvert] = useState(0);

  const cancelRequestedRef = useRef(false);

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

  // Restore saved items from IndexedDB on initial mount
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

            let status = rec.status;
            let progress = rec.progress;
            if (status === 'converting') {
              status = 'idle';
              progress = 0;
              unfinishedCount++;
              dbService
                .saveItem({
                  ...rec,
                  status: 'idle',
                  progress: 0,
                })
                .catch(() => {});
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
              `Restored ${restoredItems.length} file(s) from browser storage. ${unfinishedCount} unfinished task(s) are ready to resume.`
            );
          } else if (completedCount > 0) {
            setRestoredBannerText(
              `Restored ${restoredItems.length} file(s) from browser storage (${completedCount} converted and ready to play or download).`
            );
          } else {
            setRestoredBannerText(
              `Restored ${restoredItems.length} queued file(s) from browser storage.`
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

  // Warn before accidentally refreshing or closing during active conversion
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isConverting) {
        e.preventDefault();
        e.returnValue =
          'Conversion in progress. Reloading or closing now will pause the current extraction.';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isConverting]);

  // Apply selected theme
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

  useEffect(() => {
    if (theme !== 'system') return;
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => {
      document.documentElement.style.colorScheme = e.matches ? 'dark' : 'light';
    };
    media.addEventListener('change', handler);
    return () => media.removeEventListener('change', handler);
  }, [theme]);

  // Pre-load FFmpeg WebAssembly engine
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

    for (const item of newItems) {
      persistItemToStorage(item);
    }

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

  const handleConvertAll = async () => {
    if (isConverting) return;
    const itemsToConvert = items.filter((i) => i.status === 'idle' || i.status === 'error');
    if (itemsToConvert.length === 0) return;

    setIsConverting(true);
    setBatchTotalToConvert(itemsToConvert.length);
    cancelRequestedRef.current = false;

    for (let idx = 0; idx < itemsToConvert.length; idx++) {
      if (cancelRequestedRef.current) break;
      const item = itemsToConvert[idx];
      setBatchTrackIndex(idx + 1);

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

      setItems((current) => current.map((c) => (c.id === item.id ? updated : c)));
    }

    setIsConverting(false);
    setBatchTrackIndex(0);
    setBatchTotalToConvert(0);

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!cancelRequestedRef.current && !prefersReducedMotion) {
      try {
        confetti({
          particleCount: 40,
          spread: 55,
          origin: { y: 0.82 },
          colors: ['#047857', '#34d399', '#141413', '#a7f3d0'],
        });
      } catch {
        // Ignore confetti errors
      }
    }
  };

  const handleRetryItem = async (id: string) => {
    if (isConverting) return;
    const target = items.find((i) => i.id === id);
    if (!target) return;

    setIsConverting(true);
    setBatchTrackIndex(1);
    setBatchTotalToConvert(1);

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
    setBatchTrackIndex(0);
    setBatchTotalToConvert(0);
  };

  const handleCancel = () => {
    cancelRequestedRef.current = true;
    setIsConverting(false);
  };

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

  const activeConvertingItem = items.find((i) => i.status === 'converting') || null;
  const queuedCount = items.filter((i) => i.status === 'idle').length;

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
        {restoredBannerText && items.length > 0 && (
          <div className="restore-banner" role="status" aria-live="polite">
            <div className="restore-banner-msg">
              <CheckCircle2 size={16} className="restore-icon" aria-hidden="true" />
              <span>{restoredBannerText}</span>
            </div>
            <button
              type="button"
              className="banner-dismiss-btn"
              onClick={() => setRestoredBannerText(null)}
              aria-label="Dismiss session restore notice"
            >
              <X size={16} aria-hidden="true" />
            </button>
          </div>
        )}

        {/* Editorial Hero Band */}
        <section className="hero-band">
          <div className="hero-copy">
            <h1 className="hero-title">Extract clean audio from any video.</h1>
            <p className="hero-subtitle">
              Batch convert MP4, MKV, MOV, AVI, or WebM into MP3, WAV, AAC, M4A, FLAC, OGG, or OPUS
              directly inside your browser. No files leave your device.
            </p>
          </div>
          <div className="hero-scale-rule" aria-hidden="true">
            <span className="scale-label">44.1 / 48 kHz</span>
            <span className="scale-ticks" />
            <span className="scale-label">LOCAL WASM</span>
          </div>
        </section>

        {/* Two-Column Editorial Workbench */}
        <div className="workbench-grid">
          <div className="workbench-primary">
            {activeConvertingItem ? (
              <ConversionVisualizer
                activeItem={activeConvertingItem}
                currentIndex={batchTrackIndex || 1}
                totalCount={batchTotalToConvert || 1}
                onCancel={handleCancel}
              />
            ) : (
              <DropZone
                onFilesSelected={handleFilesSelected}
                disabled={isConverting}
                hasFiles={items.length > 0}
              />
            )}
          </div>

          <div className="workbench-secondary">
            <GlobalSettings
              settings={globalSettings}
              onChange={setGlobalSettings}
              onApplyToAll={handleApplyToAll}
              itemsCount={queuedCount}
              disabled={isConverting}
            />
          </div>
        </div>

        {/* Full-Width Batch Queue */}
        {items.length > 0 && (
          <section className="queue-section" aria-label="Batch conversion queue">
            <BatchToolbar
              items={items}
              isConverting={isConverting}
              onConvertAll={handleConvertAll}
              onDownloadZip={handleDownloadZip}
              onClearAll={handleClearAll}
              onCancel={handleCancel}
              isDownloadingZip={isDownloadingZip}
            />

            <div className="queue-list">
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

      <footer className="app-footer">
        <div className="footer-inner">
          <span>AudioExtract · Client-side FFmpeg WebAssembly</span>
          <span>IndexedDB session persistence active</span>
        </div>
      </footer>

      <InfoModal isOpen={isInfoOpen} onClose={() => setIsInfoOpen(false)} />
    </div>
  );
}

export default App;
