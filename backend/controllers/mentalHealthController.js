import mongoose from "mongoose";
import MentalHealth from "../models/MentalHealth.js";
import Logger from '../utils/logger.js';
import { stressCache } from '../utils/aiCache.js';

/**
 * ✅ Create a mental health log (Only for logged-in users)
 */
export const createMentalHealthLog = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: "Unauthorized: User not found" });
    }

    const { stressLevel, mood, sleepQuality, notes } = req.body;

    // ✅ Validate input data
    if (!["happy", "sad", "anxious", "neutral"].includes(mood)) {
      return res.status(400).json({ message: "Invalid mood value" });
    }
    if (typeof stressLevel !== "number" || stressLevel < 0 || stressLevel > 10) {
      return res.status(400).json({ message: "Stress level must be between 0 and 10" });
    }
    if (typeof sleepQuality !== "number" || sleepQuality < 0 || sleepQuality > 10) {
      return res.status(400).json({ message: "Sleep quality must be between 0 and 10" });
    }

    const mentalHealthLog = new MentalHealth({
      userId: req.user._id,
      date: req.body.date || new Date(),
      stressLevel,
      mood,
      sleepQuality,
      notes,
    });

    await mentalHealthLog.save();
    
    // ✅ Invalidate stress recommendations cache since new mental health log affects analysis
    stressCache.invalidate(req.user._id);
    Logger.info(`[MentalHealth] Stress cache invalidated for user ${req.user._id}`);
    
    Logger.info("Created Log:", mentalHealthLog);
    res.status(201).json(mentalHealthLog);
  } catch (error) {
    Logger.error("Error creating mental health log:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * ✅ Get all mental health logs with pagination (Only for logged-in users)
 */
export const getMentalHealthLogs = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: "Unauthorized: User not found" });
    }

    // Pagination params
    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 100);
    const offset = Math.max(parseInt(req.query.offset, 10) || 0, 0);

    Logger.debug(`Fetching logs for user: ${req.user._id}, limit: ${limit}, offset: ${offset}`);

    // Run count and fetch in parallel
    const [total, mentalHealthLogs] = await Promise.all([
      MentalHealth.countDocuments({ userId: req.user._id }),
      MentalHealth.find({ userId: req.user._id })
        .select('date stressLevel mood sleepQuality notes')
        .sort({ date: -1 })
        .skip(offset)
        .limit(limit)
        .lean()
    ]);

    res.json({
      data: mentalHealthLogs,
      pagination: {
        total,
        offset,
        limit,
        hasMore: offset + mentalHealthLogs.length < total
      }
    });
  } catch (error) {
    Logger.error("Error fetching mental health logs:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * ✅ Get a specific mental health log by ID (Ensure user owns it)
 */
export const getMentalHealthLog = async (req, res) => {
  try {
    const logId = req.params.id;
    Logger.debug("Fetching log for ID:", logId);

    if (!mongoose.Types.ObjectId.isValid(logId)) {
      return res.status(400).json({ message: "Invalid log ID format" });
    }

    // Fetch with ownership check in single query
    const mentalHealthLog = await MentalHealth.findOne({
      _id: logId,
      userId: req.user._id
    });

    if (!mentalHealthLog) {
      return res.status(404).json({ message: "Mental health log not found or access denied" });
    }

    res.json(mentalHealthLog);
  } catch (error) {
    Logger.error("Error fetching mental health log:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * ✅ Update a mental health log (Ensure user owns it) - Atomic operation
 */
export const updateMentalHealthLog = async (req, res) => {
  try {
    const logId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(logId)) {
      return res.status(400).json({ message: "Invalid log ID format" });
    }

    const { date, stressLevel, mood, sleepQuality, notes } = req.body;

    // Build update object with only provided fields
    const updateData = {};
    if (date !== undefined) updateData.date = date;
    if (stressLevel !== undefined) updateData.stressLevel = stressLevel;
    if (mood !== undefined) updateData.mood = mood;
    if (sleepQuality !== undefined) updateData.sleepQuality = sleepQuality;
    if (notes !== undefined) updateData.notes = notes;

    // Atomic update with ownership check in query
    const updatedLog = await MentalHealth.findOneAndUpdate(
      { _id: logId, userId: req.user._id },
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!updatedLog) {
      return res.status(404).json({ message: "Mental health log not found or access denied" });
    }

    res.json(updatedLog);
  } catch (error) {
    Logger.error("Error updating mental health log:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * ✅ Delete a mental health log (Ensure user owns it) - Atomic operation
 */
export const deleteMentalHealthLog = async (req, res) => {
  try {
    const logId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(logId)) {
      return res.status(400).json({ message: "Invalid log ID format" });
    }

    // Atomic delete with ownership check in query
    const deletedLog = await MentalHealth.findOneAndDelete({
      _id: logId,
      userId: req.user._id
    });

    if (!deletedLog) {
      return res.status(404).json({ message: "Mental health log not found or access denied" });
    }

    res.json({ message: "Mental health log deleted successfully" });
  } catch (error) {
    Logger.error("Error deleting mental health log:", error);
    res.status(500).json({ message: "Server error" });
  }
};
