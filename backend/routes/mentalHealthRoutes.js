import express from 'express';
import {
  createMentalHealthLog,
  getMentalHealthLogs,
  getMentalHealthLog,
  updateMentalHealthLog,
  deleteMentalHealthLog
} from '../controllers/mentalHealthController.js';
import authMiddleware from '../middlewares/authMiddleware.js';

const router = express.Router();

// Debugging Middleware: Log the authenticated user for every request
router.use(authMiddleware, (req, res, next) => {
  if (!req.user) {
    console.warn("Unauthorized access attempt - No user data in request.");
    return res.status(401).json({ message: "Unauthorized. No user data found." });
  }
  console.log(`Authenticated User: ${req.user._id} (${req.user.email})`);
  next();
});

// ✅ Ensure userId is extracted from `req.user` (from authMiddleware)
router.post('/', createMentalHealthLog);  // Create a new log
router.get('/', getMentalHealthLogs);  // Get all logs for the user
router.get('/:id', getMentalHealthLog);  // Get a specific log
router.put('/:id', updateMentalHealthLog);  // Update a specific log
router.delete('/:id', deleteMentalHealthLog);  // Delete a specific log

export default router;
