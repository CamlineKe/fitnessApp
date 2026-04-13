import React, { useState, useEffect, useContext, useRef } from "react";
import {
  getNutritionData,
  getNutritionStats,
  createNutritionLog,
  updateNutritionLog,
  deleteNutritionLog,
} from "../services/NutritionService";
import Chart from "react-apexcharts";
import EmptyState from "../components/EmptyState";
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
  const { user, getUserId, isAuthenticated } = useContext(UserContext);
  const userId = getUserId();
  Logger.debug("User from Context:", user);

  // ✅ State for storing nutrition data
  const [nutritionData, setNutritionData] = useState({
    logs: [],
    pagination: { page: 1, limit: 20, total: 0, pages: 1, hasMore: false }
  });

  // ✅ State for storing today's nutrition totals
  const [todayStats, setTodayStats] = useState({
    calories: 0,
    macronutrients: { protein: 0, carbohydrates: 0, fats: 0 }
  });

  // ✅ State for weekly stats (for charts)
  const [weeklyStats, setWeeklyStats] = useState([]);

  // ✅ State for meal logs (derived from nutritionData)
  const [mealLogs, setMealLogs] = useState([]);
  const [editMeal, setEditMeal] = useState(null); // Stores meal being edited
  const [editFormData, setEditFormData] = useState({
    meal: "",
    type: "",
    calories: 0,
    nutrients: { protein: 0, carbohydrates: 0, fats: 0 },
  });

  // ✅ State for pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMoreLogs, setHasMoreLogs] = useState(false);

  // Section loader component
  const SectionLoader = () => (
    <div className="section-loader">
      <div className="loading-spinner-small"></div>
    </div>
  );

  const [dietRecommendations, setDietRecommendations] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // ✅ State for meal suggestions autocomplete
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

  // ✅ Helper to calculate today's stats from logs
  const calculateTodayStats = (logs) => {
    const today = new Date().setHours(0, 0, 0, 0);
    const todaysLogs = logs.filter(log => new Date(log.date).setHours(0, 0, 0, 0) === today);

    return todaysLogs.reduce((acc, log) => ({
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

  // ✅ Fetch nutrition data and diet recommendations on component mount or when the user changes
  useEffect(() => {
    if (!isAuthenticated || !userId) return;

    const fetchInitialData = async () => {
      setIsLoading(true);
      try {
        // Get date range for last 7 days
        const endDate = new Date().toISOString();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 7);

        // Fetch nutrition logs (paginated) and stats in parallel
        const [logsResponse, statsResponse] = await Promise.all([
          getNutritionData({ page: 1, limit: 50, startDate: startDate.toISOString(), endDate }),
          getNutritionStats('daily', startDate.toISOString(), endDate)
        ]);

        // Update logs and pagination state
        setNutritionData(logsResponse);
        setMealLogs(logsResponse.data || []);
        setHasMoreLogs(logsResponse.pagination?.hasMore || false);
        setCurrentPage(1);

        // Calculate today's stats from the logs
        setTodayStats(calculateTodayStats(logsResponse.data || []));

        // Store weekly stats for charts
        setWeeklyStats(statsResponse.data || []);

        setError(null);
      } catch (err) {
        Logger.error('Error fetching nutrition data:', err);
        setError('Failed to load nutrition data');
      } finally {
        setIsLoading(false);
      }

      // Separate try-catch for recommendations
      try {
        const recommendations = await DietRecommendationService.getDietRecommendations();
        setDietRecommendations(recommendations);
      } catch (err) {
        Logger.error('Error fetching diet recommendations:', err);
      }
    };

    fetchInitialData();

    // Subscribe to diet recommendation updates
    const handleDietUpdate = (newRecommendations) => {
      Logger.info('Received new diet recommendations:', newRecommendations);
      setDietRecommendations(newRecommendations);
    };

    EventEmitter.on(EventEmitter.Events.DIET_RECOMMENDATIONS_UPDATED, handleDietUpdate);

    // Cleanup subscription
    return () => {
      EventEmitter.off(EventEmitter.Events.DIET_RECOMMENDATIONS_UPDATED, handleDietUpdate);
    };
  }, [isAuthenticated, userId]);

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
        userId: userId,
        date: new Date(),
        mealType: mealData.type,
        foodItems: [mealData.meal],
        calories: mealData.calories,
        macronutrients: mealData.nutrients,
      });

      // Update meal logs
      setMealLogs(prevLogs => [...prevLogs, response]);
      
      // Update today's nutrition data
      setTodayStats(prev => ({
        calories: prev.calories + mealData.calories,
        macronutrients: {
          protein: prev.macronutrients.protein + mealData.nutrients.protein,
          carbohydrates: prev.macronutrients.carbohydrates + mealData.nutrients.carbohydrates,
          fats: prev.macronutrients.fats + mealData.nutrients.fats
        }
      }));

      // Refetch weekly stats to update charts immediately
      const endDate = new Date().toISOString();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);
      const statsResponse = await getNutritionStats('daily', startDate.toISOString(), endDate);
      setWeeklyStats(statsResponse.data || []);

      // Update gamification for nutrition tracking
      await GamificationService.updatePoints('nutrition', {
        calories: mealData.calories,
        macronutrients: mealData.nutrients,
        mealType: mealData.type
      });
      await GamificationService.updateStreak('nutrition');
      await GamificationService.checkAchievements();

      // Emit events for dashboard update using EventEmitter constants
      EventEmitter.emit(EventEmitter.Events.NUTRITION_UPDATED, { meal: mealData });
      EventEmitter.emit(EventEmitter.Events.MEAL_ADDED, { meal: mealData });
      EventEmitter.emit(EventEmitter.Events.GAMIFICATION_UPDATED, { type: 'nutrition' });

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
    setEditFormData({
      meal: meal.foodItems?.join(", ") || "",
      type: meal.mealType || "breakfast",
      calories: meal.calories || 0,
      nutrients: {
        protein: meal.macronutrients?.protein || 0,
        carbohydrates: meal.macronutrients?.carbohydrates || 0,
        fats: meal.macronutrients?.fats || 0
      }
    });
  };

  // ✅ Handle edit form input changes
  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name.startsWith('nutrient.')) {
      const nutrient = name.split('.')[1];
      setEditFormData(prev => ({
        ...prev,
        nutrients: {
          ...prev.nutrients,
          [nutrient]: parseFloat(value) || 0
        }
      }));
    } else {
      setEditFormData(prev => ({
        ...prev,
        [name]: name === 'calories' ? parseFloat(value) || 0 : value
      }));
    }
  };

  // ✅ Cancel edit mode
  const handleCancelEdit = () => {
    setEditMeal(null);
    setEditFormData({
      meal: "",
      type: "",
      calories: 0,
      nutrients: { protein: 0, carbohydrates: 0, fats: 0 }
    });
  };

  // ✅ Function to save an updated meal log
  const handleSaveMealLog = async () => {
    try {
      const oldMeal = editMeal;
      
      const updatedMealData = {
        mealType: editFormData.type,
        foodItems: [editFormData.meal],
        calories: editFormData.calories,
        macronutrients: editFormData.nutrients,
      };

      const updatedLog = await updateNutritionLog(editMeal._id, updatedMealData);

      if (updatedLog) {
        // Update meal logs
        setMealLogs((prevLogs) => prevLogs.map((log) => (log._id === updatedLog._id ? updatedLog : log)));
        
        // Update today's nutrition data by subtracting old values and adding new ones
        setTodayStats(prev => ({
          calories: prev.calories - Number(oldMeal.calories) + Number(editFormData.calories),
          macronutrients: {
            protein: prev.macronutrients.protein - Number(oldMeal.macronutrients?.protein || 0) + Number(editFormData.nutrients.protein),
            carbohydrates: prev.macronutrients.carbohydrates - Number(oldMeal.macronutrients?.carbohydrates || 0) + Number(editFormData.nutrients.carbohydrates),
            fats: prev.macronutrients.fats - Number(oldMeal.macronutrients?.fats || 0) + Number(editFormData.nutrients.fats)
          }
        }));
        
        // Refetch weekly stats to update charts immediately
        const endDate = new Date().toISOString();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 7);
        const statsResponse = await getNutritionStats('daily', startDate.toISOString(), endDate);
        setWeeklyStats(statsResponse.data || []);
        
        // Update gamification for nutrition tracking
        await GamificationService.updatePoints('nutrition', {
          calories: editFormData.calories,
          macronutrients: editFormData.nutrients,
          mealType: editFormData.type
        });
        await GamificationService.updateStreak('nutrition');
        await GamificationService.checkAchievements();
        
        // Emit events for dashboard update using EventEmitter constants
        EventEmitter.emit(EventEmitter.Events.NUTRITION_UPDATED, { meal: updatedLog });
        EventEmitter.emit(EventEmitter.Events.MEAL_UPDATED, { meal: updatedLog });
        EventEmitter.emit(EventEmitter.Events.GAMIFICATION_UPDATED, { type: 'nutrition' });

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
        setTodayStats(prev => ({
          calories: prev.calories - Number(mealToDelete.calories),
          macronutrients: {
            protein: prev.macronutrients.protein - Number(mealToDelete.macronutrients?.protein || 0),
            carbohydrates: prev.macronutrients.carbohydrates - Number(mealToDelete.macronutrients?.carbohydrates || 0),
            fats: prev.macronutrients.fats - Number(mealToDelete.macronutrients?.fats || 0)
          }
        }));
        
        // Refetch weekly stats to update charts immediately
        const endDate = new Date().toISOString();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 7);
        const statsResponse = await getNutritionStats('daily', startDate.toISOString(), endDate);
        setWeeklyStats(statsResponse.data || []);
        
        // Update gamification for nutrition tracking
        await GamificationService.updatePoints('nutrition', {
          calories: -mealToDelete.calories,
          macronutrients: mealToDelete.macronutrients,
          mealType: mealToDelete.mealType
        });
        await GamificationService.updateStreak('nutrition');
        await GamificationService.checkAchievements();
        
        // Emit events for dashboard update using EventEmitter constants
        EventEmitter.emit(EventEmitter.Events.NUTRITION_UPDATED, { deletedId: id });
        EventEmitter.emit(EventEmitter.Events.MEAL_DELETED, { deletedId: id });
        EventEmitter.emit(EventEmitter.Events.GAMIFICATION_UPDATED, { type: 'nutrition' });
        
        notifySuccess('Meal deleted successfully! 🗑️');
      }
    } catch (error) {
      Logger.error("Failed to delete meal log:", error);
      notifyError('Failed to delete meal. Please try again.');
    }
  };

  // ✅ Load more logs for pagination
  const handleLoadMore = async () => {
    if (!hasMoreLogs || isLoading) return;
    
    setIsLoading(true);
    try {
      const nextPage = currentPage + 1;
      const endDate = new Date().toISOString();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30); // Load last 30 days on pagination
      
      const response = await getNutritionData({
        page: nextPage,
        limit: 20,
        startDate: startDate.toISOString(),
        endDate
      });
      
      setMealLogs(prev => [...prev, ...(response.data || [])]);
      setCurrentPage(nextPage);
      setHasMoreLogs(response.pagination?.hasMore || false);
    } catch (err) {
      Logger.error('Error loading more logs:', err);
      notifyError('Failed to load more logs');
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ Compute macronutrient distribution for the chart
  const getMacronutrientData = () => {
    const { protein, carbohydrates, fats } = todayStats.macronutrients;
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
      // Use weeklyStats data for categories (reversed to show oldest first)
      categories: weeklyStats.slice(-7).map(stat => {
        const date = new Date(stat.date || stat._id);
        return date.toLocaleDateString('en-US', { weekday: 'short' });
      }).reverse(),
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

  // Get today's meals
  const getTodaysMeals = () => {
    const today = new Date().toDateString();
    return mealLogs.filter(log => {
      const logDate = new Date(log.date);
      return logDate.toDateString() === today;
    });
  };

  return (
    <div className="page-container">
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
          {getTodaysMeals().length > 0 ? (
            <>
              <div className="meal-logs-header">
                <div className="meal-log-item">
                  <span className="meal-name">Meal</span>
                  <span className="meal-type">Type</span>
                  <span className="meal-calories">Calories</span>
                  <span className="meal-actions-header">Actions</span>
                </div>
              </div>
              <ul className="meal-logs-list">
                {getTodaysMeals()
                  .sort((a, b) => new Date(b.date) - new Date(a.date))
                  .map((log) => (
                    <li key={log._id} className="meal-log-item">
                      {editMeal && editMeal._id === log._id ? (
                        // Edit mode
                        <>
                          <span className="meal-name">
                            <input
                              type="text"
                              name="meal"
                              value={editFormData.meal}
                              onChange={handleEditInputChange}
                              placeholder="Meal name"
                            />
                          </span>
                          <span className="meal-type">
                            <select
                              name="type"
                              value={editFormData.type}
                              onChange={handleEditInputChange}
                            >
                              <option value="breakfast">Breakfast</option>
                              <option value="lunch">Lunch</option>
                              <option value="dinner">Dinner</option>
                              <option value="snack">Snack</option>
                            </select>
                          </span>
                          <span className="meal-calories">
                            <input
                              type="number"
                              name="calories"
                              value={editFormData.calories}
                              onChange={handleEditInputChange}
                              min="0"
                            /> kcal
                          </span>
                          <div className="meal-actions">
                            <button onClick={handleSaveMealLog} className="save-btn">Save</button>
                            <button onClick={handleCancelEdit} className="cancel-btn">Cancel</button>
                          </div>
                        </>
                      ) : (
                        // View mode
                        <>
                          <span className="meal-name">{log.foodItems?.join(", ") || "N/A"}</span>
                          <span className="meal-type">{log.mealType || "N/A"}</span>
                          <span className="meal-calories">{log.calories} kcal</span>
                          <div className="meal-actions">
                            <button onClick={() => handleEditMealLog(log)} className="edit-btn">Edit</button>
                            <button onClick={() => handleDeleteMealLog(log._id)} className="delete-btn">Delete</button>
                          </div>
                        </>
                      )}
                    </li>
                  ))}
              </ul>
              <div className="todays-total">
                <p>Total Calories Today: {todayStats.calories} kcal</p>
                <p className="macros-total">
                  P: {Math.round(todayStats.macronutrients.protein)}g | 
                  C: {Math.round(todayStats.macronutrients.carbohydrates)}g | 
                  F: {Math.round(todayStats.macronutrients.fats)}g
                </p>
              </div>
            </>
          ) : (
            <EmptyState
              icon="fa-utensils"
              title="No meals logged today"
              subtitle="Start by adding one above!"
              variant="default"
            />
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
              {mealLogs.length > 0 ? (
                <Chart
                  options={macronutrientChartOptions}
                  series={getMacronutrientData()}
                  type="donut"
                />
              ) : (
                <EmptyState
                  icon="fa-chart-pie"
                  title="Start logging meals to see your macronutrient breakdown"
                  variant="chart"
                />
              )}
            </div>
          </div>

          <div className="chart-section">
            <h2>Weekly Calorie Intake</h2>
            <div className="chart-container">
              {weeklyStats.length > 0 ? (
                <Chart
                  options={calorieChartOptions}
                  series={[{
                    name: 'Calories',
                    // Use API stats data (reversed to show oldest first)
                    data: weeklyStats.slice(-7).map(stat => stat.totalCalories || 0).reverse()
                  }]}
                  type="bar"
                />
              ) : (
                <EmptyState
                  icon="fa-chart-bar"
                  title="Add meals to track your weekly calorie trends"
                  variant="chart"
                />
              )}
            </div>
          </div>

          <div className="chart-section">
            <h2>Meal Type Distribution</h2>
            <div className="chart-container">
              {mealLogs.length > 0 ? (
                <Chart
                  options={mealTypeData.options}
                  series={mealTypeData.series}
                  type="radar"
                />
              ) : (
                <EmptyState
                  icon="fa-chart-radar"
                  title="Log different meal types to see your distribution"
                  variant="chart"
                />
              )}
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
              {mealLogs.length > 0 ? (
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
                      // Use weeklyStats for categories
                      categories: weeklyStats.slice(-7).map((stat, idx, arr) => {
                        const date = new Date(stat.date || stat._id);
                        return idx === arr.length - 1 ? 'Today' : date.toLocaleDateString('en-US', { weekday: 'short' });
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
                    // Use weeklyStats API data
                    data: weeklyStats.slice(-7).map(stat => stat.totalCalories || 0)
                  }]}
                  type="area"
                />
              ) : (
                <EmptyState
                  icon="fa-chart-area"
                  title="Log meals to see your weekly calorie trend"
                  variant="chart"
                />
              )}
            </div>

            {/* Weekly Macronutrient Distribution */}
            <div className="weekly-chart">
              <h3>Macronutrient Distribution</h3>
              {weeklyStats.length > 0 ? (
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
                      categories: weeklyStats.slice(-7).map(stat => {
                        const date = new Date(stat.date || stat._id);
                        return date.toLocaleDateString('en-US', { weekday: 'short' });
                      }),
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
                      data: weeklyStats.slice(-7).map(stat => stat.totalProtein || 0)
                    },
                    {
                      name: 'Carbs',
                      data: weeklyStats.slice(-7).map(stat => stat.totalCarbs || 0)
                    },
                    {
                      name: 'Fats',
                      data: weeklyStats.slice(-7).map(stat => stat.totalFats || 0)
                    }
                  ]}
                  type="bar"
                />
              ) : (
                <div className="chart-empty-state weekly-empty">
                  <i className="fas fa-chart-bar"></i>
                  <p>Track macros to see your weekly distribution</p>
                </div>
              )}
            </div>

            {/* Weekly Summary Cards */}
            <div className="weekly-summary">
              <div className="summary-card">
                <h4>Weekly Average</h4>
                <div className="summary-stats">
                  <div className="stat">
                    <span className="label">Calories</span>
                    <span className="value">
                      {weeklyStats.length > 0 
                        ? Math.round(weeklyStats.slice(-7).reduce((acc, stat) => acc + (stat.totalCalories || 0), 0) / weeklyStats.slice(-7).length)
                        : 0}
                    </span>
                    <span className="unit">kcal/day</span>
                  </div>
                  <div className="stat">
                    <span className="label">Protein</span>
                    <span className="value">
                      {weeklyStats.length > 0
                        ? Math.round(weeklyStats.slice(-7).reduce((acc, stat) => acc + (stat.totalProtein || 0), 0) / weeklyStats.slice(-7).length)
                        : 0}
                    </span>
                    <span className="unit">g/day</span>
                  </div>
                  <div className="stat">
                    <span className="label">Days Logged</span>
                    <span className="value">
                      {weeklyStats.filter(stat => (stat.totalCalories || 0) > 0).length}
                    </span>
                    <span className="unit">/ 7 days</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Meal Logs Section */}
        <div className="nutrition-section meal-logs">
          <h2>
            Recent Meal Logs
            {nutritionData.pagination?.total > 0 && (
              <span className="log-count">({nutritionData.pagination.total} total)</span>
            )}
            {isLoading && <SectionLoader />}
          </h2>
          {isLoading ? (
            <SectionLoader />
          ) : mealLogs.length > 0 ? (
            <>
              <div className="meal-logs-header">
                <div className="meal-log-item">
                  <span className="meal-name">Date & Meal</span>
                  <span className="meal-type">Type</span>
                  <span className="meal-calories">Calories</span>
                  <span className="meal-actions-header">Actions</span>
                </div>
              </div>
              <ul className="meal-logs-list">
                {[...mealLogs]
                  .sort((a, b) => new Date(b.date) - new Date(a.date))
                  .slice(0, 10) // Show only last 10 meals
                  .map((log) => {
                    const logDate = new Date(log.date);
                    const isToday = logDate.toDateString() === new Date().toDateString();
                    return (
                      <li key={log._id} className="meal-log-item">
                        {editMeal && editMeal._id === log._id ? (
                          // Edit mode for recent meals
                          <>
                            <span className="meal-name">
                              <input
                                type="text"
                                name="meal"
                                value={editFormData.meal}
                                onChange={handleEditInputChange}
                                placeholder="Meal name"
                              />
                            </span>
                            <span className="meal-type">
                              <select
                                name="type"
                                value={editFormData.type}
                                onChange={handleEditInputChange}
                              >
                                <option value="breakfast">Breakfast</option>
                                <option value="lunch">Lunch</option>
                                <option value="dinner">Dinner</option>
                                <option value="snack">Snack</option>
                              </select>
                            </span>
                            <span className="meal-calories">
                              <input
                                type="number"
                                name="calories"
                                value={editFormData.calories}
                                onChange={handleEditInputChange}
                                min="0"
                              /> kcal
                            </span>
                            <div className="meal-actions">
                              <button onClick={handleSaveMealLog} className="save-btn">Save</button>
                              <button onClick={handleCancelEdit} className="cancel-btn">Cancel</button>
                            </div>
                          </>
                        ) : (
                          // View mode for recent meals
                          <>
                            <span className="meal-name">
                              {isToday ? "Today" : logDate.toLocaleDateString('en-US', { 
                                month: 'short', 
                                day: 'numeric' 
                              })} - {log.foodItems?.join(", ") || "N/A"}
                            </span>
                            <span className="meal-type">{log.mealType || "N/A"}</span>
                            <span className="meal-calories">{log.calories} kcal</span>
                            <div className="meal-actions">
                              <button onClick={() => handleEditMealLog(log)} className="edit-btn">Edit</button>
                              <button onClick={() => handleDeleteMealLog(log._id)} className="delete-btn">Delete</button>
                            </div>
                          </>
                        )}
                      </li>
                    );
                  })}
              </ul>
              {/* Load More Button */}
              {hasMoreLogs && (
                <div className="load-more-container">
                  <button 
                    onClick={handleLoadMore} 
                    className="load-more-btn"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Loading...' : 'Load More Logs'}
                  </button>
                </div>
              )}
            </>
          ) : (
            <p>No meal logs yet. Start by adding one!</p>
          )}
        </div>
      </div>
    </div>
    </div>
  );
};

export default Nutrition;