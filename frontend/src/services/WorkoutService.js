import axios from "axios";
import Logger from '../utils/logger';

const API_URL = `${import.meta.env.VITE_API_URL}/workouts`;

// 🔹 Helper function to get authentication headers
const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  if (!token) {
    throw new Error("❌ No authentication token found!");
  }
  return { Authorization: `Bearer ${token}` };
};

// 🔹 Generalized API request handler with proper error handling
const requestHandler = async (method, url, data = null) => {
  try {
    const headers = getAuthHeaders();
    const requestData = data ? JSON.stringify(data) : undefined;
    Logger.debug(`Making ${method.toUpperCase()} request to ${url}`, {
      method,
      url,
      data: requestData,
      headers 
    });

    const config = {
      method,
      url,
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      },
      data: data ? JSON.stringify(data) : undefined
    };

    Logger.debug('Request config:', config);
    const response = await axios(config);
    Logger.info(`${method.toUpperCase()} request successful:`, response.data);
    return response.data;
  } catch (error) {
    Logger.error(`❌ Error in ${method.toUpperCase()} ${url}:`, error.response?.data || error.message);
    Logger.error('Full error object:', error);
    throw error;
  }
};

// �� Fetch workout data for the current day
const getWorkoutData = async () => {
  return requestHandler("get", `${API_URL}/today`);
};

// 🔹 Fetch all workout logs for the authenticated user
const getWorkoutLogs = async () => {
  try {
    const logs = await requestHandler("get", API_URL);
    return Array.isArray(logs) ? logs : [];
  } catch (error) {
    Logger.error("❌ Failed to fetch workout logs:", error);
    throw error;
  }
};

// 🔹 Fetch a specific workout log by ID
const getWorkoutLog = (id) => requestHandler("get", `${API_URL}/${id}`);

// 🔹 Add a new workout log
const addWorkoutLog = async (workoutLog) => {
  Logger.debug('🔹 Adding new workout log:', workoutLog);
  try {
    // Ensure all required fields are present and properly formatted
    const formattedLog = {
      date: workoutLog.date instanceof Date ? workoutLog.date.toISOString() : new Date(workoutLog.date).toISOString(),
      activityType: String(workoutLog.activityType).trim(),
      duration: Math.max(0, Number(workoutLog.duration) || 0),
      caloriesBurned: Math.max(0, Number(workoutLog.caloriesBurned) || 0),
      heartRate: Math.max(0, Number(workoutLog.heartRate) || 0),
      feedback: String(workoutLog.feedback || '').trim()
    };

    // Validate required fields
    if (!formattedLog.activityType) {
      throw new Error('Activity type is required');
    }
    if (formattedLog.duration <= 0) {
      throw new Error('Duration must be greater than 0');
    }
    if (formattedLog.caloriesBurned <= 0) {
      throw new Error('Calories burned must be greater than 0');
    }

    Logger.debug('🔹 Sending formatted workout log to server:', formattedLog);
    const result = await requestHandler("post", API_URL, formattedLog);
    Logger.info('✅ Successfully added workout log:', result);
    return result;
  } catch (error) {
    Logger.error('❌ Failed to add workout log:', error);
    throw error;
  }
};

// 🔹 Update an existing workout log
const updateWorkoutLog = (id, updatedLog) => requestHandler("put", `${API_URL}/${id}`, updatedLog);

// 🔹 Delete a workout log
const deleteWorkoutLog = (id) => requestHandler("delete", `${API_URL}/${id}`);

// 🔹 Update today's workout data
const updateWorkoutData = async (workoutData) => {
  Logger.debug('🔹 Updating today\'s workout data:', workoutData);
  try {
    // First get today's workout to get its ID
    const todayWorkout = await getWorkoutData();
    
    // If there's no workout for today, we can't update it
    if (!todayWorkout || !todayWorkout._id) {
      Logger.warn('❌ No workout found for today to update');
      return null;
    }

    // Update the existing workout log
    const formattedData = {
      ...workoutData,
      date: workoutData.date instanceof Date ? workoutData.date.toISOString() : new Date(workoutData.date).toISOString()
    };

    return await updateWorkoutLog(todayWorkout._id, formattedData);
  } catch (error) {
    Logger.error('❌ Failed to update today\'s workout data:', error);
    throw error;
  }
};

export default { 
  getWorkoutData, 
  getWorkoutLogs, 
  getWorkoutLog, 
  addWorkoutLog, 
  updateWorkoutLog, 
  deleteWorkoutLog,
  updateWorkoutData
};
