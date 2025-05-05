const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: async (req, file) => {
        let folder = "ukMasterclassUploads";
        let publicId = `${file.fieldname}_${Date.now()}`;

        return {
            folder,
            allowed_formats: ["jpg", "png", "jpeg", "pdf", "doc", "docx"],
            transformation: [{ width: 800, height: 800, crop: "limit" }],
            public_id: publicId,
        };
    },
});

module.exports = { cloudinary, storage };