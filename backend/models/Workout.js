import mongoose from "mongoose";

const workoutSchema = new mongoose.Schema(
  {
    userId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User", 
      required: true,
      index: true
    },
    date: { 
      type: Date, 
      default: Date.now, 
      required: true,
      index: true
    },
    activityType: { type: String, required: true },
    duration: { type: Number, required: true },  // in minutes
    caloriesBurned: { type: Number, default: 0 }, // calories burned during workout
    heartRate: { type: Number, default: 0 }, // heart rate during the workout
    feedback: { type: String, default: "" }, // any feedback from the user about the workout
  },
  { timestamps: true } // Automatically adds createdAt and updatedAt fields
);

// ✅ Compound index for fast queries by user + date
workoutSchema.index({ userId: 1, date: -1 });

export default mongoose.model("Workout", workoutSchema);
