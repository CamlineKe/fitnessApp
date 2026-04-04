import mongoose from "mongoose";

const nutritionSchema = new mongoose.Schema(
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
      index: true
    },
    mealType: { 
      type: String, 
      required: true, 
      enum: ["breakfast", "lunch", "dinner", "snack"]
    },
    foodItems: [{ 
      type: String, 
      required: true 
    }],
    calories: { 
      type: Number, 
      default: 0 
    },
    macronutrients: {
      protein: { 
        type: Number, 
        default: 0 
      },
      carbohydrates: { 
        type: Number, 
        default: 0 
      },
      fats: { 
        type: Number, 
        default: 0 
      },
    },
  },
  { timestamps: true }
);

// ✅ Compound index for fast queries by user + date
nutritionSchema.index({ userId: 1, date: -1 });

export default mongoose.model("Nutrition", nutritionSchema);