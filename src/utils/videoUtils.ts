import { createFFmpeg, fetchFile } from '@ffmpeg/ffmpeg';

export interface ConvertVideoOptions {
  format: string; // 'mp4', 'avi', etc.
  speed?: number;
  bitrate?: number; // kbps
  resolution?: string; // e.g., '1280x720'
  trim?: { start: number; end: number };
}

const ffmpeg = createFFmpeg({ log: false });

export async function convertVideo(file: File, options: ConvertVideoOptions, onProgress?: (progress: number) => void): Promise<Blob> {
  if (!ffmpeg.isLoaded()) {
    await ffmpeg.load();
  }
  const { format, speed = 1, bitrate, resolution, trim } = options;
  const inputName = 'input.' + file.name.split('.').pop();
  const outputName = 'output.' + format;
  ffmpeg.FS('writeFile', inputName, await fetchFile(file));

  let args = ['-i', inputName];
  if (typeof trim?.start === 'number') args.push('-ss', String(trim.start));
  if (typeof trim?.end === 'number' && trim.end > 0) args.push('-to', String(trim.end));
  if (speed && speed !== 1) args.push('-filter:v', `setpts=${1/speed}*PTS`);
  if (bitrate) args.push('-b:v', `${bitrate}k`);
  if (resolution && resolution !== 'original') args.push('-s', resolution);
  args.push('-y', outputName);

  ffmpeg.setProgress(({ ratio }) => onProgress?.(Math.round(ratio * 100)));
  await ffmpeg.run(...args);
  const data = ffmpeg.FS('readFile', outputName);
  ffmpeg.FS('unlink', inputName);
  ffmpeg.FS('unlink', outputName);
  return new Blob([data.buffer], { type: `video/${format}` });
} 