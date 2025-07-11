const express = require('express');
const router = express.Router();
const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
const s3Controller = require("../controllers/s3-controller");
const verifyToken = require('../middleware/verifyToken');


router.post('/add', verifyToken, upload.single('document'), s3Controller.uploadDocument);
router.get('/get', s3Controller.getDocumentTypes);
router.delete('/delete', verifyToken, s3Controller.deleteDocument);
router.put('/update', verifyToken, upload.single('document'), s3Controller.updateDocument);
router.get('/user',verifyToken, s3Controller.getUserDocuments);
router.get('/download', verifyToken, s3Controller.downloadDocument);

module.exports = router;
