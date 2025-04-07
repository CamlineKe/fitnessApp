import React, { useState, useEffect, useContext } from "react";
import Swal from 'sweetalert2';
import { UserContext } from "../components/UserContext";
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

const Workout = () => {
  const { user, logout } = useContext(UserContext);
  Logger.debug("User from Context:", user);

  // Add error state
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formErrors, setFormErrors] = useState({});
  const [workoutRecommendations, setWorkoutRecommendations] = useState(null);

  // Default states to prevent errors
  const [workoutData, setWorkoutData] = useState({
    activityType: "N/A",
    duration: 0,
    caloriesBurned: 0,
    heartRate: 0,
    feedback: "No feedback yet",
  });

  const [workoutLogs, setWorkoutLogs] = useState([]);
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

  useEffect(() => {
    if (!user || !user._id) {
      console.warn("User not authenticated, skipping fetch.");
      return;
    }

    const fetchInitialData = async () => {
      try {
        setLoading(true);
        const [workoutData, workoutLogs] = await Promise.all([
          WorkoutService.getWorkoutData(user._id),
          WorkoutService.getWorkoutLogs(user._id)
        ]);

        // Set workout logs first
        setWorkoutLogs(workoutLogs || []);

        // Find today's workout from logs
        const today = new Date();
        const todayWorkout = workoutLogs?.find(log => {
          const logDate = new Date(log.date);
          return logDate.toDateString() === today.toDateString();
        });

        // Set workout data with either today's workout or default values
        setWorkoutData(todayWorkout || {
          activityType: "No workout logged yet",
          duration: 0,
          caloriesBurned: 0,
          heartRate: 0,
          feedback: "Log your first workout for today!",
        });

        // Try to get recommendations, but don't fail if they're not available
        try {
          const recommendations = await WorkoutRecommenderService.getWorkoutRecommendations();
          setWorkoutRecommendations(recommendations);
        } catch (recError) {
          Logger.warn('Could not fetch workout recommendations:', recError);
          setWorkoutRecommendations(null);
        }
      } catch (err) {
        Logger.error('Error fetching workout data:', err);
        setError('Failed to load workout data');
        if (err.message.includes("No authentication token found") || err.response?.status === 401) {
          handleError("Session expired. Please log in again");
          logout();
        }
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();

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
  }, [user, logout]);

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
    
    setLoading(true);
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
      const today = new Date();
      const logDate = new Date(workoutEventData.date);
      if (logDate.toDateString() === today.toDateString()) {
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
        
        // Emit events for dashboard update
        EventEmitter.emit('workout-updated', workoutEventData);
        EventEmitter.emit('gamification-updated', streakResponse.streaks);

        // Show success message with streak info
        const streakMsg = streakResponse.streaks?.currentStreak > 1 
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
      setLoading(false);
    }
  };

  // Prepare data for the line chart (workout duration and calories over time)
  const workoutMetricsData = {
    labels: workoutLogs
      .slice(0, 14) // Show last 14 days
      .reverse()
      .map((log) => new Date(log.date).toLocaleDateString()),
    datasets: [
      {
        label: 'Duration (minutes)',
        data: workoutLogs
          .slice(0, 14)
          .reverse()
          .map((log) => log.duration),
        borderColor: '#4CAF50',
        backgroundColor: 'rgba(76, 175, 80, 0.2)',
        yAxisID: 'y',
        fill: true,
        tension: 0.4,
      },
      {
        label: 'Calories Burned',
        data: workoutLogs
          .slice(0, 14)
          .reverse()
          .map((log) => log.caloriesBurned),
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
    <div className="page-content">
      <div className="workout-container">
        <div className="workout-header">
          <h1>Workout</h1>
          <p>Track your workouts and stay motivated.</p>
        </div>

        <div className="workout-content">
          {loading ? (
            <div className="loading">Loading workout data...</div>
          ) : error ? (
            <div className="error-message">{error}</div>
          ) : (
            <>
              {/* Today's Workout Section */}
              <div className="todays-workout">
                <h2>Todays Workout</h2>
                {workoutData ? (
                  <div>
                    {["activityType", "duration", "caloriesBurned", "heartRate", "feedback"].map((field) => (
                      <p key={field}>
                        <strong>{field.replace(/([A-Z])/g, " $1")}:</strong> {workoutData?.[field] || "N/A"}
                      </p>
                    ))}
                  </div>
                ) : (
                  <p>Loading...</p>
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

                  <button type="submit" className="add-log-button">
                    <FaPlus /> Add Workout Log
                  </button>
                </form>
              </div>

              {/* Recommendations Section */}
              <div className="recommendations">
                <h2>Recommendations</h2>
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
                    <Line data={workoutMetricsData} options={lineChartOptions} />
                  </div>
                </div>

                <div className="workout-chart-section">
                  <h2>Activity Distribution</h2>
                  <div className="workout-pie-chart">
                    <Pie data={workoutTypeData} options={pieChartOptions} />
                  </div>
                </div>
              </div>

              {/* Workout Logs Section - At the end */}
              <div className="workout-logs">
                <h2>Workout Logs</h2>
                {workoutLogs.length > 0 ? (
                  <ul>
                    {workoutLogs.map((log, index) => (
                      <li key={log._id || index}>
                        {["date", "activityType", "duration", "caloriesBurned", "heartRate", "feedback"].map((field) => (
                          <p key={field}>
                            <strong>{field.replace(/([A-Z])/g, " $1")}:</strong>{" "}
                            {field === "date" ? new Date(log[field]).toLocaleDateString() : log[field] || "N/A"}
                          </p>
                        ))}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>No workout logs available.</p>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Workout;
