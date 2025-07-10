// /routes/authRoutes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/user-controller');
const verifyToken = require('../middleware/verifyToken');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/user', verifyToken, authController.getUserInfo);

module.exports = router;
