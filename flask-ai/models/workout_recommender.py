import numpy as np
import pandas as pd
from sklearn.preprocessing import StandardScaler
import joblib
import os
from datetime import datetime, timedelta
import logging

# Create a logger
logger = logging.getLogger(__name__)

# Get current directory and model path
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, 'workout_model.pkl')

# Load model at module level - LAZY LOADING: model is NOT loaded at import time
_model_data = None
_model = None
_feature_names = None
_model_loaded = False

def load_model():
    """Load the trained workout model - Returns model data dict or None"""
    global _model_data, _model, _feature_names, _model_loaded
    
    # Return already loaded model data
    if _model_loaded and _model_data is not None:
        return _model_data
    
    try:
        if os.path.exists(MODEL_PATH):
            logger.info(f"🔄 Loading workout model from {MODEL_PATH}...")
            _model_data = joblib.load(MODEL_PATH)
            _model = _model_data["pipeline"]
            _feature_names = _model_data["feature_names"]
            _model_loaded = True
            logger.info(f"✅ Workout model loaded successfully")
            return _model_data
        else:
            logger.warning(f"Workout model not found at {MODEL_PATH}, using rule-based fallback")
            return None
    except Exception as e:
        logger.error(f"Error loading workout model: {e}")
        return None

# NOTE: Removed automatic model loading at import time for Render free tier compatibility
# load_model()  # <-- This was causing timeout issues on Render

def calculate_age(date_of_birth):
    """Calculate age from date of birth"""
    if not date_of_birth:
        logger.warning("No date of birth provided")
        return None
    
    today = datetime.now()
    logger.info(f"Processing date of birth: {date_of_birth}")
    
    try:
        # Clean the date string by removing timezone info if present
        clean_date = date_of_birth.split('T')[0] if 'T' in date_of_birth else date_of_birth
        logger.info(f"Cleaned date: {clean_date}")
        
        # Parse the date
        born = datetime.strptime(clean_date, '%Y-%m-%d')
        
        age = today.year - born.year
        if today.month < born.month or (today.month == born.month and today.day < born.day):
            age -= 1
        
        logger.info(f"Successfully calculated age: {age} from date: {clean_date}")
        return age
    except Exception as e:
        logger.error(f"Error calculating age: {str(e)}")
        return None

def calculate_max_heart_rate(age):
    """Calculate maximum heart rate using Tanaka formula"""
    return 208 - (0.7 * age)

def get_heart_rate_zones(max_hr):
    """Calculate heart rate training zones"""
    return {
        'recovery': (max_hr * 0.6, max_hr * 0.7),
        'aerobic': (max_hr * 0.7, max_hr * 0.8),
        'anaerobic': (max_hr * 0.8, max_hr * 0.9),
        'vo2max': (max_hr * 0.9, max_hr * 1.0)
    }

def get_ml_recommendation(activity_type, duration, calories_burned, heart_rate):
    """Get workout category recommendation from ML model"""
    try:
        if _model is None:
            return None
        
        # One-hot encode activity type
        activity_dummies = {}
        possible_activities = ['Running', 'Walking', 'Cycling', 'Swimming', 'Weight Training', 'Yoga', 'HIIT']
        
        for act in possible_activities:
            activity_dummies[f'activity_{act}'] = 1 if activity_type == act else 0
        
        # Create feature vector
        features = pd.DataFrame([{
            **activity_dummies,
            'duration': duration,
            'calories_burned': calories_burned,
            'heart_rate': heart_rate
        }])
        
        # Ensure correct feature order
        features = features[_feature_names]
        
        # Get prediction
        prediction = _model.predict(features)[0]
        probabilities = _model.predict_proba(features)[0]
        
        logger.info(f"ML prediction: {prediction}, probabilities: {probabilities}")
        return {
            'category': prediction,
            'confidence': float(max(probabilities)),
            'all_probabilities': dict(zip(_model.classes_, probabilities))
        }
    except Exception as e:
        logger.error(f"Error getting ML recommendation: {e}")
        return None

