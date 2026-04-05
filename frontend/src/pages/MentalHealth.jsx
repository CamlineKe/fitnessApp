import React, { useState, useEffect, useContext } from "react";
import { UserContext } from "../components/UserContext";
import { getMentalHealthData, logDailyCheckIn } from "../services/MentalHealthService";
import StressAnalysisService from "../services/StressAnalysisService";
import GamificationService from "../services/GamificationService"; 
import { EventEmitter } from '../utils/EventEmitter';
import Swal from 'sweetalert2';
import "./styles/MentalHealth.css";
import { Line } from "react-chartjs-2";
import "chart.js/auto";
import Logger from '../utils/logger';

const moodMapping = {
  happy: 3,
  neutral: 2,
  anxious: 1,
  sad: 0,
};

const MentalHealth = () => {
  const { user } = useContext(UserContext);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mentalHealthData, setMentalHealthData] = useState([]);
  const [mentalLogs, setMentalLogs] = useState([]);
  const [stressAnalysis, setStressAnalysis] = useState({
    recommendations: [],
    analysis: {
      current_state: {},
      patterns: {}
    }
  });

  const [dailyCheckInData, setDailyCheckInData] = useState({
    mood: "",
    stressLevel: 5,
    sleepQuality: 5,
    notes: "",
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
      popup: 'mental-health-toast'
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

  const fetchStressAnalysis = async (logs) => {
    try {
      Logger.debug("Fetching stress analysis with logs:", logs);
      const analysisData = await StressAnalysisService.getStressAnalysis(logs);
      Logger.info("Received stress analysis:", analysisData);
      setStressAnalysis(analysisData);
      
      // Emit event that recommendations have been updated
      EventEmitter.emit(EventEmitter.Events.MENTAL_HEALTH_RECOMMENDATIONS_UPDATED, analysisData);
    } catch (error) {
      Logger.error("Failed to fetch stress analysis:", error);
      // Set default empty state without showing error to user
      const defaultAnalysis = {
        recommendations: [],
        analysis: {
          current_state: {
            mood: 'N/A',
            stress_level: 'N/A',
            sleep_quality: 'N/A'
          },
          patterns: {}
        }
      };
      setStressAnalysis(defaultAnalysis);
      EventEmitter.emit(EventEmitter.Events.MENTAL_HEALTH_RECOMMENDATIONS_UPDATED, defaultAnalysis);
    }
  };

  // Consolidated data fetching function
  const fetchMentalHealthData = async (userId) => {
    try {
      setIsLoading(true);
      setError(null);

      // Check if token exists
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Please log in to view your mental health data.");
        handleError("Please log in to view your mental health data.");
        return;
      }

      Logger.debug("Fetching data for user:", userId);
      const data = await getMentalHealthData(userId);
      Logger.debug("Received data:", data);

      // Handle empty or null data
      if (!data || (Array.isArray(data) && data.length === 0)) {
        setError("No mental health records found. Start by adding your first check-in!");
        setMentalHealthData([]);
        setMentalLogs([]);
        // Even with no logs, fetch stress analysis for default recommendations
        await fetchStressAnalysis([]);
        return;
      }

      // Ensure data is an array
      const dataArray = Array.isArray(data) ? data : [data];
      
      // Filter valid logs
      const validLogs = dataArray.filter(log => {
        const isValid = log && log.mood && log.date && log._id;
        if (!isValid) {
          Logger.debug("Invalid log found:", log);
        }
        return isValid;
      });

      if (validLogs.length === 0) {
        setError("No valid mental health records found. Start by adding your first check-in!");
        setMentalHealthData([]);
        setMentalLogs([]);
        await fetchStressAnalysis([]);
      } else {
        // Sort logs by date (newest first)
        const sortedLogs = validLogs.sort((a, b) => new Date(b.date) - new Date(a.date));
        setMentalHealthData(sortedLogs);
        setMentalLogs(sortedLogs);
        // Fetch stress analysis with the sorted logs
        await fetchStressAnalysis(sortedLogs);
        setError(null);
      }
    } catch (error) {
      Logger.error("Failed to fetch mental health data:", error);
      setError(error.message || "Failed to load mental health data. Please try again.");
      setMentalHealthData([]);
      setMentalLogs([]);
      await fetchStressAnalysis([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Single useEffect for initial data fetch
  useEffect(() => {
    // Check for user with either _id or id property
    const userId = user?._id || user?.id;
    if (!userId) {
      // User not loaded yet or not logged in - don't set error, just return
      setIsLoading(false);
      return;
    }

    fetchMentalHealthData(userId);

    // Subscribe to mental health recommendation updates using the correct event name
    const handleMentalHealthUpdate = (newAnalysis) => {
      Logger.info('Received new mental health analysis:', newAnalysis);
      setStressAnalysis(newAnalysis);
    };

    // Use the event constant from EventEmitter
    EventEmitter.on(EventEmitter.Events.MENTAL_HEALTH_RECOMMENDATIONS_UPDATED, handleMentalHealthUpdate);

    // Cleanup subscription
    return () => {
      EventEmitter.off(EventEmitter.Events.MENTAL_HEALTH_RECOMMENDATIONS_UPDATED, handleMentalHealthUpdate);
    };
  }, [user?._id, user?.id]); // Only re-run if user ID changes

  const handleDailyCheckInChange = (e) => {
    const { name, value, type } = e.target;
    setDailyCheckInData((prevData) => ({
      ...prevData,
      [name]: type === "range" ? Number(value) : value,
    }));
  };

  const handleDailyCheckInSubmit = async (e) => {
    e.preventDefault();
    if (!user?._id && !user?.id) {
      handleError("Please log in to submit a daily check-in.");
      return;
    }

    if (!dailyCheckInData.mood) {
      handleError("Please select a mood before submitting.");
      return;
    }

    try {
      setIsLoading(true);
      Logger.debug("Submitting check-in:", { ...dailyCheckInData, userId: user?._id || user?.id });
      const newLog = await logDailyCheckIn({ ...dailyCheckInData, userId: user?._id || user?.id });
      Logger.info("New log created:", newLog);

      if (newLog) {
        try {
          await GamificationService.updatePoints('mental', {
            mood: dailyCheckInData.mood,
            stressLevel: dailyCheckInData.stressLevel,
            sleepQuality: dailyCheckInData.sleepQuality
          });
          await GamificationService.updateStreak('mental');
          await GamificationService.logMood(dailyCheckInData.mood);
          await GamificationService.checkAchievements();

          // Refresh data - this will trigger a new stress analysis and emit the event
          await fetchMentalHealthData(user?._id || user?.id);
          
          // Reset form
          setDailyCheckInData({
            mood: "",
            stressLevel: 5,
            sleepQuality: 5,
            notes: "",
          });

          handleSuccess("Daily check-in submitted successfully!");
        } catch (error) {
          Logger.error("Failed to update gamification:", error);
          handleError("Check-in saved but failed to update points. Please try again.");
        }
      }
    } catch (error) {
      Logger.error("Failed to submit daily check-in:", error);
      handleError(error.message || "Failed to submit check-in. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const prepareDailyMoodData = (data) => {
    if (!data || data.length === 0) {
      return {
        labels: [],
        datasets: [{
          label: 'Daily Mood',
          data: [],
          borderColor: 'rgba(107, 144, 128, 1)',
          backgroundColor: 'rgba(107, 144, 128, 0.2)',
          fill: true,
          tension: 0.4,
        }]
      };
    }

    // Sort data by date
    const sortedData = [...data].sort((a, b) => new Date(a.date) - new Date(b.date));
    
    // Get last 7 days of data
    const last7Days = sortedData.filter(log => {
      const logDate = new Date(log.date);
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      return logDate >= sevenDaysAgo;
    });

    return {
      labels: last7Days.map(log => 
        new Date(log.date).toLocaleDateString(undefined, { 
          weekday: 'short', 
          month: 'short', 
          day: 'numeric' 
        })
      ),
      datasets: [{
        label: 'Daily Mood',
        data: last7Days.map(log => moodMapping[log.mood.toLowerCase()]),
        borderColor: 'rgba(107, 144, 128, 1)',
        backgroundColor: 'rgba(107, 144, 128, 0.2)',
        fill: true,
        tension: 0.4,
        pointBackgroundColor: 'rgba(107, 144, 128, 1)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 6,
        pointHoverRadius: 8,
      }]
    };
  };

  // Update the chart options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        max: 3,
        ticks: {
          stepSize: 1,
          callback: function (value) {
            return ['Sad', 'Anxious', 'Neutral', 'Happy'][value];
          }
        }
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
        display: false
      },
      tooltip: {
        callbacks: {
          title: (context) => context[0].label,
          label: (context) => {
            const moodValue = ['Sad', 'Anxious', 'Neutral', 'Happy'][context.raw];
            return `Mood: ${moodValue}`;
          }
        }
      }
    }
  };

  return (
    <div className="page-content">
      <div className="mentalhealth-container">
        <div className="mentalhealth-header">
          <h1>Mental Health</h1>
          <p>Track your mental well-being.</p>
        </div>

        <div className="mentalhealth-content">
          {/* Daily Check-In and Today's Mood Container */}
          <div className="check-in-container">
            {/* Today's Mood Section */}
            <div className="mentalhealth-section todays-mood">
              <h2>Today's Mood</h2>
              {isLoading ? (
                <p>Loading today's mood...</p>
              ) : error ? (
                <p className="error-message">{error}</p>
              ) : (
                <div className="mood-display">
                  {mentalLogs.length > 0 && new Date(mentalLogs[0]?.date).toDateString() === new Date().toDateString() ? (
                    <>
                      <div className="mood-emoji">
                        {mentalLogs[0].mood === 'happy' && '😊'}
                        {mentalLogs[0].mood === 'sad' && '😢'}
                        {mentalLogs[0].mood === 'anxious' && '😰'}
                        {mentalLogs[0].mood === 'neutral' && '😐'}
                      </div>
                      <div className="mood-stats">
                        <div className="mood-stat-item">
                          <span className="stat-label">Mood:</span>
                          <span className="stat-value">{mentalLogs[0].mood}</span>
                        </div>
                        <div className="mood-stat-item">
                          <span className="stat-label">Stress Level:</span>
                          <span className="stat-value">{mentalLogs[0].stressLevel}/10</span>
                        </div>
                        <div className="mood-stat-item">
                          <span className="stat-label">Sleep Quality:</span>
                          <span className="stat-value">{mentalLogs[0].sleepQuality}/10</span>
                        </div>
                      </div>
                    </>
                  ) : (
                    <p>No mood logged for today. Add your first check-in!</p>
                  )}
                </div>
              )}
            </div>

            {/* Daily Check-In Form */}
            <div className="mentalhealth-section daily-check-in">
              <h2>Daily Check-In</h2>
              <form onSubmit={handleDailyCheckInSubmit}>
                <div className="form-group mood-selection">
                  <label>How are you feeling today?</label>
                  <div className="mood-buttons-compact">
                    <button
                      type="button"
                      className={`mood-chip ${dailyCheckInData.mood === 'happy' ? 'selected' : ''}`}
                      onClick={() => setDailyCheckInData(prev => ({ ...prev, mood: 'happy' }))}
                    >
                      <span>😊</span> Happy
                    </button>
                    <button
                      type="button"
                      className={`mood-chip ${dailyCheckInData.mood === 'neutral' ? 'selected' : ''}`}
                      onClick={() => setDailyCheckInData(prev => ({ ...prev, mood: 'neutral' }))}
                    >
                      <span>😐</span> Neutral
                    </button>
                    <button
                      type="button"
                      className={`mood-chip ${dailyCheckInData.mood === 'anxious' ? 'selected' : ''}`}
                      onClick={() => setDailyCheckInData(prev => ({ ...prev, mood: 'anxious' }))}
                    >
                      <span>😰</span> Anxious
                    </button>
                    <button
                      type="button"
                      className={`mood-chip ${dailyCheckInData.mood === 'sad' ? 'selected' : ''}`}
                      onClick={() => setDailyCheckInData(prev => ({ ...prev, mood: 'sad' }))}
                    >
                      <span>😢</span> Sad
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label>
                    Stress Level: <span className="range-value">{dailyCheckInData.stressLevel}</span>
                  </label>
                  <input
                    type="range"
                    name="stressLevel"
                    min="0"
                    max="10"
                    value={dailyCheckInData.stressLevel}
                    onChange={handleDailyCheckInChange}
                    className="slider"
                  />
                  <div className="range-labels">
                    <span>Low</span>
                    <span>High</span>
                  </div>
                </div>

                <div className="form-group">
                  <label>
                    Sleep Quality: <span className="range-value">{dailyCheckInData.sleepQuality}</span>
                  </label>
                  <input
                    type="range"
                    name="sleepQuality"
                    min="0"
                    max="10"
                    value={dailyCheckInData.sleepQuality}
                    onChange={handleDailyCheckInChange}
                    className="slider"
                  />
                  <div className="range-labels">
                    <span>Poor</span>
                    <span>Excellent</span>
                  </div>
                </div>

                <div className="form-group">
                  <label>Notes (optional):</label>
                  <textarea
                    name="notes"
                    value={dailyCheckInData.notes}
                    onChange={handleDailyCheckInChange}
                    placeholder="Add any thoughts or feelings..."
                    rows="3"
                  />
                </div>

                <button type="submit" className="submit-button" disabled={isLoading}>
                  {isLoading ? 'Submitting...' : 'Submit Check-In'}
                </button>
              </form>
            </div>
          </div>

          {/* Stress Analysis Section */}
          <div className="mentalhealth-section stress-analysis">
            <h2>Recommendations</h2>
            <div className="stress-analysis-content">
              <div className="current-state">
                <h3>Current State</h3>
                <div className="state-grid">
                  <div className="state-item">
                    <label>Mood:</label>
                    <span>{stressAnalysis?.analysis?.current_state?.mood || 'N/A'}</span>
                  </div>
                  <div className="state-item">
                    <label>Stress Level:</label>
                    <span>{stressAnalysis?.analysis?.current_state?.stress_level ? `${stressAnalysis.analysis.current_state.stress_level}/10` : 'N/A'}</span>
                  </div>
                  <div className="state-item">
                    <label>Sleep Quality:</label>
                    <span>{stressAnalysis?.analysis?.current_state?.sleep_quality ? `${stressAnalysis.analysis.current_state.sleep_quality}/10` : 'N/A'}</span>
                  </div>
                </div>
              </div>
              <div className="recommendations">
                <h3>Personalized Recommendations</h3>
                {stressAnalysis?.recommendations && stressAnalysis.recommendations.length > 0 ? (
                  <ul>
                    {stressAnalysis.recommendations.map((rec, index) => (
                      <li key={index}>{rec}</li>
                    ))}
                  </ul>
                ) : (
                  <div className="no-recommendations">
                    <p>No recommendations available at the moment.</p>
                    <p>Continue logging your daily check-ins to receive personalized recommendations.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Mood Chart Section */}
          <div className="mentalhealth-section mood-chart-section">
            <h2>Mood Trends</h2>
            <p className="chart-description">Your daily moods for the past 7 days</p>
            {isLoading ? (
              <p>Loading your mood data...</p>
            ) : mentalHealthData.length > 0 ? (
              <div className="mood-chart-container">
                <Line data={prepareDailyMoodData(mentalHealthData)} options={chartOptions} />
              </div>
            ) : (
              <p>No mood data available yet. Start by adding your first daily check-in!</p>
            )}
          </div>

          {/* Mood History Section */}
          <div className="mentalhealth-section mental-logs">
            <h2>Mood History</h2>
            <p className="chart-description">Your daily moods for the past 7 days</p>
            {isLoading ? (
              <p>Loading your mental health logs...</p>
            ) : mentalLogs.length > 0 ? (
              <div className="mental-logs-grid">
                {mentalLogs
                  .filter(log => {
                    const logDate = new Date(log.date);
                    const sevenDaysAgo = new Date();
                    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
                    return logDate >= sevenDaysAgo;
                  })
                  .map((log) => (
                    <div key={log._id} className="mental-log-card">
                      <div className="log-date">
                        {log.date ? new Date(log.date).toLocaleDateString(undefined, {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric'
                        }) : "Unknown Date"}
                      </div>
                      <div className="log-details">
                        <div className="log-item">
                          <span className="log-label">Mood:</span>
                          <span className="log-value">{log.mood}</span>
                        </div>
                        <div className="log-item">
                          <span className="log-label">Stress Level:</span>
                          <span className="log-value">{log.stressLevel}</span>
                        </div>
                        <div className="log-item">
                          <span className="log-label">Sleep Quality:</span>
                          <span className="log-value">{log.sleepQuality}</span>
                        </div>
                        {log.notes && (
                          <div className="log-notes">
                            <span className="log-label">Notes:</span>
                            <span className="log-value">{log.notes}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <p>No mental logs available. Start by adding your first daily check-in!</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MentalHealth;