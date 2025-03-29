import express from 'express';
import authMiddleware from '../middlewares/authMiddleware.js';
import {
  getGamificationData,
  updatePoints,
  updateStreak,
  logMood,
  checkAchievements,
  getLeaderboard
} from '../controllers/gamificationController.js';

const router = express.Router();

// Protect all routes
router.use(authMiddleware);

// Get gamification data
router.get('/data', getGamificationData);

// Update points
router.post('/points', updatePoints);

// Update streak
router.post('/streak', updateStreak);

// Log mood
router.post('/mood', logMood);

// Check achievements
router.get('/achievements', checkAchievements);

// Get leaderboard
router.get('/leaderboard', getLeaderboard);

export default router;
