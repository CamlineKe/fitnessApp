import * as fitbitService from '../services/fitbitService.js';
import * as googleFitService from '../services/googleFitService.js';
import * as appleHealthService from '../services/appleHealthService.js';
import GoogleFitService from '../services/googleFitService.js';
import FitbitService from '../services/fitbitService.js';
import User from '../models/User.js';

// Placeholder for actual synchronization logic
const syncFitbitData = async (userId) => {
  const fitbitData = await fitbitService.getFitbitData(userId);
  // Process and save Fitbit data to your database
  // Example: Save workout data
  const workoutLog = new Workout({ userId, ...fitbitData.workout });
  await workoutLog.save();
};

const syncGoogleFitData = async (userId) => {
  const googleFitData = await googleFitService.getGoogleFitData(userId);
  // Process and save Google Fit data to your database
  // Example: Save nutrition data
  const nutritionLog = new Nutrition({ userId, ...googleFitData.nutrition });
  await nutritionLog.save();
};

const syncAppleHealthData = async (userId) => {
  const appleHealthData = await appleHealthService.getAppleHealthData(userId);
  // Process and save Apple Health data to your database
  // Example: Save mental health data
  const mentalHealthLog = new MentalHealth({ userId, ...appleHealthData.mentalHealth });
  await mentalHealthLog.save();
};

export const syncData = async (req, res) => {
  try {
    const userId = req.user.userId;
    await syncFitbitData(userId);
    await syncGoogleFitData(userId);
    await syncAppleHealthData(userId);
    res.json({ message: 'Data synchronization complete' });
  } catch (error) {
    res.status(500).send('Server error');
  }
};

export const getCalories = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);

    let caloriesData = {
      source: null,
      calories: 0,
      lastSynced: null
    };

    // Try Google Fit first
    if (user?.devices?.googleFit?.connected) {
      try {
        const data = await GoogleFitService.getCaloriesBurned(userId);
        caloriesData = {
          source: 'Google Fit',
          calories: data.calories,
          lastSynced: data.lastSynced
        };
      } catch (error) {
        console.error('Error fetching Google Fit calories:', error);
      }
    }
    // If Google Fit fails or isn't connected, try Fitbit
    else if (user?.devices?.fitbit?.connected) {
      try {
        const data = await FitbitService.getCaloriesBurned(userId);
        caloriesData = {
          source: 'Fitbit',
          calories: data.calories,
          lastSynced: data.lastSynced
        };
      } catch (error) {
        console.error('Error fetching Fitbit calories:', error);
      }
    }

    res.json(caloriesData);
  } catch (error) {
    console.error('Error fetching calories:', error);
    res.status(500).json({
      error: 'Failed to fetch calories data',
      details: error.message
    });
  }
};

export const getHealthData = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);

    let healthData = {
      source: null,
      calories: 0,
      heartRate: 0,
      lastSynced: null
    };

    // Try Google Fit first
    if (user?.devices?.googleFit?.connected) {
      try {
        const data = await GoogleFitService.getHealthData(userId);
        healthData = {
          source: 'Google Fit',
          calories: data.calories,
          heartRate: data.heartRate,
          lastSynced: data.lastSynced
        };
      } catch (error) {
        console.error('Error fetching Google Fit health data:', error);
      }
    }
    // If Google Fit fails or isn't connected, try Fitbit
    else if (user?.devices?.fitbit?.connected) {
      try {
        const data = await FitbitService.getHealthData(userId);
        healthData = {
          source: 'Fitbit',
          calories: data.calories,
          heartRate: data.heartRate,
          lastSynced: data.lastSynced
        };
      } catch (error) {
        console.error('Error fetching Fitbit health data:', error);
      }
    }

    res.json(healthData);
  } catch (error) {
    console.error('Error fetching health data:', error);
    res.status(500).json({
      error: 'Failed to fetch health data',
      details: error.message
    });
  }
};

