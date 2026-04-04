import mongoose from 'mongoose';

const mentalHealthSchema = new mongoose.Schema(
  {
    userId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User', 
      required: true,
      index: true
    },
    date: { 
      type: Date, 
      default: Date.now, 
      required: true,
      index: true
    },
    stressLevel: { type: Number, min: 0, max: 10, required: true },
    mood: { 
      type: String, 
      enum: ['happy', 'sad', 'anxious', 'neutral'], 
      required: true,
      set: (value) => value.toLowerCase()
    },
    sleepQuality: { type: Number, min: 0, max: 10, required: true },
    notes: { 
      type: String, 
      trim: true,
      validate: {
        validator: function (value) {
          return !(this.mood === 'sad' || this.mood === 'anxious') || (value && value.trim().length > 0);
        },
        message: 'Notes are required when mood is sad or anxious.'
      }
    }
  },
  { timestamps: true }
);

// Compound index for fast queries by user + date
mentalHealthSchema.index({ userId: 1, date: -1 });

export default mongoose.model('MentalHealth', mentalHealthSchema);
