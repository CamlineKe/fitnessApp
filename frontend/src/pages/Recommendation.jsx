import React, { useEffect, useState, useContext } from 'react';
import DietRecommendationService from '../services/DietRecommendationService';
import StressAnalysisService from '../services/StressAnalysisService';
import WorkoutRecommenderService from '../services/WorkoutRecommenderService';
import { getMentalHealthData } from '../services/MentalHealthService';
import { UserContext } from "../components/UserContext";
import { EventEmitter } from '../utils/EventEmitter';
import './styles/Recommendation.css';

const Recommendation = () => {
  const { user } = useContext(UserContext);
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

  const fetchRecommendations = async () => {
    setLoading(true);
    setErrors({
      diet: null,
      stress: null,
      workout: null
    });

    try {
      // First fetch mental health logs
      console.log("Fetching mental health logs for user:", user._id);
      const logs = await getMentalHealthData(user._id);
      console.log("Received mental health logs:", logs);
      setMentalLogs(logs);

      // Handle empty or null data
      if (!logs || (Array.isArray(logs) && logs.length === 0)) {
        console.log("No mental health records found");
        setStressAnalysis({
          recommendations: []
        });
      } else {
        // Ensure data is an array and sort by date (newest first)
        const dataArray = Array.isArray(logs) ? logs : [logs];
        const validLogs = dataArray.filter(log => log && log.mood && log.date && log._id);
        const sortedLogs = validLogs.sort((a, b) => new Date(b.date) - new Date(a.date));

        // Fetch recommendations for each service separately to handle errors individually
        try {
          const dietData = await DietRecommendationService.getDietRecommendations();
          setDietRecommendations(dietData || { recommendations: [] });
          EventEmitter.emit(EventEmitter.Events.DIET_RECOMMENDATIONS_UPDATED, dietData);
        } catch (err) {
          console.error('Failed to fetch diet recommendations:', err);
          setErrors(prev => ({ ...prev, diet: 'Diet recommendation service is currently unavailable. Please try again later.' }));
          setDietRecommendations({ recommendations: [] });
        }

        try {
          const stressData = await StressAnalysisService.getStressAnalysis(sortedLogs);
          setStressAnalysis(stressData);
          EventEmitter.emit(EventEmitter.Events.MENTAL_HEALTH_RECOMMENDATIONS_UPDATED, stressData);
        } catch (err) {
          console.error('Failed to fetch stress analysis:', err);
          setErrors(prev => ({ ...prev, stress: 'Stress analysis service is currently unavailable. Please try again later.' }));
          setStressAnalysis({
            recommendations: []
          });
        }

        try {
          const workoutData = await WorkoutRecommenderService.getWorkoutRecommendations();
          setWorkoutRecommendations(workoutData || { recommendations: [] });
          EventEmitter.emit(EventEmitter.Events.WORKOUT_RECOMMENDATIONS_UPDATED, workoutData);
        } catch (err) {
          console.error('Failed to fetch workout recommendations:', err);
          setErrors(prev => ({ ...prev, workout: 'Workout recommendation service is currently unavailable. Please try again later.' }));
          setWorkoutRecommendations({ recommendations: [] });
        }
      }
    } catch (err) {
      console.error('Failed to fetch mental health logs:', err);
      setErrors(prev => ({ ...prev, stress: 'Unable to load mental health data. Please try again later.' }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user || !user._id) {
      console.warn("User not authenticated, skipping fetch.");
      return;
    }

    fetchRecommendations();

    // Subscribe to meal update events
    const handleMealUpdated = () => {
      console.log("Meal updated, refreshing recommendations");
      fetchRecommendations();
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

                    {/* Target Nutrition */}
                    {dietRecommendations.analysis?.targets && (
                      <div className="nutrition-targets">
                        <h3>Daily Targets</h3>
                        <p>Target Calories: {dietRecommendations.analysis.targets.calories} kcal</p>
                        <div className="macro-targets">
                          <p>Target Protein: {dietRecommendations.analysis.targets.protein}g</p>
                          <p>Target Carbs: {dietRecommendations.analysis.targets.carbs}g</p>
                          <p>Target Fats: {dietRecommendations.analysis.targets.fats}g</p>
                        </div>
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
                    {/* Fitness Level */}
                    {workoutRecommendations.analysis?.fitness_level && (
                      <div className="fitness-level">
                        <h3>Your Fitness Level</h3>
                        <div className="fitness-badge">
                          {['Beginner', 'Intermediate', 'Advanced', 'Expert', 'Elite'][workoutRecommendations.analysis.fitness_level - 1]}
                        </div>
                      </div>
                    )}

                    {/* Weekly Stats */}
                    {workoutRecommendations.analysis?.pattern_analysis?.weekly_stats && (
                      <div className="workout-stats">
                        <h3>Weekly Overview</h3>
                        <div className="stats-grid">
                          {Object.entries(workoutRecommendations.analysis.pattern_analysis.weekly_stats).map(([week, stats]) => (
                            <div key={week} className="week-stats">
                              <h4>Week {week}</h4>
                              <p>Avg Duration: {Math.round(stats.duration)} min</p>
                              <p>Avg Calories: {Math.round(stats.caloriesBurned)} kcal</p>
                              <p>Avg Heart Rate: {Math.round(stats.heartRate)} bpm</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Activity Distribution */}
                    {workoutRecommendations.analysis?.pattern_analysis?.activity_distribution && (
                      <div className="activity-distribution">
                        <h3>Your Activity Distribution</h3>
                        <div className="activity-chart">
                          {Object.entries(workoutRecommendations.analysis.pattern_analysis.activity_distribution)
                            .sort((a, b) => b[1] - a[1])
                            .map(([activity, percentage]) => (
                              <div key={activity} className="activity-bar">
                                <div className="activity-label">{activity}</div>
                                <div className="activity-progress">
                                  <div 
                                    className="activity-fill" 
                                    style={{ width: `${percentage * 100}%` }}
                                  ></div>
                                </div>
                                <div className="activity-percentage">{Math.round(percentage * 100)}%</div>
                              </div>
                            ))}
                        </div>
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
                              <div className="zone-description">
                                {zone === 'recovery' && "Active recovery, focus on technique"}
                                {zone === 'aerobic' && "Endurance building, fat burning"}
                                {zone === 'anaerobic' && "Cardiovascular fitness"}
                                {zone === 'vo2max' && "Maximum effort, limit duration"}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Recommendations */}
                    <div className="workout-recommendations">
                      <h3>Personalized Recommendations</h3>
                      {workoutRecommendations.recommendations?.length > 0 ? (
                        <div className="recommendations-grid">
                          {workoutRecommendations.recommendations.map((rec, index) => (
                            <div key={index} className="recommendation-card">
                              <i className="fas fa-check-circle"></i>
                              <p>{rec}</p>
                            </div>
                          ))}
                        </div>
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