import React, { useContext, useState, useEffect } from "react";
import { UserContext } from "../components/UserContext";
import EmptyState from "../components/EmptyState";
import "./styles/Dashboard.css";
import "@fortawesome/fontawesome-free/css/all.min.css";
import { Link, useNavigate } from "react-router-dom";
import { getNutritionData } from "../services/NutritionService";
import { getMentalHealthData } from "../services/MentalHealthService";
import WorkoutService from "../services/WorkoutService";
import GamificationService from '../services/GamificationService';
import { toast } from 'react-toastify';
import { EventEmitter } from '../utils/EventEmitter';
import { FaFire, FaRunning, FaBrain, FaAppleAlt } from 'react-icons/fa';
import Logger from '../utils/logger';

const CACHE_KEY = 'dashboard_cache';
const CACHE_MAX_AGE = 5 * 60 * 1000; // 5 minutes

// Helper to load cached data
const loadCachedData = () => {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;
    const { data, timestamp } = JSON.parse(cached);
    if (Date.now() - timestamp > CACHE_MAX_AGE) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }
    return data;
  } catch {
    return null;
  }
};

// Helper to save data to cache
const saveCachedData = (data) => {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ data, timestamp: Date.now() }));
  } catch (error) {
    Logger.error('Failed to cache dashboard data:', error);
  }
};

