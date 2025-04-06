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

def analyze_stress(data):
    """
    Analyze stress and provide personalized recommendations based on user data.
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
            mood = current_check_in.get('mood')
            stress_level = current_check_in.get('stressLevel')
            sleep_quality = current_check_in.get('sleepQuality')
            notes = current_check_in.get('notes', '')
        elif daily_logs:
            # If no current check-in but we have logs, use the most recent log
            most_recent = daily_logs[0]
            mood = most_recent.get('mood')
            stress_level = most_recent.get('stressLevel')
            sleep_quality = most_recent.get('sleepQuality')
            notes = most_recent.get('notes', '')
        else:
            # Only use defaults if we have no data at all
            mood = 'neutral'
            stress_level = 5
            sleep_quality = 5
            notes = ''

        logger.info("Processed user metrics - Age: %s, Gender: %s, Mood: %s, Stress: %s, Sleep: %s", 
                   age, gender, mood, stress_level, sleep_quality)

        # Analyze patterns
        stress_pattern = analyze_stress_pattern(daily_logs)
        sleep_pattern = analyze_sleep_pattern(daily_logs)
        mood_pattern = analyze_mood_pattern(daily_logs)

        logger.info("Analyzed patterns - Stress: %s, Sleep: %s, Mood: %s", 
                   stress_pattern, sleep_pattern, mood_pattern)

        # Generate recommendations based on current state and patterns
        recommendations = []

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
                    'mood_trend': mood_pattern['trend']
                }
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
                    'mood_trend': 'neutral'
                }
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

def analyze_stress_pattern(logs):
    """Analyze stress level patterns from logs"""
    try:
        if not logs:
            return {'trend': 'neutral'}
        
        stress_levels = [log.get('stressLevel', 5) for log in logs]
        if len(stress_levels) >= 3:
            recent_trend = np.mean(stress_levels[-3:]) - np.mean(stress_levels[:-3])
            if recent_trend > 1:
                return {'trend': 'increasing'}
            elif recent_trend < -1:
                return {'trend': 'decreasing'}
        return {'trend': 'stable'}
    except Exception as e:
        logger.error("Error analyzing stress pattern: %s", str(e))
        return {'trend': 'neutral'}

def analyze_sleep_pattern(logs):
    """Analyze sleep quality patterns from logs"""
    try:
        if not logs:
            return {'trend': 'neutral'}
        
        sleep_quality = [log.get('sleepQuality', 5) for log in logs]
        if len(sleep_quality) >= 3:
            recent_trend = np.mean(sleep_quality[-3:]) - np.mean(sleep_quality[:-3])
            if recent_trend > 1:
                return {'trend': 'improving'}
            elif recent_trend < -1:
                return {'trend': 'declining'}
        return {'trend': 'stable'}
    except Exception as e:
        logger.error("Error analyzing sleep pattern: %s", str(e))
        return {'trend': 'neutral'}

def analyze_mood_pattern(logs):
    """Analyze mood patterns from logs"""
    try:
        if not logs:
            return {'trend': 'neutral'}
        
        mood_mapping = {
            'happy': 3,
            'neutral': 2,
            'anxious': 1,
            'sad': 0
        }
        
        moods = [mood_mapping.get(log.get('mood', 'neutral'), 2) for log in logs]
        if len(moods) >= 3:
            recent_trend = np.mean(moods[-3:]) - np.mean(moods[:-3])
            if recent_trend > 0.5:
                return {'trend': 'improving'}
            elif recent_trend < -0.5:
                return {'trend': 'declining'}
        return {'trend': 'stable'}
    except Exception as e:
        logger.error("Error analyzing mood pattern: %s", str(e))
        return {'trend': 'neutral'}
