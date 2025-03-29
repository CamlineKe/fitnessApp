import express from "express";
import {
  createWorkoutLog,
  getWorkoutLogs, // ✅ Fetch all workouts for the authenticated user
  getWorkoutLog, // ✅ Fetch a single workout log by ID
  updateWorkoutLog, // ✅ Update a workout log
  deleteWorkoutLog, // ✅ Delete a workout log
  getTodayWorkout, // ✅ Fetch today's workout
} from "../controllers/workoutController.js";
import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();

// ✅ Protect all workout-related routes with authentication
router.use(authMiddleware);

// ✅ Get today's workout log FIRST to prevent route conflicts
router.get("/today", getTodayWorkout);

// ✅ Get all workout logs for the authenticated user
router.get("/", getWorkoutLogs);

// ✅ Create a new workout log
router.post("/", createWorkoutLog);

// ✅ Get a specific workout log by ID (Ensure user owns the log)
router.get("/:id", getWorkoutLog);

// ✅ Update a specific workout log by ID (Ensure user owns the log)
router.put("/:id", updateWorkoutLog);

// ✅ Delete a specific workout log by ID (Ensure user owns the log)
router.delete("/:id", deleteWorkoutLog);

export default router;