const Dashboard = () => {
  const { user, logout, getUserId, isAuthenticated } = useContext(UserContext);
  const navigate = useNavigate();
  const userId = getUserId();
  
  // Individual loading states per section instead of one global loader
  const [loading, setLoading] = useState({
    nutrition: false,
    workout: false,
    mentalHealth: false,
    gamification: false
  });

  // Initialize state from cache or empty values
  const cache = loadCachedData();
  const [nutritionData, setNutritionData] = useState(cache?.nutritionData || null);
  const [workoutData, setWorkoutData] = useState(cache?.workoutData || { activityType: 'No workout yet', duration: 0, caloriesBurned: 0 });
  const [mentalHealthData, setMentalHealthData] = useState(cache?.mentalHealthData || null);
  const [gamificationData, setGamificationData] = useState(cache?.gamificationData || null);
  const [activityFeed, setActivityFeed] = useState(cache?.activityFeed || []);

  // Helper function to check if a date is today
  const isToday = (date) => {
    const today = new Date();
    const activityDate = new Date(date);
    return activityDate.toDateString() === today.toDateString();
  };

  // Helper function to safely parse date
  const parseDate = (dateStr) => {
    const parsed = new Date(dateStr);
    return isNaN(parsed.getTime()) ? new Date() : parsed;
  };

  // ✅ Helper to calculate today's nutrition totals from logs array
  const calculateTodayNutrition = (nutritionResponse) => {
    const logs = nutritionResponse?.data || [];
    const todayLogs = logs.filter(log => isToday(log.date));
    
    return todayLogs.reduce((acc, log) => ({
      calories: acc.calories + (log.calories || 0),
      macronutrients: {
        protein: acc.macronutrients.protein + (log.macronutrients?.protein || 0),
        carbohydrates: acc.macronutrients.carbohydrates + (log.macronutrients?.carbohydrates || 0),
        fats: acc.macronutrients.fats + (log.macronutrients?.fats || 0)
      }
    }), {
      calories: 0,
      macronutrients: { protein: 0, carbohydrates: 0, fats: 0 }
    });
  };

  // Update activity feed from data
  const updateActivityFeed = (nutrition, workouts, mentalHealth) => {
    const allActivities = [
      ...(nutrition?.data || [])
        .filter(log => isToday(log.date))
        .map(log => ({
          type: 'nutrition',
          icon: 'fa-utensils',
          color: '#2196F3',
          timestamp: parseDate(log.date),
          title: `Logged ${log.foodItems?.join(", ") || "meal"}`,
          details: `${log.calories} calories`,
          category: log.mealType || 'Meal'
        })),
      ...(workouts?.data || [])
        .filter(log => isToday(log.date))
        .map(log => ({
          type: 'workout',
          icon: 'fa-dumbbell',
          color: '#4CAF50',
          timestamp: parseDate(log.date),
          title: `Completed ${log.activityType}`,
          details: `${log.duration} minutes, ${log.caloriesBurned} calories burned`,
          category: 'Exercise'
        })),
      ...(mentalHealth?.logs || [])
        .filter(log => isToday(log.date))
        .map(log => ({
          type: 'mental',
          icon: 'fa-brain',
          color: '#9C27B0',
          timestamp: parseDate(log.date),
          title: 'Mental Health Check-in',
          details: `Mood: ${log.mood}, Stress Level: ${log.stressLevel}/10`,
          category: 'Wellness'
        }))
    ];

    const sortedActivities = allActivities.sort((a, b) => b.timestamp - a.timestamp);
    setActivityFeed(sortedActivities);
    return sortedActivities;
  };

  // Fetch all dashboard data in one call to avoid race conditions
  const fetchAllDashboardData = async () => {
    if (!userId) return;
    
    setLoading({
      nutrition: true,
      workout: true,
      mentalHealth: true,
      gamification: true
    });
    
    try {
      // Fetch all data in parallel
      const [nutrition, todayWorkout, mentalHealth, gamification] = await Promise.all([
        getNutritionData().catch(err => {
          Logger.error("Error fetching nutrition data:", err);
          return null;
        }),
        WorkoutService.getWorkoutData().catch(err => {
          Logger.error("Error fetching workout data:", err);
          return null;
        }),
        getMentalHealthData(userId).catch(err => {
          Logger.error("Error fetching mental health data:", err);
          return null;
        }),
        GamificationService.getGamificationData().catch(err => {
          Logger.error("Error fetching gamification data:", err);
          return null;
        })
      ]);
      
      // Update all state at once
      // ✅ Calculate today's nutrition totals from logs array
      setNutritionData(calculateTodayNutrition(nutrition));
      setWorkoutData(todayWorkout || { activityType: 'No workout yet', duration: 0, caloriesBurned: 0 });
      // ✅ Mental health data comes as { logs: [...] }, store the logs array
      setMentalHealthData(mentalHealth?.logs || []);
      setGamificationData(gamification);
      
      // Get all workouts for activity feed (not just today's)
      let allWorkouts = [];
      try {
        allWorkouts = await WorkoutService.getWorkoutLogs() || [];
      } catch (err) {
        Logger.error("Error fetching workout logs:", err);
      }
      
      // Update activity feed once with ALL fresh data
      const activities = updateActivityFeed(nutrition, allWorkouts, mentalHealth);
      
      // Cache all data
      saveCachedData({
        nutritionData: calculateTodayNutrition(nutrition),
        workoutData: todayWorkout,
        mentalHealthData: mentalHealth?.logs || [],
        gamificationData: gamification,
        activityFeed: activities
      });
      
    } finally {
      setLoading({
        nutrition: false,
        workout: false,
        mentalHealth: false,
        gamification: false
      });
    }
  };

  // Initial data load
  useEffect(() => {
    if (!isAuthenticated) return;

    Logger.debug('Dashboard: Fetching all data...');
    fetchAllDashboardData();

    // Listen for updates using EventEmitter
    const handleWorkoutUpdate = () => {
      Logger.debug('Dashboard: Workout update detected, refreshing...');
      fetchAllDashboardData();
    };

    const handleGamificationUpdate = (data) => {
      Logger.debug('Dashboard: Gamification update detected:', data);
      if (data?.streaks) {
        setGamificationData(prevData => ({
          ...prevData,
          streaks: { ...prevData?.streaks, ...data.streaks }
        }));
      } else {
        fetchAllDashboardData();
      }
    };

    const handleNutritionUpdate = () => {
      Logger.debug('Dashboard: Nutrition update detected, refreshing...');
      fetchAllDashboardData();
    };

    const handleMentalHealthUpdate = () => {
      Logger.debug('Dashboard: Mental health update detected, refreshing...');
      fetchAllDashboardData();
    };

    // Refresh data when user returns to dashboard tab/window
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        Logger.debug('Dashboard: Tab became visible, refreshing data...');
        localStorage.removeItem(CACHE_KEY); // Clear stale cache
        fetchAllDashboardData();
      }
    };

    EventEmitter.on(EventEmitter.Events.WORKOUT_UPDATED, handleWorkoutUpdate);
    EventEmitter.on(EventEmitter.Events.GAMIFICATION_UPDATED, handleGamificationUpdate);
    EventEmitter.on(EventEmitter.Events.NUTRITION_UPDATED, handleNutritionUpdate);
    EventEmitter.on(EventEmitter.Events.MENTAL_HEALTH_UPDATED, handleMentalHealthUpdate);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      EventEmitter.off(EventEmitter.Events.WORKOUT_UPDATED, handleWorkoutUpdate);
      EventEmitter.off(EventEmitter.Events.GAMIFICATION_UPDATED, handleGamificationUpdate);
      EventEmitter.off(EventEmitter.Events.NUTRITION_UPDATED, handleNutritionUpdate);
      EventEmitter.off(EventEmitter.Events.MENTAL_HEALTH_UPDATED, handleMentalHealthUpdate);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isAuthenticated, userId]);

  const quickActions = [
    { icon: 'fa-plus-circle', label: 'Log Workout', action: () => { localStorage.removeItem(CACHE_KEY); navigate('/workout'); }, color: '#4CAF50' },
    { icon: 'fa-utensils', label: 'Log Meal', action: () => { localStorage.removeItem(CACHE_KEY); navigate('/nutrition'); }, color: '#2196F3' },
    { icon: 'fa-brain', label: 'Daily Check-in', action: () => { localStorage.removeItem(CACHE_KEY); navigate('/mentalhealth'); }, color: '#9C27B0' },
    { icon: 'fa-trophy', label: 'Achievements', action: () => { localStorage.removeItem(CACHE_KEY); navigate('/gamification'); }, color: '#FF9800' },
  ];

  const handleLogout = () => {
    logout();
    localStorage.removeItem(CACHE_KEY);
    navigate("/", { replace: true });
  };

  // Loading spinner component for sections
  const SectionLoader = () => (
    <div className="section-loader">
      <div className="loading-spinner-small"></div>
    </div>
  );

  return (
    <div className="page-container">
      <div className="dashboard-container">
        <div className="dashboard-header">
          <button onClick={handleLogout} className="logout-button">
            <i className="fas fa-sign-out-alt"></i> Logout
          </button>
          <h1>Welcome, {user?.name || user?.username || "User"} to Fitness Hub</h1>
          <p>Track your fitness journey and achieve your goals</p>
        </div>
        
        <div className="dashboard-content">
          <section className="quick-stats">
            <h2>Quick Actions</h2>
            <div className="quick-actions-grid">
              {quickActions.map((action, index) => (
                <button key={index} className="quick-action-card" onClick={action.action}>
                  <i className={`fas ${action.icon}`} style={{ color: action.color }}></i>
                  <span>{action.label}</span>
                </button>
              ))}
            </div>
          </section>

          <section className="todays-progress">
            <div className="todays-progress-header">
              <h2><i className="fas fa-chart-line"></i> Today's Progress</h2>
              <p>Track your daily achievements and milestones</p>
            </div>

            <div className="stats-grid">
              <Link to="/nutrition" className="stat-card calories">
                <div className="stat-header">
                  <i className="fas fa-utensils"></i>
                  <h3>Nutrition</h3>
                  {loading.nutrition && <SectionLoader />}
                </div>
                {nutritionData?.calories > 0 ? (
                  <>
                    <div className="stat-content">
                      <p className="stat-value">{nutritionData.calories}</p>
                      <p className="stat-label">Calories Consumed</p>
                    </div>
                    <div className="macro-pills">
                      <div className="macro-pill protein">
                        <i className="fas fa-drumstick-bite"></i>
                        <span className="macro-value">{nutritionData.macronutrients?.protein || 0}g</span>
                        <span className="macro-name">Protein</span>
                      </div>
                      <div className="macro-pill carbs">
                        <i className="fas fa-bread-slice"></i>
                        <span className="macro-value">{nutritionData.macronutrients?.carbohydrates || 0}g</span>
                        <span className="macro-name">Carbs</span>
                      </div>
                      <div className="macro-pill fat">
                        <i className="fas fa-droplet"></i>
                        <span className="macro-value">{nutritionData.macronutrients?.fats || 0}g</span>
                        <span className="macro-name">Fat</span>
                      </div>
                    </div>
                  </>
                ) : (
                  <EmptyState
                    icon="fa-utensils"
                    title="No meals logged today"
                    subtitle="Click to add nutrition"
                    variant="compact"
                    action={{ label: "Log Meal", to: "/nutrition", icon: "fa-plus" }}
                  />
                )}
                <div className="stat-footer">View Nutrition <i className="fas fa-arrow-right"></i></div>
              </Link>

              <Link to="/workout" className="stat-card workout">
                <div className="stat-header">
                  <i className="fas fa-dumbbell"></i>
                  <h3>Workouts</h3>
                  {loading.workout && <SectionLoader />}
                </div>
                {workoutData?.duration > 0 ? (
                  <div className="stat-content">
                    <p className="stat-value">{workoutData.duration}</p>
                    <p className="stat-label">minutes today</p>
                    <div className="workout-pills">
                      <div className="workout-pill activity">
                        <i className={`fas fa-${workoutData.activityType?.toLowerCase().includes('run') ? 'running' : workoutData.activityType?.toLowerCase().includes('cycle') || workoutData.activityType?.toLowerCase().includes('bike') ? 'bicycle' : 'dumbbell'}`}></i>
                        <span className="workout-pill-value">{workoutData.activityType}</span>
                      </div>
                      <div className="workout-pill calories-burned">
                        <i className="fas fa-fire"></i>
                        <span className="workout-pill-value">{workoutData.caloriesBurned || 0}</span>
                        <span className="workout-pill-label">calories</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <EmptyState
                    icon="fa-dumbbell"
                    title="No workout logged today"
                    subtitle="Click to add workout"
                    variant="compact"
                    action={{ label: "Log Workout", to: "/workout", icon: "fa-plus" }}
                  />
                )}
                <div className="stat-footer">View Workouts →</div>
              </Link>

              <Link to="/mentalhealth" className="stat-card mental-health">
                <div className="stat-header">
                  <i className="fas fa-brain"></i>
                  <h3>Mental Health</h3>
                  {loading.mentalHealth && <SectionLoader />}
                </div>
                {(() => {
                  const todayLog = mentalHealthData?.find(log => isToday(log.date));
                  const stressLevel = todayLog?.stressLevel || 0;
                  const sleepQuality = todayLog?.sleepQuality || 0;
                  // Stress is inverse (higher = worse)
                  const stressSeverity = stressLevel >= 8 ? 'high' : stressLevel >= 5 ? 'medium' : 'low';
                  // Sleep is normal (higher = better)
                  const sleepSeverity = sleepQuality >= 7 ? 'high' : sleepQuality >= 5 ? 'medium' : 'low';

                  return todayLog?.mood ? (
                    <div className="stat-content">
                      <p className="stat-value">
                        {todayLog.mood.charAt(0).toUpperCase() + todayLog.mood.slice(1)}
                      </p>
                      <p className="stat-label">today's mood</p>
                      <div className="mental-pills">
                        <div className={`mental-pill stress ${stressSeverity}`}>
                          <i className="fas fa-heart-pulse"></i>
                          <span className="mental-pill-value">{stressLevel}/10</span>
                          <span className="mental-pill-label">Stress</span>
                        </div>
                        <div className={`mental-pill sleep ${sleepSeverity}`}>
                          <i className="fas fa-bed"></i>
                          <span className="mental-pill-value">{sleepQuality}/10</span>
                          <span className="mental-pill-label">Sleep</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <EmptyState
                      icon="fa-brain"
                      title="No check-in today"
                      subtitle="Click to complete check-in"
                      variant="compact"
                      action={{ label: "Check In", to: "/mentalhealth", icon: "fa-plus" }}
                    />
                  );
                })()}
                <div className="stat-footer">View Mental Health →</div>
              </Link>

              <Link to="/gamification" className="stat-card gamification">
                <div className="stat-header">
                  <i className="fas fa-trophy"></i>
                  <h3>Progress</h3>
                  {loading.gamification && <SectionLoader />}
                </div>
                {gamificationData?.effectiveCurrentStreak > 0 ? (
                  <div className="stat-content">
                    <div className="streak-info">
                      <p className="stat-value">
                        {gamificationData.effectiveCurrentStreak}
                        <span className="streak-label"> day streak</span>
                      </p>
                      <p className="stat-label">
                        <FaFire style={{ color: '#ff6b6b' }} />
                        Keep it up!
                      </p>
                    </div>
                    {/* Category breakdown pills - NEW */}
                    <div className="category-pills">
                      <div className={`category-pill workout ${gamificationData?.effectiveStreaks?.workout?.status || 'new'}`}>
                        <FaRunning />
                        <span>{gamificationData?.effectiveStreaks?.workout?.value || 0}</span>
                      </div>
                      <div className={`category-pill mental ${gamificationData?.effectiveStreaks?.mental?.status || 'new'}`}>
                        <FaBrain />
                        <span>{gamificationData?.effectiveStreaks?.mental?.value || 0}</span>
                      </div>
                      <div className={`category-pill nutrition ${gamificationData?.effectiveStreaks?.nutrition?.status || 'new'}`}>
                        <FaAppleAlt />
                        <span>{gamificationData?.effectiveStreaks?.nutrition?.value || 0}</span>
                      </div>
                    </div>
                    <div className="stat-details">
                      <span>Best Streak: {gamificationData.streaks?.bestStreak || 0} days</span>
                      <span>Total Points: {
                        (gamificationData.points?.workout || 0) +
                        (gamificationData.points?.mental || 0) +
                        (gamificationData.points?.nutrition || 0)
                      }</span>
                    </div>
                  </div>
                ) : (
                  <EmptyState
                    icon="fa-trophy"
                    title="No streak yet"
                    subtitle="Start logging to build your streak!"
                    variant="compact"
                    action={{ label: "View Progress", to: "/gamification", icon: "fa-arrow-right" }}
                  />
                )}
                <div className="stat-footer">View Progress <i className="fas fa-arrow-right"></i></div>
              </Link>
            </div>
          </section>

          <section className="todays-activity">
            <div className="activity-header">
              <h2><i className="fas fa-stream"></i> Today's Activities</h2>
              <p>{new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</p>
            </div>

            <div className="activity-feed">
              {activityFeed.length === 0 ? (
                <EmptyState
                  icon="fa-calendar-plus"
                  title="No activities logged today"
                  subtitle="Use Quick Actions above to get started!"
                  variant="default"
                />
              ) : (
                <div className="activity-list">
                  {activityFeed.map((activity, index) => (
                    <div key={index} className={`activity-item ${activity.type}`}>
                      <div className="activity-icon" style={{ backgroundColor: activity.color }}>
                        <i className={`fas ${activity.icon}`}></i>
                      </div>
                      <div className="activity-content">
                        <h3>{activity.title}</h3>
                        <p>{activity.details}</p>
                        <span className="activity-category">{activity.category}</span>
                        <span className="activity-time">
                          {activity.timestamp instanceof Date 
                            ? activity.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                            : new Date(activity.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
