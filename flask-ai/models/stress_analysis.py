import numpy as np
import pandas as pd
from sklearn.preprocessing import StandardScaler
import joblib
import os
from datetime import datetime
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Get current directory and model path
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, 'stress_model.pkl')

# Load model at module level - LAZY LOADING: model is NOT loaded at import time
_model_data = None
_model = None
_feature_names = None
_model_loaded = False

def load_model():
    """Load the trained stress model - Returns model data dict or None"""
    global _model_data, _model, _feature_names, _model_loaded
    
    # Return already loaded model data
    if _model_loaded and _model_data is not None:
        return _model_data
    
    try:
        if os.path.exists(MODEL_PATH):
            logger.info(f"🔄 Loading stress model from {MODEL_PATH}...")
            _model_data = joblib.load(MODEL_PATH)
            _model = _model_data["pipeline"]
            _feature_names = _model_data["feature_names"]
            _model_loaded = True
            logger.info(f"✅ Stress model loaded successfully")
            return _model_data
        else:
            logger.warning(f"Stress model not found at {MODEL_PATH}, using rule-based fallback")
            return None
    except Exception as e:
        logger.error(f"Error loading stress model: {e}")
        return None

# NOTE: Removed automatic model loading at import time for Render free tier compatibility
# load_model()  # <-- This was causing timeout issues on Render

def calculate_age(date_of_birth):
    """Calculate age from date of birth"""
    if not date_of_birth:
        return None
        
    try:
        today = datetime.now()
        born = datetime.strptime(date_of_birth, '%Y-%m-%d')
        age = today.year - born.year
        if today.month < born.month or (today.month == born.month and today.day < born.day):
            age -= 1
        return age
    except Exception as e:
        logger.error(f"Error calculating age: {e}")
        return None

