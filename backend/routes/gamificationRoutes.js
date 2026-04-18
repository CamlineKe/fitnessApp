import express from 'express';
import authMiddleware from '../middlewares/authMiddleware.js';
import { pointsLimiter, streakLimiter, moodLimiter } from '../middlewares/rateLimiter.js';
import {
  getGamificationData,
  updatePoints,
  updateStreak,
  logMood,
  checkAchievements,
  getLeaderboard,
  useStreakFreeze
} from '../controllers/gamificationController.js';

const router = express.Router();

// Protect all routes
router.use(authMiddleware);

// Get gamification data
router.get('/data', getGamificationData);

// Update points (rate limited to prevent abuse)
router.post('/points', pointsLimiter, updatePoints);

// Update streak (rate limited - streaks shouldn't update too frequently)
router.post('/streak', streakLimiter, updateStreak);

// Log mood (rate limited)
router.post('/mood', moodLimiter, logMood);

// Check achievements
router.get('/achievements', checkAchievements);

// Get leaderboard
router.get('/leaderboard', getLeaderboard);

// Use streak freeze (rate limited)
router.post('/freeze', streakLimiter, useStreakFreeze);

export default router;
