import axios from "axios";

// Define the base API URL for nutrition-related requests
const API_URL = `${import.meta.env.VITE_API_URL}/nutrition`;

// Helper function to get the authentication token
const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  if (!token) {
    console.warn("No authentication token found!");
    return {}; // Ensures headers object is always returned to prevent crashes
  }
  return { Authorization: `Bearer ${token}` };
};

// Function to fetch nutrition data from the server
export const getNutritionData = async () => {
  try {
    const response = await axios.get(API_URL, { headers: getAuthHeaders() });
    const logs = response.data;

    // Calculate daily totals from today's logs
    const today = new Date().setHours(0, 0, 0, 0);
    const todaysLogs = logs.filter(log => new Date(log.date).setHours(0, 0, 0, 0) === today);

    const dailyTotals = todaysLogs.reduce((acc, log) => ({
      calories: acc.calories + (log.calories || 0),
      macronutrients: {
        protein: acc.macronutrients.protein + (log.macronutrients?.protein || 0),
        carbohydrates: acc.macronutrients.carbohydrates + (log.macronutrients?.carbohydrates || 0),
        fats: acc.macronutrients.fats + (log.macronutrients?.fats || 0)
      }
    }), {
      calories: 0,
      macronutrients: { protein: 0, carbohydrates: 0, fats: 0 }
    });

    // Get all logs from the past 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);
    
    const weeklyLogs = logs.filter(log => new Date(log.date) >= sevenDaysAgo);

    return {
      ...dailyTotals,
      mealLogs: weeklyLogs  // Return the weekly logs instead of just today's
    };
  } catch (error) {
    console.error(
      `Error fetching nutrition data (Status: ${error.response?.status}):`,
      error.response?.data || error.message
    );
    throw error;
  }
};

// Function to get meal logs for a user
export const getMealLogs = async (userId) => {
  try {
    const response = await axios.get(`${API_URL}/logs/${userId}`, { headers: getAuthHeaders() });
    return response.data;
  } catch (error) {
    console.error(
      `Error fetching meal logs (Status: ${error.response?.status}):`,
      error.response?.data || error.message
    );
    throw error;
  }
};

// Function to create a new nutrition log
export const createNutritionLog = async (nutritionLog) => {
  try {
    const response = await axios.post(API_URL, nutritionLog, { headers: getAuthHeaders() });
    return response.data;
  } catch (error) {
    console.error(
      `Error creating nutrition log (Status: ${error.response?.status}):`,
      error.response?.data || error.message
    );
    throw error; // Propagate error to component
  }
};

// Function to update an existing nutrition log by ID
export const updateNutritionLog = async (id, updatedNutritionLog) => {
  try {
    const response = await axios.put(`${API_URL}/${id}`, updatedNutritionLog, { headers: getAuthHeaders() });
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
    const response = await axios.delete(`${API_URL}/${id}`, { headers: getAuthHeaders() });
    return response.data;
  } catch (error) {
    console.error(
      `Error deleting nutrition log (Status: ${error.response?.status}):`,
      error.response?.data || error.message
    );
    throw error; // Propagate error to component
  }
};