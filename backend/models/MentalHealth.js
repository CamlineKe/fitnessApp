import mongoose from 'mongoose';

const mentalHealthSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: Date, default: Date.now, required: true }, // Default to current date
    stressLevel: { type: Number, min: 0, max: 10, required: true }, // Ensure it's always provided
    mood: { 
      type: String, 
      enum: ['happy', 'sad', 'anxious', 'neutral'], 
      required: true,
      set: (value) => value.toLowerCase() // 🔥 Auto-convert to lowercase for consistency
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
  { timestamps: true } // Automatically manages createdAt and updatedAt
);

export default mongoose.model('MentalHealth', mentalHealthSchema);
