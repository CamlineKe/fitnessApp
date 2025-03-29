import Gamification from '../models/Gamification.js';

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

    res.json(gamificationData);
  } catch (error) {
    console.error('Error getting gamification data:', error);
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
    console.error('Error initializing gamification:', error);
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
    console.log('🔹 Updating points:', { activity, data });

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

    let gamificationData = await Gamification.findOne({ userId: req.user._id });
    
    if (!gamificationData) {
      console.log('🔹 No gamification data found, initializing...');
      gamificationData = await initializeGamificationData(req.user._id);
    }

    // Calculate points based on activity type
    let pointsEarned = 0;
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
        gamificationData.stats.totalWorkoutTime += Number(data.duration);
        gamificationData.stats.totalCaloriesBurned += Number(data.caloriesBurned);
        break;
      case 'mental':
        pointsEarned = 10;
        gamificationData.stats.totalMoodChecks++;
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
        gamificationData.stats.totalMealsLogged++;
        break;
    }

    // Update points
    gamificationData.points[activity] += pointsEarned;

    // Check for level up
    const totalPoints = 
      gamificationData.points.workout + 
      gamificationData.points.mental + 
      gamificationData.points.nutrition;
    
    const newLevel = Math.floor(totalPoints / 100) + 1;
    const leveledUp = newLevel > gamificationData.level;
    if (leveledUp) {
      gamificationData.level = newLevel;
    }

    await gamificationData.save();
    
    // Get Socket.IO instance
    const io = req.app.get('io');
    
    // Prepare response data
    const responseData = { 
      points: pointsEarned, 
      total: totalPoints, 
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
          totalPoints
        });
      }
    }

    res.json(responseData);
  } catch (error) {
    console.error('Error updating points:', error);
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
    console.log('🔹 Updating streak for category:', category);

    if (!['workout', 'mental', 'nutrition'].includes(category)) {
      return res.status(400).json({ 
        message: 'Invalid category',
        details: `Category must be one of: workout, mental, nutrition. Received: ${category}`
      });
    }

    let gamificationData = await Gamification.findOne({ userId: req.user._id });
    if (!gamificationData) {
      gamificationData = await initializeGamificationData(req.user._id);
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const lastActivityDate = gamificationData.streaks[`last${category.charAt(0).toUpperCase() + category.slice(1)}Date`];
    const streakKey = `${category}Streak`;
    
    if (!lastActivityDate) {
      // First activity ever
      gamificationData.streaks[streakKey] = 1;
      gamificationData.streaks[`last${category.charAt(0).toUpperCase() + category.slice(1)}Date`] = today;
    } else {
      const lastDate = new Date(lastActivityDate);
      lastDate.setHours(0, 0, 0, 0);
      const diffDays = Math.floor((today - lastDate) / (1000 * 60 * 60 * 24));

      if (diffDays === 0) {
        // Already logged today, streak stays the same
        console.log('🔹 Activity already logged today, maintaining streak');
      } else if (diffDays === 1) {
        // Activity done on consecutive day, increase streak
        console.log('🔹 Consecutive day activity, increasing streak');
        gamificationData.streaks[streakKey]++;
        gamificationData.streaks[`last${category.charAt(0).toUpperCase() + category.slice(1)}Date`] = today;
      } else {
        // Break in streak, reset to 1
        console.log('🔹 Break in streak, resetting to 1');
        gamificationData.streaks[streakKey] = 1;
        gamificationData.streaks[`last${category.charAt(0).toUpperCase() + category.slice(1)}Date`] = today;
      }
    }

    // Update overall streak metrics
    const allStreaks = [
      gamificationData.streaks.workoutStreak,
      gamificationData.streaks.mentalStreak,
      gamificationData.streaks.nutritionStreak
    ];
    
    gamificationData.streaks.currentStreak = Math.max(...allStreaks);
    gamificationData.streaks.bestStreak = Math.max(
      gamificationData.streaks.bestStreak || 0,
      gamificationData.streaks.currentStreak
    );

    console.log('🔹 Updated streak data:', {
      categoryStreak: gamificationData.streaks[streakKey],
      currentStreak: gamificationData.streaks.currentStreak,
      bestStreak: gamificationData.streaks.bestStreak
    });

    await gamificationData.save();

    res.json({
      streaks: gamificationData.streaks,
      message: `${category} streak updated successfully`
    });
  } catch (error) {
    console.error('Error updating streak:', error);
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
    let gamificationData = await Gamification.findOne({ userId: req.user._id });
    
    if (!gamificationData) {
      gamificationData = await initializeGamificationData(req.user._id);
    }

    gamificationData.moodLog.push({
      mood,
      timestamp: new Date()
    });

    // Keep only last 30 days of mood logs
    if (gamificationData.moodLog.length > 30) {
      gamificationData.moodLog = gamificationData.moodLog.slice(-30);
    }

    await gamificationData.save();
    res.json({ success: true, moodLog: gamificationData.moodLog });
  } catch (error) {
    console.error('Error logging mood:', error);
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
    console.error('Error checking achievements:', error);
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
      { $limit: 10 }
    ]);

    res.json(leaderboard);
  } catch (error) {
    console.error('Error getting leaderboard:', error);
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
