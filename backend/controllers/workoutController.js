import Workout from "../models/Workout.js";
import Logger from '../utils/logger.js';

// ✅ Create a new workout log
export const createWorkoutLog = async (req, res) => {
  try {
    Logger.debug('Received workout log creation request:', req.body);
    Logger.debug('User from request:', req.user);

    const { date, activityType, duration, caloriesBurned, heartRate, feedback } = req.body;

    if (!req.user || !req.user._id) {
      Logger.error('No user ID found in request');
      return res.status(400).json({ message: 'User ID is required' });
    }

    Logger.debug('Creating new workout with data:', {
      userId: req.user._id,
      workoutData: req.body
    });

    const workoutLog = new Workout({
      userId: req.user._id,
      date: date ? new Date(date) : new Date(), // Ensure date is a Date object
      activityType,
      duration,
      caloriesBurned,
      heartRate,
      feedback,
    });

    await workoutLog.save();
    Logger.info('Successfully created workout log:', workoutLog);
    res.status(201).json(workoutLog);
  } catch (error) {
    Logger.error("Error creating workout log:", error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        message: "Invalid workout data", 
        errors: Object.keys(error.errors).reduce((acc, key) => {
          acc[key] = error.errors[key].message;
          return acc;
        }, {})
      });
    }
    res.status(500).json({ message: 'Failed to create workout log' });
  }
};

// ✅ Get all workout logs for the authenticated user
export const getWorkoutLogs = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const workoutLogs = await Workout.find({ userId: req.user._id }).sort({ date: -1 });

    res.json(workoutLogs); // ✅ Even if empty, return []
  } catch (error) {
    Logger.error("Error fetching workout logs:", error);
    res.status(500).json({ message: 'Failed to fetch workout logs' });
  }
};

// ✅ Get today's workout log
export const getTodayWorkout = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const today = new Date();
    const startOfDay = new Date(today.setUTCHours(0, 0, 0, 0)); // ✅ UTC conversion
    const endOfDay = new Date(today.setUTCHours(23, 59, 59, 999));

    const workout = await Workout.findOne({
      userId: req.user._id,
      date: { $gte: startOfDay, $lte: endOfDay },
    });

    if (!workout) {
      // Return a default response instead of 404
      return res.json({
        activityType: "No workout logged yet",
        duration: 0,
        caloriesBurned: 0,
        heartRate: 0,
        feedback: "Log your first workout for today!",
        date: new Date()
      });
    }

    res.json(workout);
  } catch (error) {
    Logger.error("Error fetching today's workout:", error);
    res.status(500).json({ message: "Failed to fetch today's workout" });
  }
};

// ✅ Get a specific workout log by ID
export const getWorkoutLog = async (req, res) => {
  try {
    const workoutLog = await Workout.findById(req.params.id);

    if (!workoutLog) {
      return res.status(404).json({ message: "Workout log not found" });
    }

    if (!workoutLog.userId.equals(req.user._id)) {
      return res.status(403).json({ message: "Forbidden: You do not have permission" });
    }

    res.json(workoutLog);
  } catch (error) {
    Logger.error("Error fetching workout log:", error);
    res.status(500).json({ message: 'Failed to fetch workout log' });
  }
};

// ✅ Update a workout log
export const updateWorkoutLog = async (req, res) => {
  try {
    const { date, activityType, duration, caloriesBurned, heartRate, feedback } = req.body;
    const workoutLog = await Workout.findById(req.params.id);

    if (!workoutLog) {
      return res.status(404).json({ message: "Workout log not found" });
    }

    if (!workoutLog.userId.equals(req.user._id)) {
      return res.status(403).json({ message: "Forbidden: You do not have permission" });
    }

    workoutLog.date = date ? new Date(date) : workoutLog.date;
    workoutLog.activityType = activityType ?? workoutLog.activityType;
    workoutLog.duration = duration ?? workoutLog.duration;
    workoutLog.caloriesBurned = caloriesBurned ?? workoutLog.caloriesBurned;
    workoutLog.heartRate = heartRate ?? workoutLog.heartRate;
    workoutLog.feedback = feedback ?? workoutLog.feedback;

    await workoutLog.save();
    res.json(workoutLog);
  } catch (error) {
    Logger.error("Error updating workout log:", error);
    res.status(500).json({ message: 'Failed to update workout log' });
  }
};

// ✅ Delete a workout log
export const deleteWorkoutLog = async (req, res) => {
  try {
    const workoutLog = await Workout.findById(req.params.id);

    if (!workoutLog) {
      return res.status(404).json({ message: "Workout log not found" });
    }

    if (!workoutLog.userId.equals(req.user._id)) {
      return res.status(403).json({ message: "Forbidden: You do not have permission" });
    }

    await workoutLog.deleteOne();
    res.json({ message: "Workout log deleted" });
  } catch (error) {
    Logger.error("Error deleting workout log:", error);
    res.status(500).json({ message: 'Failed to delete workout log' });
  }
};

// ✅ NEW: Get all workouts (Fix for `/api/workouts` returning 404)
export const getAllWorkouts = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const workouts = await Workout.find({ userId: req.user._id }).sort({ date: -1 });

    res.json(workouts);
  } catch (error) {
    Logger.error("Error fetching workouts:", error);
    res.status(500).json({ message: 'Failed to fetch workouts' });
  }
};
