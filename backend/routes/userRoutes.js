import express from 'express';
import {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  changeUserPassword,
  getAllUsers
} from '../controllers/userController.js';

import authMiddleware, { adminMiddleware } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Public Routes
router.post('/register', registerUser);
router.post('/login', loginUser);

// Protected Routes
router.get('/profile', authMiddleware, getUserProfile);
router.put('/profile', authMiddleware, updateUserProfile);
router.put('/change-password', authMiddleware, changeUserPassword);

// Admin Routes
router.get('/', authMiddleware, adminMiddleware, getAllUsers);

export default router;
