import axios from 'axios';
import User from '../models/User.js';
import Nutrition from '../models/Nutrition.js';
import Workout from '../models/Workout.js';
import MentalHealth from '../models/MentalHealth.js';
import Logger from '../utils/logger.js';
import { dietCache, workoutCache, stressCache } from '../utils/aiCache.js';

// ✅ Configure axios instance with timeout and keep-alive for Flask AI
const flaskAxios = axios.create({
  timeout: 120000, // 120 second timeout for model loading
  headers: {
    'Content-Type': 'application/json'
  }
});

const FLASK_API_URL = process.env.FLASK_URL 
  ? `${process.env.FLASK_URL}/api`
  : (process.env.NODE_ENV === 'production' 
    ? 'https://fitness-ai-service.onrender.com/api'
    : 'http://localhost:5001/api');

export const getDietRecommendations = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const nutritionLogs = await Nutrition.find({ userId: req.user._id }).sort({ date: -1 }).limit(7);

    // Get the most recent nutrition log for current daily intake
    const currentDayLog = nutritionLogs[0] || {};

    // Format the data to match Flask API expectations
    const requestData = {
      user_data: {
        dateOfBirth: user.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split('T')[0] : null,
        gender: user.gender
      },
      daily_intake: {
        calories: currentDayLog.calories || 0,
        macronutrients: {
          protein: currentDayLog.macronutrients?.protein || 0,
          carbohydrates: currentDayLog.macronutrients?.carbohydrates || 0,
          fats: currentDayLog.macronutrients?.fats || 0
        }
      },
      nutrition_logs: nutritionLogs.map(log => ({
        calories: log.calories,
        macronutrients: log.macronutrients,
        timestamp: log.date,
        meals: log.meals
      }))
    };

    // ✅ Check cache first
    const cacheKey = dietCache.generateKey(requestData);
    const cached = dietCache.get(cacheKey);
    if (cached) {
      Logger.info('Diet cache hit - returning cached response');
      return res.json(cached);
    }

    const response = await flaskAxios.post(`${FLASK_API_URL}/diet`, requestData);
    
    // ✅ Cache the response
    dietCache.set(cacheKey, response.data);
    Logger.info(`Diet cache miss - cached response (cache size: ${dietCache.size})`);
    
    // Send back both recommendations and analysis
    res.json(response.data);
  } catch (error) {
    Logger.error('Diet AI Error:', error.message);
    res.status(500).json({ error: 'AI service unavailable', details: error.message });
  }
};

export const getWorkoutRecommendations = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const workoutLogs = await Workout.find({ userId: req.user._id }).sort({ date: -1 }).limit(7);

    // Format the data to match Flask API expectations
    const requestData = {
      user_data: {
        dateOfBirth: user.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split('T')[0] : null,
        gender: user.gender
      },
      workout_history: workoutLogs.map(log => ({
        activityType: log.activityType,
        duration: log.duration,
        heartRate: log.heartRate,
        caloriesBurned: log.caloriesBurned,
        date: log.date
      })),
      current_stats: workoutLogs[0] ? {
        activityType: workoutLogs[0].activityType,
        duration: workoutLogs[0].duration,
        heartRate: workoutLogs[0].heartRate,
        caloriesBurned: workoutLogs[0].caloriesBurned
      } : {}
    };

    // ✅ Check cache first
    const cacheKey = workoutCache.generateKey(requestData);
    const cached = workoutCache.get(cacheKey);
    if (cached) {
      Logger.info('Workout cache hit - returning cached response');
      return res.json(cached);
    }

    const response = await flaskAxios.post(`${FLASK_API_URL}/workout`, requestData);
    
    // ✅ Cache the response
    workoutCache.set(cacheKey, response.data);
    Logger.info(`Workout cache miss - cached response (cache size: ${workoutCache.size})`);
    
    res.json(response.data);
  } catch (error) {
    Logger.error('Workout AI Error:', error.message);
    res.status(500).json({ error: 'AI service unavailable', details: error.message });
  }
};

export const getStressAnalysis = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const mentalHealthLogs = await MentalHealth.find({ userId: req.user._id }).sort({ date: -1 }).limit(7);

    // Format the data to match what the Flask API expects
    const requestData = {
      user_data: {
        dateOfBirth: user.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split('T')[0] : null,
        gender: user.gender
      },
      daily_logs: mentalHealthLogs.map(log => ({
        date: log.date,
        mood: log.mood,
        stressLevel: log.stressLevel,
        sleepQuality: log.sleepQuality,
        notes: log.notes
      })),
      current_check_in: mentalHealthLogs[0] ? {
        mood: mentalHealthLogs[0].mood,
        stressLevel: mentalHealthLogs[0].stressLevel,
        sleepQuality: mentalHealthLogs[0].sleepQuality,
        notes: mentalHealthLogs[0].notes
      } : null
    };

    // ✅ Check cache first
    const cacheKey = stressCache.generateKey(requestData);
    const cached = stressCache.get(cacheKey);
    if (cached) {
      Logger.info('Stress cache hit - returning cached response');
      return res.json(cached);
    }

    const response = await flaskAxios.post(`${FLASK_API_URL}/stress`, requestData);
    
    // ✅ Cache the response
    stressCache.set(cacheKey, response.data);
    Logger.info(`Stress cache miss - cached response (cache size: ${stressCache.size})`);
    
    res.json(response.data);
  } catch (error) {
    Logger.error('Stress Analysis Error:', error.message);
    res.status(500).json({ error: 'AI service unavailable', details: error.message });
  }
};
