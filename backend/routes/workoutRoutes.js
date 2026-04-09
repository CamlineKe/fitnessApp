import express from "express";
import {
  createWorkoutLog,
  getWorkoutLogs,
  getWorkoutLog,
  updateWorkoutLog,
  deleteWorkoutLog,
  getTodayWorkout,
  bulkCreateWorkoutLogs,
} from "../controllers/workoutController.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import { validate } from "../middlewares/validation.js";
import { workoutValidation, idValidation } from "../middlewares/validation.js";

const router = express.Router();

// ✅ Protect all workout-related routes with authentication
router.use(authMiddleware);

// ✅ Get today's workout log FIRST to prevent route conflicts
router.get("/today", getTodayWorkout);

// ✅ Get all workout logs for the authenticated user
router.get("/", getWorkoutLogs);

// ✅ Create a new workout log with validation
router.post("/", 
  validate(workoutValidation.create), 
  createWorkoutLog
);

// ✅ Get a specific workout log by ID with ID validation
router.get("/:id", 
  validate(idValidation), 
  getWorkoutLog
);

// ✅ Update a specific workout log by ID with validation
router.put("/:id", 
  validate([...idValidation, ...workoutValidation.update]), 
  updateWorkoutLog
);

// ✅ Delete a specific workout log by ID with ID validation
router.delete("/:id", 
  validate(idValidation), 
  deleteWorkoutLog
);

// ✅ Bulk create workout logs for mobile sync (max 100 per request)
router.post("/bulk", 
  bulkCreateWorkoutLogs
);

export default router;