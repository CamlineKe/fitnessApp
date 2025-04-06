import express from "express";
import {
  createNutritionLog,
  getNutritionLogs,
  getNutritionLog,
  updateNutritionLog,
  deleteNutritionLog,
} from "../controllers/nutritionController.js";
import authMiddleware from "../middlewares/authMiddleware.js"; // Ensure authentication
import Logger from '../utils/logger.js';

const router = express.Router();

// Middleware to log user authentication data for debugging
router.use(authMiddleware, (req, res, next) => {
  if (!req.user) {
    Logger.warn("Unauthorized access attempt - No user data in request.");
    return res.status(401).json({ message: "Unauthorized: No user data found" });
  }
  Logger.debug(`Authenticated User: ${req.user._id} (${req.user.email})`);
  next();
});

// Create a new nutrition log
router.post("/", createNutritionLog);

// Get all nutrition logs for the authenticated user
router.get("/", getNutritionLogs);

// Get a specific nutrition log by ID
router.get("/:id", getNutritionLog);

// Update a specific nutrition log by ID
router.put("/:id", updateNutritionLog);

// Delete a specific nutrition log by ID
router.delete("/:id", deleteNutritionLog);

export default router;
