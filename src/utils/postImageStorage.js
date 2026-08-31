const fs = require('fs');
const path = require('path');

const uploadsRoot = path.join(__dirname, '../../uploads');
const postsDir = path.join(uploadsRoot, 'posts');
const videosDir = path.join(postsDir, 'videos');

fs.mkdirSync(postsDir, { recursive: true });
fs.mkdirSync(videosDir, { recursive: true });

// --- Images ---
const allowedImageMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg', 'image/gif'];

const buildPostImageUrl = (req, filename) => {
  if (!filename) return null;
  return `${req.protocol}://${req.get('host')}/uploads/posts/${filename}`;
};

const isLocalPostImage = (imageUrl) => {
  return typeof imageUrl === 'string' && imageUrl.includes('/uploads/posts/') && !imageUrl.includes('/uploads/posts/videos/');
};

const extractPostImageFilename = (imageUrl) => {
  if (!isLocalPostImage(imageUrl)) return null;
  return imageUrl.split('/uploads/posts/').pop();
};

const deletePostImage = async (imageUrl) => {
  const filename = extractPostImageFilename(imageUrl);
  if (!filename) return;

  const filePath = path.join(postsDir, filename);
  try {
    await fs.promises.unlink(filePath);
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
};

// --- Videos ---
const allowedVideoMimeTypes = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo'];

const buildPostVideoUrl = (req, filename) => {
  if (!filename) return null;
  return `${req.protocol}://${req.get('host')}/uploads/posts/videos/${filename}`;
};

// بناء عنوان صورة مصغرة (poster) لفيديو HLS محوّل
// يُتوقع أن يكون العنوان الأساسي بالشكل: .../posts/videos/{name}/index.m3u8
const buildPostVideoPosterUrl = (req, hlsFilename) => {
  if (!hlsFilename || !hlsFilename.endsWith('index.m3u8')) return null;
  const poster = hlsFilename.replace('index.m3u8', 'poster.webp');
  return `${req.protocol}://${req.get('host')}/uploads/posts/videos/${poster}`;
};

const isLocalPostVideo = (videoUrl) => {
  return typeof videoUrl === 'string' && videoUrl.includes('/uploads/posts/videos/');
};

const extractPostVideoFilename = (videoUrl) => {
  if (!isLocalPostVideo(videoUrl)) return null;
  return videoUrl.split('/uploads/posts/videos/').pop();
};

// حذف فيديو: ملف HLS يُخزَّن في مجلد فرعي باسم القاعدة — نحذف المجلد كاملًا
// ما عدا ذلك (مباشر) نحذف الملف.
const deletePostVideo = async (videoUrl) => {
  const filename = extractPostVideoFilename(videoUrl);
  if (!filename) return;

  const filePath = path.join(videosDir, filename);
  try {
    // HLS: filename يشبه "basename/index.m3u8" — احذف مجلد basename
    const topFolder = filename.split('/')[0];
    if (filename.includes('/')) {
      await fs.promises.rm(path.join(videosDir, topFolder), { recursive: true, force: true });
    } else {
      await fs.promises.unlink(filePath);
    }
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
};

module.exports = {
  postsDir,
  videosDir,
  allowedImageMimeTypes,
  allowedVideoMimeTypes,
  buildPostImageUrl,
  deletePostImage,
  buildPostVideoUrl,
  buildPostVideoPosterUrl,
  deletePostVideo,
};
