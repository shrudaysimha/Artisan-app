/**
 * Client-Side Media Compression Utilities for Rural Network Resilience
 * 
 * - Compresses smartphone camera photos (4-15MB) down to < 300KB using WebP & canvas.
 * - Records voice audio in low-bitrate Opus/WebM (24kbps) to produce ~30-50KB audio notes.
 * - Prevents HTTP 413 / timeouts on patchy 3G/edge connections in rural clusters.
 */

/**
 * Format bytes to human readable format (KB, MB)
 */
export function formatBytes(bytes, decimals = 1) {
  if (!bytes || bytes === 0) return "0 B";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

/**
 * Compresses an image file/blob to WebP (with JPEG fallback) constrained to < 300KB.
 * Keeps sufficient visual detail for Vision AI bounding boxes, weave, and chisel marks.
 * 
 * @param {File|Blob} fileOrBlob 
 * @param {Object} options
 * @param {number} options.maxDimension Max width or height in px (default 1280)
 * @param {number} options.maxSizeBytes Target maximum size in bytes (default 300KB)
 * @param {number} options.initialQuality Starting WebP quality 0..1 (default 0.82)
 * @returns {Promise<{file: File, blob: Blob, originalSize: number, compressedSize: number, percentReduction: number, dimensions: {width: number, height: number}, mimeType: string}>}
 */
export async function compressImageToWebP(
  fileOrBlob,
  {
    maxDimension = 1280,
    maxSizeBytes = 300 * 1024, // 300 KB
    initialQuality = 0.82,
  } = {}
) {
  const originalSize = fileOrBlob.size;

  return new Promise((resolve, reject) => {
    // If it's already well under 250KB and in WebP/JPEG, we can still optimize dimensions
    const url = URL.createObjectURL(fileOrBlob);
    const img = new Image();

    img.onload = async () => {
      URL.revokeObjectURL(url);

      try {
        let { width, height } = img;

        // Downscale while preserving aspect ratio
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d", { alpha: false });
        // Enable high quality bicubic smoothing
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";

        // White background for transparent PNG inputs
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        // Helper to convert canvas to blob with specific mime & quality
        const getCanvasBlob = (mime, q) =>
          new Promise((res) => {
            canvas.toBlob((b) => res(b), mime, q);
          });

        let targetMime = "image/webp";
        let quality = initialQuality;
        let blob = await getCanvasBlob(targetMime, quality);

        // Test if browser supports WebP canvas export (Safari < 14 fallback to jpeg)
        if (!blob || blob.type !== "image/webp") {
          targetMime = "image/jpeg";
          blob = await getCanvasBlob(targetMime, quality);
        }

        // Adaptive compression step: if still > maxSizeBytes, reduce quality iteratively
        const minQuality = 0.45;
        while (blob && blob.size > maxSizeBytes && quality > minQuality) {
          quality -= 0.12;
          blob = await getCanvasBlob(targetMime, quality);
        }

        if (!blob) {
          throw new Error("Canvas compression failed to generate blob");
        }

        const extension = targetMime === "image/webp" ? "webp" : "jpg";
        const baseName = (fileOrBlob.name || "craft_photo").replace(/\.[^/.]+$/, "");
        const compressedFile = new File([blob], `${baseName}_rural_opt.${extension}`, {
          type: targetMime,
          lastModified: Date.now(),
        });

        const compressedSize = blob.size;
        const savedBytes = Math.max(0, originalSize - compressedSize);
        const percentReduction = originalSize > 0 
          ? Math.round((savedBytes / originalSize) * 100) 
          : 0;

        resolve({
          file: compressedFile,
          blob,
          originalSize,
          compressedSize,
          savedBytes,
          percentReduction,
          dimensions: { width, height },
          mimeType: targetMime,
        });
      } catch (err) {
        reject(err);
      }
    };

    img.onerror = (err) => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image for client compression: " + err));
    };

    img.src = url;
  });
}

/**
 * Creates an ultra low-bitrate Opus/WebM audio recorder.
 * Encodes audio at 24kbps so a 15-second craft story is under 50KB.
 */
export function createOpusAudioRecorder() {
  let mediaRecorder = null;
  let audioStream = null;
  let chunks = [];
  let startTime = 0;

  return {
    async start() {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Audio recording is not supported on this browser.");
      }

      audioStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1, // Mono audio cuts size by 50%
          sampleRate: 16000, // 16kHz is ideal for speech recognition
          echoCancellation: true,
          noiseSuppression: true,
        },
      });

      // Prefer Opus in WebM (standard for modern browsers), fallback to whatever is supported
      let mimeType = "audio/webm;codecs=opus";
      if (typeof MediaRecorder.isTypeSupported === "function") {
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          if (MediaRecorder.isTypeSupported("audio/webm")) {
            mimeType = "audio/webm";
          } else if (MediaRecorder.isTypeSupported("audio/mp4")) {
            mimeType = "audio/mp4";
          } else {
            mimeType = "";
          }
        }
      }

      const options = mimeType ? { mimeType, audioBitsPerSecond: 24000 } : { audioBitsPerSecond: 24000 };
      mediaRecorder = new MediaRecorder(audioStream, options);
      chunks = [];
      startTime = Date.now();

      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      mediaRecorder.start(250); // Slice every 250ms
      return { mimeType: mediaRecorder.mimeType };
    },

    stop() {
      return new Promise((resolve, reject) => {
        if (!mediaRecorder) {
          return reject(new Error("No active recording found"));
        }

        mediaRecorder.onstop = () => {
          const durationSec = Math.max(1, Math.round((Date.now() - startTime) / 1000));
          const actualMime = mediaRecorder.mimeType || "audio/webm";
          const audioBlob = new Blob(chunks, { type: actualMime });

          // Clean up hardware media stream
          if (audioStream) {
            audioStream.getTracks().forEach((track) => track.stop());
            audioStream = null;
          }

          resolve({
            blob: audioBlob,
            mimeType: actualMime,
            sizeBytes: audioBlob.size,
            durationSec,
          });
        };

        try {
          mediaRecorder.stop();
        } catch (e) {
          reject(e);
        }
      });
    },

    cancel() {
      if (mediaRecorder && mediaRecorder.state !== "inactive") {
        try { mediaRecorder.stop(); } catch (_) {}
      }
      if (audioStream) {
        audioStream.getTracks().forEach((track) => track.stop());
        audioStream = null;
      }
    },
  };
}
