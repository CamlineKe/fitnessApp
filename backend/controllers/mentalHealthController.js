import mongoose from "mongoose";
import MentalHealth from "../models/MentalHealth.js";
import Logger from '../utils/logger.js';

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
    Logger.info("Created Log:", mentalHealthLog);
    res.status(201).json(mentalHealthLog);
  } catch (error) {
    Logger.error("Error creating mental health log:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * ✅ Get all mental health logs (Only for logged-in users)
 */
export const getMentalHealthLogs = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: "Unauthorized: User not found" });
    }

    Logger.debug("Fetching logs for user:", req.user._id);
    const mentalHealthLogs = await MentalHealth.find({ userId: req.user._id }).sort({ date: -1 });

    if (!mentalHealthLogs.length) {
      return res.status(404).json({ message: "No mental health logs found for this user." });
    }

    res.json(mentalHealthLogs);
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

    const mentalHealthLog = await MentalHealth.findById(logId);

    if (!mentalHealthLog) {
      return res.status(404).json({ message: "Mental health log not found" });
    }

    if (String(mentalHealthLog.userId) !== String(req.user._id)) {
      return res.status(403).json({ message: "Forbidden: You do not own this log." });
    }

    res.json(mentalHealthLog);
  } catch (error) {
    Logger.error("Error fetching mental health log:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * ✅ Update a mental health log (Ensure user owns it)
 */
export const updateMentalHealthLog = async (req, res) => {
  try {
    const logId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(logId)) {
      return res.status(400).json({ message: "Invalid log ID format" });
    }

    const { date, stressLevel, mood, sleepQuality, notes } = req.body;

    // ✅ Validate input data
    if (mood && !["happy", "sad", "anxious", "neutral"].includes(mood)) {
      return res.status(400).json({ message: "Invalid mood value" });
    }
    if (stressLevel && (typeof stressLevel !== "number" || stressLevel < 0 || stressLevel > 10)) {
      return res.status(400).json({ message: "Stress level must be between 0 and 10" });
    }
    if (sleepQuality && (typeof sleepQuality !== "number" || sleepQuality < 0 || sleepQuality > 10)) {
      return res.status(400).json({ message: "Sleep quality must be between 0 and 10" });
    }

    const mentalHealthLog = await MentalHealth.findById(logId);

    if (!mentalHealthLog) {
      return res.status(404).json({ message: "Mental health log not found" });
    }

    if (String(mentalHealthLog.userId) !== String(req.user._id)) {
      return res.status(403).json({ message: "Forbidden: You do not own this log." });
    }

    mentalHealthLog.date = date || mentalHealthLog.date;
    if (stressLevel !== undefined) mentalHealthLog.stressLevel = stressLevel;
    if (mood) mentalHealthLog.mood = mood;
    if (sleepQuality !== undefined) mentalHealthLog.sleepQuality = sleepQuality;
    if (notes !== undefined) mentalHealthLog.notes = notes;

    await mentalHealthLog.save();
    res.json(mentalHealthLog);
  } catch (error) {
    Logger.error("Error updating mental health log:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * ✅ Delete a mental health log (Ensure user owns it)
 */
export const deleteMentalHealthLog = async (req, res) => {
  try {
    const logId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(logId)) {
      return res.status(400).json({ message: "Invalid log ID format" });
    }

    const mentalHealthLog = await MentalHealth.findById(logId);

    if (!mentalHealthLog) {
      return res.status(404).json({ message: "Mental health log not found" });
    }

    if (String(mentalHealthLog.userId) !== String(req.user._id)) {
      return res.status(403).json({ message: "Forbidden: You do not own this log." });
    }

    await mentalHealthLog.deleteOne();
    res.json({ message: "Mental health log deleted successfully" });
  } catch (error) {
    Logger.error("Error deleting mental health log:", error);
    res.status(500).json({ message: "Server error" });
  }
};