export const getDeviceStatus = async (req, res) => {
  try {
    const userId = req.user.id;

    const [googleFitStatus, fitbitStatus] = await Promise.all([
      GoogleFitService.getConnectionStatus(userId),
      FitbitService.getConnectionStatus(userId)
    ]);

    res.json({
      googleFit: googleFitStatus,
      fitbit: fitbitStatus
    });
  } catch (error) {
    console.error('Error fetching device status:', error);
    res.status(500).json({ error: error.message });
  }
};

export const getDeviceAuthUrl = async (req, res) => {
  try {
    const { device } = req.params;

    let authUrl;
    switch (device) {
      case 'google-fit':
        authUrl = await GoogleFitService.getAuthUrl();
        break;
      case 'fitbit':
        authUrl = await FitbitService.getAuthUrl();
        break;
      default:
        return res.status(400).json({ message: 'Invalid device type' });
    }

    res.json({ authUrl });
  } catch (error) {
    console.error('Error generating auth URL:', error);
    res.status(500).json({
      message: 'Failed to generate authentication URL',
      error: error.message
    });
  }
};

export const connectDevice = async (req, res) => {
  try {
    const { device } = req.params;
    const { code } = req.body;
    const userId = req.user.id;

    let tokens;
    switch (device) {
      case 'google-fit':
        tokens = await GoogleFitService.exchangeCodeForTokens(code);
        await User.findByIdAndUpdate(userId, {
          'devices.googleFit': {
            connected: true,
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            lastSynced: new Date()
          }
        });
        break;
      case 'fitbit':
        tokens = await FitbitService.exchangeCodeForTokens(code);
        await User.findByIdAndUpdate(userId, {
          'devices.fitbit': {
            connected: true,
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            lastSynced: new Date()
          }
        });
        break;
      default:
        return res.status(400).json({ message: 'Invalid device type' });
    }

    res.json({ message: `Successfully connected to ${device}` });
  } catch (error) {
    console.error('Error connecting device:', error);
    res.status(500).json({
      message: 'Failed to connect device',
      error: error.message
    });
  }
};

export const disconnectDevice = async (req, res) => {
  try {
    const { device } = req.params;
    const userId = req.user.id;

    switch (device) {
      case 'google-fit':
        await GoogleFitService.disconnect(userId);
        break;
      case 'fitbit':
        await FitbitService.disconnect(userId);
        break;
      default:
        return res.status(400).json({ message: 'Unsupported device type' });
    }

    res.json({ message: `Successfully disconnected ${device}` });
  } catch (error) {
    console.error(`Error disconnecting device:`, error);
    res.status(500).json({ error: error.message });
  }
};

export const testDeviceConnection = async (req, res) => {
  try {
    const { device } = req.params;
    const userId = req.user.id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    let testResult = {
      connected: false,
      tokenValid: false,
      canFetchData: false,
      details: {}
    };

    switch (device) {
      case 'googleFit':
        if (!user.devices?.googleFit?.connected) {
          return res.status(400).json({ message: 'Google Fit not connected' });
        }
        try {
          // Test token validity
          const googleFitData = await GoogleFitService.getHealthData(userId);
          testResult = {
            connected: true,
            tokenValid: true,
            canFetchData: true,
            details: {
              lastSync: user.devices.googleFit.lastSynced,
              dataReceived: !!googleFitData
            }
          };
        } catch (error) {
          testResult.details.error = error.message;
        }
        break;

      case 'fitbit':
        if (!user.devices?.fitbit?.connected) {
          return res.status(400).json({ message: 'Fitbit not connected' });
        }
        try {
          // Test token validity
          const fitbitData = await FitbitService.getHealthData(userId);
          testResult = {
            connected: true,
            tokenValid: true,
            canFetchData: true,
            details: {
              lastSync: user.devices.fitbit.lastSynced,
              dataReceived: !!fitbitData
            }
          };
        } catch (error) {
          testResult.details.error = error.message;
        }
        break;

      default:
        return res.status(400).json({ message: 'Invalid device type' });
    }

    res.json(testResult);
  } catch (error) {
    console.error(`Error testing ${req.params.device} connection:`, error);
    res.status(500).json({
      message: 'Error testing device connection',
      error: error.message
    });
  }
};