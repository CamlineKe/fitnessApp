import React, { useState, useEffect, useContext } from 'react';
import GamificationService from '../services/GamificationService';
import NotificationService from '../services/NotificationService';
import { UserContext } from '../components/UserContext';
import './styles/Gamification.css';
import { Tab, Tabs, ProgressBar } from 'react-bootstrap';
import {
  FaTrophy, FaMedal, FaStar, FaFire, FaRunning, FaDumbbell,
  FaSwimmer, FaHeart, FaBolt, FaStopwatch, FaBrain, FaAppleAlt,
  FaCalendarCheck, FaClock, FaCrown, FaUsers
} from 'react-icons/fa';
import { GiMeditation } from 'react-icons/gi';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { EventEmitter } from '../utils/EventEmitter';
import Logger from '../utils/logger';
import '@fortawesome/fontawesome-free/css/all.min.css';

const getMoodEmoji = (mood) => {
  switch (mood?.toLowerCase()) {
    case 'happy':
      return '😊';
    case 'sad':
      return '😢';
    case 'anxious':
      return '😰';
    case 'neutral':
      return '😐';
    default:
      return '❓';
  }
};

const getMoodColor = (mood) => {
  switch (mood?.toLowerCase()) {
    case 'happy':
      return '#4CAF50';
    case 'sad':
      return '#2196F3';
    case 'anxious':
      return '#FF9800';
    case 'neutral':
      return '#9E9E9E';
    default:
      return '#9E9E9E';
  }
};

