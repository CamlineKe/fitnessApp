import { useState, useEffect, useContext, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import notificationService from '../services/NotificationService';
import { UserContext } from './UserContext';
import { EventEmitter } from '../utils/EventEmitter';
import '../components/Notification.css';
import Logger from '../utils/logger';

const Notification = () => {
  const [notifications, setNotifications] = useState([]);
  const navigate = useNavigate();
  const { user, getUserId } = useContext(UserContext);
  const userId = getUserId();
  
  // Track recent notification hashes to prevent duplicates
  const recentNotifications = useRef(new Set());

  useEffect(() => {
    // Initialize notification service
    notificationService.initialize();

    // Join user room when user is available
    if (userId) {
      notificationService.joinUserRoom(userId);
      Logger.debug('Notification: Joined user room for', userId);
    }

    // Register event listeners
    const unsubscribePointsUpdated = notificationService.onPointsUpdated((data) => {
      addNotification({
        type: 'points',
        title: 'Points Earned!',
        message: `You earned ${data.points} points for your activity.`,
        data
      });
    });

    const unsubscribeLevelUp = notificationService.onLevelUp((data) => {
      addNotification({
        type: 'level',
        title: 'Level Up!',
        message: `Congratulations! You've reached level ${data.newLevel}.`,
        data
      });
    });

    const unsubscribeAchievementUnlocked = notificationService.onAchievementUnlocked((data) => {
      addNotification({
        type: 'achievement',
        title: 'Achievement Unlocked!',
        message: `You've unlocked the "${data.name}" achievement!`,
        data
      });
    });

    const unsubscribeStreakUpdated = notificationService.onStreakUpdated((data) => {
      addNotification({
        type: 'streak',
        title: 'Streak Updated!',
        message: `You're on a ${data.days} day streak!`,
        data
      });
    });

    const unsubscribeChallengeCompleted = notificationService.onChallengeCompleted((data) => {
      addNotification({
        type: 'challenge',
        title: 'Challenge Completed!',
        message: `You've completed the "${data.name}" challenge!`,
        data
      });
    });

    // Listen for local events from pages (Workout, Nutrition, MentalHealth)
    const handleLocalPointsUpdated = (data) => {
      Logger.debug('Notification: Local points update received:', data);
      addNotification({
        type: 'points',
        title: 'Points Earned!',
        message: `You earned ${data.points || 0} points for your activity.`,
        data
      });
    };

    const handleLocalStreakUpdated = (data) => {
      Logger.debug('Notification: Local streak update received:', data);
      addNotification({
        type: 'streak',
        title: 'Streak Updated!',
        message: `You're on a ${data.days || 1} day streak! 🔥`,
        data
      });
    };

    const handleLocalAchievementUnlocked = (data) => {
      Logger.debug('Notification: Local achievement received:', data);
      addNotification({
        type: 'achievement',
        title: 'Achievement Unlocked!',
        message: `You've unlocked the "${data.name || 'New Achievement'}" achievement!`,
        data
      });
    };

    const handleLocalLevelUp = (data) => {
      Logger.debug('Notification: Local level up received:', data);
      addNotification({
        type: 'level',
        title: 'Level Up!',
        message: `Congratulations! You've reached level ${data.newLevel || 1}.`,
        data
      });
    };

    EventEmitter.on(EventEmitter.Events.GAMIFICATION_UPDATED, handleLocalPointsUpdated);
    EventEmitter.on(EventEmitter.Events.WORKOUT_UPDATED, handleLocalStreakUpdated);

    // Clean up event listeners on unmount
    return () => {
      unsubscribePointsUpdated();
      unsubscribeLevelUp();
      unsubscribeAchievementUnlocked();
      unsubscribeStreakUpdated();
      unsubscribeChallengeCompleted();
      notificationService.disconnect();
      
      EventEmitter.off(EventEmitter.Events.GAMIFICATION_UPDATED, handleLocalPointsUpdated);
      EventEmitter.off(EventEmitter.Events.WORKOUT_UPDATED, handleLocalStreakUpdated);
    };
  }, [userId]); // Re-run when userId changes

  // Add a new notification with deduplication
  const addNotification = (notification) => {
    // Create a hash of the notification content
    const hash = `${notification.type}-${notification.title}-${notification.message}`;
    
    // Check if we recently showed this exact notification
    if (recentNotifications.current.has(hash)) {
      Logger.debug('Duplicate notification prevented:', hash);
      return;
    }
    
    // Add to recent set and schedule removal
    recentNotifications.current.add(hash);
    setTimeout(() => {
      recentNotifications.current.delete(hash);
    }, 2000); // 2 second deduplication window
    
    const id = Date.now();
    const newNotification = {
      id,
      ...notification,
      timestamp: new Date()
    };
    
    Logger.debug('Adding notification:', newNotification);
    
    setNotifications(prev => [newNotification, ...prev]);

    // Auto-dismiss after 5 seconds
    setTimeout(() => {
      dismissNotification(id);
    }, 5000);
  };

  // Dismiss a notification
  const dismissNotification = (id) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id 
          ? { ...notification, dismissing: true } 
          : notification
      )
    );

    // Remove from state after animation completes
    setTimeout(() => {
      setNotifications(prev => 
        prev.filter(notification => notification.id !== id)
      );
    }, 300);
  };

  // Handle notification click
  const handleNotificationClick = (notification) => {
    // Navigate to relevant page based on notification type
    switch (notification.type) {
      case 'points':
      case 'level':
      case 'achievement':
        navigate('/gamification');
        break;
      case 'streak':
        navigate('/workout');
        break;
      case 'challenge':
        navigate('/gamification');
        break;
      default:
        break;
    }
    
    // Dismiss the notification
    dismissNotification(notification.id);
  };

  // Format timestamp
  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="notification-container">
      {notifications.map(notification => (
        <div 
          key={notification.id} 
          className={`notification-item ${notification.type} ${notification.dismissing ? 'dismissing' : ''}`}
          onClick={() => handleNotificationClick(notification)}
        >
          <div className="notification-header">
            <h4>{notification.title}</h4>
            <button 
              className="notification-dismiss" 
              onClick={(e) => {
                e.stopPropagation();
                dismissNotification(notification.id);
              }}
            >
              &times;
            </button>
          </div>
          <div className="notification-content">
            {notification.message}
          </div>
          <div className="notification-time">
            {formatTime(notification.timestamp)}
          </div>
        </div>
      ))}
    </div>
  );
};

export default Notification;
