import axios from 'axios';
import User from '../models/User.js';
import Nutrition from '../models/Nutrition.js';
import Workout from '../models/Workout.js';
import MentalHealth from '../models/MentalHealth.js';

const FLASK_API_URL = 'http://localhost:5001/api';

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

    const response = await axios.post(`${FLASK_API_URL}/diet`, requestData);
    
    // Send back both recommendations and analysis
    res.json(response.data);
  } catch (error) {
    console.error('Diet AI Error:', error);
    res.status(500).send('Server error');
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

    const response = await axios.post(`${FLASK_API_URL}/workout`, requestData);
    res.json(response.data);
  } catch (error) {
    console.error('Workout AI Error:', error);
    res.status(500).send('Server error');
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

    const response = await axios.post(`${FLASK_API_URL}/stress`, requestData);
    res.json(response.data);
  } catch (error) {
    console.error('Stress Analysis Error:', error);
    res.status(500).send('Server error');
  }
};
