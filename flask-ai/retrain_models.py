import numpy as np
import pandas as pd
import joblib
import os
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline
from sklearn.model_selection import train_test_split

# Set paths for saving models
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODELS_DIR = os.path.join(BASE_DIR, "models")
DIET_MODEL_PATH = os.path.join(MODELS_DIR, "diet_model.pkl")
STRESS_MODEL_PATH = os.path.join(MODELS_DIR, "stress_model.pkl")
WORKOUT_MODEL_PATH = os.path.join(MODELS_DIR, "workout_model.pkl")

def load_sample_data():
    np.random.seed(42)
    data_size = 10000  # Increased dataset size for better training
    
    # Enhanced diet data generation
    diet_data = pd.DataFrame({
        "calories": np.random.normal(2200, 400, data_size).clip(1500, 3500),
        "protein": np.random.normal(80, 25, data_size).clip(30, 150),
        "carbohydrates": np.random.normal(250, 60, data_size).clip(100, 400),
        "fats": np.random.normal(70, 20, data_size).clip(30, 120),
    })
    
    def get_diet_recommendation(row):
        total = row['protein'] + row['carbohydrates'] + row['fats']
        protein_ratio = row['protein'] / total
        carb_ratio = row['carbohydrates'] / total
        
        if protein_ratio > 0.35:
            return "High Protein"
        elif carb_ratio > 0.60:
            return "High Carb"
        elif protein_ratio < 0.15:
            return "Increase Protein"
        else:
            return "Balanced"
    
    diet_data["diet_recommendation"] = diet_data.apply(get_diet_recommendation, axis=1)

    # Enhanced stress data generation with more realistic patterns
    stress_data = pd.DataFrame({
        "mood": np.random.choice(
            ["happy", "sad", "anxious", "neutral"],
            data_size,
            p=[0.3, 0.2, 0.2, 0.3]  # More realistic mood distribution
        ),
        "stress_level": np.random.normal(5, 2, data_size).clip(0, 10),
        "sleep_quality": np.random.normal(6.5, 1.5, data_size).clip(0, 10),
    })
    
    def get_stress_category(row):
        stress_score = 0
        
        # Enhanced mood impact
        mood_scores = {
            "happy": -2.5,
            "neutral": 0,
            "anxious": 2.5,
            "sad": 2
        }
        stress_score += mood_scores[row['mood']] * 1.5
        
        # Non-linear stress level impact
        stress_level_impact = (row['stress_level'] - 5) * 0.8
        stress_score += stress_level_impact * (1 + abs(stress_level_impact) * 0.1)
        
        # Enhanced sleep quality impact
        sleep_impact = (7 - row['sleep_quality']) * 0.7
        stress_score += sleep_impact * (1 + abs(sleep_impact) * 0.1)
        
        if stress_score < -2.5:
            return "Low"
        elif stress_score < 2.5:
            return "Moderate"
        else:
            return "High"
    
    stress_data["stress_category"] = stress_data.apply(get_stress_category, axis=1)

    # Enhanced workout data generation
    workout_data = pd.DataFrame({
        "activity_type": np.random.choice([
            "Running", "Walking", "Cycling", "Swimming", 
            "Weight Training", "Yoga", "HIIT"
        ], data_size, p=[0.2, 0.15, 0.15, 0.1, 0.2, 0.1, 0.1]),
        "duration": np.random.normal(45, 20, data_size).clip(10, 120),
        "calories_burned": None,
        "heart_rate": None
    })
    
    # More realistic calories and heart rate based on activity type
    def generate_activity_metrics(row):
        base_calories = {
            "Running": 600,
            "Walking": 300,
            "Cycling": 450,
            "Swimming": 500,
            "Weight Training": 400,
            "Yoga": 250,
            "HIIT": 700
        }
        base_heart_rate = {
            "Running": 160,
            "Walking": 120,
            "Cycling": 140,
            "Swimming": 130,
            "Weight Training": 130,
            "Yoga": 100,
            "HIIT": 170
        }
        
        calories_per_hour = base_calories[row['activity_type']]
        row['calories_burned'] = (calories_per_hour * row['duration'] / 60) * (1 + np.random.normal(0, 0.1))
        row['heart_rate'] = base_heart_rate[row['activity_type']] * (1 + np.random.normal(0, 0.1))
        return row
    
    workout_data = workout_data.apply(generate_activity_metrics, axis=1)

    return diet_data, stress_data, workout_data

def train_model(X, y, model, model_path, feature_names=None):
    """Train and save model with feature names"""
    if feature_names is None:
        feature_names = X.columns.tolist()

    pipeline = Pipeline([
        ("scaler", StandardScaler()),
        ("classifier", model)
    ])
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    pipeline.fit(X_train, y_train)
    
    # Save model data
    model_data = {
        "pipeline": pipeline,
        "feature_names": feature_names
    }
    os.makedirs(os.path.dirname(model_path), exist_ok=True)
    joblib.dump(model_data, model_path)
    
    # Print accuracy metrics
    train_score = pipeline.score(X_train, y_train)
    test_score = pipeline.score(X_test, y_test)
    print(f"✅ Model saved: {model_path}")
    print(f"   Training accuracy: {train_score:.2f}")
    print(f"   Testing accuracy: {test_score:.2f}")

def determine_workout_category(duration, heart_rate, calories_burned):
    """Determine workout category based on metrics"""
    intensity_score = (
        (heart_rate / 180) +  # Normalized heart rate
        (calories_burned / (duration * 10)) +  # Calories per minute
        (duration / 60)  # Duration factor
    ) / 3  # Average the factors

    if intensity_score > 0.8:
        return "Recovery"
    elif intensity_score > 0.6:
        return "Maintain"
    elif intensity_score > 0.4:
        return "Increase Duration"
    else:
        return "Increase Intensity"

# Generate and prepare training data
print("Generating training data...")
diet_data, stress_data, workout_data = load_sample_data()

# Train Diet Model
print("\nTraining diet model...")
X_diet = diet_data[["calories", "protein", "carbohydrates", "fats"]]
y_diet = diet_data["diet_recommendation"]
train_model(
    X_diet, 
    y_diet,
    RandomForestClassifier(n_estimators=100, random_state=42),
    DIET_MODEL_PATH
)

# Train Stress Model
print("\nTraining stress model...")
X_stress = pd.concat([
    pd.get_dummies(stress_data["mood"], prefix="mood"),
    stress_data[["stress_level", "sleep_quality"]]
], axis=1)
y_stress = stress_data["stress_category"]

# Use a more sophisticated model configuration
stress_model = RandomForestClassifier(
    n_estimators=200,
    max_depth=10,
    min_samples_split=5,
    min_samples_leaf=2,
    class_weight='balanced',
    random_state=42
)

train_model(
    X_stress,
    y_stress,
    stress_model,
    STRESS_MODEL_PATH
)

# Train Workout Model
print("\nTraining workout model...")
X_workout = pd.concat([
    pd.get_dummies(workout_data["activity_type"], prefix="activity"),
    workout_data[["duration", "calories_burned", "heart_rate"]]
], axis=1)

# Generate the target categories
workout_data["category"] = workout_data.apply(
    lambda row: determine_workout_category(
        row["duration"], 
        row["heart_rate"],
        row["calories_burned"]
    ), 
    axis=1
)
y_workout = workout_data["category"]

train_model(
    X_workout,
    y_workout,
    RandomForestClassifier(n_estimators=100, random_state=42),
    WORKOUT_MODEL_PATH
)

print("\n✅ All models trained and saved successfully!")
