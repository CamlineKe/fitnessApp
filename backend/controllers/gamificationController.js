import Gamification from '../models/Gamification.js';
import Logger from '../utils/logger.js';

// Helper function to initialize gamification data
const initializeGamificationData = async (userId) => {
  return await Gamification.create({
    userId,
    points: { workout: 0, mental: 0, nutrition: 0 },
    level: 1,
    streaks: {
      workoutStreak: 0,
      mentalStreak: 0,
      nutritionStreak: 0,
      currentStreak: 0,
      bestStreak: 0,
      lastWorkoutDate: null,
      lastMentalDate: null,
      lastNutritionDate: null
    },
    achievements: [],
    challenges: [
      {
        id: 'welcome',
        name: 'Welcome Challenge',
        description: 'Complete your first activity in each category',
        category: 'workout',
        target: 100,
        progress: 0,
        completed: false,
        startDate: new Date(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      }
    ],
    moodLog: [],
    stats: {
      totalWorkoutTime: 0,
      totalCaloriesBurned: 0,
      totalMealsLogged: 0,
      totalMoodChecks: 0
    }
  });
};

// Helper function to calculate effective streak status
const calculateEffectiveStreak = (streakValue, lastActivityDate) => {
  if (!lastActivityDate) {
    return { value: 0, status: 'new' };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const lastDate = new Date(lastActivityDate);
  lastDate.setHours(0, 0, 0, 0);
  const diffDays = Math.floor((today - lastDate) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return { value: streakValue, status: 'active' };
  } else if (diffDays === 1) {
    return { value: streakValue, status: 'at-risk' };
  } else {
    return { value: 0, status: 'broken' };
  }
};

// Get gamification data
export const getGamificationData = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    let gamificationData = await Gamification.findOne({ userId: req.user._id });

    // Initialize if not exists
    if (!gamificationData) {
      gamificationData = await initializeGamificationData(req.user._id);
    }

    // Calculate effective streaks for real-time status
    const effectiveStreaks = {
      workout: calculateEffectiveStreak(
        gamificationData.streaks.workoutStreak,
        gamificationData.streaks.lastWorkoutDate
      ),
      mental: calculateEffectiveStreak(
        gamificationData.streaks.mentalStreak,
        gamificationData.streaks.lastMentalDate
      ),
      nutrition: calculateEffectiveStreak(
        gamificationData.streaks.nutritionStreak,
        gamificationData.streaks.lastNutritionDate
      )
    };

    // Calculate overall effective current streak (max of all effective streaks)
    const overallCurrentStreak = Math.max(
      effectiveStreaks.workout.value,
      effectiveStreaks.mental.value,
      effectiveStreaks.nutrition.value
    );

    const responseData = {
      ...gamificationData.toObject(),
      effectiveStreaks,
      effectiveCurrentStreak: overallCurrentStreak
    };

    res.json(responseData);
  } catch (error) {
    Logger.error('Error getting gamification data:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Initialize gamification data
export const initializeGamification = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    let gamificationData = await Gamification.findOne({ userId: req.user._id });
    
    // Initialize if not exists
    if (!gamificationData) {
      gamificationData = await initializeGamificationData(req.user._id);
    }

    res.json(gamificationData);
  } catch (error) {
    Logger.error('Error initializing gamification:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update points
export const updatePoints = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { activity, data } = req.body;
    Logger.debug('Updating points:', { activity, data });

    // Validate request data
    if (!activity || !data) {
      return res.status(400).json({ 
        message: 'Invalid request data',
        details: 'Both activity and data are required'
      });
    }

    // Validate activity type
    if (!['workout', 'mental', 'nutrition'].includes(activity)) {
      return res.status(400).json({ 
        message: 'Invalid activity type',
        details: `Activity must be one of: workout, mental, nutrition. Received: ${activity}`
      });
    }

    // Calculate points based on activity type
    let pointsEarned = 0;
    const statsUpdate = {};

    switch (activity) {
      case 'workout':
        // Validate workout data
        if (!data.duration || !data.caloriesBurned) {
          return res.status(400).json({
            message: 'Invalid workout data',
            details: 'Duration and caloriesBurned are required for workout activities'
          });
        }
        pointsEarned = Math.floor(Number(data.duration) / 10) + Math.floor(Number(data.caloriesBurned) / 100);
        statsUpdate.totalWorkoutTime = Number(data.duration);
        statsUpdate.totalCaloriesBurned = Number(data.caloriesBurned);
        break;
      case 'mental':
        pointsEarned = 10;
        statsUpdate.totalMoodChecks = 1;
        break;
      case 'nutrition':
        pointsEarned = 5;
        if (data.macronutrients) {
          const total = data.macronutrients.protein + data.macronutrients.carbohydrates + data.macronutrients.fats;
          if (total > 0) {
            const isBalanced = 
              data.macronutrients.protein / total >= 0.2 && 
              data.macronutrients.carbohydrates / total >= 0.3 && 
              data.macronutrients.fats / total >= 0.2;
            if (isBalanced) pointsEarned += 5;
          }
        }
        statsUpdate.totalMealsLogged = 1;
        break;
    }

    // Atomic update using findOneAndUpdate to prevent race conditions
    let gamificationData = await Gamification.findOne({ userId: req.user._id });
    
    if (!gamificationData) {
      Logger.debug('No gamification data found, initializing...');
      gamificationData = await initializeGamificationData(req.user._id);
    }

    // Calculate new level before atomic update
    const currentTotalPoints = 
      gamificationData.points.workout + 
      gamificationData.points.mental + 
      gamificationData.points.nutrition;
    const newTotalPoints = currentTotalPoints + pointsEarned;
    const currentLevel = gamificationData.level;
    const newLevel = Math.floor(newTotalPoints / 100) + 1;
    const leveledUp = newLevel > currentLevel;

    // Build atomic update operations
    const updateOps = {
      $inc: { [`points.${activity}`]: pointsEarned }
    };

    // Add stats increments
    Object.keys(statsUpdate).forEach(key => {
      updateOps.$inc[`stats.${key}`] = statsUpdate[key];
    });

    // Update level if needed
    if (leveledUp) {
      updateOps.$set = { level: newLevel };
    }

    // Atomic update - prevents race conditions
    gamificationData = await Gamification.findOneAndUpdate(
      { userId: req.user._id },
      updateOps,
      { new: true, upsert: true }
    );
    
    // Get Socket.IO instance
    const io = req.app.get('io');
    
    // Prepare response data
    const responseData = { 
      points: pointsEarned, 
      total: newTotalPoints, 
      level: gamificationData.level,
      leveledUp,
      activityPoints: gamificationData.points[activity]
    };
    
    // Emit real-time events if Socket.IO is available
    if (io) {
      // Emit to user's personal room
      io.to(`user_${req.user._id}`).emit('points_updated', responseData);
      
      // If user leveled up, emit a special event
      if (leveledUp) {
        io.to(`user_${req.user._id}`).emit('level_up', {
          newLevel: gamificationData.level,
          totalPoints: newTotalPoints
        });
      }
    }

    res.json(responseData);
  } catch (error) {
    Logger.error('Error updating points:', error);
    res.status(500).json({ 
      message: 'Server error',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Update streak
export const updateStreak = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { category } = req.body;
    Logger.debug('Updating streak for category:', category);

    if (!['workout', 'mental', 'nutrition'].includes(category)) {
      return res.status(400).json({ 
        message: 'Invalid category',
        details: `Category must be one of: workout, mental, nutrition. Received: ${category}`
      });
    }

    const categoryCapitalized = category.charAt(0).toUpperCase() + category.slice(1);
    const streakKey = `${category}Streak`;
    const lastDateKey = `last${categoryCapitalized}Date`;
    
    // Fetch current data for streak calculation
    let gamificationData = await Gamification.findOne({ userId: req.user._id });
    if (!gamificationData) {
      gamificationData = await initializeGamificationData(req.user._id);
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const lastActivityDate = gamificationData.streaks[lastDateKey];
    let streakUpdate = {};
    let currentStreakValue = gamificationData.streaks[streakKey];
    
    if (!lastActivityDate) {
      // First activity ever
      streakUpdate[streakKey] = 1;
      streakUpdate[lastDateKey] = today;
      currentStreakValue = 1;
      Logger.debug('First activity ever, setting streak to 1');
    } else {
      const lastDate = new Date(lastActivityDate);
      lastDate.setHours(0, 0, 0, 0);
      const diffDays = Math.floor((today - lastDate) / (1000 * 60 * 60 * 24));

      if (diffDays === 0) {
        // Already logged today, streak stays the same
        Logger.debug('Activity already logged today, maintaining streak');
      } else if (diffDays === 1) {
        // Activity done on consecutive day, increase streak
        Logger.debug('Consecutive day activity, increasing streak');
        streakUpdate[streakKey] = gamificationData.streaks[streakKey] + 1;
        streakUpdate[lastDateKey] = today;
        currentStreakValue = streakUpdate[streakKey];
      } else {
        // Break in streak, reset to 1
        Logger.debug('Break in streak, resetting to 1');
        streakUpdate[streakKey] = 1;
        streakUpdate[lastDateKey] = today;
        currentStreakValue = 1;
      }
    }

    // If no update needed (already logged today), return current state
    if (Object.keys(streakUpdate).length === 0) {
      return res.json({
        streaks: gamificationData.streaks,
        message: `${category} streak unchanged - already logged today`
      });
    }

    // Calculate overall streak metrics
    const otherStreaks = [
      category === 'workout' ? currentStreakValue : gamificationData.streaks.workoutStreak,
      category === 'mental' ? currentStreakValue : gamificationData.streaks.mentalStreak,
      category === 'nutrition' ? currentStreakValue : gamificationData.streaks.nutritionStreak
    ];
    
    const newCurrentStreak = Math.max(...otherStreaks);
    const newBestStreak = Math.max(
      gamificationData.streaks.bestStreak || 0,
      newCurrentStreak
    );

    streakUpdate.currentStreak = newCurrentStreak;
    streakUpdate.bestStreak = newBestStreak;

    Logger.debug('Atomic streak update:', {
      userId: req.user._id,
      category,
      streakUpdate
    });

    // Build atomic $set operations for streak updates
    const streakSetOps = {};
    Object.keys(streakUpdate).forEach(key => {
      streakSetOps[`streaks.${key}`] = streakUpdate[key];
    });

    // Atomic update - prevents race conditions
    gamificationData = await Gamification.findOneAndUpdate(
      { userId: req.user._id },
      { $set: streakSetOps },
      { new: true, upsert: true }
    );

    // Calculate effective streaks for response
    const effectiveStreaks = {
      workout: calculateEffectiveStreak(
        gamificationData.streaks.workoutStreak,
        gamificationData.streaks.lastWorkoutDate
      ),
      mental: calculateEffectiveStreak(
        gamificationData.streaks.mentalStreak,
        gamificationData.streaks.lastMentalDate
      ),
      nutrition: calculateEffectiveStreak(
        gamificationData.streaks.nutritionStreak,
        gamificationData.streaks.lastNutritionDate
      )
    };

    res.json({
      streaks: gamificationData.streaks,
      effectiveStreaks,
      message: `${category} streak updated successfully`
    });
  } catch (error) {
    Logger.error('Error updating streak:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Log mood
export const logMood = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { mood } = req.body;
    
    // Validate mood input
    if (!mood || typeof mood !== 'string') {
      return res.status(400).json({ 
        message: 'Invalid mood data',
        details: 'Mood must be a non-empty string'
      });
    }

    // Ensure user has gamification data (initialize if not exists)
    let gamificationData = await Gamification.findOne({ userId: req.user._id });
    if (!gamificationData) {
      gamificationData = await initializeGamificationData(req.user._id);
    }

    // Atomic $push with $slice - keeps only last 30 entries, no need to load entire document
    gamificationData = await Gamification.findOneAndUpdate(
      { userId: req.user._id },
      { 
        $push: { 
          moodLog: { 
            $each: [{ mood, timestamp: new Date() }], 
            $slice: -30 
          } 
        }
      },
      { new: true, upsert: true }
    );

    res.json({ success: true, moodLog: gamificationData.moodLog });
  } catch (error) {
    Logger.error('Error logging mood:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Check achievements
export const checkAchievements = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    let gamificationData = await Gamification.findOne({ userId: req.user._id });
    
    if (!gamificationData) {
      gamificationData = await initializeGamificationData(req.user._id);
    }

    const newAchievements = [];

    // Workout achievements
    if (gamificationData.stats.totalWorkoutTime >= 3600 && !gamificationData.achievements.find(a => a.id === 'workout_master')) {
      newAchievements.push({
        id: 'workout_master',
        name: 'Workout Master',
        description: 'Complete 60 minutes of workouts',
        category: 'workout',
        unlocked: true,
        progress: 100,
        icon: 'FaDumbbell',
        unlockedAt: new Date()
      });
    }

    // Mental health achievements
    if (gamificationData.streaks.mentalStreak >= 7 && !gamificationData.achievements.find(a => a.id === 'mindfulness_master')) {
      newAchievements.push({
        id: 'mindfulness_master',
        name: 'Mindfulness Master',
        description: 'Maintain a 7-day mental health streak',
        category: 'mental',
        unlocked: true,
        progress: 100,
        icon: 'FaBrain',
        unlockedAt: new Date()
      });
    }

    // Nutrition achievements
    if (gamificationData.stats.totalMealsLogged >= 10 && !gamificationData.achievements.find(a => a.id === 'nutrition_master')) {
      newAchievements.push({
        id: 'nutrition_master',
        name: 'Nutrition Master',
        description: 'Log 10 meals',
        category: 'nutrition',
        unlocked: true,
        progress: 100,
        icon: 'FaAppleAlt',
        unlockedAt: new Date()
      });
    }

    // Add new achievements
    if (newAchievements.length > 0) {
      gamificationData.achievements.push(...newAchievements);
      await gamificationData.save();
    }

    res.json({ newAchievements });
  } catch (error) {
    Logger.error('Error checking achievements:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get leaderboard
export const getLeaderboard = async (req, res) => {
  try {
    const leaderboard = await Gamification.aggregate([
      {
        $project: {
          userId: 1,
          totalPoints: {
            $add: ['$points.workout', '$points.mental', '$points.nutrition']
          },
          level: 1
        }
      },
      { $sort: { totalPoints: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          userId: 1,
          totalPoints: 1,
          level: 1,
          username: { $ifNull: ['$user.username', 'Unknown User'] },
          displayName: { $ifNull: ['$user.displayName', '$user.username', 'Unknown User'] }
        }
      }
    ]);

    res.json(leaderboard);
  } catch (error) {
    Logger.error('Error getting leaderboard:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export default {
  getGamificationData,
  initializeGamification,
  updatePoints,
  updateStreak,
  logMood,
  checkAchievements,
  getLeaderboard
};
