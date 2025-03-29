import axios from 'axios';

const API_URL = `${import.meta.env.VITE_API_URL}/users`;

// Register User Function
const registerUser = async (userData) => {
    try {
        const response = await axios.post(`${API_URL}/register`, userData, {
            headers: { 'Content-Type': 'application/json' }
        });
        return response.data;
    } catch (error) {
        console.error("Registration error:", error.response?.data || error.message);
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

        const response = await axios.post(`${API_URL}/login`, formattedUserData, {
            headers: { 'Content-Type': 'application/json' }
        });

        if (!response.data.token || !response.data.user) {
            throw new Error("Invalid response: Missing token or user data");
        }

        return response.data;
    } catch (error) {
        console.error("Login failed:", error.response?.data || error.message);
        throw error;
    }
};

// Get auth headers helper
const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('No authentication token found');
    return { Authorization: `Bearer ${token}` };
};

// Get User Profile Function
const getUserProfile = async () => {
    try {
        const response = await axios.get(`${API_URL}/profile`, {
            headers: getAuthHeaders()
        });
        return response.data;
    } catch (error) {
        console.error('Profile fetch error:', error.response?.data || error.message);
        throw error;
    }
};

// Update User Profile Function
const updateUserProfile = async (userData) => {
    try {
        const response = await axios.put(`${API_URL}/profile`, userData, {
            headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' }
        });

        if (!response.data || !response.data.user) {
            throw new Error("Invalid response: No user data returned");
        }

        return {
            user: response.data.user,
            token: response.data.token
        };
    } catch (error) {
        console.error("Profile update error:", error.response?.data || error.message);
        throw error;
    }
};

// Change Password Function
const changePassword = async ({ currentPassword, newPassword }) => {
    try {
        const response = await axios.put(
            `${API_URL}/change-password`,
            { currentPassword, newPassword },
            { headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' } }
        );

        if (!response.data) {
            throw new Error("Invalid response from server");
        }

        return response.data;
    } catch (error) {
        console.error("Change password error:", error.response?.data || error.message);
        throw error;
    }
};

export default {
    registerUser,
    loginUser,
    getUserProfile,
    updateUserProfile,
    changePassword
};
