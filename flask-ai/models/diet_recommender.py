import numpy as np
from datetime import datetime
import os
import logging

# Create a logger
logger = logging.getLogger(__name__)

def calculate_age(date_of_birth):
    """Calculate age from date of birth"""
    if not date_of_birth:
        logger.warning("No date of birth provided")
        return None
    today = datetime.now()
    try:
        # Try parsing different date formats
        for date_format in ['%Y-%m-%d', '%Y-%m-%dT%H:%M:%S.%fZ', '%Y-%m-%dT%H:%M:%SZ']:
            try:
                born = datetime.strptime(date_of_birth, date_format)
                age = today.year - born.year
                if today.month < born.month or (today.month == born.month and today.day < born.day):
                    age -= 1
                logger.info(f"Successfully calculated age: {age} from date: {date_of_birth}")
                return age
            except ValueError:
                continue
        
        logger.error(f"Failed to parse date of birth: {date_of_birth}")
        return None
    except (TypeError, Exception) as e:
        logger.error(f"Error calculating age: {str(e)}")
        return None

def get_diet_recommendations(data):
    """
    Generate personalized diet recommendations based on available user data and nutrition logs.
    """
    try:
        user_data = data.get('user_data', {})
        daily_intake = data.get('daily_intake', {})
        nutrition_logs = data.get('nutrition_logs', [])

        # Get user profile data
        date_of_birth = user_data.get('dateOfBirth')
        logger.info(f"Retrieved date of birth: {date_of_birth}")  # Log the date of birth
        gender = user_data.get('gender', 'other')
        age = calculate_age(date_of_birth)
        logger.info(f"Calculated age: {age}")  # Log the calculated age

        # Get current intake
        current_calories = daily_intake.get('calories', 0)
        current_protein = daily_intake.get('macronutrients', {}).get('protein', 0)
        current_carbs = daily_intake.get('macronutrients', {}).get('carbohydrates', 0)
        current_fats = daily_intake.get('macronutrients', {}).get('fats', 0)

        # Analyze meal timing patterns
        meal_times = []
        for log in nutrition_logs:
            if 'timestamp' in log:
                try:
                    meal_time = datetime.fromisoformat(log['timestamp'].replace('Z', '+00:00'))
                    meal_times.append(meal_time)
                except (ValueError, AttributeError):
                    continue

        recommendations = []
        meal_pattern = "Regular"

        # Profile completeness check
        if not age:
            recommendations.append("Complete your date of birth for more personalized nutrition recommendations")
        if gender == 'other':
            recommendations.append("Specify your gender for tailored nutritional advice")

        # Gender and age-specific base calorie and nutrient recommendations
        base_calories = None
        if age and gender != 'other':
            if gender == 'female':
                base_calories = 2000 if age < 50 else 1800
                recommendations.extend([
                    "Female-specific nutrition tips:",
                    "- Ensure adequate iron intake, especially if menstruating",
                    "- Include calcium-rich foods for bone health",
                    "- Consider folate-rich foods for reproductive health"
                ])
            elif gender == 'male':
                base_calories = 2500 if age < 50 else 2200
                recommendations.extend([
                    "Male-specific nutrition tips:",
                    "- Focus on lean proteins for muscle maintenance",
                    "- Include zinc-rich foods for hormone balance",
                    "- Consider heart-healthy fats"
                ])

        # Analyze meal spacing
        if meal_times:
            meal_times.sort()
            time_diffs = []
            for i in range(1, len(meal_times)):
                diff = (meal_times[i] - meal_times[i-1]).total_seconds() / 3600  # Convert to hours
                time_diffs.append(diff)

            if time_diffs:
                avg_time_between_meals = sum(time_diffs) / len(time_diffs)
                max_time_between_meals = max(time_diffs)

                if max_time_between_meals > 6:
                    recommendations.append("Try to avoid gaps of more than 6 hours between meals")
                    meal_pattern = "Irregular"

                if avg_time_between_meals < 2:
                    recommendations.append("Consider spacing your meals at least 2-3 hours apart")
                    meal_pattern = "Frequent"
                elif avg_time_between_meals > 5:
                    recommendations.append("Consider adding healthy snacks between meals")
                    meal_pattern = "Infrequent"

        # Basic nutrient balance recommendations
        if current_calories > 0:
            protein_ratio = (current_protein * 4 / current_calories) if current_calories > 0 else 0
            carbs_ratio = (current_carbs * 4 / current_calories) if current_calories > 0 else 0
            fats_ratio = (current_fats * 9 / current_calories) if current_calories > 0 else 0

            # Adjust protein recommendations based on gender
            if gender == 'male':
                protein_min = 0.25  # 25% for males
                protein_max = 0.45  # 45% for males
            else:
                protein_min = 0.20  # 20% for females and others
                protein_max = 0.40  # 40% for females and others

            if protein_ratio < protein_min:
                recommendations.append("Try to include more protein-rich foods like lean meats, fish, eggs, or legumes")
            elif protein_ratio > protein_max:
                recommendations.append("Consider balancing your meals with more vegetables and whole grains")

            if carbs_ratio < 0.3:
                recommendations.append("Include more complex carbohydrates from whole grains, fruits, and vegetables")
            elif carbs_ratio > 0.65:
                recommendations.append("Try to include more protein and healthy fats in your meals")

            if fats_ratio < 0.2:
                recommendations.append("Add healthy fats from sources like avocados, nuts, and olive oil")
            elif fats_ratio > 0.35:
                recommendations.append("Consider reducing fat intake, especially from processed foods")

        # Age-specific recommendations
        if age is not None:
            if age < 25:
                recommendations.extend([
                    "Young adult nutrition tips:",
                    "- Support your active lifestyle with adequate calories",
                    "- Include foods rich in calcium and vitamin D",
                    "- Stay well-hydrated, especially during exercise"
                ])
            elif age >= 25 and age < 40:
                recommendations.extend([
                    "Adult nutrition tips:",
                    "- Balance nutrients for sustained energy",
                    "- Include anti-inflammatory foods",
                    "- Consider meal prep for consistent nutrition"
                ])
            elif age >= 40:
                recommendations.extend([
                    "Mid-life nutrition tips:",
                    "- Focus on nutrient-dense, whole foods",
                    "- Include foods rich in antioxidants",
                    "- Consider reducing sodium intake"
                ])

        return {
            'recommendations': recommendations,
            'analysis': {
                'current_intake': {
                    'calories': current_calories,
                    'recommended_calories': base_calories,
                    'macronutrients': {
                        'protein': current_protein,
                        'carbohydrates': current_carbs,
                        'fats': current_fats
                    }
                },
                'meal_pattern': meal_pattern,
                'nutrient_balance': {
                    'protein_ratio': round(protein_ratio * 100) if current_calories > 0 else 0,
                    'carbs_ratio': round(carbs_ratio * 100) if current_calories > 0 else 0,
                    'fats_ratio': round(fats_ratio * 100) if current_calories > 0 else 0
                },
                'profile_data': {
                    'age': age,
                    'gender': gender
                }
            },
            'profile_complete': bool(age and gender != 'other')
        }

    except Exception as e:
        logger.error(f"Diet recommendation error: {e}")
        return {
            'recommendations': [
                "Please complete your profile for personalized recommendations.",
                "In the meantime, try these general tips:",
                "- Track your meals regularly",
                "- Aim for balanced macronutrients",
                "- Stay hydrated throughout the day"
            ],
            'analysis': {
                'error': str(e),
                'profile_complete': False
            }
        }
