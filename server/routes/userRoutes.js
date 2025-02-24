const express = require('express');
const { getUserProfile, connectTelegram } = require('../controllers/userController');

const router = express.Router();

router.get('/profile', getUserProfile);
router.post('/connect-telegram', connectTelegram);

module.exports = router;
