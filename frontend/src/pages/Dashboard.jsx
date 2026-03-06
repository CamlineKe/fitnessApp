import React, { useContext, useState, useEffect } from "react";
import { UserContext } from "../components/UserContext";
import "./styles/Dashboard.css";
import "@fortawesome/fontawesome-free/css/all.min.css"; // Updated import
import { Link, useNavigate } from "react-router-dom";
import { getNutritionData } from "../services/NutritionService";
import { getMentalHealthData } from "../services/MentalHealthService";
import WorkoutService from "../services/WorkoutService";
import GamificationService from '../services/GamificationService';
import { toast } from 'react-toastify';
import { EventEmitter } from '../utils/EventEmitter';
import { FaFire } from 'react-icons/fa';
import Logger from '../utils/logger';

const Dashboard = () => {
  const { user, logout } = useContext(UserContext);
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [nutritionData, setNutritionData] = useState(null);
  const [workoutData, setWorkoutData] = useState(null);
  const [mentalHealthData, setMentalHealthData] = useState(null);
  const [gamificationData, setGamificationData] = useState(null);
  const [activityFeed, setActivityFeed] = useState([]);

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

  const fetchDashboardData = async () => {
    if (!user?._id) {
      toast.error("Please log in to view your dashboard");
      return;
    }

    try {
      setIsLoading(true);
      Logger.debug('Dashboard: Fetching fresh data...');

      const [nutrition, workouts, mentalHealth, gamification] = await Promise.all([
        getNutritionData(),
        WorkoutService.getWorkoutLogs(),
        getMentalHealthData(user._id),
        GamificationService.getGamificationData()
      ]);

      // Get today's workout from the workouts array
      const today = new Date();
      const todayWorkout = workouts?.find(workout =>
        new Date(workout.date).toDateString() === today.toDateString()
      ) || {
        activityType: 'No workout yet',
        duration: 0,
        caloriesBurned: 0
      };

      // Combine all activities into a single feed
      const allActivities = [
        ...(nutrition?.mealLogs || [])
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
        ...(workouts || [])
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
        ...(Array.isArray(mentalHealth) ? mentalHealth : [])
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

      // Sort activities by timestamp (most recent first)
      const sortedActivities = allActivities.sort((a, b) => b.timestamp - a.timestamp);
      Logger.debug('Dashboard: Updated activity feed:', sortedActivities);

      setActivityFeed(sortedActivities);
      setNutritionData(nutrition);
      setWorkoutData(todayWorkout);
      setMentalHealthData(mentalHealth);
      setGamificationData(gamification);
    } catch (error) {
      Logger.error("Error fetching dashboard data:", error);
      toast.error("Failed to load some dashboard data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();

    // Listen for workout and gamification updates using EventEmitter constants
    const handleWorkoutUpdate = () => {
      Logger.debug('Dashboard: Workout update detected, refreshing data...');
      fetchDashboardData();
    };

    const handleGamificationUpdate = (data) => {
      Logger.debug('Dashboard: Gamification update detected with data:', data);
      
      // If we received streak data, update it directly
      if (data?.streaks) {
        setGamificationData(prevData => ({
          ...prevData,
          streaks: {
            ...prevData?.streaks,
            ...data.streaks
          }
        }));
      } else {
        // Otherwise refresh all data
        fetchDashboardData();
      }
    };

    const handleNutritionUpdate = () => {
      Logger.debug('Dashboard: Nutrition update detected, refreshing data...');
      fetchDashboardData();
    };

    const handleMentalHealthUpdate = () => {
      Logger.debug('Dashboard: Mental health update detected, refreshing data...');
      fetchDashboardData();
    };

    // Use EventEmitter constants
    EventEmitter.on(EventEmitter.Events.WORKOUT_UPDATED, handleWorkoutUpdate);
    EventEmitter.on(EventEmitter.Events.GAMIFICATION_UPDATED, handleGamificationUpdate);
    EventEmitter.on(EventEmitter.Events.NUTRITION_UPDATED, handleNutritionUpdate);
    EventEmitter.on(EventEmitter.Events.MENTAL_HEALTH_RECOMMENDATIONS_UPDATED, handleMentalHealthUpdate);

    return () => {
      EventEmitter.off(EventEmitter.Events.WORKOUT_UPDATED, handleWorkoutUpdate);
      EventEmitter.off(EventEmitter.Events.GAMIFICATION_UPDATED, handleGamificationUpdate);
      EventEmitter.off(EventEmitter.Events.NUTRITION_UPDATED, handleNutritionUpdate);
      EventEmitter.off(EventEmitter.Events.MENTAL_HEALTH_RECOMMENDATIONS_UPDATED, handleMentalHealthUpdate);
    };
  }, [user?._id]); // Only re-run if user ID changes

  const quickActions = [
    {
      icon: 'fa-plus-circle',
      label: 'Log Workout',
      action: () => navigate('/workout'),
      color: '#4CAF50'
    },
    {
      icon: 'fa-utensils',
      label: 'Log Meal',
      action: () => navigate('/nutrition'),
      color: '#2196F3'
    },
    {
      icon: 'fa-brain',
      label: 'Daily Check-in',
      action: () => navigate('/mentalhealth'),
      color: '#9C27B0'
    },
    {
      icon: 'fa-trophy',
      label: 'Achievements',
      action: () => navigate('/gamification'),
      color: '#FF9800'
    },
  ];

  const handleLogout = () => {
    logout();
    navigate("/", { replace: true });
  };

  if (isLoading) {
    return <div className="dashboard-loading">Loading dashboard data...</div>;
  }

  return (
    <div className="page-container">
      <div className="dashboard-container">
        <div className="dashboard-header">
          <button onClick={handleLogout} className="logout-button">
            <i className="fas fa-sign-out-alt"></i> Logout {/* Updated icon */}
          </button>
          <h1>Welcome, {user?.name || user?.username || "User"} to Fitness Hub</h1>
          <p>Track your fitness journey and achieve your goals</p>
        </div>
        <div className="dashboard-content">
          <section className="quick-stats">
            {/* Quick Actions Section */}
            <h2>Quick Actions</h2>
            <div className="quick-actions-grid">
              {quickActions.map((action, index) => (
                <button
                  key={index}
                  className="quick-action-card"
                  onClick={action.action}
                >
                  <i className={`fas ${action.icon}`} style={{ color: action.color }}></i> {/* Updated to fas */}
                  <span>{action.label}</span>
                </button>
              ))}
            </div>
          </section>
          <section className="todays-progress">
            <div className="todays-progress-header">
              <h2>
                <i className="fas fa-chart-line"></i> {/* Already correct */}
                Today's Progress
              </h2>
              <p>Track your daily achievements and milestones</p>
            </div>

            <div className="stats-grid">
              <Link to="/nutrition" className="stat-card calories">
                <div className="stat-header">
                  <i className="fas fa-utensils"></i> {/* Updated to fas */}
                  <h3>Nutrition</h3>
                </div>
                <div className="stat-content">
                  <p className="stat-value">{nutritionData?.calories || 0}</p>
                  <p className="stat-label">Calories Consumed</p>
                </div>
                <div className="stat-details">
                  <span>Protein: {nutritionData?.macronutrients?.protein || 0}g</span>
                  <span>Carbs: {nutritionData?.macronutrients?.carbohydrates || 0}g</span>
                  <span>Fat: {nutritionData?.macronutrients?.fats || 0}g</span>
                </div>
                <div className="stat-footer">
                  View Nutrition <i className="fas fa-arrow-right"></i> {/* Already correct */}
                </div>
              </Link>

              <Link to="/workout" className="stat-card workout">
                <div className="stat-header">
                  <i className="fas fa-dumbbell"></i> {/* Updated to fas */}
                  <h3>Workouts</h3>
                </div>
                <div className="stat-content">
                  <p className="stat-value">{workoutData?.duration || 0}</p>
                  <p className="stat-label">minutes today</p>
                  <div className="stat-details">
                    <span>{workoutData?.activityType || 'No workout yet'}</span>
                    <span>{workoutData?.caloriesBurned || 0} calories burned</span>
                  </div>
                </div>
                <div className="stat-footer">View Workouts →</div>
              </Link>

              <Link to="/mentalhealth" className="stat-card mental-health">
                <div className="stat-header">
                  <i className="fas fa-brain"></i> {/* Updated to fas */}
                  <h3>Mental Health</h3>
                </div>
                <div className="stat-content">
                  <p className="stat-value">
                    {mentalHealthData?.[0]?.mood ?
                      mentalHealthData[0].mood.charAt(0).toUpperCase() + mentalHealthData[0].mood.slice(1) :
                      'No check-in'}
                  </p>
                  <p className="stat-label">today's mood</p>
                  <div className="stat-details">
                    <span>Stress: {mentalHealthData?.[0]?.stressLevel || 0}/10</span>
                    <span>Sleep: {mentalHealthData?.[0]?.sleepQuality || 0}/10</span>
                  </div>
                </div>
                <div className="stat-footer">View Mental Health →</div>
              </Link>

              <Link to="/gamification" className="stat-card gamification">
                <div className="stat-header">
                  <i className="fas fa-trophy"></i> {/* Updated to fas */}
                  <h3>Progress</h3>
                </div>
                <div className="stat-content">
                  <div className="streak-info">
                    <p className="stat-value">
                      {gamificationData?.streaks?.currentStreak || 0}
                      <span className="streak-label"> day streak</span>
                    </p>
                    <p className="stat-label">
                      <FaFire style={{ color: gamificationData?.streaks?.currentStreak > 0 ? '#ff6b6b' : '#999' }} />
                      {gamificationData?.streaks?.currentStreak > 0 ? 'Keep it up!' : 'Start your streak!'}
                    </p>
                  </div>
                  <div className="stat-details">
                    <span>Best Streak: {gamificationData?.streaks?.bestStreak || 0} days</span>
                    <span>Total Points: {
                      (gamificationData?.points?.workout || 0) +
                      (gamificationData?.points?.mental || 0) +
                      (gamificationData?.points?.nutrition || 0)
                    }</span>
                  </div>
                </div>
                <div className="stat-footer">
                  View Progress <i className="fas fa-arrow-right"></i> {/* Already correct */}
                </div>
              </Link>
            </div>
          </section>
          <section className="todays-activity">
            <div className="activity-header">
              <h2>
                <i className="fas fa-stream"></i> {/* Already correct */}
                Today's Activities
              </h2>
              <p>{new Date().toLocaleDateString(undefined, {
                weekday: 'long',
                month: 'long',
                day: 'numeric'
              })}</p>
            </div>

            <div className="activity-feed">
              {activityFeed.length === 0 ? (
                <div className="no-activities">
                  <i className="fas fa-calendar-plus"></i> {/* Updated to fas */}
                  <p>No activities logged today. Start your wellness journey!</p>
                  <div className="quick-add-buttons">
                    <Link to="/workout" className="quick-add-btn workout">
                      <i className="fas fa-dumbbell"></i> Log Workout {/* Updated to fas */}
                    </Link>
                    <Link to="/nutrition" className="quick-add-btn nutrition">
                      <i className="fas fa-utensils"></i> Log Meal {/* Updated to fas */}
                    </Link>
                    <Link to="/mentalhealth" className="quick-add-btn mental">
                      <i className="fas fa-brain"></i> Check-in {/* Updated to fas */}
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="activity-list">
                  {activityFeed.map((activity, index) => (
                    <div key={index} className={`activity-item ${activity.type}`}>
                      <div className="activity-icon" style={{ backgroundColor: activity.color }}>
                        <i className={`fas ${activity.icon}`}></i> {/* Updated to fas */}
                      </div>
                      <div className="activity-content">
                        <h3>{activity.title}</h3>
                        <p>{activity.details}</p>
                        <span className="activity-category">{activity.category}</span>
                        <span className="activity-time">
                          {activity.timestamp.toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
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