import React, { useState, useEffect, useContext } from "react";
import Swal from 'sweetalert2';
import { UserContext } from "../components/UserContext";
import EmptyState from "../components/EmptyState";
import WorkoutService from "../services/WorkoutService";
import WorkoutRecommenderService from "../services/WorkoutRecommenderService";
import GamificationService from "../services/GamificationService";
import "./styles/Workout.css";
import "react-datepicker/dist/react-datepicker.css";
import DatePicker from "react-datepicker";
import { FaPlus } from "react-icons/fa";
import { EventEmitter } from '../utils/EventEmitter';
import { Line, Pie } from 'react-chartjs-2';
import Logger from '../utils/logger';

const activityTypes = [
  "Running",
  "Walking",
  "Cycling",
  "Swimming",
  "Weight Training",
  "Yoga",
  "HIIT",
  "Basketball",
  "Soccer",
  "Other"
];

const CACHE_KEY = 'workout_cache';
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
    Logger.error('Failed to cache workout data:', error);
  }
};

const Workout = () => {
  const { user, logout, getUserId, isAuthenticated } = useContext(UserContext);
  const userId = getUserId();
  Logger.debug("User from Context:", user);

  const [error, setError] = useState(null);
  // Individual loading states per section instead of one global loader
  const [loading, setLoading] = useState({
    logs: false,
    recommendations: false,
    submitting: false
  });
  const [formErrors, setFormErrors] = useState({});
  const [workoutRecommendations, setWorkoutRecommendations] = useState(null);

  // Initialize from cache
  const cache = loadCachedData();
  const [workoutData, setWorkoutData] = useState(cache?.workoutData || {
    activityType: "No workout logged yet",
    duration: 0,
    caloriesBurned: 0,
    heartRate: 0,
    feedback: "Log your first workout for today!",
  });
  const [workoutLogs, setWorkoutLogs] = useState(cache?.workoutLogs || []);
  const [pagination, setPagination] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [newLog, setNewLog] = useState({
    date: new Date(),
    activityType: "",
    duration: 0,
    caloriesBurned: 0,
    heartRate: 0,
    feedback: "",
  });

  const Toast = Swal.mixin({
    toast: true,
    position: 'top-right',
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
    background: '#fff',
    color: '#333',
    customClass: {
      popup: 'workout-toast'
    }
  });

  const handleSuccess = (message) => {
    Toast.fire({
      icon: 'success',
      title: message
    });
  };

  const handleError = (message) => {
    Toast.fire({
      icon: 'error',
      title: message
    });
  };

  // Helper function to check if a date is today
  const isToday = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  // Helper function to format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  useEffect(() => {
    if (!isAuthenticated || !userId) return;

    // Fetch workout logs with pagination
    const fetchWorkoutLogs = async (page = 1, append = false) => {
      if (!userId) return;

      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(prev => ({ ...prev, logs: true }));
      }

      try {
        // Use field projection to fetch only needed fields for charts
        const fields = ['date', 'activityType', 'duration', 'caloriesBurned', 'heartRate', 'feedback'];

        const result = await WorkoutService.getWorkoutLogs({
          page,
          limit: 30,
          sortBy: 'date',
          order: 'desc',
          fields
        });

        Logger.debug('Fetched workout logs:', result);

        if (result.cached) {
          Logger.debug('Using cached workout logs');
          return;
        }

        const newLogs = result.data || [];

        // Update logs (append for pagination, replace for initial load)
        if (append) {
          setWorkoutLogs(prev => [...prev, ...newLogs]);
        } else {
          setWorkoutLogs(newLogs);

          // Find today's workout from first page only
          const todayWorkout = newLogs.find(log => isToday(log.date));
          setWorkoutData(todayWorkout || {
            activityType: "No workout logged yet",
            duration: 0,
            caloriesBurned: 0,
            heartRate: 0,
            feedback: "Log your first workout for today!",
          });
        }

        setPagination(result.pagination);
        setCurrentPage(page);
      } catch (err) {
        Logger.error('Error fetching workout logs:', err);
        if (err.message?.includes("No authentication token found") || err.response?.status === 401) {
          handleError("Session expired. Please log in again");
          logout();
        }
      } finally {
        setLoading(prev => ({ ...prev, logs: false }));
        setLoadingMore(false);
      }
    };

    // Load more handler
    const handleLoadMore = () => {
      if (pagination?.hasNextPage && !loadingMore) {
        fetchWorkoutLogs(currentPage + 1, true);
      }
    };

    // Fetch recommendations independently (non-blocking)
    const fetchRecommendations = async () => {
      if (!userId) return;
      setLoading(prev => ({ ...prev, recommendations: true }));
      try {
        const recommendations = await WorkoutRecommenderService.getWorkoutRecommendations();
        Logger.debug('Fetched workout recommendations:', recommendations);
        setWorkoutRecommendations(recommendations);
      } catch (recError) {
        Logger.warn('Could not fetch workout recommendations:', recError);
        setWorkoutRecommendations(null);
      } finally {
        setLoading(prev => ({ ...prev, recommendations: false }));
      }
    };

    // Fetch data in parallel without blocking UI
    Promise.all([fetchWorkoutLogs(1, false), fetchRecommendations()]);

    // Subscribe to workout recommendation updates
    const handleWorkoutUpdate = (newRecommendations) => {
      Logger.info('Received new workout recommendations:', newRecommendations);
      setWorkoutRecommendations(newRecommendations);
    };

    EventEmitter.on(EventEmitter.Events.WORKOUT_RECOMMENDATIONS_UPDATED, handleWorkoutUpdate);

    // Cleanup subscription
    return () => {
      EventEmitter.off(EventEmitter.Events.WORKOUT_RECOMMENDATIONS_UPDATED, handleWorkoutUpdate);
    };
  }, [isAuthenticated, userId, logout]);

  // Load more handler (defined outside useEffect)
  const handleLoadMore = () => {
    if (pagination?.hasNextPage && !loadingMore) {
      const nextPage = currentPage + 1;
      setLoadingMore(true);

      WorkoutService.getWorkoutLogs({
        page: nextPage,
        limit: 30,
        sortBy: 'date',
        order: 'desc',
        fields: ['date', 'activityType', 'duration', 'caloriesBurned', 'heartRate', 'feedback']
      }).then(result => {
        if (!result.cached && result.data) {
          setWorkoutLogs(prev => [...prev, ...result.data]);
          setPagination(result.pagination);
          setCurrentPage(nextPage);
        }
      }).catch(err => {
        Logger.error('Error loading more logs:', err);
        handleError("Failed to load more logs");
      }).finally(() => {
        setLoadingMore(false);
      });
    }
  };

  // Cache data when it changes
  useEffect(() => {
    if (workoutLogs.length > 0 || workoutData.activityType !== "No workout logged yet") {
      saveCachedData({ workoutData, workoutLogs });
    }
  }, [workoutData, workoutLogs]);

  // Section loader component
  const SectionLoader = () => (
    <div className="section-loader">
      <div className="loading-spinner-small"></div>
    </div>
  );

  const handleNewLogChange = (e) => {
    const { name, value } = e.target;

    // Handle numeric fields
    if (["duration", "caloriesBurned", "heartRate"].includes(name)) {
      // Only allow numbers and empty string
      if (value === '' || /^\d*$/.test(value)) {
        setNewLog(prevLog => ({
          ...prevLog,
          [name]: value === '' ? '' : Number(value)
        }));
      }
    } else {
      // Handle other fields normally
      setNewLog(prevLog => ({
        ...prevLog,
        [name]: value
      }));
    }
  };

  const handleNewLogDateChange = (date) => {
    setNewLog((prevLog) => ({ ...prevLog, date }));
  };

  const validateForm = () => {
    const errors = {};
    if (!newLog.activityType) errors.activityType = "Please select an activity type";
    if (!newLog.duration || newLog.duration <= 0) errors.duration = "Duration must be greater than 0";
    if (!newLog.caloriesBurned || newLog.caloriesBurned <= 0) errors.caloriesBurned = "Calories burned must be greater than 0";
    if (newLog.heartRate && (newLog.heartRate < 40 || newLog.heartRate > 220)) errors.heartRate = "Heart rate must be between 40 and 220";

    setFormErrors(errors);
    if (Object.keys(errors).length > 0) {
      Object.values(errors).forEach(error => handleError(error));
    }
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setLoading(prev => ({ ...prev, submitting: true }));
    setError(null);

    try {
      // First, add the workout log
      const workoutToAdd = {
        ...newLog,
        date: new Date(newLog.date),
        duration: Number(newLog.duration),
        caloriesBurned: Number(newLog.caloriesBurned),
        heartRate: Number(newLog.heartRate)
      };

      const response = await WorkoutService.addWorkoutLog(workoutToAdd);
      
      // Update workout logs
      setWorkoutLogs(prevLogs => [...prevLogs, response]);
      
      // Create workout data object
      const workoutEventData = {
        ...response,
        date: new Date(response.date)
      };
      
      // Update today's workout data if the new log is for today
      if (isToday(workoutEventData.date)) {
        setWorkoutData(workoutEventData);
      }

      try {
        // Update points first
        const pointsResponse = await GamificationService.updatePoints("workout", {
          duration: workoutEventData.duration,
          caloriesBurned: workoutEventData.caloriesBurned,
          activityType: workoutEventData.activityType
        });

        // Update streak
        const streakResponse = await GamificationService.updateStreak("workout");
        Logger.debug('Updated streak data:', streakResponse);
        
        // Emit events for dashboard update using EventEmitter constants
        EventEmitter.emit(EventEmitter.Events.WORKOUT_UPDATED, workoutEventData);
        EventEmitter.emit(EventEmitter.Events.GAMIFICATION_UPDATED, streakResponse?.streaks);

        // Show success message with streak info
        const streakMsg = streakResponse?.streaks?.currentStreak > 1 
          ? `${streakResponse.streaks.currentStreak} day streak! 🔥` 
          : '';
        handleSuccess(`Workout logged successfully! ${streakMsg}`);
      } catch (error) {
        Logger.error("Failed to update gamification:", error);
        handleError(error.message || "Failed to update gamification. Please try refreshing the page.");
      }

      // Reset form
      setNewLog({
        date: new Date(),
        activityType: "",
        duration: 0,
        caloriesBurned: 0,
        heartRate: 0,
        feedback: ""
      });
    } catch (error) {
      Logger.error("Failed to add workout log:", error);
      setError("Failed to add workout log. Please try again.");
      handleError("Failed to add workout log. Please try again");
    } finally {
      setLoading(prev => ({ ...prev, submitting: false }));
    }
  };

  // Prepare data for the line chart (workout duration and calories over time)
  const workoutMetricsData = {
    labels: workoutLogs
      .slice(-14) // Get last 14 logs
      .map((log) => formatDate(log.date)),
    datasets: [
      {
        label: 'Duration (minutes)',
        data: workoutLogs
          .slice(-14)
          .map((log) => log.duration || 0),
        borderColor: '#4CAF50',
        backgroundColor: 'rgba(76, 175, 80, 0.2)',
        yAxisID: 'y',
        fill: true,
        tension: 0.4,
      },
      {
        label: 'Calories Burned',
        data: workoutLogs
          .slice(-14)
          .map((log) => log.caloriesBurned || 0),
        borderColor: '#2196F3',
        backgroundColor: 'rgba(33, 150, 243, 0.2)',
        yAxisID: 'y1',
        fill: true,
        tension: 0.4,
      }
    ]
  };

  // Prepare data for the pie chart (workout type distribution)
  const workoutTypeData = {
    labels: activityTypes,
    datasets: [{
      data: activityTypes.map(type =>
        workoutLogs.filter(log => log.activityType === type).length
      ),
      backgroundColor: [
        '#4CAF50', '#2196F3', '#FFC107', '#9C27B0',
        '#F44336', '#00BCD4', '#FF9800', '#795548',
        '#607D8B', '#E91E63'
      ],
      borderWidth: 1
    }]
  };

  const lineChartOptions = {
    responsive: true,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    scales: {
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        title: {
          display: true,
          text: 'Duration (minutes)'
        }
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        title: {
          display: true,
          text: 'Calories Burned'
        },
        grid: {
          drawOnChartArea: false,
        },
      },
      x: {
        grid: {
          display: false
        },
        ticks: {
          maxRotation: 45,
          minRotation: 45
        }
      }
    },
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Workout Progress'
      }
    }
  };

  const pieChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'right',
      },
      title: {
        display: true,
        text: 'Workout Type Distribution'
      }
    }
  };

  return (
    <div className="page-container">
      <div className="workout-container">
        <div className="workout-header">
          <h1>Workout</h1>
          <p>Track your workouts and stay motivated.</p>
        </div>

        <div className="workout-content">
          {error && <div className="error-message">{error}</div>}
          
          {/* Today's Workout Section */}
          <div className="todays-workout">
            <h2>Today's Workout {loading.logs && <SectionLoader />}</h2>
                {workoutData ? (
                  <div className="workout-stats">
                    <div className="stat-item">
                      <span className="stat-label">Activity:</span>
                      <span className="stat-value">{workoutData.activityType}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Duration:</span>
                      <span className="stat-value">{workoutData.duration} min</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Calories:</span>
                      <span className="stat-value">{workoutData.caloriesBurned} kcal</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Heart Rate:</span>
                      <span className="stat-value">{workoutData.heartRate} bpm</span>
                    </div>
                    {workoutData.feedback && (
                      <div className="stat-item feedback">
                        <span className="stat-label">Feedback:</span>
                        <span className="stat-value">{workoutData.feedback}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <p>No workout logged today</p>
                )}
              </div>

              {/* Add Workout Log Form - Moved above recommendations */}
              <div className="add-log-form">
                <h3>Add New Workout Log</h3>
                <form onSubmit={handleSubmit}>
                  <div className="form-group">
                    <div className="input-with-label">
                      <label>Date:</label>
                      <DatePicker
                        selected={newLog.date}
                        onChange={handleNewLogDateChange}
                        className="date-picker"
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <div className="input-with-label">
                      <label>Activity Type:</label>
                      <select
                        name="activityType"
                        value={newLog.activityType}
                        onChange={handleNewLogChange}
                        className={formErrors.activityType ? "error" : ""}
                      >
                        <option value="">Select activity type</option>
                        {activityTypes.map(type => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="input-with-label">
                      <label>Duration:</label>
                      <div className="input-with-unit">
                        <input
                          type="text"
                          name="duration"
                          value={newLog.duration}
                          onChange={handleNewLogChange}
                          placeholder="e.g., 30"
                        />
                        <span className="unit">minutes</span>
                      </div>
                    </div>

                    <div className="input-with-label">
                      <label>Calories Burned:</label>
                      <div className="input-with-unit">
                        <input
                          type="text"
                          name="caloriesBurned"
                          value={newLog.caloriesBurned}
                          onChange={handleNewLogChange}
                          placeholder="e.g., 300"
                        />
                        <span className="unit">kcal</span>
                      </div>
                    </div>

                    <div className="input-with-label">
                      <label>Heart Rate:</label>
                      <div className="input-with-unit">
                        <input
                          type="text"
                          name="heartRate"
                          value={newLog.heartRate}
                          onChange={handleNewLogChange}
                          placeholder="e.g., 140"
                        />
                        <span className="unit">bpm</span>
                      </div>
                    </div>
                  </div>

                  <div className="form-group">
                    <div className="input-with-label">
                      <label>Feedback/Notes:</label>
                      <textarea
                        name="feedback"
                        value={newLog.feedback}
                        onChange={handleNewLogChange}
                        placeholder="How was your workout? Add any notes here..."
                        rows="3"
                      />
                    </div>
                  </div>

                  <button type="submit" className="add-log-button" disabled={loading.submitting}>
                    <FaPlus /> {loading.submitting ? 'Adding...' : 'Add Workout Log'}
                  </button>
                </form>
              </div>

              {/* Recommendations Section */}
              <div className="recommendations">
                <h2>Recommendations {loading.recommendations && <SectionLoader />}</h2>
                <p>Based on your recent workout data, here are some personalized recommendations:</p>
                {workoutRecommendations?.recommendations?.length > 0 ? (
                  <ul>
                    {workoutRecommendations.recommendations.map((recommendation, index) => (
                      <li key={index}>{recommendation}</li>
                    ))}
                  </ul>
                ) : (
                  <div className="no-recommendations">
                    <p>No workout recommendations available at the moment.</p>
                    <p className="recommendation-note">Keep logging your workouts to receive personalized recommendations!</p>
                  </div>
                )}
              </div>

              {/* Workout Analytics Section */}
              <div className="workout-analytics">
                <div className="workout-chart-section">
                  <h2>Workout Progress</h2>
                  <div className="workout-line-chart">
                    {workoutLogs.length > 0 ? (
                      <Line data={workoutMetricsData} options={lineChartOptions} />
                    ) : (
                      <EmptyState
                        icon="fa-chart-line"
                        title="Log workouts to track your progress over time"
                        variant="chart"
                      />
                    )}
                  </div>
                </div>

                <div className="workout-chart-section">
                  <h2>Activity Distribution</h2>
                  <div className="workout-pie-chart">
                    {workoutLogs.length > 0 ? (
                      <Pie data={workoutTypeData} options={pieChartOptions} />
                    ) : (
                      <EmptyState
                        icon="fa-chart-pie"
                        title="Start logging different activities to see your distribution"
                        variant="chart"
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* Workout Logs Section */}
              <div className="workout-logs">
                <h2>
                  Recent Workout Logs
                  {loading.logs && <SectionLoader />}
                  {!loading.logs && pagination && (
                    <span className="log-count">({pagination.totalCount} total)</span>
                  )}
                </h2>
                {workoutLogs.length > 0 ? (
                  <>
                    <div className="logs-grid">
                      {workoutLogs.map((log, index) => (
                        <div key={log._id || index} className="log-card">
                          <div className="log-header">
                            <span className="log-date">{formatDate(log.date)}</span>
                            <span className="log-type">{log.activityType}</span>
                          </div>
                          <div className="log-details">
                            <span className="log-duration">⏱️ {log.duration} min</span>
                            <span className="log-calories">🔥 {log.caloriesBurned} kcal</span>
                            <span className="log-heartrate">❤️ {log.heartRate} bpm</span>
                          </div>
                          {log.feedback && (
                            <div className="log-feedback">💬 {log.feedback}</div>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Load More Button */}
                    {pagination?.hasNextPage && (
                      <div className="load-more-container">
                        <button
                          className="load-more-button"
                          onClick={handleLoadMore}
                          disabled={loadingMore}
                        >
                          {loadingMore ? (
                            <>
                              <span className="loading-spinner">⏳</span> Loading...
                            </>
                          ) : (
                            <>Load More ({pagination.totalCount - workoutLogs.length} remaining)</>
                          )}
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <EmptyState
                    icon="fa-dumbbell"
                    title="No workout logs yet"
                    subtitle="Start by logging your first workout above!"
                    variant="default"
                  />
                )}
              </div>
          </div>
        </div>
      </div>
  );
};

export default Workout;