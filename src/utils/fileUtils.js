const cloudinary = require('cloudinary').v2;
require('dotenv').config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadImageToCloudinary = (buffer, originalName) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'school-images',
        public_id: `school-${Date.now()}-${Math.round(Math.random() * 1E9)}`,
        resource_type: 'auto'
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      }
    );
    uploadStream.end(buffer);
  });
};

const deleteImageFromCloudinary = async (publicId) => {
  if (!publicId) return;
  
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    console.log(`Deleted image from Cloudinary: ${publicId}`, result);
    return result;
  } catch (error) {
    console.error('Error deleting image from Cloudinary:', error);
    throw error;
  }
};

const extractPublicIdFromUrl = (url) => {
  if (!url) return null;
  
  const parts = url.split('/');
  const filename = parts[parts.length - 1];
  const publicId = filename.split('.')[0];
  return `school-images/${publicId}`;
};

module.exports = {
  uploadImageToCloudinary,
  deleteImageFromCloudinary,
  extractPublicIdFromUrl
};