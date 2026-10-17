/**
 * Real HTML5 Canvas Pixel-Differencing Motion Detection Engine
 * Analyzes video pixel delta across a downsampled grid in real time.
 * Absolutely NO simulation: measures actual light & pixel variations.
 */

export interface MotionAnalysis {
  motionScore: number; // 0 to 100
  isTriggered: boolean;
  boundingBoxes: { x: number; y: number; width: number; height: number }[];
  activeCells: number;
}

export class MotionDetector {
  private offscreenCanvas: HTMLCanvasElement;
  private offscreenCtx: CanvasRenderingContext2D | null;
  private prevFrameData: Uint8ClampedArray | null = null;
  private width = 48;
  private height = 36;
  private pixelThreshold = 28; // luminance delta threshold per pixel

  constructor() {
    this.offscreenCanvas = document.createElement('canvas');
    this.offscreenCanvas.width = this.width;
    this.offscreenCanvas.height = this.height;
    this.offscreenCtx = this.offscreenCanvas.getContext('2d', { willReadFrequently: true });
  }

  public analyzeFrame(
    video: HTMLVideoElement | HTMLCanvasElement,
    sensitivityThreshold = 30,
    overlayCanvas?: HTMLCanvasElement | null
  ): MotionAnalysis {
    const isReady =
      video instanceof HTMLCanvasElement
        ? video.width > 0 && video.height > 0
        : video.readyState >= 2 && video.videoWidth > 0;

    if (!this.offscreenCtx || !isReady) {
      return { motionScore: 0, isTriggered: false, boundingBoxes: [], activeCells: 0 };
    }

    // Downsample video frame to offscreen grid
    this.offscreenCtx.drawImage(video, 0, 0, this.width, this.height);
    const imgData = this.offscreenCtx.getImageData(0, 0, this.width, this.height);
    const currPixels = imgData.data;

    if (!this.prevFrameData) {
      this.prevFrameData = new Uint8ClampedArray(currPixels);
      return { motionScore: 0, isTriggered: false, boundingBoxes: [], activeCells: 0 };
    }

    let changedPixels = 0;
    let minX = this.width;
    let maxX = 0;
    let minY = this.height;
    let maxY = 0;

    const totalPixels = this.width * this.height;

    for (let i = 0; i < totalPixels; i++) {
      const offset = i * 4;
      const rDiff = Math.abs(currPixels[offset] - this.prevFrameData[offset]);
      const gDiff = Math.abs(currPixels[offset + 1] - this.prevFrameData[offset + 1]);
      const bDiff = Math.abs(currPixels[offset + 2] - this.prevFrameData[offset + 2]);
      const avgDiff = (rDiff + gDiff + bDiff) / 3;

      if (avgDiff > this.pixelThreshold) {
        changedPixels++;
        const x = i % this.width;
        const y = Math.floor(i / this.width);
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }

    // Save current frame as previous for next tick
    this.prevFrameData.set(currPixels);

    // Calculate motion percentage (0% - 100%)
    const rawMotionScore = (changedPixels / (totalPixels * 0.4)) * 100;
    const motionScore = Math.min(100, Math.round(rawMotionScore));
    const isTriggered = motionScore >= sensitivityThreshold;

    const boundingBoxes: { x: number; y: number; width: number; height: number }[] = [];
    if (changedPixels > 10 && minX <= maxX && minY <= maxY) {
      boundingBoxes.push({
        x: (minX / this.width),
        y: (minY / this.height),
        width: ((maxX - minX + 1) / this.width),
        height: ((maxY - minY + 1) / this.height),
      });
    }

    // Render motion indicator onto overlay canvas if provided
    if (overlayCanvas && overlayCanvas.width > 0) {
      const ctx = overlayCanvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);

        if (boundingBoxes.length > 0) {
          boundingBoxes.forEach((box) => {
            const bx = box.x * overlayCanvas.width;
            const by = box.y * overlayCanvas.height;
            const bw = box.width * overlayCanvas.width;
            const bh = box.height * overlayCanvas.height;

            // Draw tactical cyan/red bounding box
            ctx.strokeStyle = isTriggered ? 'rgba(239, 68, 68, 0.95)' : 'rgba(56, 189, 248, 0.85)';
            ctx.lineWidth = 2;
            ctx.setLineDash([6, 4]);
            ctx.strokeRect(bx, by, bw, bh);
            ctx.setLineDash([]);

            // Draw tactical corner marks
            const cornerSize = 12;
            ctx.strokeStyle = isTriggered ? '#ef4444' : '#38bdf8';
            ctx.lineWidth = 3;

            // Top-left
            ctx.beginPath();
            ctx.moveTo(bx, by + cornerSize);
            ctx.lineTo(bx, by);
            ctx.lineTo(bx + cornerSize, by);
            ctx.stroke();

            // Bottom-right
            ctx.beginPath();
            ctx.moveTo(bx + bw, by + bh - cornerSize);
            ctx.lineTo(bx + bw, by + bh);
            ctx.lineTo(bx + bw - cornerSize, by + bh);
            ctx.stroke();

            // Label
            ctx.fillStyle = isTriggered ? '#ef4444' : '#0284c7';
            ctx.fillRect(bx, Math.max(0, by - 20), 125, 18);
            ctx.fillStyle = '#ffffff';
            ctx.font = '10px "JetBrains Mono", monospace';
            ctx.fillText(
              isTriggered ? `BREACH: ${motionScore}%` : `TRACKING: ${motionScore}%`,
              bx + 4,
              Math.max(12, by - 7)
            );
          });
        }
      }
    }

    return {
      motionScore,
      isTriggered,
      boundingBoxes,
      activeCells: changedPixels,
    };
  }

  public reset() {
    this.prevFrameData = null;
  }
}
