const express = require('express');
const router = express.Router();
const upload = require('../config/multerMiddleware');
const { getAllUser, createUser, getAllStatus, updateStatus, getStatusCounts, sendEmailToUser, deleteUser, deleteAllUsers} = require('../controller/userContoller');

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
router.get('/users/status-counts', getStatusCounts);
router.post('/admin/send-email', sendEmailToUser)
router.delete('/admin/:userId/deleteUser', deleteUser )
router.delete('/admin/deleteAll', deleteAllUsers)

module.exports = router;