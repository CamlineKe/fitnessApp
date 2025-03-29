import mongoose from "mongoose";

const nutritionSchema = new mongoose.Schema(
  {
    userId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User", 
      required: true 
    },
    date: { 
      type: Date, 
      default: Date.now 
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

export default mongoose.model("Nutrition", nutritionSchema);