def get_workout_recommendations(data):
    """
    Generate personalized workout recommendations based on user data and workout history.
    Uses ML model if available, falls back to rule-based logic.
    """
    try:
        user_data = data.get('user_data', {})
        workout_history = data.get('workout_history', [])
        current_stats = data.get('current_stats', {})

        # Get user profile data
        date_of_birth = user_data.get('dateOfBirth')
        logger.info(f"Received user data: {user_data}")
        logger.info(f"Date of birth from request: {date_of_birth}")
        
        gender = user_data.get('gender', 'other')
        age = calculate_age(date_of_birth)
        logger.info(f"Calculated age: {age}, Gender: {gender}")

        # Calculate heart rate zones
        max_hr = calculate_max_heart_rate(age) if age else 180  # Default if age not available
        hr_zones = get_heart_rate_zones(max_hr)
        
        # Analyze current workout
        activity_type = current_stats.get('activityType', '')
        duration = current_stats.get('duration', 0)
        heart_rate = current_stats.get('heartRate', 0)
        calories_burned = current_stats.get('caloriesBurned', 0)

        # Try to get ML-based recommendation
        ml_result = get_ml_recommendation(activity_type, duration, calories_burned, heart_rate)

        # Analyze workout patterns
        weekly_volume = sum(w.get('duration', 0) for w in workout_history[-7:])
        workout_frequency = len(workout_history[-7:])
        
        # Generate recommendations
        recommendations = []
        analysis = {
            'current_workout': {
                'activity_type': activity_type,
                'duration': duration,
                'heart_rate': heart_rate,
                'calories_burned': calories_burned
            },
            'weekly_stats': {
                'total_volume': weekly_volume,
                'frequency': workout_frequency
            },
            'heart_rate_zones': hr_zones,
            'profile_data': {
                'age': age,
                'gender': gender
            }
        }

        # Add ML result to analysis if available
        if ml_result:
            analysis['ml_prediction'] = ml_result
            analysis['ml_used'] = True
            
            # Add ML-based recommendation
            recommendations.append(f"📊 ML Analysis: {ml_result['category']}")
            if ml_result['confidence'] > 0.7:
                recommendations.append(f"High confidence recommendation ({(ml_result['confidence']*100):.1f}%)")
            
            # Add specific advice based on ML category
            if 'Recovery' in ml_result['category']:
                recommendations.append("Focus on light activity and proper rest today")
            elif 'Maintain' in ml_result['category']:
                recommendations.append("Continue with your current workout routine")
            elif 'Increase Duration' in ml_result['category']:
                recommendations.append("Try extending your workout by 5-10 minutes")
            elif 'Increase Intensity' in ml_result['category']:
                recommendations.append("Consider increasing the intensity of your workouts")
        else:
            analysis['ml_used'] = False

        # Profile completeness check
        is_profile_complete = bool(age and gender != 'other')
        logger.info(f"Profile completeness check - Age: {age}, Gender: {gender}, Complete: {is_profile_complete}")

        if not is_profile_complete:
            if not age:
                recommendations.append("Complete your date of birth for more personalized workout recommendations")
            if gender == 'other':
                recommendations.append("Specify your gender for tailored workout advice")
            return {
                'recommendations': recommendations,
                'analysis': analysis,
                'profile_complete': False
            }

        # Only proceed with personalized recommendations if profile is complete
        # Age-based workout structure
        if age < 30:
            recommended_frequency = 4
            base_duration = 45
            intensity = "moderate to high"
        elif age < 50:
            recommended_frequency = 3
            base_duration = 40
            intensity = "moderate"
        else:
            recommended_frequency = 3
            base_duration = 30
            intensity = "light to moderate"

        # Adjust for gender (based on general fitness guidelines)
        if gender == 'female':
            # Slightly lower intensity for better fat burning
            intensity = intensity.replace('high', 'moderate-high')
            base_duration += 5  # Slightly longer duration
        
        # Frequency recommendations (only if no ML result or ML result has low confidence)
        if not ml_result or ml_result['confidence'] < 0.6:
            if workout_frequency < recommended_frequency:
                recommendations.append(f"Try to increase workout frequency to {recommended_frequency} times per week")
            elif workout_frequency > recommended_frequency + 2:
                recommendations.append("Consider adding more rest days to prevent overtraining")

            # Duration recommendations
            if duration < base_duration:
                recommendations.append(f"Gradually increase workout duration to {base_duration} minutes")
        
        # Heart rate zone recommendations (always include if heart rate is tracked)
        if heart_rate > 0:  # Only if heart rate is tracked
            for zone, (lower, upper) in hr_zones.items():
                if lower <= heart_rate <= upper:
                    current_zone = zone
                    break
            else:
                current_zone = 'unknown'
            
            zone_recommendations = {
                'recovery': "Good for active recovery. Focus on technique and form.",
                'aerobic': "Great for building endurance and burning fat.",
                'anaerobic': "Excellent for improving cardiovascular fitness.",
                'vo2max': "High intensity zone - limit time here to prevent overtraining."
            }
            if current_zone in zone_recommendations:
                recommendations.append(zone_recommendations[current_zone])

        # Age-specific recommendations (keep these regardless)
        if age > 50:
            recommendations.extend([
                "For your age group:",
                "- Focus on low-impact activities",
                "- Include balance exercises",
                "- Maintain flexibility with stretching",
                "- Consider swimming or water aerobics"
            ])
        elif age < 30:
            recommendations.extend([
                "For your age group:",
                "- Mix cardio with strength training",
                "- Try high-intensity interval training (HIIT)",
                "- Include dynamic stretching",
                "- Consider team sports or group activities"
            ])
        else:
            recommendations.extend([
                "For your age group:",
                "- Balance cardio and strength training",
                "- Include flexibility work",
                "- Focus on proper form and technique",
                "- Consider yoga or Pilates"
            ])

        # Gender-specific recommendations
        if gender == 'female':
            recommendations.extend([
                "For optimal results:",
                "- Include strength training for bone health",
                "- Focus on core and lower body exercises",
                "- Consider resistance training 2-3 times per week",
                "- Mix in high and low impact activities"
            ])
        elif gender == 'male':
            recommendations.extend([
                "For optimal results:",
                "- Balance strength and cardio training",
                "- Include upper body exercises",
                "- Consider compound movements",
                "- Focus on proper form to prevent injury"
            ])

        # Recovery recommendations
        if workout_history:
            last_workout = workout_history[-1]
            last_workout_type = last_workout.get('activityType', '')
            
            if last_workout_type == activity_type:
                recommendations.append("Consider varying your workout type for better overall fitness")
            
            try:
                # Convert the last workout date to naive datetime
                last_workout_date = datetime.fromisoformat(last_workout.get('date', '').replace('Z', '+00:00'))
                last_workout_date = last_workout_date.replace(tzinfo=None)  # Remove timezone info
                time_since_last = datetime.now() - last_workout_date
                
                if time_since_last < timedelta(hours=24):
                    recommendations.append("Ensure adequate rest between workouts")
            except (ValueError, TypeError) as e:
                logger.warning(f"Could not parse workout date: {e}")
                # Continue without the time-based recommendation

        # Progressive overload suggestion
        if len(workout_history) >= 4:
            recent_durations = [w.get('duration', 0) for w in workout_history[-4:]]
            if all(d >= base_duration for d in recent_durations):
                recommendations.append("Consider gradually increasing workout intensity")

        return {
            'recommendations': recommendations,
            'analysis': analysis,
            'profile_complete': True
        }

    except Exception as e:
        logger.error(f"Workout recommendation error: {e}")
        # Only return generic recommendations if profile is incomplete
        if 'is_profile_complete' in locals() and not is_profile_complete:
            return {
                'recommendations': [
                    "Please complete your profile for personalized recommendations.",
                    "In the meantime, try these general tips:",
                    "- Start with light to moderate intensity workouts",
                    "- Focus on proper form and technique",
                    "- Gradually increase duration and intensity",
                    "- Include both cardio and strength training"
                ],
                'analysis': {
                    'error': str(e),
                    'profile_complete': False
                }
            }
        # If profile is complete but there's an error, return what we have
        return {
            'recommendations': recommendations if 'recommendations' in locals() else [],
            'analysis': analysis if 'analysis' in locals() else {'error': str(e)},
            'profile_complete': True
        }