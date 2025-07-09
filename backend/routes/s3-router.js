const express = require('express');
const router = express.Router();
const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
const s3Controller = require("../controllers/s3-controller")


router.post('/upload', upload.single('document'), s3Controller.uploadDocument);
module.exports = router;
