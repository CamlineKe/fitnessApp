import { body, param, query, validationResult } from 'express-validator';
import Logger from '../utils/logger.js';

// Middleware to handle validation results
export const validate = (validations) => {
  return async (req, res, next) => {
    // Run all validations
    await Promise.all(validations.map(validation => validation.run(req)));

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    Logger.debug('Validation errors:', errors.array());
    
    return res.status(400).json({
      message: 'Validation failed',
      errors: errors.array().map(err => ({
        field: err.path,
        message: err.msg
      }))
    });
  };
};

// User validation rules
export const userValidation = {
  register: [
    body('username')
      .trim()
      .isLength({ min: 3, max: 30 }).withMessage('Username must be between 3 and 30 characters')
      .matches(/^[a-zA-Z0-9_]+$/).withMessage('Username can only contain letters, numbers, and underscores'),
    
    body('email')
      .trim()
      .isEmail().withMessage('Must be a valid email address')
      .normalizeEmail(),
    
    body('password')
      .isLength({ min: 6 }).withMessage('Password must be at least 6 characters long')
      .matches(/^(?=.*[A-Za-z])(?=.*\d)/).withMessage('Password must contain at least one letter and one number'),
    
    body('firstName')
      .optional()
      .trim()
      .isLength({ max: 50 }).withMessage('First name cannot exceed 50 characters'),
    
    body('lastName')
      .optional()
      .trim()
      .isLength({ max: 50 }).withMessage('Last name cannot exceed 50 characters'),
    
    body('dateOfBirth')
      .optional()
      .isISO8601().withMessage('Must be a valid date')
      .custom((value) => {
        const date = new Date(value);
        const now = new Date();
        const age = now.getFullYear() - date.getFullYear();
        if (age < 13) throw new Error('User must be at least 13 years old');
        if (age > 120) throw new Error('Invalid date of birth');
        return true;
      }),
    
    body('gender')
      .optional()
      .isIn(['male', 'female', 'other']).withMessage('Gender must be one of: male, female, other')
  ],

  login: [
    body('email')
      .trim()
      .isEmail().withMessage('Must be a valid email address')
      .normalizeEmail(),
    
    body('password')
      .notEmpty().withMessage('Password is required')
  ],

  updateProfile: [
    body('firstName')
      .optional()
      .trim()
      .isLength({ max: 50 }).withMessage('First name cannot exceed 50 characters'),
    
    body('lastName')
      .optional()
      .trim()
      .isLength({ max: 50 }).withMessage('Last name cannot exceed 50 characters'),
    
    body('dateOfBirth')
      .optional()
      .isISO8601().withMessage('Must be a valid date'),
    
    body('gender')
      .optional()
      .isIn(['male', 'female', 'other']).withMessage('Gender must be one of: male, female, other'),
    
    body('healthGoals')
      .optional()
      .trim()
      .isLength({ max: 500 }).withMessage('Health goals cannot exceed 500 characters')
  ],

  changePassword: [
    body('currentPassword')
      .notEmpty().withMessage('Current password is required'),
    
    body('newPassword')
      .isLength({ min: 6 }).withMessage('New password must be at least 6 characters long')
      .matches(/^(?=.*[A-Za-z])(?=.*\d)/).withMessage('New password must contain at least one letter and one number')
  ]
};

// Workout validation rules
export const workoutValidation = {
  create: [
    body('date')
      .optional()
      .isISO8601().withMessage('Must be a valid date'),
    
    body('activityType')
      .trim()
      .notEmpty().withMessage('Activity type is required')
      .isLength({ max: 100 }).withMessage('Activity type cannot exceed 100 characters'),
    
    body('duration')
      .isInt({ min: 1, max: 1440 }).withMessage('Duration must be between 1 and 1440 minutes'),
    
    body('caloriesBurned')
      .optional()
      .isInt({ min: 0 }).withMessage('Calories burned must be a positive number'),
    
    body('heartRate')
      .optional()
      .isInt({ min: 30, max: 220 }).withMessage('Heart rate must be between 30 and 220 bpm'),
    
    body('feedback')
      .optional()
      .trim()
      .isLength({ max: 500 }).withMessage('Feedback cannot exceed 500 characters')
  ],

  update: [
    param('id')
      .isMongoId().withMessage('Invalid workout ID format'),
    
    body('date')
      .optional()
      .isISO8601().withMessage('Must be a valid date'),
    
    body('activityType')
      .optional()
      .trim()
      .isLength({ max: 100 }).withMessage('Activity type cannot exceed 100 characters'),
    
    body('duration')
      .optional()
      .isInt({ min: 1, max: 1440 }).withMessage('Duration must be between 1 and 1440 minutes'),
    
    body('caloriesBurned')
      .optional()
      .isInt({ min: 0 }).withMessage('Calories burned must be a positive number'),
    
    body('heartRate')
      .optional()
      .isInt({ min: 30, max: 220 }).withMessage('Heart rate must be between 30 and 220 bpm'),
    
    body('feedback')
      .optional()
      .trim()
      .isLength({ max: 500 }).withMessage('Feedback cannot exceed 500 characters')
  ]
};

