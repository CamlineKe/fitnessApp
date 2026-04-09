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

// ✅ Get all workout logs for the authenticated user with pagination
export const getWorkoutLogs = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Parse pagination parameters
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const sortField = req.query.sortBy || 'date';
    const sortOrder = req.query.order === 'asc' ? 1 : -1;

    // Build sort object
    const sort = { [sortField]: sortOrder };

    // Execute paginated query with lean for faster serialization
    const skip = (page - 1) * limit;
    const [workoutLogs, totalCount] = await Promise.all([
      Workout.find({ userId: req.user._id })
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      Workout.countDocuments({ userId: req.user._id })
    ]);

    res.json({
      data: workoutLogs,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
        limit,
        hasNextPage: page * limit < totalCount,
        hasPrevPage: page > 1
      }
    });
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
    }).lean();

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
    const workoutLog = await Workout.findOne({
      _id: req.params.id,
      userId: req.user._id
    }).lean();

    if (!workoutLog) {
      return res.status(404).json({ message: "Workout log not found" });
    }

    res.json(workoutLog);
  } catch (error) {
    Logger.error("Error fetching workout log:", error);
    res.status(500).json({ message: 'Failed to fetch workout log' });
  }
};

// ✅ Update a workout log with atomic operation
export const updateWorkoutLog = async (req, res) => {
  try {
    const { date, activityType, duration, caloriesBurned, heartRate, feedback } = req.body;

    // Build update object with only provided fields
    const updateFields = {};
    if (date !== undefined) updateFields.date = new Date(date);
    if (activityType !== undefined) updateFields.activityType = activityType;
    if (duration !== undefined) updateFields.duration = duration;
    if (caloriesBurned !== undefined) updateFields.caloriesBurned = caloriesBurned;
    if (heartRate !== undefined) updateFields.heartRate = heartRate;
    if (feedback !== undefined) updateFields.feedback = feedback;

    // Atomic update with ownership check
    const workoutLog = await Workout.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { $set: updateFields },
      { new: true, runValidators: true }
    );

    if (!workoutLog) {
      return res.status(404).json({ message: "Workout log not found or access denied" });
    }

    res.json(workoutLog);
  } catch (error) {
    Logger.error("Error updating workout log:", error);
    res.status(500).json({ message: 'Failed to update workout log' });
  }
};

// ✅ Delete a workout log with atomic operation
export const deleteWorkoutLog = async (req, res) => {
  try {
    // Atomic delete with ownership check
    const result = await Workout.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!result) {
      return res.status(404).json({ message: "Workout log not found or access denied" });
    }

    res.json({ message: "Workout log deleted" });
  } catch (error) {
    Logger.error("Error deleting workout log:", error);
    res.status(500).json({ message: 'Failed to delete workout log' });
  }
};

