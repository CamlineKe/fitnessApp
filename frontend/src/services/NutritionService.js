import axios from "../axiosConfig";

// Define the base API URL for nutrition-related requests
const API_URL = `/nutrition`;

/**
 * Fetch paginated nutrition logs from the server
 * @param {Object} options - Query options
 * @param {number} options.page - Page number (default: 1)
 * @param {number} options.limit - Items per page (default: 20, max: 100)
 * @param {string} options.startDate - Filter start date (ISO 8601)
 * @param {string} options.endDate - Filter end date (ISO 8601)
 * @param {string} options.mealType - Filter by meal type
 * @returns {Promise<{data: Array, pagination: Object}>}
 */
export const getNutritionData = async (options = {}) => {
  try {
    const { page = 1, limit = 20, startDate, endDate, mealType } = options;
    
    // Build query params
    const params = new URLSearchParams();
    params.append('page', page);
    params.append('limit', limit);
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    if (mealType) params.append('mealType', mealType);
    
    const response = await axios.get(`${API_URL}?${params.toString()}`);
    return response.data; // { data: [...], pagination: {...} }
  } catch (error) {
    console.error(
      `Error fetching nutrition data (Status: ${error.response?.status}):`,
      error.response?.data || error.message
    );
    throw error;
  }
};

/**
 * Fetch nutrition stats (daily/weekly/monthly aggregation)
 * @param {string} period - 'daily' | 'weekly' | 'monthly'
 * @param {string} startDate - Filter start date (ISO 8601)
 * @param {string} endDate - Filter end date (ISO 8601)
 * @returns {Promise<{period: string, data: Array, summary: Object}>}
 */
export const getNutritionStats = async (period = 'daily', startDate, endDate) => {
  try {
    const params = new URLSearchParams();
    params.append('period', period);
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    const response = await axios.get(`${API_URL}/stats/summary?${params.toString()}`);
    return response.data;
  } catch (error) {
    console.error(
      `Error fetching nutrition stats (Status: ${error.response?.status}):`,
      error.response?.data || error.message
    );
    throw error;
  }
};

// Function to create a new nutrition log
export const createNutritionLog = async (nutritionLog) => {
  try {
    const response = await axios.post(API_URL, nutritionLog);
    return response.data;
  } catch (error) {
    console.error(
      `Error creating nutrition log (Status: ${error.response?.status}):`,
      error.response?.data || error.message
    );
    throw error;
  }
};

/**
 * Bulk create multiple nutrition logs
 * @param {Array} logs - Array of nutrition log objects (max 50)
 * @returns {Promise<{message: string, count: number, logs: Array}>}
 */
export const bulkCreateNutritionLogs = async (logs) => {
  try {
    const response = await axios.post(`${API_URL}/bulk`, { logs });
    return response.data;
  } catch (error) {
    console.error(
      `Error bulk creating nutrition logs (Status: ${error.response?.status}):`,
      error.response?.data || error.message
    );
    throw error;
  }
};

// Function to update an existing nutrition log by ID
export const updateNutritionLog = async (id, updatedNutritionLog) => {
  try {
    const response = await axios.put(`${API_URL}/${id}`, updatedNutritionLog);
    return response.data;
  } catch (error) {
    console.error(
      `Error updating nutrition log (Status: ${error.response?.status}):`,
      error.response?.data || error.message
    );
    throw error; // Propagate error to component
  }
};

// Function to delete a nutrition log by ID
export const deleteNutritionLog = async (id) => {
  try {
    const response = await axios.delete(`${API_URL}/${id}`);
    return response.data;
  } catch (error) {
    console.error(
      `Error deleting nutrition log (Status: ${error.response?.status}):`,
      error.response?.data || error.message
    );
    throw error; // Propagate error to component
  }
};