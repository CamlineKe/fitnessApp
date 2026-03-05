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
import { validate } from '../middlewares/validation.js';
import { userValidation } from '../middlewares/validation.js';

const router = express.Router();

// Public Routes with validation
router.post('/register', 
  validate(userValidation.register), 
  registerUser
);

router.post('/login', 
  validate(userValidation.login), 
  loginUser
);

// Protected Routes with validation
router.get('/profile', 
  authMiddleware, 
  getUserProfile
);

router.put('/profile', 
  authMiddleware, 
  validate(userValidation.updateProfile), 
  updateUserProfile
);

router.put('/change-password', 
  authMiddleware, 
  validate(userValidation.changePassword), 
  changeUserPassword
);

// Admin Routes
router.get('/', 
  authMiddleware, 
  adminMiddleware, 
  getAllUsers
);

export default router;