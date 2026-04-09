import express from "express";
import {
  createNutritionLog,
  getNutritionLogs,
  getNutritionLog,
  updateNutritionLog,
  deleteNutritionLog,
  getNutritionStats,
  bulkCreateNutritionLogs,
} from "../controllers/nutritionController.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import { validate } from "../middlewares/validation.js";
import { nutritionValidation, idValidation, bulkNutritionValidation, paginationValidation } from "../middlewares/validation.js";
import { nutritionLimiter } from "../middlewares/rateLimiter.js";
import { cacheMiddleware } from "../utils/nutritionCache.js";
import Logger from '../utils/logger.js';

const router = express.Router();

// Apply rate limiting to nutrition routes (300 requests per 15 minutes)
router.use(nutritionLimiter);

// Middleware to log user authentication data for debugging
router.use(authMiddleware, (req, res, next) => {
  if (!req.user) {
    Logger.warn("Unauthorized access attempt - No user data in request.");
    return res.status(401).json({ message: "Unauthorized: No user data found" });
  }
  Logger.debug(`Authenticated User: ${req.user._id} (${req.user.email})`);
  next();
});

// Create a new nutrition log with validation
router.post("/", 
  validate(nutritionValidation.create), 
  createNutritionLog
);

// Get all nutrition logs for the authenticated user with pagination and caching
router.get("/", 
  validate(paginationValidation),
  cacheMiddleware('logs'),
  getNutritionLogs
);

// Get a specific nutrition log by ID with ID validation
router.get("/:id", 
  validate(idValidation), 
  getNutritionLog
);

// Update a specific nutrition log by ID with validation
router.put("/:id", 
  validate([...idValidation, ...nutritionValidation.update]), 
  updateNutritionLog
);

// Delete a specific nutrition log by ID with ID validation
router.delete("/:id", 
  validate(idValidation), 
  deleteNutritionLog
);

// Get nutrition stats (daily/weekly/monthly aggregation) with caching
router.get("/stats/summary", 
  cacheMiddleware('stats'),
  getNutritionStats
);

// Bulk create nutrition logs with validation
router.post("/bulk", 
  validate(bulkNutritionValidation), 
  bulkCreateNutritionLogs
);

export default router;