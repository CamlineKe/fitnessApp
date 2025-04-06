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
      current_state: {
        mood: 'neutral',
        stress_level: 5,
        sleep_quality: 10
      },
      patterns: {
        stress_trend: 'neutral',
        sleep_trend: 'neutral',
        mood_trend: 'neutral'
      }
    }
  });

  const [dailyCheckInData, setDailyCheckInData] = useState({
    mood: "",
    stressLevel: 0,
    sleepQuality: 0,
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
    } catch (error) {
      Logger.error("Failed to fetch stress analysis:", error);
      // Don't show error toast, just use default values
      setStressAnalysis({
        recommendations: [
          "Welcome to your stress management journey!",
          "- Track your daily mood and stress levels",
          "- Practice basic stress management techniques",
          "- Establish a consistent sleep schedule",
          "- Engage in regular physical activity"
        ],
        analysis: {
          current_state: {
            mood: 'neutral',
            stress_level: 5,
            sleep_quality: 10
          },
          patterns: {
            stress_trend: 'neutral',
            sleep_trend: 'neutral',
            mood_trend: 'neutral'
          }
        }
      });
    }
  };

  // Function to fetch mental health data
  const fetchMentalHealthData = async (userId) => {
    try {
      setIsLoading(true);
      setError(null);

      // Check if token exists
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Please log in to view your mental health data.");
        setIsLoading(false);
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
        handleError("No mental health records found. Start by adding your first check-in!");
        return;
      }

      // Ensure data is an array
      const dataArray = Array.isArray(data) ? data : [data];
      Logger.debug("Data array:", dataArray);

      // Filter valid logs
      const validLogs = dataArray.filter(log => {
        const isValid = log && log.mood && log.date && log._id;
        if (!isValid) {
          Logger.debug("Invalid log found:", log);
        }
        return isValid;
      });

      Logger.debug("Valid logs:", validLogs);

      if (validLogs.length === 0) {
        setError("No valid mental health records found. Start by adding your first check-in!");
        handleError("No valid mental health records found. Start by adding your first check-in!");
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
      // Even on error, fetch stress analysis for default recommendations
      await fetchStressAnalysis([]);
      handleError("Failed to load mental health data. Please try again later");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!user || !user._id) return;

    const fetchInitialData = async () => {
      try {
        setIsLoading(true);
        const [logs, analysis] = await Promise.all([
          getMentalHealthData(user._id),
          StressAnalysisService.getStressAnalysis()
        ]);

        setMentalLogs(logs || []);
        setStressAnalysis(analysis || {
          recommendations: [],
          analysis: {
            current_state: { mood: 'neutral', stress_level: 5, sleep_quality: 10 },
            patterns: { stress_trend: 'neutral', sleep_trend: 'neutral', mood_trend: 'neutral' }
          }
        });
      } catch (err) {
        Logger.error('Error fetching mental health data:', err);
        setError('Failed to load mental health data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitialData();

    // Subscribe to mental health recommendation updates
    const handleMentalHealthUpdate = (newAnalysis) => {
      Logger.info('Received new mental health analysis:', newAnalysis);
      setStressAnalysis(newAnalysis);
    };

    EventEmitter.on(EventEmitter.Events.MENTAL_HEALTH_RECOMMENDATIONS_UPDATED, handleMentalHealthUpdate);

    // Cleanup subscription
    return () => {
      EventEmitter.off(EventEmitter.Events.MENTAL_HEALTH_RECOMMENDATIONS_UPDATED, handleMentalHealthUpdate);
    };
  }, [user]);

  useEffect(() => {
    if (!user?._id) {
      setError("Please log in to view your mental health data.");
      setIsLoading(false);
      handleError("Please log in to view your mental health data.");
      return;
    }

    fetchMentalHealthData(user._id);
  }, [user?._id]);

  const handleDailyCheckInChange = (e) => {
    const { name, value, type } = e.target;
    setDailyCheckInData((prevData) => ({
      ...prevData,
      [name]: type === "range" ? Number(value) : value,
    }));
  };

  const handleDailyCheckInSubmit = async (e) => {
    e.preventDefault();
    if (!user?._id) {
      handleError("Please log in to submit a daily check-in.");
      return;
    }

    if (!dailyCheckInData.mood) {
      handleError("Please select a mood before submitting.");
      return;
    }

    try {
      setIsLoading(true);
      Logger.debug("Submitting check-in:", { ...dailyCheckInData, userId: user._id });
      const newLog = await logDailyCheckIn({ ...dailyCheckInData, userId: user._id });
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

          EventEmitter.emit('mental-updated');
          EventEmitter.emit('gamification-updated');

          // Reset form
          setDailyCheckInData({
            mood: "",
            stressLevel: 0,
            sleepQuality: 0,
            notes: "",
          });

          // Refresh data
          await fetchMentalHealthData(user._id);
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

  // First, let's add console logs to debug the data
  const calculateDailyMoods = (data) => {
    Logger.debug("Calculating daily moods with data:", data);
    
    if (!Array.isArray(data) || data.length === 0) {
      Logger.debug("No data available for mood calculation");
      return [];
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 6);
    
    // Create array of last 7 days
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(today);
      date.setDate(today.getDate() - (6 - i));
      return date;
    });

    // Get the mood for each day
    const dailyMoods = last7Days.map(date => {
      const dayLog = data.find(log => {
        const logDate = new Date(log.date);
        return logDate.toDateString() === date.toDateString();
      });

      const result = {
        date,
        mood: dayLog ? moodMapping[dayLog.mood.toLowerCase()] : null
      };
      Logger.debug(`Mood for ${date.toDateString()}:`, result.mood);
      return result;
    });

    Logger.debug("Calculated daily moods:", dailyMoods);
    return dailyMoods;
  };

  // Replace the existing calculateWeeklyAverages and moodData preparation with this:
  const prepareDailyMoodData = (data) => {
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
                  <div className="mood-buttons">
                    <button
                      type="button"
                      className={`mood-button ${dailyCheckInData.mood === 'happy' ? 'selected' : ''}`}
                      data-mood="happy"
                      onClick={() => {
                        Logger.debug('Setting mood to happy');
                        setDailyCheckInData(prev => ({
                          ...prev,
                          mood: 'happy'
                        }));
                      }}
                    >
                      <span>😊</span> Happy
                    </button>
                    <button
                      type="button"
                      className={`mood-button ${dailyCheckInData.mood === 'neutral' ? 'selected' : ''}`}
                      data-mood="neutral"
                      onClick={() => {
                        Logger.debug('Setting mood to neutral');
                        setDailyCheckInData(prev => ({
                          ...prev,
                          mood: 'neutral'
                        }));
                      }}
                    >
                      <span>😐</span> Neutral
                    </button>
                    <button
                      type="button"
                      className={`mood-button ${dailyCheckInData.mood === 'anxious' ? 'selected' : ''}`}
                      data-mood="anxious"
                      onClick={() => {
                        Logger.debug('Setting mood to anxious');
                        setDailyCheckInData(prev => ({
                          ...prev,
                          mood: 'anxious'
                        }));
                      }}
                    >
                      <span>😰</span> Anxious
                    </button>
                    <button
                      type="button"
                      className={`mood-button ${dailyCheckInData.mood === 'sad' ? 'selected' : ''}`}
                      data-mood="sad"
                      onClick={() => {
                        Logger.debug('Setting mood to sad');
                        setDailyCheckInData(prev => ({
                          ...prev,
                          mood: 'sad'
                        }));
                      }}
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
            {mentalHealthData.length > 0 ? (
              <div>
                <p>
                  Your latest stress level is{" "}
                  <strong>{mentalHealthData[0]?.stressLevel || "Not recorded"}</strong>.
                </p>
                {stressAnalysis ? (
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
                          <span>{stressAnalysis?.analysis?.current_state?.stress_level || 'N/A'}/10</span>
                        </div>
                        <div className="state-item">
                          <label>Sleep Quality:</label>
                          <span>{stressAnalysis?.analysis?.current_state?.sleep_quality || 'N/A'}/10</span>
                        </div>
                      </div>
                    </div>
                    <div className="recommendations">
                      <h3>Personalized Recommendations</h3>
                      <ul>
                        {Array.isArray(stressAnalysis?.recommendations) ? (
                          stressAnalysis.recommendations.map((rec, index) => (
                            <li key={index}>{rec}</li>
                          ))
                        ) : (
                          <li>No recommendations available at the moment.</li>
                        )}
                      </ul>
                    </div>
                  </div>
                ) : (
                  <div className="stress-analysis-content">
                    <div className="current-state">
                      <h3>Current State</h3>
                      <div className="state-grid">
                        <div className="state-item">
                          <label>Mood:</label>
                          <span>neutral</span>
                        </div>
                        <div className="state-item">
                          <label>Stress Level:</label>
                          <span>5/10</span>
                        </div>
                        <div className="state-item">
                          <label>Sleep Quality:</label>
                          <span>10/10</span>
                        </div>
                      </div>
                    </div>
                    <div className="recommendations">
                      <h3>Personalized Recommendations</h3>
                      <ul>
                        <li>Welcome to your stress management journey!</li>
                        <li>- Track your daily mood and stress levels</li>
                        <li>- Practice basic stress management techniques</li>
                        <li>- Establish a consistent sleep schedule</li>
                        <li>- Engage in regular physical activity</li>
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p>Loading stress data...</p>
            )}
          </div>

          {/* Mood Chart Section */}
          <div className="mentalhealth-section mood-chart-section">
            <h2>Mood Trends</h2>
            <p className="chart-description">Your daily moods for the past 7 days</p>
            {isLoading ? (
              <p>Loading your mood data...</p>
            ) : error ? (
              <p className="error-message">{error}</p>
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
            ) : error ? (
              <p className="error-message">{error}</p>
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
