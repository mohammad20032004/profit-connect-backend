const path = require('path');
const fs = require('fs/promises');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const ffmpeg = require('fluent-ffmpeg');
ffmpeg.setFfmpegPath(ffmpegPath);
const { videosDir } = require('../utils/postImageStorage');

const VIDEO_MIME_TYPES = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo'];

function isVideo(file) {
  return VIDEO_MIME_TYPES.includes(file.mimetype);
}

function convertVideoToHls(file) {
  return new Promise((resolve, reject) => {
    const baseName = path.basename(file.filename, path.extname(file.filename));
    const outputDir = path.join(videosDir, baseName);
    const masterPath = path.join(outputDir, 'index.m3u8');

    ffmpeg(file.path, { timeout: 300 })
      .videoCodec('libx264')
      .addOptions([
        '-profile:v', 'main',
        '-preset', 'veryfast',
        '-crf', '28',
        '-pix_fmt', 'yuv420p',
        '-movflags', '+faststart',
        '-sc_threshold', '0',
        '-hls_time', '6',
        '-hls_playlist_type', 'vod',
        '-hls_segment_filename', path.join(outputDir, 'segment_%03d.ts'),
        '-start_number', '0',
        '-hls_flags', 'independent_segments',
        '-force_key_frames', 'expr:gte(t,n_forced*6)',
      ])
      .outputOptions('-hls_list_size', '0')
      .output(masterPath)
      .on('start', () => {})
      .on('error', (err) => reject(err))
      .on('end', () => resolve({ outputDir, masterPath }))
      .run();
  });
}

async function generatePoster(file, posterPath, posterWebpPath) {
  const sharp = require('sharp');
  await new Promise((resolve, reject) => {
    ffmpeg(file.path, { timeout: 300 })
      .seekInput(0.1)
      .outputOptions(['-frames:v', '1', '-vf', 'scale=1280:-2'])
      .output(posterPath)
      .on('end', resolve)
      .on('error', reject)
      .run();
  });
  await sharp(posterPath).webp({ quality: 80 }).toFile(posterWebpPath);
  await fs.unlink(posterPath).catch(() => {});
}

async function convertVideoFile(file) {
  if (!isVideo(file)) return;

  const baseName = path.basename(file.filename, path.extname(file.filename));
  const outputDir = path.join(videosDir, baseName);
  await fs.mkdir(outputDir, { recursive: true });

  const result = await convertVideoToHls(file);
  const posterPath = path.join(outputDir, 'poster.jpg');
  const posterWebpPath = path.join(outputDir, 'poster.webp');
  try {
    await generatePoster(file, posterPath, posterWebpPath);
  } catch (e) {
    console.error('Poster generation failed:', file.filename, e.message);
    await fs.unlink(posterPath).catch(() => {});
    await fs.unlink(posterWebpPath).catch(() => {});
  }

  await fs.unlink(file.path).catch(() => {});

  file.filename = `${baseName}/index.m3u8`;
  file.path = result.masterPath;
  file.hlsPlaylist = true;
  file.hasPoster = true;
}

async function videoUploadHandler(req, res, next) {
  try {
    if (req.file && req.file.fieldname === 'video') {
      await convertVideoFile(req.file);
    }

    if (req.files) {
      if (Array.isArray(req.files)) {
        for (const file of req.files) {
          if (file.fieldname === 'video') await convertVideoFile(file);
        }
      } else {
        for (const field of ['image', 'video']) {
          if (req.files[field]) {
            for (const file of req.files[field]) {
              if (file.fieldname === 'video') await convertVideoFile(file);
            }
          }
        }
      }
    }
  } catch (err) {
    console.error('Video conversion error:', err.message);
  }
  next();
}

module.exports = videoUploadHandler;
module.exports.isVideo = isVideo;
module.exports.convertVideoFile = convertVideoFile;
