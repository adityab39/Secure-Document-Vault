const express = require('express');
const router = express.Router();
const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
const s3Controller = require("../controllers/s3-controller");
const verifyToken = require('../middleware/verifyToken');


router.post('/add', verifyToken, upload.single('document'), s3Controller.uploadDocument);
router.get('/get', s3Controller.getDocumentTypes);
router.delete('/delete', s3Controller.deleteDocument);



module.exports = router;
