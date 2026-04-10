import rateLimit from 'express-rate-limit';
import Logger from '../utils/logger.js';

// Strict rate limiter for auth endpoints (5 attempts per 15 minutes)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: {
    error: 'Too many authentication attempts',
    message: 'Please try again after 15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next, options) => {
    Logger.warn(`Rate limit exceeded for IP: ${req.ip} on auth endpoint`);
    res.status(429).json(options.message);
  },
  skip: (req) => {
    // Skip rate limiting in development
    return process.env.NODE_ENV === 'development';
  }
});

// General API rate limiter (100 requests per 15 minutes)
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    error: 'Too many requests',
    message: 'Please slow down and try again later'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Nutrition API rate limiter (300 requests per 15 minutes) - higher for meal logging
export const nutritionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: {
    error: 'Too many nutrition requests',
    message: 'Please slow down and try again later'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting in development
    return process.env.NODE_ENV === 'development';
  }
});

// Gamification points update limiter (60 per hour - allows frequent activity logging but prevents abuse)
export const pointsLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 60,
  message: {
    error: 'Too many points updates',
    message: 'Please slow down with activity logging'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next, options) => {
    Logger.warn(`Points rate limit exceeded for user: ${req.user?._id || req.ip}`);
    res.status(429).json(options.message);
  },
  skip: (req) => {
    return process.env.NODE_ENV === 'development';
  }
});

// Gamification streak update limiter (10 per hour - streaks should not update too frequently)
export const streakLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  message: {
    error: 'Too many streak updates',
    message: 'Streak updates are limited to prevent abuse'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next, options) => {
    Logger.warn(`Streak rate limit exceeded for user: ${req.user?._id || req.ip}`);
    res.status(429).json(options.message);
  },
  skip: (req) => {
    return process.env.NODE_ENV === 'development';
  }
});

// Gamification mood logging limiter (30 per hour)
export const moodLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 30,
  message: {
    error: 'Too many mood logs',
    message: 'Please slow down with mood logging'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next, options) => {
    Logger.warn(`Mood logging rate limit exceeded for user: ${req.user?._id || req.ip}`);
    res.status(429).json(options.message);
  },
  skip: (req) => {
    return process.env.NODE_ENV === 'development';
  }
});

export default { authLimiter, apiLimiter, nutritionLimiter, pointsLimiter, streakLimiter, moodLimiter };
