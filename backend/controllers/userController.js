import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Workout from '../models/Workout.js';
import Nutrition from '../models/Nutrition.js';
import MentalHealth from '../models/MentalHealth.js';
import Gamification from '../models/Gamification.js';
import Logger from '../utils/logger.js';

dotenv.config();

// Cookie configuration
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
};

const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
};

// Generate Access Token (short-lived: 15 minutes)
const generateAccessToken = (user) => {
  return jwt.sign(
    { userId: user._id, email: user.email, username: user.username },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  );
};

// Generate Refresh Token (long-lived: 30 days)
const generateRefreshToken = (user) => {
  return jwt.sign(
    { userId: user._id, type: 'refresh' },
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
    { expiresIn: '30d' }
  );
};

// Set auth cookies helper
const setAuthCookies = (res, accessToken, refreshToken) => {
  res.cookie('accessToken', accessToken, COOKIE_OPTIONS);
  res.cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTIONS);
};

// Clear auth cookies helper
const clearAuthCookies = (res) => {
  res.clearCookie('accessToken', COOKIE_OPTIONS);
  res.clearCookie('refreshToken', REFRESH_COOKIE_OPTIONS);
};

// Register User (Now initializes default data)
export const registerUser = async (req, res) => {
  try {
    const { username, email, password, firstName, lastName, dateOfBirth, gender } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: 'Username already exists' });
    }

    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    // Create new user (Model will hash password)
    const user = new User({
      username,
      email,
      password,  // Stored raw, will be auto-hashed
      firstName,
      lastName,
      dateOfBirth,
      gender,
      isAdmin: false, // Default as non-admin
    });

    await user.save();
    Logger.info("User registered successfully:", user);

    // Initialize default data for the user
    await initializeDefaultData(user._id);

    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Store refresh token hash in database
    const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
    user.refreshToken = refreshTokenHash;
    user.refreshTokenExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    await user.save();

    // Set httpOnly cookies
    setAuthCookies(res, accessToken, refreshToken);

    Logger.info("User registered successfully:", user.username);

    res.status(201).json({
      message: 'User registered successfully',
      user: { id: user._id, username, email, firstName, lastName, dateOfBirth, gender },
    });

  } catch (error) {
    Logger.error("Registration error:", error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

// Initialize Default Data for New Users
const initializeDefaultData = async (userId) => {
  try {
    // Default workout plan
    await Workout.create({
      userId,
      date: new Date(),
      activityType: "Not Started",
      duration: 1,  // Set minimum duration since it's required
      caloriesBurned: 0,
      heartRate: 0,
      feedback: "",
    });

    // Default nutrition data
    await Nutrition.create({
      userId,
      dailyCalories: 0,
      mealType: "breakfast",  // Set a default meal type
      foodItems: ["Initial meal"],  // Add a default food item since it's required
      calories: 0,
      macronutrients: {
        protein: 0,
        carbohydrates: 0,
        fats: 0,
      },
    });

    // Default mental health data
    await MentalHealth.create({
      userId,
      date: new Date(),
      stressLevel: 5, // Default to neutral stress level
      mood: "neutral", // Default to neutral mood
      sleepQuality: 5, // Default to neutral sleep quality
      notes: "Initial check-in"
    });

    // Default gamification data with complete achievement structure
    const defaultAchievements = [
      {
        id: 'first_workout',
        name: 'First Step',
        description: 'Complete your first workout',
        category: 'workout',
        unlocked: false,
        progress: 0,
        icon: 'FaRunning'
      },
      {
        id: 'workout_streak',
        name: 'Consistency King',
        description: 'Maintain a 7-day workout streak',
        category: 'workout',
        unlocked: false,
        progress: 0,
        icon: 'FaFire'
      },
      {
        id: 'strength_master',
        name: 'Strength Master',
        description: 'Complete 10 strength training sessions',
        category: 'workout',
        unlocked: false,
        progress: 0,
        icon: 'FaDumbbell'
      },
      {
        id: 'cardio_champion',
        name: 'Cardio Champion',
        description: 'Burn 5000 total calories',
        category: 'workout',
        unlocked: false,
        progress: 0,
        icon: 'FaHeart'
      },
      {
        id: 'meditation_master',
        name: 'Meditation Master',
        description: 'Complete 5 meditation sessions',
        category: 'mental',
        unlocked: false,
        progress: 0,
        icon: 'GiMeditation'
      },
      {
        id: 'mood_tracker',
        name: 'Mood Tracking Pro',
        description: 'Log your mood for 7 consecutive days',
        category: 'mental',
        unlocked: false,
        progress: 0,
        icon: 'FaBrain'
      },
      {
        id: 'hydration_hero',
        name: 'Hydration Hero',
        description: 'Meet daily water intake goal 5 times',
        category: 'nutrition',
        unlocked: false,
        progress: 0,
        icon: 'FaWater'
      },
      {
        id: 'nutrition_master',
        name: 'Nutrition Master',
        description: 'Log all meals for 7 consecutive days',
        category: 'nutrition',
        unlocked: false,
        progress: 0,
        icon: 'FaAppleAlt'
      }
    ];

    await Gamification.create({
      userId,
      streaks: {
        workoutStreak: 0,
        mentalStreak: 0,
        nutritionStreak: 0,
        lastWorkoutDate: null,
        lastMentalDate: null,
        lastNutritionDate: null
      },
      points: {
        workout: 0,
        mental: 0,
        nutrition: 0
      },
      level: 1,
      achievements: defaultAchievements,
      challenges: [],
      waterIntake: {
        daily: 0,
        target: 2000,
        lastUpdated: new Date()
      },
      moodLog: []
    });

    Logger.info("Default data initialized for user:", userId);
  } catch (error) {
    Logger.error("Error initializing default data:", error);
    throw error; // Re-throw to handle in the calling function
  }
};


// Login User (with httpOnly cookies and refresh tokens)
export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    // Generate new tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Store refresh token hash in database
    const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
    user.refreshToken = refreshTokenHash;
    user.refreshTokenExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    await user.save();

    // Set httpOnly cookies
    setAuthCookies(res, accessToken, refreshToken);

    res.json({
      message: 'Login successful',
      user: { 
        id: user._id, 
        email: user.email, 
        username: user.username, 
        firstName: user.firstName, 
        lastName: user.lastName, 
        dateOfBirth: user.dateOfBirth, 
        gender: user.gender,
        healthGoals: user.healthGoals 
      },
    });

  } catch (error) {
    Logger.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Refresh Access Token
export const refreshAccessToken = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({ message: 'No refresh token provided' });
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET);
    
    if (!decoded.userId || decoded.type !== 'refresh') {
      return res.status(403).json({ message: 'Invalid refresh token' });
    }

    // Find user and verify stored hash
    const user = await User.findById(decoded.userId);
    if (!user || !user.refreshToken) {
      return res.status(403).json({ message: 'Invalid refresh token' });
    }

    // Check if refresh token is expired in database
    if (user.refreshTokenExpiresAt && new Date() > user.refreshTokenExpiresAt) {
      return res.status(403).json({ message: 'Refresh token expired. Please log in again.' });
    }

    // Verify the refresh token hash matches
    const isValid = await bcrypt.compare(refreshToken, user.refreshToken);
    if (!isValid) {
      return res.status(403).json({ message: 'Invalid refresh token' });
    }

    // Generate new access token
    const newAccessToken = generateAccessToken(user);

    // Set new access token cookie
    res.cookie('accessToken', newAccessToken, COOKIE_OPTIONS);

    res.json({ message: 'Token refreshed successfully' });

  } catch (error) {
    Logger.error('Token refresh error:', error);
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Refresh token expired. Please log in again.' });
    }
    res.status(403).json({ message: 'Invalid refresh token' });
  }
};

