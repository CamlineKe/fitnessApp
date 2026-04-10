import express from 'express';
import { getDietRecommendations, getWorkoutRecommendations, getStressAnalysis, getAllRecommendations } from '../controllers/aiController.js';
import authMiddleware from '../middlewares/authMiddleware.js';

const router = express.Router();

// ✅ Changed to `POST` to allow sending user data for personalized recommendations
router.post('/diet', authMiddleware, getDietRecommendations);
router.post('/workout', authMiddleware, getWorkoutRecommendations);
router.post('/stress', authMiddleware, getStressAnalysis);

// OPTIMIZED: Batch endpoint - fetch all 3 recommendations in parallel
router.post('/all', authMiddleware, getAllRecommendations);

export default router;
