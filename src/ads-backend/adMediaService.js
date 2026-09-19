// src/ads-backend/adMediaService.js
/**
 * Reliv Ads V1 — Media Normalization Service
 * Prepares all image/video assets into kiosk-ready 1920x1080 landscape files.
 * Normalizes audio to standard loudness (playback volume is dynamically controlled by KioskAdPlayer).
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export const DISPLAY_WIDTH = 1920;
export const DISPLAY_HEIGHT = 1080;
export const MAX_VIDEO_DURATION_SEC = 15;

/**
 * Calculates SHA-256 of a file on disk
 */
export async function computeFileSHA256(filePath) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const stream = fs.createReadStream(filePath);
    stream.on('data', data => hash.update(data));
    stream.on('end', () => resolve(hash.digest('hex')));
    stream.on('error', reject);
  });
}

/**
 * FFmpeg Video Normalization Command Generator
 * Audio is normalized to standard broadcast loudness without baking fixed attenuation.
 * Playback volume is dynamically set to 30% by KioskAdPlayer at runtime.
 */
export function buildFFmpegCommand(inputPath, outputPath, isPortraitOrSquare = true) {
  if (!isPortraitOrSquare) {
    // 16:9 landscape scale
    return `ffmpeg -y -i "${inputPath}" -t ${MAX_VIDEO_DURATION_SEC} ` +
      `-vf "scale=${DISPLAY_WIDTH}:${DISPLAY_HEIGHT}:force_original_aspect_ratio=increase,crop=${DISPLAY_WIDTH}:${DISPLAY_HEIGHT}" ` +
      `-c:v libx264 -pix_fmt yuv420p -preset fast -crf 23 -r 30 ` +
      `-af "loudnorm=I=-24:LRA=7:tp=-2" -c:a aac -b:a 128k -movflags +faststart "${outputPath}"`;
  }

  // Portrait / Square with blurred background wings
  const filterGraph = [
    `[0:v]split=2[bg_in][fg_in]`,
    `[bg_in]scale=${DISPLAY_WIDTH}:${DISPLAY_HEIGHT}:force_original_aspect_ratio=increase,crop=${DISPLAY_WIDTH}:${DISPLAY_HEIGHT},boxblur=40:5[bg]`,
    `[fg_in]scale=-1:${DISPLAY_HEIGHT}:force_original_aspect_ratio=decrease[fg]`,
    `[bg][fg]overlay=(W-w)/2:(H-h)/2[outv]`
  ].join(';');

  return `ffmpeg -y -i "${inputPath}" -t ${MAX_VIDEO_DURATION_SEC} ` +
    `-filter_complex "${filterGraph}" -map "[outv]" -map 0:a? ` +
    `-c:v libx264 -pix_fmt yuv420p -preset fast -crf 23 -r 30 ` +
    `-af "loudnorm=I=-24:LRA=7:tp=-2" -c:a aac -b:a 128k -movflags +faststart "${outputPath}"`;
}

/**
 * Prepares image creative using Sharp
 */
export async function normalizeImage(inputPath, outputPath, isPortraitOrSquare = false) {
  try {
    const sharp = (await import('sharp')).default;

    if (!isPortraitOrSquare) {
      // 16:9 landscape
      await sharp(inputPath)
        .resize(DISPLAY_WIDTH, DISPLAY_HEIGHT, { fit: 'cover' })
        .webp({ quality: 90 })
        .toFile(outputPath);
      return { outputPath, success: true };
    }

    // Blurred background composite for portrait / square
    const backgroundBuffer = await sharp(inputPath)
      .resize(DISPLAY_WIDTH, DISPLAY_HEIGHT, { fit: 'cover' })
      .blur(40)
      .modulate({ brightness: 0.75, saturation: 0.85 })
      .toBuffer();

    const foregroundBuffer = await sharp(inputPath)
      .resize(null, DISPLAY_HEIGHT, { fit: 'inside' })
      .toBuffer();

    await sharp(backgroundBuffer)
      .composite([{ input: foregroundBuffer, gravity: 'center' }])
      .webp({ quality: 90 })
      .toFile(outputPath);

    return { outputPath, success: true };
  } catch (err) {
    console.error('[adMediaService] Image normalization error:', err);
    throw err;
  }
}

/**
 * Normalizes video creative using FFmpeg
 */
export async function normalizeVideo(inputPath, outputPath, isPortraitOrSquare = false) {
  const cmd = buildFFmpegCommand(inputPath, outputPath, isPortraitOrSquare);
  await execAsync(cmd);
  return { outputPath, success: true };
}
