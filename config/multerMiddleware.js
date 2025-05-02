const multer = require('multer')
const {storage} = require('../config/cloudinary')

const upload = multer({
    storage,
    limits: { fileSize: 3 * 1024 * 1024}
})

module.exports = upload