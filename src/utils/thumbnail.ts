export interface VideoMetadata {
  duration: number;
  width?: number;
  height?: number;
  thumbnailUrl?: string;
}

/**
 * Extracts a frame from a video file to use as a preview thumbnail,
 * along with basic metadata (duration, dimensions).
 */
export async function extractVideoMetadata(file: File): Promise<VideoMetadata> {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    const objectUrl = URL.createObjectURL(file);
    video.preload = 'metadata';
    video.src = objectUrl;
    video.muted = true;
    video.playsInline = true;

    // Timeout safety in case video cannot be decoded by native browser player
    const timer = setTimeout(() => {
      URL.revokeObjectURL(objectUrl);
      resolve({
        duration: 0,
      });
    }, 4000);

    video.onloadedmetadata = () => {
      // Seek slightly into video to avoid blank/black opening frames
      const seekTime = Math.min(1.0, video.duration / 2);
      video.currentTime = seekTime;
    };

    video.onseeked = () => {
      clearTimeout(timer);
      try {
        const canvas = document.createElement('canvas');
        const maxDim = 160;
        let w = video.videoWidth || 160;
        let h = video.videoHeight || 90;

        if (w > h) {
          h = Math.round((h * maxDim) / w);
          w = maxDim;
        } else {
          w = Math.round((w * maxDim) / h);
          h = maxDim;
        }

        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, w, h);
          const thumbnailUrl = canvas.toDataURL('image/jpeg', 0.7);
          URL.revokeObjectURL(objectUrl);
          resolve({
            duration: video.duration || 0,
            width: video.videoWidth,
            height: video.videoHeight,
            thumbnailUrl,
          });
          return;
        }
      } catch {
        // Canvas tainted or unsupported
      }

      URL.revokeObjectURL(objectUrl);
      resolve({
        duration: video.duration || 0,
        width: video.videoWidth,
        height: video.videoHeight,
      });
    };

    video.onerror = () => {
      clearTimeout(timer);
      URL.revokeObjectURL(objectUrl);
      // Fallback for formats browser doesn't natively decode (MKV/AVI/etc.)
      resolve({
        duration: 0,
      });
    };
  });
}