// Nutrition validation rules
export const nutritionValidation = {
  create: [
    body('date')
      .optional()
      .isISO8601().withMessage('Must be a valid date'),
    
    body('mealType')
      .isIn(['breakfast', 'lunch', 'dinner', 'snack']).withMessage('Invalid meal type'),
    
    body('foodItems')
      .isArray({ min: 1 }).withMessage('At least one food item is required')
      .custom((items) => {
        if (!items.every(item => typeof item === 'string' && item.trim().length > 0)) {
          throw new Error('All food items must be non-empty strings');
        }
        return true;
      }),
    
    body('calories')
      .optional()
      .isInt({ min: 0, max: 10000 }).withMessage('Calories must be between 0 and 10000'),
    
    body('macronutrients.protein')
      .optional()
      .isFloat({ min: 0 }).withMessage('Protein must be a positive number'),
    
    body('macronutrients.carbohydrates')
      .optional()
      .isFloat({ min: 0 }).withMessage('Carbohydrates must be a positive number'),
    
    body('macronutrients.fats')
      .optional()
      .isFloat({ min: 0 }).withMessage('Fats must be a positive number')
  ],

  update: [
    param('id')
      .isMongoId().withMessage('Invalid nutrition log ID format'),
    
    body('mealType')
      .optional()
      .isIn(['breakfast', 'lunch', 'dinner', 'snack']).withMessage('Invalid meal type'),
    
    body('foodItems')
      .optional()
      .isArray().withMessage('Food items must be an array')
      .custom((items) => {
        if (items && !items.every(item => typeof item === 'string' && item.trim().length > 0)) {
          throw new Error('All food items must be non-empty strings');
        }
        return true;
      }),
    
    body('calories')
      .optional()
      .isInt({ min: 0, max: 10000 }).withMessage('Calories must be between 0 and 10000')
  ]
};

// Mental health validation rules
export const mentalHealthValidation = {
  create: [
    body('date')
      .optional()
      .isISO8601().withMessage('Must be a valid date'),
    
    body('stressLevel')
      .isInt({ min: 0, max: 10 }).withMessage('Stress level must be between 0 and 10'),
    
    body('mood')
      .isIn(['happy', 'sad', 'anxious', 'neutral']).withMessage('Invalid mood value'),
    
    body('sleepQuality')
      .isInt({ min: 0, max: 10 }).withMessage('Sleep quality must be between 0 and 10'),
    
    body('notes')
      .optional()
      .trim()
      .isLength({ max: 1000 }).withMessage('Notes cannot exceed 1000 characters')
      .custom((value, { req }) => {
        // Notes required when mood is sad or anxious
        if ((req.body.mood === 'sad' || req.body.mood === 'anxious') && (!value || value.trim().length === 0)) {
          throw new Error('Notes are required when mood is sad or anxious');
        }
        return true;
      })
  ],

  update: [
    param('id')
      .isMongoId().withMessage('Invalid mental health log ID format'),
    
    body('stressLevel')
      .optional()
      .isInt({ min: 0, max: 10 }).withMessage('Stress level must be between 0 and 10'),
    
    body('mood')
      .optional()
      .isIn(['happy', 'sad', 'anxious', 'neutral']).withMessage('Invalid mood value'),
    
    body('sleepQuality')
      .optional()
      .isInt({ min: 0, max: 10 }).withMessage('Sleep quality must be between 0 and 10'),
    
    body('notes')
      .optional()
      .trim()
      .isLength({ max: 1000 }).withMessage('Notes cannot exceed 1000 characters')
  ]
};

// ID parameter validation
export const idValidation = [
  param('id')
    .isMongoId().withMessage('Invalid ID format')
];

// Pagination validation
export const paginationValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
];

// Device validation
export const deviceValidation = {
  connect: [
    param('device')
      .isIn(['google-fit', 'fitbit']).withMessage('Invalid device type'),
    
    body('code')
      .notEmpty().withMessage('Authorization code is required')
  ],

  disconnect: [
    param('device')
      .isIn(['google-fit', 'fitbit']).withMessage('Invalid device type')
  ],

  test: [
    param('device')
      .isIn(['googleFit', 'fitbit']).withMessage('Invalid device type for testing')
  ]
};

export default {
  validate,
  userValidation,
  workoutValidation,
  nutritionValidation,
  mentalHealthValidation,
  idValidation,
  paginationValidation,
  deviceValidation
};