import express from 'express';
import homeController from '../controllers/homeController.js';
// import authMiddleware from '../middleware/authMiddleware.js'; // this for production

const router = express.Router();

// Get the dating cards
router.get('/feed', homeController.getFeed);

// Perform a swipe
router.post('/swipe', homeController.swipeUser);

router.get('/notifications', homeController.getNotifications);

export default router;