const Gamification = () => {
  const { user, isAuthLoading } = useContext(UserContext);
  const [gamificationData, setGamificationData] = useState({
    points: { workout: 0, mental: 0, nutrition: 0 },
    streaks: {
      currentStreak: 0,
      bestStreak: 0,
      lastActivityDate: null,
      workoutStreak: 0,
      mentalStreak: 0,
      nutritionStreak: 0
    },
    stats: {
      totalWorkoutTime: 0,
      totalCaloriesBurned: 0,
      totalMealsLogged: 0,
      totalMoodChecks: 0
    },
    achievements: [],
    challenges: [],
    moodLog: []
  });
  const [leaderboard, setLeaderboard] = useState([]);
  const [activeTab, setActiveTab] = useState('workout');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState({
    data: true,
    workout: true,
    mental: true,
    nutrition: true,
    leaderboard: true
  });

  useEffect(() => {
    if (isAuthLoading) return;

    if (!user) {
      setError('Please log in to view your gamification data');
      setLoading(false);
      return;
    }

    const fetchGamificationData = async () => {
      try {
        setLoading(prev => ({ ...prev, data: true }));
        setError(null);
        const data = await GamificationService.getGamificationData();
        if (data) {
          setGamificationData(data);
        } else {
          // Initialize if no data exists
          const initialized = await GamificationService.initializeGamification();
          setGamificationData(initialized);
          toast.info('Welcome! Start your wellness journey by completing activities.');
        }
      } catch (error) {
        Logger.error('Failed to fetch gamification data:', error);
        setError('Failed to load data. Please try again.');
        toast.error('Error loading gamification data');
      } finally {
        setLoading(prev => ({ ...prev, data: false, workout: false, mental: false, nutrition: false }));
      }
    };

    const fetchLeaderboard = async () => {
      try {
        setLoading(prev => ({ ...prev, leaderboard: true }));
        const data = await GamificationService.getLeaderboard();
        if (data) {
          setLeaderboard(data);
        }
      } catch (error) {
        Logger.error('Failed to fetch leaderboard:', error);
      } finally {
        setLoading(prev => ({ ...prev, leaderboard: false }));
      }
    };

    fetchGamificationData();
    fetchLeaderboard();

    // Initialize Socket.IO connection
    NotificationService.initialize();
    if (user?._id) {
      NotificationService.joinUserRoom(user._id);
    }

    // Set up Socket.IO event listeners for real-time updates
    const unsubscribePoints = NotificationService.onPointsUpdated((data) => {
      Logger.debug('Real-time points update received:', data);
      // Refresh data to show updated points
      fetchGamificationData();
    });

    const unsubscribeLevelUp = NotificationService.onLevelUp((data) => {
      Logger.info('Level up event received:', data);
      // Show level-up celebration toast
      toast.success(
        <div>
          <strong>🎉 Level Up!</strong>
          <p>Congratulations! You've reached Level {data.newLevel}!</p>
          <p>Total Points: {data.totalPoints}</p>
        </div>,
        { autoClose: 5000, position: 'top-center' }
      );
      // Refresh data
      fetchGamificationData();
    });

    const unsubscribeAchievement = NotificationService.onAchievementUnlocked((data) => {
      Logger.info('Achievement unlocked event received:', data);
      // Show achievement toast
      toast.success(
        <div>
          <strong>🏆 Achievement Unlocked!</strong>
          <p>{data.name}</p>
          <p>{data.description}</p>
        </div>,
        { autoClose: 5000 }
      );
      // Refresh data
      fetchGamificationData();
    });

    const unsubscribeStreak = NotificationService.onStreakUpdated((data) => {
      Logger.debug('Streak updated event received:', data);
      fetchGamificationData();
    });

    // Listen for gamification updates from other components
    const handleGamificationUpdate = (data) => {
      Logger.debug('Gamification update received:', data);
      fetchGamificationData();
    };

    EventEmitter.on(EventEmitter.Events.GAMIFICATION_UPDATED, handleGamificationUpdate);

    return () => {
      EventEmitter.off(EventEmitter.Events.GAMIFICATION_UPDATED, handleGamificationUpdate);
      // Unsubscribe from Socket.IO events
      unsubscribePoints();
      unsubscribeLevelUp();
      unsubscribeAchievement();
      unsubscribeStreak();
    };
  }, [user, isAuthLoading]);

  const renderLeaderboardSection = () => (
    <div className="section-content">
      <div className="section-header-row">
        <FaTrophy className="section-icon" />
        <h2>Leaderboard</h2>
      </div>
      <div className="leaderboard-container">
        {loading.leaderboard ? (
          <div className="loading-spinner">Loading leaderboard...</div>
        ) : leaderboard.length === 0 ? (
          <div className="no-leaderboard">
            <FaUsers className="empty-icon" />
            <p>No leaderboard data available</p>
          </div>
        ) : (
          <div className="leaderboard-list">
            {leaderboard.map((entry, index) => (
              <div 
                key={entry.userId} 
                className={`leaderboard-item ${entry.userId === user?._id ? 'current-user' : ''} rank-${index + 1}`}
              >
                <div className="leaderboard-rank">
                  {index === 0 && <FaCrown className="rank-icon gold" />}
                  {index === 1 && <FaMedal className="rank-icon silver" />}
                  {index === 2 && <FaMedal className="rank-icon bronze" />}
                  {index > 2 && <span className="rank-number">{index + 1}</span>}
                </div>
                <div className="leaderboard-user">
                  <span className="leaderboard-username">
                    {entry.displayName || entry.username || 'Unknown User'}
                  </span>
                  {entry.userId === user?._id && <span className="you-badge">You</span>}
                </div>
                <div className="leaderboard-stats">
                  <span className="leaderboard-points">
                    <FaStar className="points-icon" /> {entry.totalPoints} pts
                  </span>
                  <span className="leaderboard-level">Level {entry.level}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderStreakCard = (category) => {
    const streak = gamificationData?.streaks?.[`${category}Streak`] || 0;
    const lastActivityDate = gamificationData?.streaks?.[`last${category.charAt(0).toUpperCase() + category.slice(1)}Date`];
    const today = new Date();
    const isActiveStreak = lastActivityDate && 
      new Date(lastActivityDate).toDateString() === today.toDateString();

    const icons = {
      workout: <FaRunning className="streak-icon" />,
      mental: <GiMeditation className="streak-icon" />,
      nutrition: <FaAppleAlt className="streak-icon" />
    };

    return (
      <div className={`streak-card ${isActiveStreak ? 'active-streak' : ''}`}>
        {icons[category]}
        <h3>{category.charAt(0).toUpperCase() + category.slice(1)} Streak</h3>
        <p className="streak-count">{streak} {streak === 1 ? 'day' : 'days'}</p>
        <div className="streak-flame">
          {streak > 0 && (
            <FaFire
              className={`flame ${streak > 2 ? 'flame-hot' : ''} ${isActiveStreak ? 'active' : ''}`}
              style={{ color: isActiveStreak ? '#ff6b6b' : '#999' }}
            />
          )}
        </div>
        {isActiveStreak ? (
          <p className="streak-status active">Active Today! 🔥</p>
        ) : lastActivityDate ? (
          <p className="streak-status inactive">Last active: {GamificationService.formatDate(lastActivityDate)}</p>
        ) : (
          <p className="streak-status new">Start your streak today!</p>
        )}
      </div>
    );
  };

  const renderChallenges = (category) => {
    const challenges = gamificationData?.challenges?.filter(c => c.category === category) || [];
    
    if (challenges.length === 0) {
      return (
        <div className="challenges-section">
          <h3>Active Challenges</h3>
          <div className="no-challenges">
            <i className="fas fa-trophy"></i>
            <p>No active challenges</p>
            <span className="empty-label">Keep logging activities to unlock challenges!</span>
          </div>
        </div>
      );
    }

    return (
      <div className="challenges-section">
        <h3>Active Challenges</h3>
        <div className="challenges-grid">
          {challenges.map((challenge, index) => (
            <div key={challenge.id || index} className="challenge-card">
              <h4>{challenge.name}</h4>
              <p>{challenge.description}</p>
              <div className="challenge-progress">
                <ProgressBar
                  now={challenge.progress}
                  label={`${challenge.progress}%`}
                  variant={challenge.progress === 100 ? "success" : "info"}
                />
              </div>
              {challenge.completed && (
                <div className="challenge-completed">
                  <FaTrophy className="challenge-trophy" />
                  <span>Completed!</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderWorkoutSection = () => (
    <div className="section-content">
      <div className="section-header-row">
        <FaRunning className="section-icon" />
        <h2>Workouts</h2>
      </div>
      {renderStreakCard('workout')}
      <div className="stats-row">
        <div className="stat-card">
          <FaDumbbell className="stat-icon" />
          <h3>Workout Points</h3>
          <p className="stat-value">{gamificationData?.points?.workout || 0}</p>
        </div>
        <div className="stat-card">
          <FaBolt className="stat-icon" />
          <h3>Active Achievements</h3>
          <p className="stat-value">{gamificationData?.achievements?.filter(a => a.category === 'workout' && a.unlocked)?.length || 0}</p>
        </div>
        <div className="stat-card">
          <FaClock className="stat-icon" />
          <h3>Total Time</h3>
          <p className="stat-value">{Math.round(gamificationData?.stats?.totalWorkoutTime || 0)} mins</p>
        </div>
        <div className="stat-card">
          <FaHeart className="stat-icon" />
          <h3>Calories Burned</h3>
          <p className="stat-value">{Math.round(gamificationData?.stats?.totalCaloriesBurned || 0)} kcal</p>
        </div>
      </div>
      <div className="achievements-row">
        <h3>Latest Achievements</h3>
        <div className="achievement-badges">
          {gamificationData?.achievements
            ?.filter(a => a.category === 'workout' && a.unlocked)
            ?.slice(-3)
            .map((achievement, index) => (
              <div key={achievement.id || index} className="achievement-badge">
                <FaMedal className="achievement-icon" />
                <div className="achievement-info">
                  <span className="achievement-name">{achievement.name}</span>
                  <span className="achievement-date">
                    {GamificationService.formatDate(achievement.unlockedAt)}
                  </span>
                </div>
              </div>
            ))}
          {(!gamificationData?.achievements?.filter(a => a.category === 'workout' && a.unlocked)?.length > 0) && (
            <div className="no-achievements">
              <i className="fas fa-medal"></i>
              <p>No achievements yet</p>
              <span className="empty-label">Complete workouts to earn badges!</span>
            </div>
          )}
        </div>
      </div>
      {renderChallenges('workout')}
    </div>
  );

  const renderMentalSection = () => (
    <div className="section-content">
      <div className="section-header-row">
        <FaBrain className="section-icon" />
        <h2>Mental Health</h2>
      </div>
      {renderStreakCard('mental')}
      <div className="stats-row">
        <div className="stat-card">
          <FaHeart className="stat-icon" />
          <h3>Mental Points</h3>
          <p className="stat-value">{gamificationData?.points?.mental || 0}</p>
        </div>
        <div className="stat-card">
          <FaBrain className="stat-icon" />
          <h3>Active Achievements</h3>
          <p className="stat-value">{gamificationData?.achievements?.filter(a => a.category === 'mental' && a.unlocked)?.length || 0}</p>
        </div>
        <div className="stat-card">
          <FaCalendarCheck className="stat-icon" />
          <h3>Mood Checks</h3>
          <p className="stat-value">{gamificationData?.stats?.totalMoodChecks || 0}</p>
        </div>
      </div>
      <div className="mood-tracker">
        <h3>Recent Moods</h3>
        <div className="mood-grid">
          {gamificationData?.moodLog?.length > 0 ? (
            gamificationData.moodLog.slice(-7).map((log, index) => (
              <div key={index} className="mood-day">
                <span className="mood-date">{GamificationService.formatDate(log.timestamp)}</span>
                <span 
                  className="mood-emoji"
                  style={{ backgroundColor: getMoodColor(log.mood) + '20' }}
                >
                  {getMoodEmoji(log.mood)}
                </span>
                <span className="mood-label">{log.mood}</span>
              </div>
            ))
          ) : (
            <div className="no-moods">
              <i className="fas fa-brain"></i>
              <p>No mood logs yet</p>
              <span className="empty-label">Check in daily to track your mental wellness!</span>
            </div>
          )}
        </div>
      </div>
      {renderChallenges('mental')}
    </div>
  );

  const renderNutritionSection = () => (
    <div className="section-content">
      <div className="section-header-row">
        <FaAppleAlt className="section-icon" />
        <h2>Nutrition</h2>
      </div>
      {renderStreakCard('nutrition')}
      <div className="stats-row">
        <div className="stat-card">
          <FaAppleAlt className="stat-icon" />
          <h3>Nutrition Points</h3>
          <p className="stat-value">{gamificationData?.points?.nutrition || 0}</p>
        </div>
        <div className="stat-card">
          <FaAppleAlt className="stat-icon" />
          <h3>Meals Logged</h3>
          <p className="stat-value">{gamificationData?.stats?.totalMealsLogged || 0}</p>
        </div>
        <div className="stat-card">
          <FaMedal className="stat-icon" />
          <h3>Active Achievements</h3>
          <p className="stat-value">{gamificationData?.achievements?.filter(a => a.category === 'nutrition' && a.unlocked)?.length || 0}</p>
        </div>
      </div>
      <div className="achievements-row">
        <h3>Latest Achievements</h3>
        <div className="achievement-badges">
          {gamificationData?.achievements
            ?.filter(a => a.category === 'nutrition' && a.unlocked)
            ?.slice(-3)
            .map((achievement, index) => (
              <div key={achievement.id || index} className="achievement-badge">
                <FaMedal className="achievement-icon" />
                <div className="achievement-info">
                  <span className="achievement-name">{achievement.name}</span>
                  <span className="achievement-date">
                    {GamificationService.formatDate(achievement.unlockedAt)}
                  </span>
                </div>
              </div>
            ))}
          {(!gamificationData?.achievements?.filter(a => a.category === 'nutrition' && a.unlocked)?.length > 0) && (
            <div className="no-achievements">
              <i className="fas fa-medal"></i>
              <p>No achievements yet</p>
              <span className="empty-label">Log meals to earn nutrition badges!</span>
            </div>
          )}
        </div>
      </div>
      {renderChallenges('nutrition')}
    </div>
  );

  // Calculate total points
  const totalPoints = 
    (gamificationData?.points?.workout || 0) + 
    (gamificationData?.points?.mental || 0) + 
    (gamificationData?.points?.nutrition || 0);

  const renderSkeletonCard = () => (
    <div className="stat-card skeleton-card">
      <div className="skeleton-icon"></div>
      <div className="skeleton-text"></div>
      <div className="skeleton-value"></div>
    </div>
  );

  const renderSkeletonSection = () => (
    <div className="section-content skeleton-section">
      <div className="skeleton-header"></div>
      <div className="skeleton-streak"></div>
      <div className="stats-row">
        {renderSkeletonCard()}
        {renderSkeletonCard()}
        {renderSkeletonCard()}
      </div>
    </div>
  );

  return (
    <div className="page-container">
      {error ? (
        <div className="error-container">
          <div className="error-message">{error}</div>
          <button onClick={() => window.location.reload()} className="retry-button">
            Try Again
          </button>
        </div>
      ) : (
        <div className="gamification-container">
          <div className="gamification-header">
            <h1>Gamification Dashboard</h1>
            <p>Track your progress and unlock achievements</p>
            <div className="header-stats">
              <div className="header-stat">
                <FaStar className="header-icon" />
                <span className="header-stat-label">Level {gamificationData?.level || 1}</span>
              </div>
              <div className="header-stat">
                <FaFire className="header-icon" />
                <span className="header-stat-label">{gamificationData?.streaks?.currentStreak || 0} Day Streak</span>
              </div>
              <div className="header-stat">
                <FaTrophy className="header-icon" />
                <span className="header-stat-label">{totalPoints} Total Points</span>
              </div>
            </div>
          </div>
          <div className="content-wrapper">
            {loading.workout ? renderSkeletonSection() : renderWorkoutSection()}
            {loading.mental ? renderSkeletonSection() : renderMentalSection()}
            {loading.nutrition ? renderSkeletonSection() : renderNutritionSection()}
          </div>
        </div>
      )}
    </div>
  );
};

export default Gamification;