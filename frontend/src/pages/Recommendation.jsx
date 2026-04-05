import React, { useEffect, useState, useContext } from 'react';
import DietRecommendationService from '../services/DietRecommendationService';
import StressAnalysisService from '../services/StressAnalysisService';
import WorkoutRecommenderService from '../services/WorkoutRecommenderService';
import { getMentalHealthData } from '../services/MentalHealthService';
import { UserContext } from "../components/UserContext";
import { EventEmitter } from '../utils/EventEmitter';
import Logger from '../utils/logger';
import { getCachedRecommendations, setCachedRecommendations, clearRecommendationsCache } from '../utils/recommendationsCache';
import './styles/Recommendation.css';

const Recommendation = () => {
  const { user, getUserId, isAuthenticated } = useContext(UserContext);
  const [dietRecommendations, setDietRecommendations] = useState(null);
  const [stressAnalysis, setStressAnalysis] = useState(null);
  const [workoutRecommendations, setWorkoutRecommendations] = useState(null);
  const [mentalLogs, setMentalLogs] = useState([]);
  const [errors, setErrors] = useState({
    diet: null,
    stress: null,
    workout: null
  });
  const [loading, setLoading] = useState(true);

  const fetchRecommendations = async (skipCache = false) => {
    const userId = getUserId();
    console.log('[Recommendation] Starting fetch, userId:', userId);
    
    if (!userId) {
      Logger.warn("No user ID available, skipping recommendations fetch");
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setErrors({
      diet: null,
      stress: null,
      workout: null
    });

    // ✅ Check cache first (unless skipCache is true - e.g., after meal update)
    if (!skipCache) {
      const cached = getCachedRecommendations();
      if (cached) {
        Logger.debug('Using cached recommendations');
        setDietRecommendations(cached.diet);
        setStressAnalysis(cached.stress);
        setWorkoutRecommendations(cached.workout);
        setMentalLogs(cached.mentalLogs || []);
        setLoading(false);
        return;
      }
    }

    try {
      // First fetch mental health logs
      const logs = await getMentalHealthData(userId);
      Logger.debug("Received mental health logs:", logs);
      setMentalLogs(logs);

      // Handle empty or null data
      if (!logs || (Array.isArray(logs) && logs.length === 0)) {
        Logger.log("No mental health records found");
        setStressAnalysis({
          recommendations: [],
          analysis: {
            current_state: {},
            patterns: {}
          }
        });
      }
      
      // Ensure data is an array and sort by date (newest first)
      const dataArray = Array.isArray(logs) ? logs : [logs];
      const validLogs = dataArray.filter(log => log && log.mood && log.date && log._id);
      const sortedLogs = validLogs.sort((a, b) => new Date(b.date) - new Date(a.date));

      // Fetch all recommendations in PARALLEL for faster loading
      console.log('[Recommendation] Calling APIs with userId:', userId);
      const [dietData, stressData, workoutData] = await Promise.allSettled([
        DietRecommendationService.getDietRecommendations(userId),
        StressAnalysisService.getStressAnalysis(sortedLogs, userId),
        WorkoutRecommenderService.getWorkoutRecommendations(userId)
      ]);
      console.log('[Recommendation] API results:', { dietData, stressData, workoutData });

        // Process diet results
        if (dietData.status === 'fulfilled') {
          Logger.debug("Diet recommendations:", dietData.value);
          setDietRecommendations(dietData.value || { recommendations: [], analysis: {} });
          EventEmitter.emit(EventEmitter.Events.DIET_RECOMMENDATIONS_UPDATED, dietData.value);
        } else {
          Logger.error('Failed to fetch diet recommendations:', dietData.reason);
          setErrors(prev => ({ ...prev, diet: 'Diet recommendation service is currently unavailable. Please try again later.' }));
          setDietRecommendations({ recommendations: [], analysis: {} });
        }

        // Process stress results
        if (stressData.status === 'fulfilled') {
          Logger.debug("Stress analysis:", stressData.value);
          setStressAnalysis(stressData.value);
          EventEmitter.emit(EventEmitter.Events.MENTAL_HEALTH_RECOMMENDATIONS_UPDATED, stressData.value);
        } else {
          Logger.error('Failed to fetch stress analysis:', stressData.reason);
          setErrors(prev => ({ ...prev, stress: 'Stress analysis service is currently unavailable. Please try again later.' }));
          setStressAnalysis({
            recommendations: [],
            analysis: {
              current_state: {},
              patterns: {}
            }
          });
        }

        // Process workout results
        if (workoutData.status === 'fulfilled') {
          Logger.debug("Workout recommendations:", workoutData.value);
          setWorkoutRecommendations(workoutData.value || { recommendations: [], analysis: {} });
          EventEmitter.emit(EventEmitter.Events.WORKOUT_RECOMMENDATIONS_UPDATED, workoutData.value);
        } else {
          Logger.error('Failed to fetch workout recommendations:', workoutData.reason);
          setErrors(prev => ({ ...prev, workout: 'Workout recommendation service is currently unavailable. Please try again later.' }));
          setWorkoutRecommendations({ recommendations: [], analysis: {} });
        }

        // ✅ Cache the results for 5 minutes
        setCachedRecommendations({
          diet: dietData.status === 'fulfilled' ? dietData.value : { recommendations: [], analysis: {} },
          stress: stressData.status === 'fulfilled' ? stressData.value : { recommendations: [], analysis: { current_state: {}, patterns: {} } },
          workout: workoutData.status === 'fulfilled' ? workoutData.value : { recommendations: [], analysis: {} },
          mentalLogs: logs
        });
    } catch (err) {
      Logger.error('Failed to fetch mental health logs:', err);
      setErrors(prev => ({ ...prev, stress: 'Unable to load mental health data. Please try again later.' }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) return;
    fetchRecommendations();
  }, [isAuthenticated]);

  useEffect(() => {
    const handleMealUpdated = () => {
      Logger.debug("Meal updated, refreshing recommendations (skipping cache)");
      clearRecommendationsCache();
      fetchRecommendations(true); // Skip cache on meal updates
    };

    EventEmitter.on(EventEmitter.Events.MEAL_ADDED, handleMealUpdated);
    EventEmitter.on(EventEmitter.Events.MEAL_UPDATED, handleMealUpdated);
    EventEmitter.on(EventEmitter.Events.MEAL_DELETED, handleMealUpdated);

    // Cleanup event listeners
    return () => {
      EventEmitter.off(EventEmitter.Events.MEAL_ADDED, handleMealUpdated);
      EventEmitter.off(EventEmitter.Events.MEAL_UPDATED, handleMealUpdated);
      EventEmitter.off(EventEmitter.Events.MEAL_DELETED, handleMealUpdated);
    };
  }, [user]);

  return (
    <div className="page-content">
      <div className="recommendation-container">
        <div className="recommendation-header">
          <h1>Your Personalized Recommendations</h1>
          <p>Get tailored advice for your diet, stress management, and workout routine.</p>
        </div>
      
        <div className="recommendation-content">
          {loading && (
            <div className="loading-message">
              <i className="fas fa-spinner fa-spin"></i>
              <p>Loading your personalized recommendations...</p>
            </div>
          )}

          {!loading && (
            <div className="recommendations-grid">
              {/* Diet Recommendations Section */}
              <div className="recommendation-section diet-section">
                <div className="section-header">
                  <i className="fas fa-utensils"></i>
                  <h2>Diet Recommendations</h2>
                </div>
                {errors.diet && (
                  <div className="error-message">
                    <i className="fas fa-exclamation-circle"></i>
                    <p>{errors.diet}</p>
                  </div>
                )}
                {dietRecommendations && (
                  <div>
                    {/* Current Intake Analysis */}
                    {dietRecommendations.analysis?.current_intake && (
                      <div className="current-intake">
                        <h3>Today's Intake</h3>
                        <p>Calories: {dietRecommendations.analysis.current_intake.calories || 0} kcal</p>
                        <div className="macros">
                          <p>Protein: {dietRecommendations.analysis.current_intake.macronutrients?.protein || 0}g</p>
                          <p>Carbs: {dietRecommendations.analysis.current_intake.macronutrients?.carbohydrates || 0}g</p>
                          <p>Fats: {dietRecommendations.analysis.current_intake.macronutrients?.fats || 0}g</p>
                        </div>
                      </div>
                    )}

                    {/* Nutrient Balance */}
                    {dietRecommendations.analysis?.nutrient_balance && (
                      <div className="nutrient-balance">
                        <h3>Macronutrient Balance</h3>
                        <p>Protein: {dietRecommendations.analysis.nutrient_balance.protein_ratio || 0}%</p>
                        <p>Carbs: {dietRecommendations.analysis.nutrient_balance.carbs_ratio || 0}%</p>
                        <p>Fats: {dietRecommendations.analysis.nutrient_balance.fats_ratio || 0}%</p>
                      </div>
                    )}

                    {/* Meal Pattern */}
                    {dietRecommendations.analysis?.meal_pattern && (
                      <div className="meal-pattern">
                        <h3>Meal Pattern</h3>
                        <p>{dietRecommendations.analysis.meal_pattern}</p>
                      </div>
                    )}

                    {/* ML Info */}
                    {dietRecommendations.analysis?.ml_used && (
                      <div className="ml-badge">
                        <i className="fas fa-robot"></i> AI-Powered Analysis
                        {dietRecommendations.analysis.ml_prediction && (
                          <span className="confidence">
                            Confidence: {Math.round(dietRecommendations.analysis.ml_prediction.confidence * 100)}%
                          </span>
                        )}
                      </div>
                    )}

                    {/* Recommendations */}
                    <div className="diet-recommendations">
                      <h3>Personalized Recommendations</h3>
                      {dietRecommendations.recommendations?.length > 0 ? (
                        <ul>
                          {dietRecommendations.recommendations.map((rec, index) => (
                            <li key={index} className="recommendation-item">{rec}</li>
                          ))}
                        </ul>
                      ) : (
                        <p>No diet recommendations available at the moment.</p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Stress Analysis Section */}
              <div className="recommendation-section stress-section">
                <div className="section-header">
                  <i className="fas fa-brain"></i>
                  <h2>Stress Analysis</h2>
                </div>
                {errors.stress && (
                  <div className="error-message">
                    <i className="fas fa-exclamation-circle"></i>
                    <p>{errors.stress}</p>
                  </div>
                )}
                {stressAnalysis && (
                  <div>
                    <div className="stress-status">
                      <h3>Current Status</h3>
                      <p>Mood: {stressAnalysis?.analysis?.current_state?.mood || 'N/A'}</p>
                      <p>Stress Level: {stressAnalysis?.analysis?.current_state?.stress_level ? `${stressAnalysis.analysis.current_state.stress_level}/10` : 'N/A'}</p>
                      <p>Sleep Quality: {stressAnalysis?.analysis?.current_state?.sleep_quality ? `${stressAnalysis.analysis.current_state.sleep_quality}/10` : 'N/A'}</p>
                    </div>

                    {/* Patterns */}
                    {stressAnalysis?.analysis?.patterns && (
                      <div className="stress-patterns">
                        <h3>Trends</h3>
                        <p>Stress: {stressAnalysis.analysis.patterns.stress_trend}</p>
                        <p>Sleep: {stressAnalysis.analysis.patterns.sleep_trend}</p>
                        <p>Mood: {stressAnalysis.analysis.patterns.mood_trend}</p>
                      </div>
                    )}

                    {/* ML Info */}
                    {stressAnalysis?.analysis?.ml_used && (
                      <div className="ml-badge">
                        <i className="fas fa-robot"></i> AI-Powered Analysis
                        {stressAnalysis.analysis.ml_prediction && (
                          <span className="confidence">
                            Confidence: {Math.round(stressAnalysis.analysis.ml_prediction.confidence * 100)}%
                          </span>
                        )}
                      </div>
                    )}

                    <div className="stress-recommendations">
                      <h3>Recommendations</h3>
                      {stressAnalysis?.recommendations?.length > 0 ? (
                        <ul>
                          {stressAnalysis.recommendations.map((rec, index) => (
                            <li key={index} className="recommendation-item">{rec}</li>
                          ))}
                        </ul>
                      ) : (
                        <p>No stress analysis recommendations available at the moment.</p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Workout Recommendations Section */}
              <div className="recommendation-section workout-section">
                <div className="section-header">
                  <i className="fas fa-dumbbell"></i>
                  <h2>Workout Recommendations</h2>
                </div>
                {errors.workout && (
                  <div className="error-message">
                    <i className="fas fa-exclamation-circle"></i>
                    <p>{errors.workout}</p>
                  </div>
                )}
                {workoutRecommendations && (
                  <div>
                    {/* Current Workout */}
                    {workoutRecommendations.analysis?.current_workout && (
                      <div className="current-workout">
                        <h3>Today's Workout</h3>
                        <p>Activity: {workoutRecommendations.analysis.current_workout.activity_type || 'N/A'}</p>
                        <p>Duration: {workoutRecommendations.analysis.current_workout.duration || 0} min</p>
                        <p>Calories: {workoutRecommendations.analysis.current_workout.calories_burned || 0} kcal</p>
                        <p>Heart Rate: {workoutRecommendations.analysis.current_workout.heart_rate || 0} bpm</p>
                      </div>
                    )}

                    {/* Weekly Stats */}
                    {workoutRecommendations.analysis?.weekly_stats && (
                      <div className="workout-stats">
                        <h3>Weekly Overview</h3>
                        <p>Total Volume: {workoutRecommendations.analysis.weekly_stats.total_volume || 0} min</p>
                        <p>Frequency: {workoutRecommendations.analysis.weekly_stats.frequency || 0} workouts</p>
                      </div>
                    )}

                    {/* Heart Rate Zones */}
                    {workoutRecommendations.analysis?.heart_rate_zones && (
                      <div className="heart-rate-zones">
                        <h3>Your Target Heart Rate Zones</h3>
                        <div className="zones-grid">
                          {Object.entries(workoutRecommendations.analysis.heart_rate_zones).map(([zone, [lower, upper]]) => (
                            <div key={zone} className="zone-card">
                              <div className="zone-name">{zone.charAt(0).toUpperCase() + zone.slice(1)}</div>
                              <div className="zone-range">{Math.round(lower)} - {Math.round(upper)} BPM</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* ML Info */}
                    {workoutRecommendations.analysis?.ml_used && (
                      <div className="ml-badge">
                        <i className="fas fa-robot"></i> AI-Powered Analysis
                        {workoutRecommendations.analysis.ml_prediction && (
                          <span className="confidence">
                            Confidence: {Math.round(workoutRecommendations.analysis.ml_prediction.confidence * 100)}%
                          </span>
                        )}
                      </div>
                    )}

                    {/* Recommendations */}
                    <div className="workout-recommendations">
                      <h3>Personalized Recommendations</h3>
                      {workoutRecommendations.recommendations?.length > 0 ? (
                        <ul>
                          {workoutRecommendations.recommendations.map((rec, index) => (
                            <li key={index} className="recommendation-item">{rec}</li>
                          ))}
                        </ul>
                      ) : (
                        <div className="no-recommendations">
                          <p>No workout recommendations available at the moment.</p>
                          <p>Continue logging your workouts to receive personalized recommendations.</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Recommendation;