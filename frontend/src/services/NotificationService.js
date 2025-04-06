import { io } from 'socket.io-client';
import Logger from '../utils/logger';

class NotificationService {
  constructor() {
    this.socket = null;
    this.connected = false;
    this.callbacks = {
      pointsUpdated: [],
      levelUp: [],
      achievementUnlocked: [],
      streakUpdated: [],
      challengeCompleted: []
    };
  }

  // Initialize the socket connection
  initialize() {
    if (this.socket) return;

    // Get base URL without the /api suffix for Socket.IO connection
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    const SOCKET_URL = API_URL.replace('/api', '');
    
    Logger.info('Connecting to socket server at:', SOCKET_URL);
    
    this.socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 20000,
      withCredentials: true
    });

    // Set up connection event handlers
    this.socket.on('connect', () => {
      Logger.info('Socket connected:', this.socket.id);
      this.connected = true;
      
      // Authenticate the socket connection
      const token = localStorage.getItem('token');
      if (token) {
        this.socket.emit('authenticate', token);
      }
    });

    this.socket.on('connect_error', (error) => {
      Logger.error('Socket connection error:', error.message);
    });

    this.socket.on('disconnect', () => {
      Logger.info('Socket disconnected');
      this.connected = false;
    });

    this.socket.on('error', (error) => {
      Logger.error('Socket error:', error);
    });

    // Set up notification event handlers
    this.socket.on('points_updated', (data) => {
      Logger.debug('Points updated:', data);
      this.callbacks.pointsUpdated.forEach(callback => callback(data));
    });

    this.socket.on('level_up', (data) => {
      Logger.info('Level up:', data);
      this.callbacks.levelUp.forEach(callback => callback(data));
    });

    this.socket.on('achievement_unlocked', (data) => {
      Logger.info('Achievement unlocked:', data);
      this.callbacks.achievementUnlocked.forEach(callback => callback(data));
    });

    this.socket.on('streak_updated', (data) => {
      Logger.debug('Streak updated:', data);
      this.callbacks.streakUpdated.forEach(callback => callback(data));
    });

    this.socket.on('challenge_completed', (data) => {
      Logger.info('Challenge completed:', data);
      this.callbacks.challengeCompleted.forEach(callback => callback(data));
    });
  }

  // Join the user's personal room for targeted notifications
  joinUserRoom(userId) {
    if (!this.connected || !this.socket) return;
    Logger.debug('Joining user room for:', userId);
    this.socket.emit('join_user_room', userId);
  }

  // Register callback for points updated events
  onPointsUpdated(callback) {
    this.callbacks.pointsUpdated.push(callback);
    return () => {
      this.callbacks.pointsUpdated = this.callbacks.pointsUpdated.filter(cb => cb !== callback);
    };
  }

  // Register callback for level up events
  onLevelUp(callback) {
    this.callbacks.levelUp.push(callback);
    return () => {
      this.callbacks.levelUp = this.callbacks.levelUp.filter(cb => cb !== callback);
    };
  }

  // Register callback for achievement unlocked events
  onAchievementUnlocked(callback) {
    this.callbacks.achievementUnlocked.push(callback);
    return () => {
      this.callbacks.achievementUnlocked = this.callbacks.achievementUnlocked.filter(cb => cb !== callback);
    };
  }

  // Register callback for streak updated events
  onStreakUpdated(callback) {
    this.callbacks.streakUpdated.push(callback);
    return () => {
      this.callbacks.streakUpdated = this.callbacks.streakUpdated.filter(cb => cb !== callback);
    };
  }

  // Register callback for challenge completed events
  onChallengeCompleted(callback) {
    this.callbacks.challengeCompleted.push(callback);
    return () => {
      this.callbacks.challengeCompleted = this.callbacks.challengeCompleted.filter(cb => cb !== callback);
    };
  }

  // Disconnect the socket
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
    }
  }
}

// Create a singleton instance
const notificationService = new NotificationService();

export default notificationService;
