import express from 'express';
import { getDietRecommendations, getWorkoutRecommendations, getStressAnalysis } from '../controllers/aiController.js';
import authMiddleware from '../middlewares/authMiddleware.js';

const router = express.Router();

// ✅ Changed to `POST` to allow sending user data for personalized recommendations
router.post('/diet', authMiddleware, getDietRecommendations);
router.post('/workout', authMiddleware, getWorkoutRecommendations);
router.post('/stress', authMiddleware, getStressAnalysis);

export default router;
