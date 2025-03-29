import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import notificationService from '../services/NotificationService';
import '../components/Notification.css';

const Notification = () => {
  const [notifications, setNotifications] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    // Initialize notification service
    notificationService.initialize();

    // Get user data from localStorage
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    if (userData._id) {
      notificationService.joinUserRoom(userData._id);
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

    // Clean up event listeners on unmount
    return () => {
      unsubscribePointsUpdated();
      unsubscribeLevelUp();
      unsubscribeAchievementUnlocked();
      unsubscribeStreakUpdated();
      unsubscribeChallengeCompleted();
      notificationService.disconnect();
    };
  }, []);

  // Add a new notification
  const addNotification = (notification) => {
    const id = Date.now();
    const newNotification = {
      id,
      ...notification,
      timestamp: new Date()
    };
    
    console.log('Adding notification:', newNotification);
    
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