def get_ml_stress_category(mood, stress_level, sleep_quality):
    """Get stress category prediction from ML model"""
    try:
        if _model is None:
            return None
        
        # One-hot encode mood
        mood_dummies = {}
        possible_moods = ['happy', 'sad', 'anxious', 'neutral']
        
        for m in possible_moods:
            mood_dummies[f'mood_{m}'] = 1 if mood == m else 0
        
        # Create feature vector
        features = pd.DataFrame([{
            **mood_dummies,
            'stress_level': stress_level,
            'sleep_quality': sleep_quality
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
        logger.error(f"Error getting ML stress category: {e}")
        return None

def calculate_time_weights(logs, decay_factor=0.7):
    """
    Calculate time-decay weights for logs.
    More recent logs get higher weights.
    decay_factor: 0.0-1.0, higher = faster decay (more weight to recent)
    """
    try:
        if not logs:
            return []
        
        # Parse dates and find most recent
        dates = []
        for log in logs:
            date_str = log.get('date', '')
            try:
                # Handle ISO format
                date = datetime.fromisoformat(date_str.replace('Z', '+00:00'))
                dates.append(date)
            except:
                dates.append(datetime.now())
        
        if not dates:
            return [1.0] * len(logs)
        
        most_recent = max(dates)
        
        # Calculate weights based on days ago
        weights = []
        for date in dates:
            days_ago = (most_recent - date).days
            # Exponential decay: weight = decay_factor ^ days_ago
            weight = decay_factor ** max(0, days_ago)
            weights.append(weight)
        
        # Normalize weights to sum to 1
        total_weight = sum(weights)
        if total_weight > 0:
            weights = [w / total_weight for w in weights]
        
        return weights
    except Exception as e:
        logger.error("Error calculating time weights: %s", str(e))
        return [1.0 / len(logs)] * len(logs) if logs else []


def analyze_stress_pattern(logs):
    """
    Analyze stress level patterns with time-weighted analysis.
    More recent check-ins have higher influence on trend.
    """
    try:
        if not logs:
            return {'trend': 'neutral', 'data_sufficient': False, 'volatility': 'unknown'}
        
        # Need at least 2 logs for any trend analysis
        if len(logs) < 2:
            return {'trend': 'neutral', 'data_sufficient': False, 'volatility': 'insufficient'}
        
        stress_levels = [log.get('stressLevel', 5) for log in logs]
        weights = calculate_time_weights(logs, decay_factor=0.8)
        
        # Calculate weighted average
        weighted_avg = np.average(stress_levels, weights=weights)
        
        # Calculate trend using linear regression on weighted data
        x = np.arange(len(stress_levels))
        # Weight the recent points more in regression
        slope = np.polyfit(x, stress_levels, 1, w=weights)[0]
        
        # Calculate volatility (consistency)
        weighted_std = np.sqrt(np.average((np.array(stress_levels) - weighted_avg)**2, weights=weights))
        if weighted_std < 0.8:
            volatility = 'consistent'
        elif weighted_std < 1.5:
            volatility = 'moderate'
        else:
            volatility = 'fluctuating'
        
        # Determine trend with more nuanced thresholds
        if slope > 0.5:
            trend = 'increasing'
        elif slope < -0.5:
            trend = 'decreasing'
        else:
            trend = 'stable'
        
        return {
            'trend': trend,
            'data_sufficient': len(logs) >= 3,
            'volatility': volatility,
            'weighted_avg': round(weighted_avg, 1)
        }
    except Exception as e:
        logger.error("Error analyzing stress pattern: %s", str(e))
        return {'trend': 'neutral', 'data_sufficient': False, 'volatility': 'unknown'}


def analyze_sleep_pattern(logs):
    """
    Analyze sleep quality patterns with time-weighted analysis.
    """
    try:
        if not logs:
            return {'trend': 'neutral', 'data_sufficient': False, 'volatility': 'unknown'}
        
        if len(logs) < 2:
            return {'trend': 'neutral', 'data_sufficient': False, 'volatility': 'insufficient'}
        
        sleep_quality = [log.get('sleepQuality', 5) for log in logs]
        weights = calculate_time_weights(logs, decay_factor=0.75)
        
        weighted_avg = np.average(sleep_quality, weights=weights)
        
        x = np.arange(len(sleep_quality))
        slope = np.polyfit(x, sleep_quality, 1, w=weights)[0]
        
        weighted_std = np.sqrt(np.average((np.array(sleep_quality) - weighted_avg)**2, weights=weights))
        if weighted_std < 0.8:
            volatility = 'consistent'
        elif weighted_std < 1.5:
            volatility = 'moderate'
        else:
            volatility = 'fluctuating'
        
        # For sleep, higher is better, so positive slope = improving
        if slope > 0.4:
            trend = 'improving'
        elif slope < -0.4:
            trend = 'declining'
        else:
            trend = 'stable'
        
        return {
            'trend': trend,
            'data_sufficient': len(logs) >= 3,
            'volatility': volatility,
            'weighted_avg': round(weighted_avg, 1)
        }
    except Exception as e:
        logger.error("Error analyzing sleep pattern: %s", str(e))
        return {'trend': 'neutral', 'data_sufficient': False, 'volatility': 'unknown'}


def analyze_mood_pattern(logs):
    """
    Analyze mood patterns with time-weighted analysis.
    """
    try:
        if not logs:
            return {'trend': 'neutral', 'data_sufficient': False, 'volatility': 'unknown'}
        
        if len(logs) < 2:
            return {'trend': 'neutral', 'data_sufficient': False, 'volatility': 'insufficient'}
        
        mood_mapping = {
            'happy': 3,
            'neutral': 2,
            'anxious': 1,
            'sad': 0
        }
        
        moods = [mood_mapping.get(log.get('mood', 'neutral'), 2) for log in logs]
        weights = calculate_time_weights(logs, decay_factor=0.8)
        
        weighted_avg = np.average(moods, weights=weights)
        
        x = np.arange(len(moods))
        slope = np.polyfit(x, moods, 1, w=weights)[0]
        
        weighted_std = np.sqrt(np.average((np.array(moods) - weighted_avg)**2, weights=weights))
        if weighted_std < 0.5:
            volatility = 'consistent'
        elif weighted_std < 0.8:
            volatility = 'moderate'
        else:
            volatility = 'fluctuating'
        
        # For mood, higher is better
        if slope > 0.25:
            trend = 'improving'
        elif slope < -0.25:
            trend = 'declining'
        else:
            trend = 'stable'
        
        return {
            'trend': trend,
            'data_sufficient': len(logs) >= 3,
            'volatility': volatility,
            'weighted_avg': round(weighted_avg, 2)
        }
    except Exception as e:
        logger.error("Error analyzing mood pattern: %s", str(e))
        return {'trend': 'neutral', 'data_sufficient': False, 'volatility': 'unknown'}

def analyze_stress(data):
    """
    Analyze stress and provide personalized recommendations based on user data.
    Uses ML model if available, falls back to rule-based logic.
    """
    try:
        logger.info("Starting stress analysis with data: %s", data)
        
        user_data = data.get('user_data', {})
        daily_logs = data.get('daily_logs', [])
        current_check_in = data.get('current_check_in')

        logger.info("Extracted components - User data: %s, Daily logs: %s, Current check-in: %s", 
                   user_data, daily_logs, current_check_in)

        # Get user profile data
        date_of_birth = user_data.get('dateOfBirth')
        gender = user_data.get('gender', 'other')
        
        # Calculate age from date of birth
        age = calculate_age(date_of_birth)

        # Get current metrics - Use most recent log if available
        if current_check_in:
            # Use the provided current check-in data
            mood = current_check_in.get('mood') or 'neutral'
            stress_level = current_check_in.get('stressLevel') or 5
            sleep_quality = current_check_in.get('sleepQuality') or 5
            notes = current_check_in.get('notes', '')
        elif daily_logs:
            # If no current check-in but we have logs, use the most recent log
            most_recent = daily_logs[0]
            mood = most_recent.get('mood') or 'neutral'
            stress_level = most_recent.get('stressLevel') or 5
            sleep_quality = most_recent.get('sleepQuality') or 5
            notes = most_recent.get('notes', '')
        else:
            # Only use defaults if we have no data at all
            mood = 'neutral'
            stress_level = 5
            sleep_quality = 5
            notes = ''

        logger.info("Processed user metrics - Age: %s, Gender: %s, Mood: %s, Stress: %s, Sleep: %s", 
                   age, gender, mood, stress_level, sleep_quality)

        # Try to get ML-based stress category
        ml_result = get_ml_stress_category(mood, stress_level, sleep_quality)

        # Analyze patterns
        stress_pattern = analyze_stress_pattern(daily_logs)
        sleep_pattern = analyze_sleep_pattern(daily_logs)
        mood_pattern = analyze_mood_pattern(daily_logs)

        logger.info("Analyzed patterns - Stress: %s, Sleep: %s, Mood: %s", 
                   stress_pattern, sleep_pattern, mood_pattern)

        # Generate recommendations based on current state and patterns
        recommendations = []

        # Add ML-based insight if available
        if ml_result:
            recommendations.append(f"📊 ML Analysis: Stress level appears {ml_result['category'].lower()}")
            if ml_result['confidence'] > 0.7:
                recommendations.append(f"High confidence assessment ({(ml_result['confidence']*100):.1f}%)")
            
            # Add specific advice based on ML category
            if ml_result['category'] == 'High':
                recommendations.append("Your stress indicators suggest high stress - prioritize self-care today")
            elif ml_result['category'] == 'Moderate':
                recommendations.append("Moderate stress levels detected - maintain your coping strategies")
            elif ml_result['category'] == 'Low':
                recommendations.append("Low stress levels - great job managing your wellbeing!")

        # Current state analysis with gender and age considerations
        if stress_level >= 7:
            recommendations.extend([
                "Your stress level is high. Consider immediate stress relief activities:",
                "- Practice deep breathing exercises (4-7-8 technique)",
                "- Take a short walk outside",
                "- Try progressive muscle relaxation"
            ])
            
            # Add gender-specific high stress recommendations
            if gender == 'female':
                recommendations.append("- Consider journaling or talking with a friend (studies show women often benefit from verbal processing)")
            elif gender == 'male':
                recommendations.append("- Consider physical exercise or problem-solving activities (studies show men often benefit from action-oriented coping)")

        elif stress_level >= 5:
            recommendations.extend([
                "Your stress level is moderate. Here are some management techniques:",
                "- Take regular breaks during work",
                "- Practice mindfulness meditation",
                "- Consider light exercise"
            ])
        else:
            recommendations.extend([
                "Your stress level is manageable. Keep it up with these practices:",
                "- Maintain your current stress management routine",
                "- Stay physically active",
                "- Continue with relaxation practices"
            ])

        # Age-specific recommendations
        if age is not None:
            if age < 25:
                recommendations.extend([
                    "Young adult specific tips:",
                    "- Balance academic/work pressure with social activities",
                    "- Maintain regular sleep schedule despite high energy levels",
                    "- Learn to set healthy boundaries"
                ])
            elif age >= 25 and age < 40:
                recommendations.extend([
                    "Career-age specific tips:",
                    "- Practice work-life balance",
                    "- Schedule regular exercise despite busy schedule",
                    "- Make time for hobbies and personal growth"
                ])
            elif age >= 40:
                recommendations.extend([
                    "Mid-life specific tips:",
                    "- Practice stress-reducing activities like yoga or tai chi",
                    "- Maintain social connections",
                    "- Consider regular health check-ups"
                ])
        else:
            recommendations.append("Complete your profile with date of birth for more personalized recommendations")

        # Sleep quality recommendations
        if sleep_quality <= 5:
            recommendations.extend([
                "Improve your sleep quality with these tips:",
                "- Maintain a consistent sleep schedule",
                "- Create a relaxing bedtime routine",
                "- Limit screen time before bed"
            ])
            if gender == 'female':
                recommendations.append("- Consider hormone-cycle impact on sleep patterns")
            elif gender == 'male':
                recommendations.append("- Consider impact of evening exercise on sleep quality")

        elif sleep_pattern['trend'] == 'declining':
            recommendations.extend([
                "Your sleep quality is declining. Consider these adjustments:",
                "- Review your evening routine",
                "- Ensure your bedroom is dark and quiet",
                "- Avoid caffeine in the afternoon"
            ])

        # Mood-based recommendations with gender considerations
        if mood in ['sad', 'anxious']:
            base_recommendations = [
                f"Notice you're feeling {mood}. Here are some mood-lifting activities:",
                "- Reach out to a friend or family member",
                "- Engage in activities you enjoy",
                "- Consider journaling your thoughts"
            ]
            
            if gender == 'female':
                base_recommendations.append("- Join a support group or community activity")
            elif gender == 'male':
                base_recommendations.append("- Try a physical activity or hobby project")
                
            recommendations.extend(base_recommendations)

        return {
            'analysis': {
                'current_state': {
                    'mood': mood,
                    'stress_level': stress_level,
                    'sleep_quality': sleep_quality,
                    'age': age,
                    'gender': gender
                },
                'patterns': {
                    'stress_trend': stress_pattern['trend'],
                    'sleep_trend': sleep_pattern['trend'],
                    'mood_trend': mood_pattern['trend'],
                    'stress_volatility': stress_pattern.get('volatility', 'unknown'),
                    'sleep_volatility': sleep_pattern.get('volatility', 'unknown'),
                    'mood_volatility': mood_pattern.get('volatility', 'unknown'),
                    'data_sufficient': stress_pattern.get('data_sufficient', False) and sleep_pattern.get('data_sufficient', False) and mood_pattern.get('data_sufficient', False)
                },
                'ml_used': ml_result is not None,
                'ml_prediction': ml_result
            },
            'recommendations': recommendations,
            'profile_complete': bool(age and gender != 'other')
        }

    except Exception as e:
        logger.error("Error in stress analysis: %s", str(e))
        return {
            'analysis': {
                'current_state': {
                    'mood': 'neutral',
                    'stress_level': 5,
                    'sleep_quality': 5,
                    'age': None,
                    'gender': 'other'
                },
                'patterns': {
                    'stress_trend': 'neutral',
                    'sleep_trend': 'neutral',
                    'mood_trend': 'neutral',
                    'stress_volatility': 'unknown',
                    'sleep_volatility': 'unknown',
                    'mood_volatility': 'unknown',
                    'data_sufficient': False
                },
                'ml_used': False,
                'error': str(e)
            },
            'recommendations': [
                "Unable to generate personalized recommendations.",
                "Please complete your profile for tailored advice.",
                "In the meantime, try these general wellness tips:",
                "- Maintain regular exercise",
                "- Practice mindfulness daily",
                "- Keep a consistent sleep schedule"
            ],
            'profile_complete': False
        }