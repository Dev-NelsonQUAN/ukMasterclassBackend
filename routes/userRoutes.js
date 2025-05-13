const express = require("express");
const router = express.Router();
const upload = require("../config/multerMiddleware");
const {
  createUser,
  getAllUser,
  getAllStatus,
  updateStatus,
  getStatusCounts,
  sendEmailToUser,
  deleteUser,
  deleteAllUsers,
} = require("../controller/userContoller");
const { adminAuth } = require("../middleware/AuthMiddleware");
const cloudinary = require('cloudinary').v2;

router.get('/cloudinary/signature', (req, res) => {
  const timestamp = Math.round((new Date()).getTime() / 1000);
  const upload_preset = 'ml_default'; // Replace with your upload preset
  const folder = 'ukMasterclassUploads'; // Optional: specify a folder

  const params_to_sign = {
    timestamp: timestamp,
    upload_preset: upload_preset,
    folder: folder, // Include if you want it signed
  };

  const signature = cloudinary.utils.api_sign_request(params_to_sign, process.env.CLOUDINARY_API_SECRET);

  res.json({
    signature: signature,
    timestamp: timestamp,
    upload_preset: upload_preset,
    folder: folder,
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, // Get from .env
    api_key: process.env.CLOUDINARY_API_KEY,     // Get from .env (optional)
  });
});

router.post(
  "/users/register",
  upload.fields([
    { name: "bscCertificate", maxCount: 1 },
    { name: "transcript", maxCount: 1 },
    { name: "wassceCertificate", maxCount: 1 },
    { name: "cv", maxCount: 1 },
    { name: "personalStatement", maxCount: 1 },
    { name: "passportBiodata", maxCount: 1 },
    { name: "referenceLetter1", maxCount: 1 },
    { name: "referenceLetter2", maxCount: 1 },
  ]),
  createUser
);
router.get("/users/getAllUser", adminAuth, getAllUser);
router.get("/users/status/:status", adminAuth, getAllStatus);
router.patch("/users/:userId/status", adminAuth, updateStatus);
router.get("/users/status-counts", adminAuth, getStatusCounts);
router.post("/admin/send-email", adminAuth, sendEmailToUser);
router.delete("/admin/:userId/deleteUser", adminAuth, deleteUser);
router.delete("/admin/deleteAll", adminAuth, deleteAllUsers);

module.exports = router;

// const express = require("express");
// const router = express.Router();
// const upload = require("../config/multerMiddleware");
// const {
//   createUser,
//   getAllUser,
//   getAllStatus,
//   updateStatus,
//   getStatusCounts,
//   sendEmailToUser,
//   deleteUser,
//   deleteAllUsers,
// } = require("../controller/userContoller")

// router.post(
//   "/users/register",
//   upload.fields([
//     { name: "bscCertificate", maxCount: 1 },
//     { name: "transcript", maxCount: 1 },
//     { name: "wassceCertificate", maxCount: 1 },
//     { name: "cv", maxCount: 1 },
//     { name: "personalStatement", maxCount: 1 },
//     { name: "passportBiodata", maxCount: 1 },
//     { name: "referenceLetter1", maxCount: 1 },
//     { name: "referenceLetter2", maxCount: 1 },
//   ]),
//   createUser
// );
// router.get("/users/getAllUser", getAllUser);
// router.get("/users/status/:status", getAllStatus);
// router.patch("/users/:userId/status", updateStatus);
// router.get("/users/status-counts", getStatusCounts);
// router.post("/admin/send-email", sendEmailToUser);
// router.delete("/admin/:userId/deleteUser", deleteUser);
// router.delete("/admin/deleteAll", deleteAllUsers);

// module.exports = router;