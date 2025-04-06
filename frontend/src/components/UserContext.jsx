import React, { createContext, useState, useCallback } from "react";
import axios from "axios";
import Logger from '../utils/logger';

export const UserContext = createContext(null);
const API_URL = `${import.meta.env.VITE_API_URL}/users/profile`; // 

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const storedUser = localStorage.getItem("user");
      return storedUser ? JSON.parse(storedUser) : null;
    } catch (error) {
      Logger.error("Error parsing user from localStorage:", error);
      return null;
    }
  });

  const [loading, setLoading] = useState(false); // 

  // 
  const fetchUser = useCallback(async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      console.warn(" No authentication token found. User is not logged in.");
      setUser(null);
      return;
    }

    try {
      setLoading(true);
      const response = await axios.get(API_URL, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.data) throw new Error("No user data returned from server.");

      setUser(response.data);
      localStorage.setItem("user", JSON.stringify(response.data)); // 
    } catch (error) {
      Logger.error("Authentication error:", error.response?.data || error.message);

      if (error.response?.status === 401) {
        console.warn(" Token expired or invalid. Logging out...");
        logout();
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // 
  const login = async (userData, token) => {
    if (!token || !userData) {
      Logger.error("Login error: Missing token or user data.");
      return;
    }

    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);

    await fetchUser(); // 
  };

  // 
  const logout = useCallback(() => {
    Logger.info("Logging out...");
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  }, []);

  // 
  const updateUser = async (userData, newToken) => {
    try {
      if (!userData) {
        Logger.error("Update failed: No user data provided");
        return;
      }

      // Update token if provided
      if (newToken) {
        localStorage.setItem("token", newToken);
        // Update axios default headers
        axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
      }

      // Update user data in localStorage and state
      localStorage.setItem("user", JSON.stringify(userData));
      setUser(userData);

      // Verify the update was successful by fetching fresh user data
      await fetchUser();
    } catch (error) {
      Logger.error("Error updating user context:", error);
      // If there's an error, try to recover by fetching fresh user data
      await fetchUser();
    }
  };

  return (
    <UserContext.Provider value={{ user, setUser, login, logout, updateUser, fetchUser, loading }}>
      {children}
    </UserContext.Provider>
  );
};

// Export the provider as a named export
export { UserProvider as Provider };