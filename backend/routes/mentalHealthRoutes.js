import express from 'express';
import {
  createMentalHealthLog,
  getMentalHealthLogs,
  getMentalHealthLog,
  updateMentalHealthLog,
  deleteMentalHealthLog
} from '../controllers/mentalHealthController.js';
import authMiddleware from '../middlewares/authMiddleware.js';
import { validate } from '../middlewares/validation.js';
import { mentalHealthValidation, idValidation } from '../middlewares/validation.js';
import Logger from '../utils/logger.js';

const router = express.Router();

// Debugging Middleware: Log the authenticated user for every request
router.use(authMiddleware, (req, res, next) => {
  if (!req.user) {
    Logger.warn("Unauthorized access attempt - No user data in request.");
    return res.status(401).json({ message: "Unauthorized. No user data found." });
  }
  Logger.debug(`Authenticated User: ${req.user._id} (${req.user.email})`);
  next();
});

// Create a new log with validation
router.post('/', 
  validate(mentalHealthValidation.create), 
  createMentalHealthLog
);

// Get all logs for the user
router.get('/', getMentalHealthLogs);

// Get a specific log with ID validation
router.get('/:id', 
  validate(idValidation), 
  getMentalHealthLog
);

// Update a specific log with validation
router.put('/:id', 
  validate([...idValidation, ...mentalHealthValidation.update]), 
  updateMentalHealthLog
);

// Delete a specific log with ID validation
router.delete('/:id', 
  validate(idValidation), 
  deleteMentalHealthLog
);

export default router;