const express = require('express');
const router = express.Router();
const upload = require('../config/multerMiddleware');
const { getAllUser, createUser, getAllStatus, updateStatus } = require('../controller/userContoller');

router.post('/users/register', upload.fields([
    { name: 'bscCertificate', maxCount: 1 },
    { name: 'transcript', maxCount: 1 },
    { name: 'wassceCertificate', maxCount: 1 },
    { name: 'cv', maxCount: 1 },
    { name: 'personalStatement', maxCount: 1 },
    { name: 'passportBiodata', maxCount: 1 },
    { name: 'referenceLetter1', maxCount: 1 },
    { name: 'referenceLetter2', maxCount: 1 }
]), createUser);

router.get('/users/getAllUser', getAllUser);
router.get('/users/status/:status', getAllStatus)
router.patch("/users/:userId/status", updateStatus)

module.exports = router;