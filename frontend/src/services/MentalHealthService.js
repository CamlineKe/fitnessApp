import axios from "axios";
import Logger from '../utils/logger';

const API_URL = `${import.meta.env.VITE_API_URL}/mentalhealth`;

// Fetch mental health logs for the authenticated user
export const getMentalHealthData = async (userId) => {
  if (!userId) {
    throw new Error("User ID is required to fetch mental health data");
  }

  const token = localStorage.getItem("token");
  if (!token) {
    throw new Error("Please log in to view your mental health data");
  }

  try {
    Logger.debug("API URL being called:", API_URL);
    Logger.debug("User ID:", userId);
    Logger.debug("Token:", token ? "Present" : "Missing");
    
    const response = await axios.get(API_URL, {
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
    });

    Logger.info("Response from server:", response.data);

    if (!response.data) {
      Logger.error("No data in response");
      return []; // Return empty array instead of throwing error
    }

    if (!Array.isArray(response.data)) {
      Logger.debug("Converting non-array response to array");
      return [response.data]; // Convert single item to array
    }

    return response.data;
  } catch (error) {
    Logger.error("Full error details:", {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      config: {
        url: error.config?.url,
        method: error.config?.method,
        headers: error.config?.headers
      }
    });

    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      throw new Error("Your session has expired. Please log in again");
    }
    if (error.response?.status === 404) {
      Logger.error("API endpoint not found. Please check the URL configuration.");
      return []; // Return empty array for no records instead of throwing error
    }
    throw new Error(error.response?.data?.message || "Failed to fetch mental health data");
  }
};

// Log daily check-in (POST request)
export const logDailyCheckIn = async (checkInData) => {
  const token = localStorage.getItem("token");
  if (!token) {
    throw new Error("Please log in to submit your check-in");
  }

  if (!checkInData || Object.keys(checkInData).length === 0) {
    throw new Error("Invalid check-in data provided");
  }

  if (!["happy", "sad", "anxious", "neutral"].includes(checkInData.mood)) {
    throw new Error("Please select a valid mood");
  }

  if (
    typeof checkInData.stressLevel !== "number" ||
    checkInData.stressLevel < 0 ||
    checkInData.stressLevel > 10
  ) {
    throw new Error("Stress Level must be a number between 0 and 10");
  }

  if (
    typeof checkInData.sleepQuality !== "number" ||
    checkInData.sleepQuality < 0 ||
    checkInData.sleepQuality > 10
  ) {
    throw new Error("Sleep Quality must be a number between 0 and 10");
  }

  try {
    Logger.debug("API URL for POST:", API_URL);
    Logger.debug("Submitting check-in data:", checkInData);
    
    const { userId, ...dataToSend } = checkInData;
    
    const response = await axios.post(API_URL, dataToSend, {
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
    });
    
    Logger.info("Check-in response:", response.data);
    return response.data;
  } catch (error) {
    Logger.error("Error submitting check-in:", {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      config: {
        url: error.config?.url,
        method: error.config?.method,
        headers: error.config?.headers
      }
    });

    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      throw new Error("Your session has expired. Please log in again");
    }
    throw new Error(error.response?.data?.message || "Failed to submit check-in");
  }
};
