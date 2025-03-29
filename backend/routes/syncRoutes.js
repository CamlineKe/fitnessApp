import express from 'express';
import { syncData, getDeviceStatus, getHealthData, getCalories, getDeviceAuthUrl, connectDevice, disconnectDevice, testDeviceConnection } from '../controllers/syncController.js';
import authMiddleware from '../middlewares/authMiddleware.js';
import User from '../models/User.js';
import GoogleFitService from '../services/googleFitService.js';

const router = express.Router();

// Synchronize data from all connected platforms
router.post('/', authMiddleware, syncData);

// Get device statuses
router.get('/device-status', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      googleFit: {
        connected: user.devices?.googleFit?.connected || false,
        lastSynced: user.devices?.googleFit?.lastSynced
      },
      fitbit: {
        connected: user.devices?.fitbit?.connected || false,
        lastSynced: user.devices?.fitbit?.lastSynced
      }
    });
  } catch (error) {
    console.error('Error fetching device status:', error);
    res.status(500).json({ message: 'Failed to fetch device status' });
  }
});

// Get calories data
router.get('/calories', authMiddleware, getCalories);

// Get health data (calories and heart rate)
router.get('/health-data', authMiddleware, getHealthData);

// Device specific routes
router.get('/:device/auth-url', authMiddleware, getDeviceAuthUrl);
router.post('/:device/connect', authMiddleware, connectDevice);
router.post('/:device/disconnect', authMiddleware, disconnectDevice);

// Test device connection
router.get('/:device/test', authMiddleware, testDeviceConnection);

// Google Fit Routes
router.get('/google-fit/auth-url', authMiddleware, async (req, res) => {
  try {
    const authUrl = await GoogleFitService.getAuthUrl();
    res.json({ authUrl });
  } catch (error) {
    console.error('Error generating Google Fit auth URL:', error);
    res.status(500).json({ message: error.message });
  }
});

router.post('/google-fit/connect', authMiddleware, async (req, res) => {
  try {
    const result = await GoogleFitService.connect(req.user._id, req.body.code);
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/google-fit/disconnect', authMiddleware, async (req, res) => {
  try {
    const result = await GoogleFitService.disconnect(req.user._id);
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/google-fit/status', authMiddleware, async (req, res) => {
  try {
    const status = await GoogleFitService.getConnectionStatus(req.user._id);
    res.json(status);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Fitbit Routes
router.get('/fitbit/auth-url', authMiddleware, async (req, res) => {
  try {
    const authUrl = await FitbitService.getAuthUrl();
    res.json({ authUrl });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/fitbit/connect', authMiddleware, async (req, res) => {
  try {
    const result = await FitbitService.connect(req.user._id, req.body.code);
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/fitbit/disconnect', authMiddleware, async (req, res) => {
  try {
    const result = await FitbitService.disconnect(req.user._id);
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/fitbit/status', authMiddleware, async (req, res) => {
  try {
    const status = await FitbitService.getConnectionStatus(req.user._id);
    res.json(status);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;