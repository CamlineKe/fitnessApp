import React, { useState, useEffect, useContext, useRef } from "react";
import {
  getNutritionData,
  createNutritionLog,
  updateNutritionLog,
  deleteNutritionLog,
  getMealLogs
} from "../services/NutritionService";
import Chart from "react-apexcharts";
import "./styles/Nutrition.css";
import { UserContext } from "../components/UserContext";
import DietRecommendationService from '../services/DietRecommendationService';
import GamificationService from '../services/GamificationService';
import { EventEmitter } from '../utils/EventEmitter';
import Swal from 'sweetalert2';
import mealsData from '../data/mealsData';
import Logger from '../utils/logger';

const Nutrition = () => {
  // ✅ Get the authenticated user from UserContext
  const { user } = useContext(UserContext);
  Logger.debug("User from Context:", user);

  // ✅ State for storing nutrition data (calories, macronutrients, meal logs)
  const [nutritionData, setNutritionData] = useState({
    calories: 0,
    macronutrients: { protein: 0, carbohydrates: 0, fats: 0 },
    mealLogs: [],
  });

  // ✅ State for storing meal logs separately
  const [mealLogs, setMealLogs] = useState([]);
  const [editMeal, setEditMeal] = useState(null); // Stores meal being edited

  // ✅ State for new meal input fields
  const [newMeal, setNewMeal] = useState({
    meal: "",
    type: "",
    calories: 0,
    nutrients: { protein: 0, carbohydrates: 0, fats: 0 },
  });

  const [dietRecommendations, setDietRecommendations] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // ✅ New state for meal suggestions autocomplete
  const [mealInput, setMealInput] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionsRef = useRef(null);

  const Toast = Swal.mixin({
    toast: true,
    position: 'top-right',
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
    background: '#fff',
    color: '#333',
    customClass: {
      popup: 'nutrition-toast'
    }
  });

  const notifySuccess = (message) => {
    Toast.fire({
      icon: 'success',
      title: message
    });
  };

  const notifyError = (message) => {
    Toast.fire({
      icon: 'error',
      title: message
    });
  };

  // ✅ Fetch nutrition data and diet recommendations on component mount or when the user changes
  useEffect(() => {
    if (!user || !user._id) return;

    const fetchData = async () => {
      try {
        const [nutritionData, logsData] = await Promise.all([
          getNutritionData(),
          getMealLogs(user._id)
        ]);
        setNutritionData(nutritionData);
        setMealLogs(logsData);
        setError(null);
      } catch (err) {
        console.error('Error fetching nutrition data:', err);
        setError('Failed to load nutrition data');
      }

      try {
        const recommendations = await DietRecommendationService.getDietRecommendations();
        setDietRecommendations(recommendations);
      } catch (err) {
        console.warn('Failed to load diet recommendations:', err);
        setDietRecommendations(null);
      }
    };

    fetchData();

    // Subscribe to diet recommendation updates
    const handleDietUpdate = (newRecommendations) => {
      setDietRecommendations(newRecommendations);
    };

    EventEmitter.on(EventEmitter.Events.DIET_RECOMMENDATIONS_UPDATED, handleDietUpdate);

    return () => {
      EventEmitter.off(EventEmitter.Events.DIET_RECOMMENDATIONS_UPDATED, handleDietUpdate);
    };
  }, [user]);

  // ✅ Add click outside handler to close suggestions dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // ✅ Handle meal input change and filter suggestions
  const handleMealInputChange = (e) => {
    const value = e.target.value;
    setMealInput(value);
    
    if (value.trim() === "") {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    
    // Filter meals that match the input
    const filteredSuggestions = mealsData.filter(meal => 
      meal.name.toLowerCase().includes(value.toLowerCase())
    );
    
    setSuggestions(filteredSuggestions);
    setShowSuggestions(true);
  };

  // ✅ Handle suggestion selection
  const handleSelectSuggestion = (meal) => {
    setMealInput(meal.name);
    
    // Auto-fill the form with selected meal data
    const form = document.getElementById('mealForm');
    if (form) {
      form.meal.value = meal.name;
      form.type.value = meal.type;
      form.calories.value = meal.calories;
      form.protein.value = meal.nutrients.protein;
      form.carbohydrates.value = meal.nutrients.carbohydrates;
      form.fats.value = meal.nutrients.fats;
    }
    
    setShowSuggestions(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const form = e.target;
    
    // Validate required fields
    const mealName = form.meal.value.trim();
    const calories = form.calories.value ? parseFloat(form.calories.value) : 0;
    
    // Validation checks
    if (!mealName) {
        notifyError('Please enter a meal name');
        return;
    }
    
    if (!calories || calories <= 0) {
        notifyError('Please enter valid calories (greater than 0)');
        return;
    }
    
    setIsSubmitting(true);
    
    // Convert form values to numbers and handle empty values
    const protein = form.protein.value ? parseFloat(form.protein.value) : 0;
    const carbs = form.carbohydrates.value ? parseFloat(form.carbohydrates.value) : 0;
    const fats = form.fats.value ? parseFloat(form.fats.value) : 0;
    
    // Additional validation for macronutrients
    if (protein < 0 || carbs < 0 || fats < 0) {
        notifyError('Macronutrient values cannot be negative');
        setIsSubmitting(false);
        return;
    }
    
    const mealData = {
        meal: mealName,
        type: form.type.value || 'breakfast',
        calories: calories,
        nutrients: {
            protein: protein,
            carbohydrates: carbs,
            fats: fats
        }
    };

    try {
        await handleMealSubmit(mealData);
        form.reset();
        setMealInput(""); // Reset meal input after submission
    } catch (error) {
        Logger.error('Failed to submit meal:', error);
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleMealSubmit = async (mealData) => {
    try {
      const response = await createNutritionLog({
        userId: user._id,
        date: new Date(),
        mealType: mealData.type,
        foodItems: [mealData.meal],
        calories: mealData.calories,
        macronutrients: mealData.nutrients,
      });

      // Update meal logs
      setMealLogs(prevLogs => [...prevLogs, response]);
      
      // Update today's nutrition data
      setNutritionData(prev => ({
        ...prev,
        calories: prev.calories + mealData.calories,
        macronutrients: {
          protein: prev.macronutrients.protein + mealData.nutrients.protein,
          carbohydrates: prev.macronutrients.carbohydrates + mealData.nutrients.carbohydrates,
          fats: prev.macronutrients.fats + mealData.nutrients.fats
        }
      }));

      // Update gamification for nutrition tracking
      await GamificationService.updatePoints('nutrition', {
        calories: mealData.calories,
        macronutrients: mealData.nutrients,
        mealType: mealData.type
      });
      await GamificationService.updateStreak('nutrition');
      await GamificationService.checkAchievements();

      // Emit events for dashboard update
      EventEmitter.emit('nutrition-updated');
      EventEmitter.emit('gamification-updated');

      // Show success toast
      notifySuccess('Meal added successfully! 🍽️');
      
    } catch (error) {
      Logger.error("Failed to create meal log:", error);
      notifyError('Failed to add meal. Please try again.');
    }
  };

  // ✅ Function to set the selected meal for editing
  const handleEditMealLog = (meal) => {
    setEditMeal(meal);
    setNewMeal(meal);
  };

  // ✅ Function to save an updated meal log
  const handleSaveMealLog = async () => {
    try {
      const oldMeal = editMeal; // Store the old meal data
      const updatedLog = await updateNutritionLog(editMeal._id, newMeal);

      if (updatedLog) {
        // Update meal logs
        setMealLogs((prevLogs) => prevLogs.map((log) => (log._id === updatedLog._id ? updatedLog : log)));
        
        // Update today's nutrition data by subtracting old values and adding new ones
        setNutritionData(prev => ({
          ...prev,
          calories: prev.calories - Number(oldMeal.calories) + Number(newMeal.calories),
          macronutrients: {
            protein: prev.macronutrients.protein - Number(oldMeal.macronutrients?.protein || 0) + Number(newMeal.nutrients.protein),
            carbohydrates: prev.macronutrients.carbohydrates - Number(oldMeal.macronutrients?.carbohydrates || 0) + Number(newMeal.nutrients.carbohydrates),
            fats: prev.macronutrients.fats - Number(oldMeal.macronutrients?.fats || 0) + Number(newMeal.nutrients.fats)
          }
        }));
        
        // Update gamification for nutrition tracking
        await GamificationService.updatePoints('nutrition', {
          calories: newMeal.calories,
          macronutrients: newMeal.nutrients,
          mealType: newMeal.type
        });
        await GamificationService.updateStreak('nutrition');
        await GamificationService.checkAchievements();
        
        // Emit event for dashboard update
        EventEmitter.emit('nutrition-updated');

        setEditMeal(null); // Clear edit mode after saving
        notifySuccess('Meal updated successfully! 🔄');
      }
    } catch (error) {
      Logger.error("Failed to update meal log:", error);
      notifyError('Failed to update meal. Please try again.');
    }
  };

  // ✅ Function to delete a meal log
  const handleDeleteMealLog = async (id) => {
    try {
      // Find the meal log before deleting it
      const mealToDelete = mealLogs.find(log => log._id === id);
      
      await deleteNutritionLog(id);

      // Update meal logs
      setMealLogs((prevLogs) => prevLogs.filter((log) => log._id !== id));
      
      // Update today's nutrition data by subtracting the deleted meal's values
      if (mealToDelete) {
        setNutritionData(prev => ({
          ...prev,
          calories: prev.calories - Number(mealToDelete.calories),
          macronutrients: {
            protein: prev.macronutrients.protein - Number(mealToDelete.macronutrients?.protein || 0),
            carbohydrates: prev.macronutrients.carbohydrates - Number(mealToDelete.macronutrients?.carbohydrates || 0),
            fats: prev.macronutrients.fats - Number(mealToDelete.macronutrients?.fats || 0)
          }
        }));
        
        // Update gamification for nutrition tracking
        await GamificationService.updatePoints('nutrition', {
          calories: -mealToDelete.calories,
          macronutrients: mealToDelete.macronutrients,
          mealType: mealToDelete.mealType
        });
        await GamificationService.updateStreak('nutrition');
        await GamificationService.checkAchievements();
        
        notifySuccess('Meal deleted successfully! 🗑️');
      }
    } catch (error) {
      Logger.error("Failed to delete meal log:", error);
      notifyError('Failed to delete meal. Please try again.');
    }
  };

  // ✅ Compute macronutrient distribution for the chart
  const getMacronutrientData = () => {
    const { protein, carbohydrates, fats } = nutritionData.macronutrients;
    return [protein, carbohydrates, fats];
  };

  // Chart configurations for macronutrients donut chart
  const macronutrientChartOptions = {
    chart: {
      type: 'donut',
      height: 300
    },
    labels: ['Protein', 'Carbohydrates', 'Fats'],
    colors: ['#FF6B6B', '#4ECDC4', '#45B7D1'],
    plotOptions: {
      pie: {
        donut: {
          labels: {
            show: true,
            total: {
              show: true,
              label: 'Total Macros',
              formatter: function (w) {
                return w.globals.seriesTotals.reduce((a, b) => a + b, 0) + 'g';
              }
            }
          }
        }
      }
    }
  };

  // Chart configurations for calorie bar chart
  const calorieChartOptions = {
    chart: {
      type: 'bar',
      height: 350,
      toolbar: { show: false }
    },
    plotOptions: {
      bar: {
        borderRadius: 4,
        columnWidth: '70%',
      }
    },
    xaxis: {
      // Get last 7 days including today
      categories: Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        return date.toLocaleDateString('en-US', { weekday: 'short' });
      }),
      labels: { rotate: -45 }
    },
    yaxis: {
      title: { text: 'Calories' },
      min: 0
    },
    fill: { colors: ['#FF6B6B'] }
  };

  // Chart configurations for meal type radar chart
  const mealTypeData = {
    series: [{
      name: 'Meals',
      data: [
        mealLogs.filter(log => log.mealType === 'breakfast').length,
        mealLogs.filter(log => log.mealType === 'lunch').length,
        mealLogs.filter(log => log.mealType === 'dinner').length,
        mealLogs.filter(log => log.mealType === 'snack').length
      ]
    }],
    options: {
      chart: {
        type: 'radar',
        height: 300
      },
      labels: ['Breakfast', 'Lunch', 'Dinner', 'Snacks'],
      colors: ['#4ECDC4'],
      markers: {
        size: 4,
        colors: ['#fff'],
        strokeColors: '#4ECDC4',
        strokeWidth: 2,
      }
    }
  };

  return (
    <div className="page-content">  
    <div className="nutrition-container">
      <div className="nutrition-header">
        <h1>Nutrition</h1>
        <p>Track your daily nutrition intake.</p>
      </div>

      <div className="nutrition-content">
        {/* Meal Form Section */}
        <div className="nutrition-section meal-form">
          <h2>Add Meal</h2>
          <form id="mealForm" onSubmit={handleSubmit}>
            <div className="form-group">
              <div className="input-with-label meal-input-container">
                <label>Meal Name:</label>
                <input
                  type="text"
                  name="meal"
                  placeholder="What did you eat?"
                  required
                  value={mealInput}
                  onChange={handleMealInputChange}
                  onFocus={() => mealInput.trim() !== "" && setShowSuggestions(true)}
                />
                {showSuggestions && suggestions.length > 0 && (
                  <div className="meal-suggestions" ref={suggestionsRef}>
                    {suggestions.map((meal, index) => (
                      <div 
                        key={index} 
                        className="suggestion-item"
                        onClick={() => handleSelectSuggestion(meal)}
                      >
                        <div className="suggestion-name">{meal.name}</div>
                        <div className="suggestion-details">
                          <span>{meal.calories} kcal</span>
                          <span>P: {meal.nutrients.protein}g</span>
                          <span>C: {meal.nutrients.carbohydrates}g</span>
                          <span>F: {meal.nutrients.fats}g</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="input-with-label">
                <label>Meal Type:</label>
                <select
                  name="type"
                  defaultValue="breakfast"
                >
                  <option value="breakfast">Breakfast</option>
                  <option value="lunch">Lunch</option>
                  <option value="dinner">Dinner</option>
                  <option value="snack">Snack</option>
                </select>
              </div>
            </div>
            <div className="form-group">
              <div className="input-with-label">
                <label>Total Calories:</label>
                <input
                  type="number"
                  name="calories"
                  placeholder="Calories"
                  min="0"
                  required
                />
                <span className="unit">kcal</span>
              </div>
            </div>
            <div className="nutrients-group">
              <div className="input-with-label">
                <label>Protein:</label>
                <input
                  type="number"
                  name="protein"
                  placeholder="Protein"
                  min="0"
                />
                <span className="unit">g</span>
              </div>
              <div className="input-with-label">
                <label>Carbohydrates:</label>
                <input
                  type="number"
                  name="carbohydrates"
                  placeholder="Carbs"
                  min="0"
                />
                <span className="unit">g</span>
              </div>
              <div className="input-with-label">
                <label>Fats:</label>
                <input
                  type="number"
                  name="fats"
                  placeholder="Fats"
                  min="0"
                />
                <span className="unit">g</span>
              </div>
            </div>
            <button 
              type="submit" 
              className={isSubmitting ? 'loading' : ''}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Adding Meal...' : 'Add Meal'}
            </button>
            {message && <p style={{ color: 'green' }}>{message}</p>}
            {error && <p style={{ color: 'red' }}>{error}</p>}
          </form>
        </div>

        {/* Today's Meals Section */}
        <div className="nutrition-section todays-meals">
          <h2>Today's Meals</h2>
          {mealLogs.filter(log => {
            const logDate = new Date(log.date);
            const today = new Date();
            return logDate.toDateString() === today.toDateString();
          }).length > 0 ? (
            <>
              <div className="meal-logs-header">
                <div className="meal-log-item">
                  <span className="meal-name">Meal Name</span>
                  <span className="meal-type">Type</span>
                  <span className="meal-calories">Calories</span>
                  <span className="meal-actions-header">Actions</span>
                </div>
              </div>
              <ul className="meal-logs-list">
                {mealLogs
                  .filter(log => {
                    const logDate = new Date(log.date);
                    const today = new Date();
                    return logDate.toDateString() === today.toDateString();
                  })
                  .sort((a, b) => new Date(b.date) - new Date(a.date))
                  .map((log) => (
                    <li key={log._id} className="meal-log-item">
                      <span className="meal-name">{log.foodItems?.join(", ") || "N/A"}</span>
                      <span className="meal-type">{log.mealType || "N/A"}</span>
                      <span className="meal-calories">{log.calories} kcal</span>
                      <div className="meal-actions">
                        {editMeal && editMeal._id === log._id ? (
                          <button onClick={handleSaveMealLog}>Save</button>
                        ) : (
                          <button onClick={() => handleEditMealLog(log)}>Edit</button>
                        )}
                        <button onClick={() => handleDeleteMealLog(log._id)} className="delete-btn">Delete</button>
                      </div>
                    </li>
                  ))}
              </ul>
              <div className="todays-total">
                <p>Total Calories Today: {
                  mealLogs
                    .filter(log => {
                      const logDate = new Date(log.date);
                      const today = new Date();
                      return logDate.toDateString() === today.toDateString();
                    })
                    .reduce((sum, log) => sum + (log.calories || 0), 0)
                } kcal</p>
              </div>
            </>
          ) : (
            <p className="no-meals">No meals logged today. Start by adding one above!</p>
          )}
        </div>

        {/* Diet Recommendations Section */}
        <div className="nutrition-section diet-recommendations">
          <h2>Your Diet Recommendations</h2>
          <p>Personalized nutrition advice based on your recent nutrition</p>
          {dietRecommendations?.recommendations ? (
            <ul className="recommendations-list">
              {dietRecommendations.recommendations.map((rec, index) => (
                <li key={index} className="recommendation-item">
                  <i className="fas fa-check-circle"></i>
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="no-recommendations">
              <p>No diet recommendations available at the moment.</p>
            </div>
          )}
        </div>

        {/* Charts Section */}
        <div className="nutrition-charts">
          <div className="chart-section">
            <h2>Today's Macronutrients</h2>
            <div className="chart-container">
              <Chart
                options={macronutrientChartOptions}
                series={getMacronutrientData()}
                type="donut"
              />
            </div>
          </div>

          <div className="chart-section">
            <h2>Weekly Calorie Intake</h2>
            <div className="chart-container">
              <Chart
                options={calorieChartOptions}
                series={[{
                  name: 'Calories',
                  data: Array.from({ length: 7 }, (_, i) => {
                    const date = new Date();
                    date.setDate(date.getDate() - (6 - i));
                    date.setHours(0, 0, 0, 0);
                    
                    return mealLogs
                      .filter(log => {
                        const logDate = new Date(log.date);
                        return logDate.setHours(0, 0, 0, 0) === date.getTime();
                      })
                      .reduce((sum, log) => sum + (log.calories || 0), 0);
                  })
                }]}
                type="bar"
              />
            </div>
          </div>

          <div className="chart-section">
            <h2>Meal Type Distribution</h2>
            <div className="chart-container">
              <Chart
                options={mealTypeData.options}
                series={mealTypeData.series}
                type="radar"
              />
            </div>
          </div>
        </div>

        {/* Weekly Overview Section */}
        <div className="nutrition-section weekly-overview">
          <h2>Weekly Overview</h2>
          <div className="weekly-charts-container">
            {/* Weekly Calorie Trend */}
            <div className="weekly-chart">
              <h3>Calorie Trend</h3>
              <Chart
                options={{
                  chart: {
                    type: 'area',
                    height: 250,
                    toolbar: { show: false },
                    zoom: { enabled: false }
                  },
                  stroke: {
                    curve: 'smooth',
                    width: 2
                  },
                  fill: {
                    type: 'gradient',
                    gradient: {
                      shadeIntensity: 1,
                      opacityFrom: 0.7,
                      opacityTo: 0.3,
                      stops: [0, 90, 100]
                    }
                  },
                  dataLabels: { enabled: false },
                  colors: ['#4ECDC4'],
                  xaxis: {
                    // Get last 7 days including today
                    categories: Array.from({ length: 7 }, (_, i) => {
                      const date = new Date();
                      date.setDate(date.getDate() - (6 - i));
                      return date.toDateString() === new Date().toDateString()
                        ? 'Today'
                        : date.toLocaleDateString('en-US', { weekday: 'short' });
                    }),
                    labels: { style: { colors: '#666' } }
                  },
                  yaxis: {
                    title: { text: 'Calories' },
                    labels: { style: { colors: '#666' } },
                    min: 0
                  },
                  tooltip: {
                    theme: 'light',
                    y: {
                      formatter: (val) => `${val} kcal`
                    }
                  }
                }}
                series={[{
                  name: 'Daily Calories',
                  data: Array.from({ length: 7 }, (_, i) => {
                    const date = new Date();
                    date.setDate(date.getDate() - (6 - i));
                    date.setHours(0, 0, 0, 0);
                    
                    return mealLogs
                      .filter(log => {
                        const logDate = new Date(log.date);
                        return logDate.setHours(0, 0, 0, 0) === date.getTime();
                      })
                      .reduce((sum, log) => sum + (log.calories || 0), 0);
                  })
                }]}
                type="area"
              />
            </div>

            {/* Weekly Macronutrient Distribution */}
            <div className="weekly-chart">
              <h3>Macronutrient Distribution</h3>
              <Chart
                options={{
                  chart: {
                    type: 'bar',
                    height: 250,
                    stacked: true,
                    toolbar: { show: false }
                  },
                  plotOptions: {
                    bar: {
                      horizontal: false,
                      borderRadius: 4,
                      columnWidth: '70%'
                    }
                  },
                  colors: ['#FF6B6B', '#4ECDC4', '#45B7D1'],
                  xaxis: {
                    categories: mealLogs
                      .slice(-7)
                      .map(log => new Date(log.date).toLocaleDateString('en-US', { weekday: 'short' })),
                    labels: { style: { colors: '#666' } }
                  },
                  yaxis: {
                    title: { text: 'Grams' },
                    labels: { style: { colors: '#666' } }
                  },
                  legend: {
                    position: 'top',
                    horizontalAlign: 'center'
                  },
                  tooltip: {
                    theme: 'light',
                    y: {
                      formatter: (val) => `${val}g`
                    }
                  }
                }}
                series={[
                  {
                    name: 'Protein',
                    data: mealLogs.slice(-7).map(log => log.macronutrients?.protein || 0)
                  },
                  {
                    name: 'Carbs',
                    data: mealLogs.slice(-7).map(log => log.macronutrients?.carbohydrates || 0)
                  },
                  {
                    name: 'Fats',
                    data: mealLogs.slice(-7).map(log => log.macronutrients?.fats || 0)
                  }
                ]}
                type="bar"
              />
            </div>

            {/* Weekly Summary Cards */}
            <div className="weekly-summary">
              <div className="summary-card">
                <h4>Weekly Average</h4>
                <div className="summary-stats">
                  <div className="stat">
                    <span className="label">Calories</span>
                    <span className="value">
                      {Math.round(
                        mealLogs.slice(-7).reduce((acc, log) => acc + log.calories, 0) / 7
                      )}
                    </span>
                    <span className="unit">kcal/day</span>
                  </div>
                  <div className="stat">
                    <span className="label">Protein</span>
                    <span className="value">
                      {Math.round(
                        mealLogs.slice(-7).reduce((acc, log) => acc + (log.macronutrients?.protein || 0), 0) / 7
                      )}
                    </span>
                    <span className="unit">g/day</span>
                  </div>
                  <div className="stat">
                    <span className="label">Consistency</span>
                    <span className="value">
                      {Math.round(
                        (mealLogs.slice(-7).filter(log => log.calories > 0).length / 7) * 100
                      )}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Meal Logs Section */}
        <div className="nutrition-section meal-logs">
          <h2>Meal Logs</h2>
          {mealLogs.length > 0 ? (
            <>
              <div className="meal-logs-header">
                <div className="meal-log-item">
                  <span className="meal-name">Meal Name</span>
                  <span className="meal-type">Type</span>
                  <span className="meal-calories">Calories</span>
                  <span className="meal-actions-header">Actions</span>
                </div>
              </div>
              <ul className="meal-logs-list">
                {[...mealLogs]
                  .sort((a, b) => new Date(b.date) - new Date(a.date)) // Sort by most recent
                  .filter(log => {
                    const logDate = new Date(log.date);
                    const sevenDaysAgo = new Date();
                    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
                    return logDate >= sevenDaysAgo;
                  })
                  .map((log) => {
                    const logDate = new Date(log.date);
                    const isToday = logDate.toDateString() === new Date().toDateString();
                    return (
                      <li key={log._id} className="meal-log-item">
                        <span className="meal-name">
                          {isToday ? "Today" : logDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} - {log.foodItems?.join(", ") || "N/A"}
                        </span>
                        <span className="meal-type">{log.mealType || "N/A"}</span>
                        <span className="meal-calories">{log.calories} kcal</span>
                        <div className="meal-actions">
                          {editMeal && editMeal._id === log._id ? (
                            <button onClick={handleSaveMealLog}>Save</button>
                          ) : (
                            <button onClick={() => handleEditMealLog(log)}>Edit</button>
                          )}
                          <button onClick={() => handleDeleteMealLog(log._id)} className="delete-btn">Delete</button>
                        </div>
                      </li>
                    );
                  })}
              </ul>
            </>
          ) : <p>No meal logs yet. Start by adding one!</p>}
        </div>

      </div>
    </div>
    </div>
  );
};

export default Nutrition;
