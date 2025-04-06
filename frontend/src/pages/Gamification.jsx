import React, { useState, useEffect, useContext } from 'react';
import GamificationService from '../services/GamificationService';
import { UserContext } from '../components/UserContext';
import './styles/Gamification.css';
import { Tab, Tabs, ProgressBar } from 'react-bootstrap';
import {
  FaTrophy, FaMedal, FaStar, FaFire, FaRunning, FaDumbbell,
  FaSwimmer, FaHeart, FaBolt, FaStopwatch, FaBrain, FaAppleAlt
} from 'react-icons/fa';
import { GiMeditation } from 'react-icons/gi';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Logger from '../utils/logger';

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

const Gamification = () => {
  const { user, isAuthLoading } = useContext(UserContext);
  const [activeTab, setActiveTab] = useState('workout');
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
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAuthLoading) return;

    if (!user) {
      setError('Please log in to view your gamification data');
      return;
    }

    const fetchGamificationData = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await GamificationService.getGamificationData();
        if (data) {
          setGamificationData(data);
        } else {
          await initializeNewUserData();
        }
      } catch (error) {
        Logger.error('Failed to fetch gamification data:', error);
        setError('Failed to load data. Please try again.');
        toast.error('Error loading gamification data');
      } finally {
        setLoading(false);
      }
    };

    fetchGamificationData();
  }, [user, isAuthLoading]);

  const initializeNewUserData = async () => {
    try {
      // Initialize with default values
      const defaultData = {
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
        challenges: [
          {
            id: 'welcome',
            name: 'Welcome Challenge',
            description: 'Complete your first activity in each category',
            category: 'workout',
            target: 100,
            progress: 0,
            completed: false,
            startDate: new Date(),
            endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
          }
        ],
        moodLog: []
      };
      setGamificationData(defaultData);
      toast.info('Welcome! Start your wellness journey by completing activities.');
    } catch (error) {
      Logger.error('Failed to initialize new user data:', error);
      toast.error('Error setting up your profile');
    }
  };

  const renderStreakCard = (category) => {
    const streak = gamificationData?.streaks?.[`${category}Streak`] || 0;
    const lastActivityDate = new Date(gamificationData?.streaks?.lastActivityDate || null);
    const today = new Date();
    const isActiveStreak = lastActivityDate &&
      lastActivityDate.toDateString() === today.toDateString();

    const icons = {
      workout: <FaRunning className="streak-icon" />,
      mental: <GiMeditation className="streak-icon" />,
      nutrition: <FaAppleAlt className="streak-icon" />
    };

    return (
      <div className={`streak-card ${isActiveStreak ? 'active-streak' : ''}`}>
        {icons[category]}
        <h3>{category.charAt(0).toUpperCase() + category.slice(1)} Streak</h3>
        <p className="streak-count">{streak} days</p>
        <div className="streak-flame">
          {streak > 0 && (
            <FaFire
              className={`flame ${streak > 2 ? 'flame-hot' : ''} ${isActiveStreak ? 'active' : ''}`}
              style={{ color: isActiveStreak ? '#ff6b6b' : '#999' }}
            />
          )}
        </div>
        {isActiveStreak && <p className="streak-status">Active Today!</p>}
      </div>
    );
  };

  const renderChallenges = (category) => {
    const challenges = gamificationData?.challenges?.filter(c => c.category === category) || [];
    return (
      <div className="challenges-section">
        <h3>Active Challenges</h3>
        <div className="challenges-grid">
          {challenges.map((challenge, index) => (
            <div key={index} className="challenge-card">
              <h4>{challenge.name}</h4>
              <p>{challenge.description}</p>
              <ProgressBar
                now={challenge.progress}
                label={`${challenge.progress}%`}
                variant={challenge.progress === 100 ? "success" : "info"}
              />
              {challenge.completed && <FaTrophy className="challenge-trophy" />}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderWorkoutTab = () => (
    <div className="tab-content-section">
      {renderStreakCard('workout')}
      <div className="stats-row">
        <div className="stat-card">
          <FaDumbbell className="stat-icon" />
          <h3>Workout Points</h3>
          <p>{gamificationData?.points?.workout || 0}</p>
        </div>
        <div className="stat-card">
          <FaBolt className="stat-icon" />
          <h3>Active Achievements</h3>
          <p>{gamificationData?.achievements?.filter(a => a.category === 'workout' && a.unlocked)?.length || 0}</p>
        </div>
        <div className="stat-card">
          <FaStopwatch className="stat-icon" />
          <h3>Total Time</h3>
          <p>{Math.round(gamificationData?.stats?.totalWorkoutTime || 0)} mins</p>
        </div>
      </div>
      <div className="achievements-row">
        <h3>Latest Achievements</h3>
        <div className="achievement-badges">
          {gamificationData?.achievements
            ?.filter(a => a.category === 'workout' && a.unlocked)
            ?.slice(-3)
            .map((achievement, index) => (
              <div key={index} className="achievement-badge">
                <FaMedal className="achievement-icon" />
                <FaStar className="achievement-star" />
                <span>{achievement.name}</span>
              </div>
            ))}
        </div>
      </div>
      {renderChallenges('workout')}
    </div>
  );

  const renderMentalTab = () => (
    <div className="tab-content-section">
      {renderStreakCard('mental')}
      <div className="stats-row">
        <div className="stat-card">
          <FaHeart className="stat-icon" />
          <h3>Mental Points</h3>
          <p>{gamificationData?.points?.mental || 0}</p>
        </div>
        <div className="stat-card">
          <FaBrain className="stat-icon" />
          <h3>Active Achievements</h3>
          <p>{gamificationData?.achievements?.filter(a => a.category === 'mental' && a.unlocked)?.length || 0}</p>
        </div>
        <div className="stat-card">
          <FaBrain className="stat-icon" />
          <h3>Mood Checks</h3>
          <p>{gamificationData?.stats?.totalMoodChecks || 0}</p>
        </div>
      </div>
      <div className="mood-tracker">
        <h3>Mood Log</h3>
        <div className="mood-grid">
          {gamificationData?.moodLog?.slice(-7).map((log, index) => (
            <div key={index} className={`mood-day mood-${log.mood}`}>
              <span className="mood-date">
                {GamificationService.formatDate(log.timestamp)}
              </span>
              <span className="mood-emoji">
                {getMoodEmoji(log.mood)}
              </span>
            </div>
          ))}
        </div>
      </div>
      {renderChallenges('mental')}
    </div>
  );

  const renderNutritionTab = () => (
    <div className="tab-content-section">
      {renderStreakCard('nutrition')}
      <div className="stats-row">
        <div className="stat-card">
          <FaAppleAlt className="stat-icon" />
          <h3>Nutrition Points</h3>
          <p>{gamificationData?.points?.nutrition || 0}</p>
        </div>
        <div className="stat-card">
          <FaAppleAlt className="stat-icon" />
          <h3>Meals Logged</h3>
          <p>{gamificationData?.stats?.totalMealsLogged || 0}</p>
        </div>
      </div>
      {renderChallenges('nutrition')}
    </div>
  );

  return (
    <div className="page-container">
      {error ? (
        <div className="error-message">{error}</div>
      ) : loading ? (
        <div className="loading-spinner">Loading...</div>
      ) : (
        <div className="gamification-container">
          <div className="gamification-header">
            <h1>Gamification Dashboard</h1>
            <p>Track your progress and unlock achievements</p>
          </div>
          <div className="tabs-wrapper">
            <Tabs
              activeKey={activeTab}
              onSelect={(k) => setActiveTab(k)}
              className="gamification-tabs"
            >
              <Tab eventKey="workout" title={<><FaRunning /> Workouts</>}>
                {renderWorkoutTab()}
              </Tab>
              <Tab eventKey="mental" title={<><FaBrain /> Mental Health</>}>
                {renderMentalTab()}
              </Tab>
              <Tab eventKey="nutrition" title={<><FaAppleAlt /> Nutrition</>}>
                {renderNutritionTab()}
              </Tab>
            </Tabs>
          </div>
        </div>
      )}
    </div>
  );
};

export default Gamification;