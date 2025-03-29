import mongoose from 'mongoose';

const gamificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  points: {
    workout: { type: Number, default: 0 },
    mental: { type: Number, default: 0 },
    nutrition: { type: Number, default: 0 }
  },
  level: { type: Number, default: 1 },
  streaks: {
    workoutStreak: { type: Number, default: 0 },
    mentalStreak: { type: Number, default: 0 },
    nutritionStreak: { type: Number, default: 0 },
    currentStreak: { type: Number, default: 0 },
    bestStreak: { type: Number, default: 0 },
    lastWorkoutDate: { type: Date },
    lastMentalDate: { type: Date },
    lastNutritionDate: { type: Date }
  },
  achievements: [{
    id: String,
    name: String,
    description: String,
    category: { type: String, enum: ['workout', 'mental', 'nutrition'] },
    unlocked: { type: Boolean, default: false },
    progress: { type: Number, default: 0 },
    icon: String,
    unlockedAt: Date
  }],
  challenges: [{
    id: String,
    name: String,
    description: String,
    category: { type: String, enum: ['workout', 'mental', 'nutrition'] },
    target: Number,
    progress: { type: Number, default: 0 },
    completed: { type: Boolean, default: false },
    startDate: Date,
    endDate: Date
  }],
  moodLog: [{
    mood: String,
    timestamp: { type: Date, default: Date.now }
  }],
  stats: {
    totalWorkoutTime: { type: Number, default: 0 },
    totalCaloriesBurned: { type: Number, default: 0 },
    totalMealsLogged: { type: Number, default: 0 },
    totalMoodChecks: { type: Number, default: 0 }
  }
});

// Create indexes for efficient querying
gamificationSchema.index({ userId: 1 });
gamificationSchema.index({ 'achievements.category': 1 });
gamificationSchema.index({ 'challenges.category': 1 });

export default mongoose.model('Gamification', gamificationSchema);
