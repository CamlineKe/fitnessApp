import axios from 'axios';
import User from '../models/User.js';
import Nutrition from '../models/Nutrition.js';
import Workout from '../models/Workout.js';
import MentalHealth from '../models/MentalHealth.js';
import Logger from '../utils/logger.js';
import { dietCache, workoutCache, stressCache } from '../utils/aiCache.js';

// ✅ Configure axios instance with timeout and keep-alive for Flask AI
const flaskAxios = axios.create({
  timeout: 180000, // 180 second timeout for model loading on cold start
  headers: {
    'Content-Type': 'application/json'
  },
  // Add retry configuration
  validateStatus: (status) => status < 500 // Don't reject on 4xx errors
});

const FLASK_API_URL = process.env.FLASK_URL 
  ? `${process.env.FLASK_URL}/api`
  : (process.env.NODE_ENV === 'production' 
    ? 'https://fitness-ai-service.onrender.com/api'
    : 'http://localhost:5001/api');

export const getDietRecommendations = async (req, res) => {
  try {
    Logger.info('[AI] Diet recommendations request received for user:', req.user?._id);
    Logger.info('[AI] FLASK_API_URL:', FLASK_API_URL);
    
    const user = await User.findById(req.user._id);
    Logger.info('[AI] User found:', user?._id, 'DOB:', user?.dateOfBirth, 'Gender:', user?.gender);
    
    const nutritionLogs = await Nutrition.find({ userId: req.user._id }).sort({ date: -1 }).limit(7);
    Logger.info('[AI] Nutrition logs count:', nutritionLogs.length);

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

    Logger.info('[AI] Calling Flask API at:', `${FLASK_API_URL}/diet`);
    Logger.info('[AI] Request data:', JSON.stringify(requestData, null, 2));

    const response = await flaskAxios.post(`${FLASK_API_URL}/diet`, requestData);
    
    Logger.info('[AI] Flask response status:', response.status);
    Logger.info('[AI] Flask response data:', JSON.stringify(response.data, null, 2).substring(0, 500));
    
    // ✅ Cache the response
    dietCache.set(cacheKey, response.data);
    Logger.info(`Diet cache miss - cached response (cache size: ${dietCache.size})`);
    
    // Send back both recommendations and analysis
    res.json(response.data);
  } catch (error) {
    Logger.error('Diet AI Error:', error.message);
    if (error.response) {
      Logger.error('Flask response status:', error.response.status);
      Logger.error('Flask response data:', error.response.data);
    }
    if (error.code === 'ECONNABORTED') {
      return res.status(504).json({ error: 'AI service timeout', details: 'The AI service took too long to respond' });
    }
    res.status(500).json({ error: 'AI service unavailable', details: error.message });
  }
};

export const getWorkoutRecommendations = async (req, res) => {
  try {
    Logger.info('[AI] Workout recommendations request received for user:', req.user?._id);
    
    const user = await User.findById(req.user._id);
    Logger.info('[AI] User found:', user?._id);
    
    const workoutLogs = await Workout.find({ userId: req.user._id }).sort({ date: -1 }).limit(7);
    Logger.info('[AI] Workout logs count:', workoutLogs.length);

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

    Logger.info('[AI] Calling Flask API at:', `${FLASK_API_URL}/workout`);
    const response = await flaskAxios.post(`${FLASK_API_URL}/workout`, requestData);
    Logger.info('[AI] Workout Flask response status:', response.status);
    
    // ✅ Cache the response
    workoutCache.set(cacheKey, response.data);
    Logger.info(`Workout cache miss - cached response (cache size: ${workoutCache.size})`);
    
    res.json(response.data);
  } catch (error) {
    Logger.error('Workout AI Error:', error.message);
    if (error.response) {
      Logger.error('Flask response status:', error.response.status);
      Logger.error('Flask response data:', error.response.data);
    }
    if (error.code === 'ECONNABORTED') {
      return res.status(504).json({ error: 'AI service timeout', details: 'The AI service took too long to respond' });
    }
    res.status(500).json({ error: 'AI service unavailable', details: error.message });
  }
};

export const getStressAnalysis = async (req, res) => {
  try {
    Logger.info('[AI] Stress analysis request received for user:', req.user?._id);
    
    const user = await User.findById(req.user._id);
    Logger.info('[AI] User found:', user?._id);
    
    const mentalHealthLogs = await MentalHealth.find({ userId: req.user._id }).sort({ date: -1 }).limit(7);
    Logger.info('[AI] Mental health logs count:', mentalHealthLogs.length);

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

    Logger.info('[AI] Calling Flask API at:', `${FLASK_API_URL}/stress`);
    const response = await flaskAxios.post(`${FLASK_API_URL}/stress`, requestData);
    Logger.info('[AI] Stress Flask response status:', response.status);
    
    // ✅ Cache the response
    stressCache.set(cacheKey, response.data);
    Logger.info(`Stress cache miss - cached response (cache size: ${stressCache.size})`);
    
    res.json(response.data);
  } catch (error) {
    Logger.error('Stress Analysis Error:', error.message);
    if (error.response) {
      Logger.error('Flask response status:', error.response.status);
      Logger.error('Flask response data:', error.response.data);
    }
    if (error.code === 'ECONNABORTED') {
      return res.status(504).json({ error: 'AI service timeout', details: 'The AI service took too long to respond' });
    }
    res.status(500).json({ error: 'AI service unavailable', details: error.message });
  }
};
