import Nutrition from "../models/Nutrition.js";
import Logger from '../utils/logger.js';

// Create a new nutrition log
export const createNutritionLog = async (req, res) => {
  try {
    const { date, mealType, foodItems, calories, macronutrients } = req.body;

    const userId = req.user._id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized: No user ID found" });
    }

    const nutritionLog = new Nutrition({
      userId,
      date: date || new Date(),
      mealType,
      foodItems,
      calories,
      macronutrients,
    });

    await nutritionLog.save();
    return res.status(201).json(nutritionLog);
  } catch (error) {
    Logger.error("Error creating nutrition log:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get all nutrition logs for the authenticated user
export const getNutritionLogs = async (req, res) => {
  try {
    const nutritionLogs = await Nutrition.find({ userId: req.user._id }).sort({ date: -1 });

    // If no logs are found, return an empty array instead of a 404 status
    if (!nutritionLogs || !nutritionLogs.length) {
      return res.status(200).json([]); // Return an empty array with a 200 status
    }

    return res.json(nutritionLogs);
  } catch (error) {
    console.error("Error fetching nutrition logs:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get a specific nutrition log by ID
export const getNutritionLog = async (req, res) => {
  try {
    const nutritionLog = await Nutrition.findById(req.params.id);

    if (!nutritionLog) {
      return res.status(404).json({ message: "Nutrition log not found" });
    }

    return res.json(nutritionLog);
  } catch (error) {
    console.error("Error fetching nutrition log:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Update a specific nutrition log by ID
export const updateNutritionLog = async (req, res) => {
  try {
    const { date, mealType, foodItems, calories, macronutrients } = req.body;
    
    const updatedLog = await Nutrition.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id }, // Ensure the user owns the log
      { date, mealType, foodItems, calories, macronutrients },
      { new: true, runValidators: true } // Ensure validation and return updated doc
    );

    if (!updatedLog) {
      return res.status(404).json({ message: "Nutrition log not found or you don't have permission to edit it" });
    }

    return res.json(updatedLog);
  } catch (error) {
    console.error("Error updating nutrition log:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Delete a specific nutrition log by ID
export const deleteNutritionLog = async (req, res) => {
  try {
    const deletedLog = await Nutrition.findOneAndDelete({ _id: req.params.id, userId: req.user._id });

    if (!deletedLog) {
      return res.status(404).json({ message: "Nutrition log not found or you don't have permission to delete it" });
    }

    return res.json({ message: "Nutrition log deleted successfully" });
  } catch (error) {
    console.error("Error deleting nutrition log:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};