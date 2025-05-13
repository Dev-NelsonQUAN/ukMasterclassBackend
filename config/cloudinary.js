const cloudinary = require('cloudinary').v2;
require('dotenv/config')

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'your_cloud_name',
  api_key: process.env.CLOUDINARY_API_KEY || 'your_api_key',
  api_secret: process.env.CLOUDINARY_API_secret || 'your_api_secret',
});

async function uploadToCloudinary(file, resourceType, folder, options = {}) {
  try {
    if (!file || !file.buffer || !file.mimetype) {
      console.error("Error: Invalid file object received for upload:", file);
      throw new Error("Invalid file object");
    }

    const base64File = file.buffer.toString('base64');
    const dataURI = `data:${file.mimetype};base64,${base64File}`;
    
    const result = await cloudinary.uploader.upload(dataURI, {
      resource_type: resourceType,
      folder: folder,
      ...options,
    });
    return result;
  } catch (error) {
    console.error("Error uploading to Cloudinary (Config):", error);
    throw error;
  }
}

module.exports = { cloudinary, uploadToCloudinary };