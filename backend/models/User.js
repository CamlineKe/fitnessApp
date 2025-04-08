import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import Logger from '../utils/logger.js';

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  firstName: { type: String },
  lastName: { type: String },
  dateOfBirth: { type: Date },
  gender: { type: String, enum: ['male', 'female', 'other'] },
  healthGoals: { type: String },
  devices: {
    googleFit: {
      connected: { type: Boolean, default: false },
      accessToken: { type: String },
      refreshToken: { type: String },
      lastSynced: { type: Date },
      healthData: {
        calories: { type: Number, default: 0 },
        heartRate: { type: Number, default: 0 },
        lastUpdated: { type: Date }
      }
    },
    fitbit: {
      connected: { type: Boolean, default: false },
      accessToken: { type: String },
      refreshToken: { type: String },
      lastSynced: { type: Date },
      healthData: {
        calories: { type: Number, default: 0 },
        heartRate: { type: Number, default: 0 },
        lastUpdated: { type: Date }
      }
    },
    appleHealth: {
      connected: { type: Boolean, default: false },
      lastSynced: { type: Date }
    }
  }
}, { timestamps: true });

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (this.isModified('password')) {
    try {
      this.password = await bcrypt.hash(this.password, 10);
    } catch (error) {
      next(error);
    }
  }
  next();
});

// Method to compare passwords
userSchema.methods.comparePassword = async function (candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    Logger.error("Password comparison error:", error);
    return false;
  }
};

const User = mongoose.model('User', userSchema);

export default User;