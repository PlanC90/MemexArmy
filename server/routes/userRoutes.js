import express from 'express';
import { getUserProfile, connectTelegram } from '../controllers/userController.js'; // Assuming controller also uses ES Modules or adjust path/import

const router = express.Router();

router.get('/profile', getUserProfile);
router.post('/connect-telegram', connectTelegram);

export default router; // Export using ES Module syntax
