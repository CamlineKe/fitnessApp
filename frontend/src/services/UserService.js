import axios from '../axiosConfig';
import Logger from '../utils/logger';

const API_URL = `/users`;

// Register User Function
const registerUser = async (userData) => {
    try {
        const response = await axios.post(`${API_URL}/register`, userData);
        return response.data;
    } catch (error) {
        Logger.error("Registration error:", error.response?.data || error.message);
        throw error;
    }
};

// Login User Function
const loginUser = async (userData) => {
    try {
        const formattedUserData = {
            email: userData.email.toLowerCase(),
            password: userData.password
        };

        const response = await axios.post(`${API_URL}/login`, formattedUserData);

        if (!response.data.user) {
            throw new Error("Invalid response: Missing user data");
        }

        return response.data;
    } catch (error) {
        Logger.error("Login failed:", error.response?.data || error.message);
        throw error;
    }
};

// Get User Profile Function
const getUserProfile = async () => {
    try {
        const response = await axios.get(`${API_URL}/profile`);
        return response.data;
    } catch (error) {
        Logger.error('Profile fetch error:', error.response?.data || error.message);
        throw error;
    }
};

// Update User Profile Function
const updateUserProfile = async (userData) => {
    try {
        const response = await axios.put(`${API_URL}/profile`, userData);

        if (!response.data || !response.data.user) {
            throw new Error("Invalid response: No user data returned");
        }

        return {
            user: response.data.user
        };
    } catch (error) {
        Logger.error("Profile update error:", error.response?.data || error.message);
        throw error;
    }
};

// Change Password Function
const changePassword = async ({ currentPassword, newPassword }) => {
    try {
        const response = await axios.put(
            `${API_URL}/change-password`,
            { currentPassword, newPassword }
        );

        if (!response.data) {
            throw new Error("Invalid response from server");
        }

        return response.data;
    } catch (error) {
        Logger.error("Change password error:", error.response?.data || error.message);
        throw error;
    }
};

// Logout Function
const logoutUser = async () => {
    try {
        const response = await axios.post(`${API_URL}/logout`);
        return response.data;
    } catch (error) {
        Logger.error("Logout error:", error.response?.data || error.message);
        throw error;
    }
};

export default {
    registerUser,
    loginUser,
    getUserProfile,
    updateUserProfile,
    changePassword,
    logoutUser
};
