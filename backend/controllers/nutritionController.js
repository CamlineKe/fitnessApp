import Nutrition from "../models/Nutrition.js";
import Logger from '../utils/logger.js';
import { cacheResponse, invalidateUserCache } from '../utils/nutritionCache.js';

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
    // Invalidate user cache after creating new log
    invalidateUserCache(userId);
    return res.status(201).json(nutritionLog);
  } catch (error) {
    Logger.error("Error creating nutrition log:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get all nutrition logs for the authenticated user with pagination
export const getNutritionLogs = async (req, res) => {
  try {
    // Parse pagination parameters
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    // Parse date filters
    const { startDate, endDate } = req.query;
    const query = { userId: req.user._id };
    
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    // Parse meal type filter
    if (req.query.mealType) {
      query.mealType = req.query.mealType;
    }

    // Execute count and find in parallel
    const [total, nutritionLogs] = await Promise.all([
      Nutrition.countDocuments(query),
      Nutrition.find(query)
        .select('-__v') // Exclude version key
        .lean() // Convert to plain JS objects (faster)
        .sort({ date: -1 })
        .skip(skip)
        .limit(limit)
    ]);

    const response = {
      data: nutritionLogs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasMore: skip + nutritionLogs.length < total
      }
    };
    
    // Cache the response
    cacheResponse(req, response);
    
    return res.json(response);
  } catch (error) {
    Logger.error("Error fetching nutrition logs:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get a specific nutrition log by ID
export const getNutritionLog = async (req, res) => {
  try {
    const nutritionLog = await Nutrition.findOne({
      _id: req.params.id,
      userId: req.user._id // Security: ensure user owns this log
    }).lean();

    if (!nutritionLog) {
      return res.status(404).json({ message: "Nutrition log not found" });
    }

    return res.json(nutritionLog);
  } catch (error) {
    Logger.error("Error fetching nutrition log:", error);
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

    // Invalidate user cache after update
    invalidateUserCache(req.user._id);
    
    return res.json(updatedLog);
  } catch (error) {
    Logger.error("Error updating nutrition log:", error);
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

    // Invalidate user cache after delete
    invalidateUserCache(req.user._id);
    
    return res.json({ message: "Nutrition log deleted successfully" });
  } catch (error) {
    Logger.error("Error deleting nutrition log:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get nutrition stats (daily/weekly/monthly aggregation)
export const getNutritionStats = async (req, res) => {
  try {
    const { period = 'daily', startDate, endDate } = req.query;
    
    const matchStage = { userId: req.user._id };
    
    if (startDate || endDate) {
      matchStage.date = {};
      if (startDate) matchStage.date.$gte = new Date(startDate);
      if (endDate) matchStage.date.$lte = new Date(endDate);
    }

    let groupStage;
    switch (period) {
      case 'weekly':
        groupStage = {
          _id: { $isoWeek: "$date" },
          year: { $first: { $year: "$date" } },
          week: { $first: { $isoWeek: "$date" } },
          totalCalories: { $sum: "$calories" },
          avgCalories: { $avg: "$calories" },
          totalProtein: { $sum: "$macronutrients.protein" },
          totalCarbs: { $sum: "$macronutrients.carbohydrates" },
          totalFats: { $sum: "$macronutrients.fats" },
          mealCount: { $sum: 1 }
        };
        break;
      case 'monthly':
        groupStage = {
          _id: { month: { $month: "$date" }, year: { $year: "$date" } },
          year: { $first: { $year: "$date" } },
          month: { $first: { $month: "$date" } },
          totalCalories: { $sum: "$calories" },
          avgCalories: { $avg: "$calories" },
          totalProtein: { $sum: "$macronutrients.protein" },
          totalCarbs: { $sum: "$macronutrients.carbohydrates" },
          totalFats: { $sum: "$macronutrients.fats" },
          mealCount: { $sum: 1 }
        };
        break;
      default: // daily
        groupStage = {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
          date: { $first: "$date" },
          totalCalories: { $sum: "$calories" },
          totalProtein: { $sum: "$macronutrients.protein" },
          totalCarbs: { $sum: "$macronutrients.carbohydrates" },
          totalFats: { $sum: "$macronutrients.fats" },
          mealCount: { $sum: 1 },
          meals: { 
            $push: { 
              mealType: "$mealType", 
              calories: "$calories",
              foodItems: "$foodItems"
            } 
          }
        };
    }

    const stats = await Nutrition.aggregate([
      { $match: matchStage },
      { $sort: { date: -1 } },
      { $group: groupStage },
      { $sort: { _id: -1 } }
    ]);

    const response = {
      period,
      data: stats,
      summary: {
        totalDays: stats.length,
        avgDailyCalories: stats.length > 0 
          ? Math.round(stats.reduce((acc, s) => acc + s.totalCalories, 0) / stats.length)
          : 0
      }
    };
    
    // Cache the response
    cacheResponse(req, response);
    
    return res.json(response);
  } catch (error) {
    Logger.error("Error fetching nutrition stats:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Bulk create nutrition logs
export const bulkCreateNutritionLogs = async (req, res) => {
  try {
    const { logs } = req.body;
    
    if (!Array.isArray(logs) || logs.length === 0) {
      return res.status(400).json({ message: "Logs array is required" });
    }

    if (logs.length > 50) {
      return res.status(400).json({ message: "Maximum 50 logs allowed per bulk request" });
    }

    const userId = req.user._id;
    const nutritionLogs = logs.map(log => ({
      userId,
      date: log.date || new Date(),
      mealType: log.mealType,
      foodItems: log.foodItems,
      calories: log.calories || 0,
      macronutrients: log.macronutrients || { protein: 0, carbohydrates: 0, fats: 0 }
    }));

    const createdLogs = await Nutrition.insertMany(nutritionLogs, { ordered: false });
    
    // Invalidate user cache after bulk create
    invalidateUserCache(userId);
    
    return res.status(201).json({
      message: `Successfully created ${createdLogs.length} nutrition logs`,
      count: createdLogs.length,
      logs: createdLogs
    });
  } catch (error) {
    Logger.error("Error bulk creating nutrition logs:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};