// Logout User (clear cookies and invalidate refresh token)
export const logoutUser = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    
    // Invalidate refresh token in database if exists
    if (refreshToken) {
      try {
        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId);
        if (user) {
          user.refreshToken = null;
          user.refreshTokenExpiresAt = null;
          await user.save();
        }
      } catch (e) {
        // Token invalid, just clear cookies
      }
    }

    // Clear cookies
    clearAuthCookies(res);

    res.json({ message: 'Logout successful' });
  } catch (error) {
    Logger.error('Logout error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get User Profile (Unchanged)
export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    // Return consistent format with login/register
    res.json({
      id: user._id,
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      dateOfBirth: user.dateOfBirth,
      gender: user.gender,
      healthGoals: user.healthGoals,
      isAdmin: user.isAdmin
    });
  } catch (error) {
    Logger.error('Error fetching user profile:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

// Update User Profile 
export const updateUserProfile = async (req, res) => {
  try {
    const { firstName, lastName, dateOfBirth, gender, healthGoals } = req.body;

    const updateFields = {};
    if (firstName !== undefined) updateFields.firstName = firstName;
    if (lastName !== undefined) updateFields.lastName = lastName;
    if (dateOfBirth !== undefined) updateFields.dateOfBirth = dateOfBirth;
    if (gender !== undefined) updateFields.gender = gender;
    if (healthGoals !== undefined) updateFields.healthGoals = healthGoals;

    const user = await User.findByIdAndUpdate(
      req.user._id, 
      { $set: updateFields },  
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const token = generateToken(user);

    res.json({ 
      message: "Profile updated successfully", 
      token,
      user: { 
        id: user._id, 
        username: user.username, 
        email: user.email, 
        firstName: user.firstName, 
        lastName: user.lastName, 
        dateOfBirth: user.dateOfBirth, 
        gender: user.gender,
        healthGoals: user.healthGoals,
        isAdmin: user.isAdmin 
      }
    });

  } catch (error) {
    Logger.error("Profile update error:", error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

// Change User Password
export const changeUserPassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Validate password requirements
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters long' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Use the comparePassword method from the User model
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    // Set the new password - it will be hashed by the pre-save middleware
    user.password = newPassword;
    await user.save();

    // Generate new token since credentials changed
    const token = generateToken(user);

    res.json({ 
      message: 'Password changed successfully',
      token
    });
  } catch (error) {
    Logger.error('Password change error:', error);
    res.status(500).json({ message: 'Failed to change password' });
  }
};

// Get All Users (Unchanged)
export const getAllUsers = async (req, res) => {
  try {
    if (!req.user || !req.user.isAdmin) {
      return res.status(403).json({ message: "Access denied. Admins only." });
    }

    const users = await User.find().select('-password');
    res.json(users);
  } catch (error) {
    Logger.error('Error fetching all users:', error);
    res.status(500).json({ message: 'Server error' });
  }
};