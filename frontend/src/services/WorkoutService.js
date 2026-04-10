import axios from "../axiosConfig";
import Logger from '../utils/logger';

const API_URL = `/workouts`;

// Store ETags for caching
const etagCache = new Map();

// 🔹 Generalized API request handler with proper error handling and ETag support
const requestHandler = async (method, url, data = null, options = {}) => {
  try {
    const { useETag = false, fields = null, params = {} } = options;
    const requestData = data ? JSON.stringify(data) : undefined;

    // Build query string for params and fields
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value);
      }
    });
    if (fields) {
      queryParams.append('fields', Array.isArray(fields) ? fields.join(',') : fields);
    }

    const fullUrl = queryParams.toString() ? `${url}?${queryParams.toString()}` : url;

    Logger.debug(`Making ${method.toUpperCase()} request to ${fullUrl}`, {
      method,
      url: fullUrl,
      data: requestData,
      useETag
    });

    const config = {
      method,
      url: fullUrl,
      headers: {
        'Content-Type': 'application/json'
      },
      data: data ? JSON.stringify(data) : undefined
    };

    // Add If-None-Match header if we have cached ETag
    if (useETag && method === 'get' && etagCache.has(fullUrl)) {
      config.headers['If-None-Match'] = etagCache.get(fullUrl);
    }

    Logger.debug('Request config:', config);
    const response = await axios(config);

    // Store ETag if present
    if (useETag && response.headers.etag) {
      etagCache.set(fullUrl, response.headers.etag);
    }

    Logger.info(`${method.toUpperCase()} request successful:`, response.data);
    return response.data;
  } catch (error) {
    // Handle 304 Not Modified (cached response)
    if (error.response?.status === 304) {
      Logger.debug(`304 Not Modified for ${url}, using cached data`);
      return { cached: true, data: null };
    }

    Logger.error(`❌ Error in ${method.toUpperCase()} ${url}:`, error.response?.data || error.message);
    Logger.error('Full error object:', error);
    throw error;
  }
};

// �� Fetch workout data for the current day
const getWorkoutData = async () => {
  return requestHandler("get", `${API_URL}/today`);
};

// 🔹 Fetch all workout logs for the authenticated user with pagination
const getWorkoutLogs = async (options = {}) => {
  try {
    const { page = 1, limit = 30, sortBy = 'date', order = 'desc', fields = null, useETag = false } = options;

    const response = await requestHandler("get", API_URL, null, {
      useETag,
      fields,
      params: { page, limit, sortBy, order }
    });

    // Handle cached response (304 Not Modified)
    if (response.cached) {
      return { cached: true };
    }

    // Handle new paginated response format
    if (response.data && Array.isArray(response.data)) {
      return {
        data: response.data,
        pagination: response.pagination || null
      };
    }

    // Fallback for old format (direct array)
    if (Array.isArray(response)) {
      return { data: response, pagination: null };
    }

    return { data: [], pagination: null };
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

// 🔹 Bulk create workout logs for mobile sync
const bulkCreateWorkoutLogs = async (workouts) => {
  try {
    if (!Array.isArray(workouts) || workouts.length === 0) {
      throw new Error('Workouts array is required and cannot be empty');
    }

    if (workouts.length > 100) {
      throw new Error('Cannot process more than 100 workouts at once');
    }

    Logger.debug('🔹 Bulk creating workout logs:', { count: workouts.length });

    // Format each workout
    const formattedWorkouts = workouts.map(workout => ({
      date: workout.date instanceof Date ? workout.date.toISOString() : new Date(workout.date).toISOString(),
      activityType: String(workout.activityType).trim(),
      duration: Math.max(0, Number(workout.duration) || 0),
      caloriesBurned: Math.max(0, Number(workout.caloriesBurned) || 0),
      heartRate: Math.max(0, Number(workout.heartRate) || 0),
      feedback: String(workout.feedback || '').trim()
    }));

    const result = await requestHandler("post", `${API_URL}/bulk`, { workouts: formattedWorkouts });
    Logger.info(`✅ Successfully bulk created ${result.insertedCount} workout logs`);
    return result;
  } catch (error) {
    Logger.error('❌ Failed to bulk create workout logs:', error);
    throw error;
  }
};

// 🔹 Clear ETag cache (useful for forcing refresh)
const clearCache = () => {
  etagCache.clear();
  Logger.debug('ETag cache cleared');
};

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
  bulkCreateWorkoutLogs,
  updateWorkoutData,
  clearCache
};
