import React, { createContext, useState, useCallback } from "react";
import axios from "../axiosConfig"; // ✅ Use configured axios instance
import Logger from '../utils/logger';

export const UserContext = createContext(null);
const API_URL = `/users/profile`;

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

  const [loading, setLoading] = useState(false);

  // ✅ Fetch user profile using cookie-based auth
  const fetchUser = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(API_URL);

      if (!response.data) throw new Error("No user data returned from server.");

      setUser(response.data);
      localStorage.setItem("user", JSON.stringify(response.data));
    } catch (error) {
      Logger.error("Authentication error:", error.response?.data || error.message);

      if (error.response?.status === 401) {
        Logger.warn("Authentication failed. Logging out...");
        logout();
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // ✅ Login with cookie-based auth
  const login = async (userData) => {
    if (!userData) {
      Logger.error("Login error: Missing user data.");
      return;
    }

    // ✅ Token is now stored in httpOnly cookie by backend
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
  };

  // ✅ Logout - clears cookies via backend call
  const logout = useCallback(async () => {
    Logger.info("Logging out...");
    try {
      // Call logout endpoint to clear httpOnly cookies
      await axios.post('/users/logout');
    } catch (error) {
      Logger.error("Logout error:", error);
    } finally {
      localStorage.removeItem("user");
      setUser(null);
    }
  }, []);

  // ✅ Update user - no token storage needed
  const updateUser = async (userData) => {
    try {
      if (!userData) {
        Logger.error("Update failed: No user data provided");
        return;
      }

      // Update user data in localStorage and state only
      localStorage.setItem("user", JSON.stringify(userData));
      setUser(userData);
    } catch (error) {
      Logger.error("Error updating user context:", error);
      logout();
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