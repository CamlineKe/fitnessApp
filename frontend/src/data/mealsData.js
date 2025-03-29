// mealsData.js - Common Kenyan meals with nutrition information
// This file contains a database of common Kenyan meals with their nutritional values
// Each meal includes name, calories, carbs, proteins, and fats
// Organized by meal type: breakfast, lunch, snack, dinner

const mealsData = [
  // Breakfast Meals
  {
    name: "Milk Tea with Mandazi",
    type: "breakfast",
    calories: 350,
    nutrients: { carbohydrates: 50, protein: 6, fats: 12 }
  },
  {
    name: "Millet Porridge with Honey",
    type: "breakfast",
    calories: 280,
    nutrients: { carbohydrates: 45, protein: 8, fats: 4 }
  },
  {
    name: "Chapati with Fried Eggs",
    type: "breakfast",
    calories: 450,
    nutrients: { carbohydrates: 55, protein: 18, fats: 15 }
  },
  {
    name: "Arrowroots with Peanut Butter",
    type: "breakfast",
    calories: 300,
    nutrients: { carbohydrates: 60, protein: 6, fats: 8 }
  },
  {
    name: "Light Boiled Maize & Beans (Breakfast Githeri)",
    type: "breakfast",
    calories: 400,
    nutrients: { carbohydrates: 65, protein: 20, fats: 10 }
  },
  {
    name: "Swahili Coconut Buns (Mahamri) with Milk",
    type: "breakfast",
    calories: 500,
    nutrients: { carbohydrates: 70, protein: 10, fats: 15 }
  },
  {
    name: "Sweet Potatoes with Black Tea",
    type: "breakfast",
    calories: 320,
    nutrients: { carbohydrates: 55, protein: 5, fats: 2 }
  },
  {
    name: "Bread with Blue Band and Black Tea",
    type: "breakfast",
    calories: 370,
    nutrients: { carbohydrates: 50, protein: 8, fats: 10 }
  },
  {
    name: "Weetabix with Warm Milk",
    type: "breakfast",
    calories: 290,
    nutrients: { carbohydrates: 45, protein: 12, fats: 6 }
  },
  {
    name: "Omelette with Toasted Bread",
    type: "breakfast",
    calories: 380,
    nutrients: { carbohydrates: 40, protein: 22, fats: 14 }
  },
  {
    name: "Rice with Fried Beans",
    type: "breakfast",
    calories: 450,
    nutrients: { carbohydrates: 65, protein: 15, fats: 10 }
  },
  {
    name: "Boiled Green Bananas with Tea",
    type: "breakfast",
    calories: 300,
    nutrients: { carbohydrates: 50, protein: 4, fats: 2 }
  },
  {
    name: "Ugali with Fried Eggs",
    type: "breakfast",
    calories: 420,
    nutrients: { carbohydrates: 55, protein: 20, fats: 12 }
  },
  {
    name: "Pancakes with Honey and Tea",
    type: "breakfast",
    calories: 380,
    nutrients: { carbohydrates: 60, protein: 10, fats: 8 }
  },
  {
    name: "Scrambled Eggs with Chapati and Tea",
    type: "breakfast",
    calories: 460,
    nutrients: { carbohydrates: 50, protein: 22, fats: 18 }
  },
  // New breakfast meals
  {
    name: "Uji (Fermented Porridge) with Groundnuts",
    type: "breakfast",
    calories: 310,
    nutrients: { carbohydrates: 48, protein: 9, fats: 7 }
  },
  {
    name: "Boiled Cassava with Tea",
    type: "breakfast",
    calories: 330,
    nutrients: { carbohydrates: 58, protein: 3, fats: 1 }
  },
  {
    name: "Viazi Karai (Fried Potatoes) with Tea",
    type: "breakfast",
    calories: 420,
    nutrients: { carbohydrates: 65, protein: 7, fats: 14 }
  },
  {
    name: "Nduma na Mayai (Arrowroot with Eggs)",
    type: "breakfast",
    calories: 380,
    nutrients: { carbohydrates: 52, protein: 16, fats: 10 }
  },
  {
    name: "Mango and Yogurt with Granola",
    type: "breakfast",
    calories: 340,
    nutrients: { carbohydrates: 55, protein: 10, fats: 8 }
  },

  // Lunch Meals
  {
    name: "Ugali with Sukuma Wiki and Beef Stew",
    type: "lunch",
    calories: 550,
    nutrients: { carbohydrates: 60, protein: 35, fats: 12 }
  },
  {
    name: "Rice with Fried Beans",
    type: "lunch",
    calories: 500,
    nutrients: { carbohydrates: 70, protein: 25, fats: 10 }
  },
  {
    name: "Githeri (Maize & Beans) with Avocado",
    type: "lunch",
    calories: 480,
    nutrients: { carbohydrates: 75, protein: 22, fats: 15 }
  },
  {
    name: "Pilau with Kachumbari",
    type: "lunch",
    calories: 600,
    nutrients: { carbohydrates: 80, protein: 25, fats: 18 }
  },
  {
    name: "Chapati with Ndengu (Green Grams)",
    type: "lunch",
    calories: 450,
    nutrients: { carbohydrates: 65, protein: 20, fats: 12 }
  },
  {
    name: "Matoke (Fried Bananas) with Peas",
    type: "lunch",
    calories: 430,
    nutrients: { carbohydrates: 70, protein: 18, fats: 10 }
  },
  {
    name: "Mukimo with Beef Stew",
    type: "lunch",
    calories: 550,
    nutrients: { carbohydrates: 65, protein: 30, fats: 15 }
  },
  {
    name: "Fried Fish with Ugali and Greens",
    type: "lunch",
    calories: 600,
    nutrients: { carbohydrates: 55, protein: 40, fats: 20 }
  },
  {
    name: "Rice with Chicken Stew",
    type: "lunch",
    calories: 550,
    nutrients: { carbohydrates: 70, protein: 35, fats: 15 }
  },
  {
    name: "Ugali with Omena (Silverfish) and Greens",
    type: "lunch",
    calories: 500,
    nutrients: { carbohydrates: 60, protein: 30, fats: 12 }
  },
  {
    name: "Nyama Choma with Ugali and Kachumbari",
    type: "lunch",
    calories: 650,
    nutrients: { carbohydrates: 55, protein: 45, fats: 20 }
  },
  {
    name: "Spaghetti with Minced Meat",
    type: "lunch",
    calories: 550,
    nutrients: { carbohydrates: 75, protein: 30, fats: 15 }
  },
  {
    name: "Irio (Mashed Peas, Corn, and Potatoes) with Stew",
    type: "lunch",
    calories: 500,
    nutrients: { carbohydrates: 65, protein: 25, fats: 12 }
  },
  {
    name: "Coconut Rice with Fish Stew",
    type: "lunch",
    calories: 600,
    nutrients: { carbohydrates: 80, protein: 30, fats: 18 }
  },
  {
    name: "Beans and Chapati",
    type: "lunch",
    calories: 520,
    nutrients: { carbohydrates: 70, protein: 25, fats: 12 }
  },
  // New lunch meals
  {
    name: "Mchicha (Amaranth) with Ugali and Fish",
    type: "lunch",
    calories: 520,
    nutrients: { carbohydrates: 58, protein: 38, fats: 14 }
  },
  {
    name: "Maharagwe ya Nazi (Coconut Beans) with Rice",
    type: "lunch",
    calories: 580,
    nutrients: { carbohydrates: 78, protein: 22, fats: 16 }
  },
  {
    name: "Mtori (Banana and Beef Soup) with Chapati",
    type: "lunch",
    calories: 490,
    nutrients: { carbohydrates: 62, protein: 28, fats: 13 }
  },
  {
    name: "Bhajia with Coconut Rice and Kachumbari",
    type: "lunch",
    calories: 570,
    nutrients: { carbohydrates: 85, protein: 15, fats: 18 }
  },
  {
    name: "Kunde (Cowpeas) with Ugali and Grilled Chicken",
    type: "lunch",
    calories: 590,
    nutrients: { carbohydrates: 65, protein: 42, fats: 16 }
  },

  // Snack Meals
  {
    name: "Roasted Maize (Mahindi Choma)",
    type: "snack",
    calories: 250,
    nutrients: { carbohydrates: 45, protein: 6, fats: 3 }
  },
  {
    name: "Samosa with Tea",
    type: "snack",
    calories: 300,
    nutrients: { carbohydrates: 40, protein: 8, fats: 10 }
  },
  {
    name: "Bhajia (Spiced Potatoes)",
    type: "snack",
    calories: 350,
    nutrients: { carbohydrates: 55, protein: 6, fats: 12 }
  },
  {
    name: "Roasted Groundnuts (Peanuts)",
    type: "snack",
    calories: 280,
    nutrients: { carbohydrates: 20, protein: 12, fats: 18 }
  },
  {
    name: "Boiled Sweet Potatoes",
    type: "snack",
    calories: 220,
    nutrients: { carbohydrates: 50, protein: 5, fats: 1 }
  },
  {
    name: "Chapati with Honey",
    type: "snack",
    calories: 400,
    nutrients: { carbohydrates: 65, protein: 10, fats: 10 }
  },
  {
    name: "Fruits (Banana, Mango, Watermelon)",
    type: "snack",
    calories: 180,
    nutrients: { carbohydrates: 45, protein: 3, fats: 1 }
  },
  {
    name: "Fried Cassava with Chilli",
    type: "snack",
    calories: 300,
    nutrients: { carbohydrates: 50, protein: 4, fats: 8 }
  },
  {
    name: "Kenyan Sausage with Kachumbari",
    type: "snack",
    calories: 320,
    nutrients: { carbohydrates: 10, protein: 20, fats: 25 }
  },
  {
    name: "Boiled Arrowroots (Nduma)",
    type: "snack",
    calories: 250,
    nutrients: { carbohydrates: 55, protein: 4, fats: 2 }
  },
  {
    name: "Yogurt with Nuts",
    type: "snack",
    calories: 350,
    nutrients: { carbohydrates: 40, protein: 15, fats: 10 }
  },
  {
    name: "Bread with Peanut Butter",
    type: "snack",
    calories: 380,
    nutrients: { carbohydrates: 50, protein: 10, fats: 15 }
  },
  {
    name: "Fresh Fruit Juice with Groundnuts",
    type: "snack",
    calories: 280,
    nutrients: { carbohydrates: 55, protein: 6, fats: 8 }
  },
  {
    name: "Boiled Maize with Butter",
    type: "snack",
    calories: 300,
    nutrients: { carbohydrates: 55, protein: 8, fats: 10 }
  },
  {
    name: "Black Tea with Biscuits",
    type: "snack",
    calories: 270,
    nutrients: { carbohydrates: 50, protein: 4, fats: 5 }
  },
  // New snack meals
  {
    name: "Mabuyu (Baobab Seeds)",
    type: "snack",
    calories: 180,
    nutrients: { carbohydrates: 35, protein: 5, fats: 4 }
  },
  {
    name: "Mkate wa Sinia (Swahili Bread)",
    type: "snack",
    calories: 320,
    nutrients: { carbohydrates: 52, protein: 7, fats: 9 }
  },
  {
    name: "Kashata (Coconut Peanut Brittle)",
    type: "snack",
    calories: 290,
    nutrients: { carbohydrates: 32, protein: 8, fats: 16 }
  },
  {
    name: "Kaimati (Sweet Dumplings)",
    type: "snack",
    calories: 310,
    nutrients: { carbohydrates: 48, protein: 5, fats: 11 }
  },
  {
    name: "Masala Chips (Spiced Fries)",
    type: "snack",
    calories: 380,
    nutrients: { carbohydrates: 58, protein: 6, fats: 14 }
  },

  // Dinner Meals
  {
    name: "Ugali with Fried Sukuma Wiki and Eggs",
    type: "dinner",
    calories: 500,
    nutrients: { carbohydrates: 55, protein: 30, fats: 10 }
  },
  {
    name: "Rice with Lentils and Kachumbari",
    type: "dinner",
    calories: 480,
    nutrients: { carbohydrates: 70, protein: 20, fats: 8 }
  },
  {
    name: "Boiled Matoke with Meat Stew",
    type: "dinner",
    calories: 500,
    nutrients: { carbohydrates: 75, protein: 25, fats: 10 }
  },
  {
    name: "Coconut Rice with Grilled Chicken",
    type: "dinner",
    calories: 600,
    nutrients: { carbohydrates: 80, protein: 35, fats: 18 }
  },
  {
    name: "Spaghetti with Tomato Sauce and Minced Meat",
    type: "dinner",
    calories: 550,
    nutrients: { carbohydrates: 75, protein: 30, fats: 15 }
  },
  {
    name: "Mashed Potatoes with Fried Cabbage",
    type: "dinner",
    calories: 450,
    nutrients: { carbohydrates: 65, protein: 15, fats: 8 }
  },
  {
    name: "Tilapia with Ugali and Greens",
    type: "dinner",
    calories: 600,
    nutrients: { carbohydrates: 55, protein: 40, fats: 20 }
  },
  {
    name: "Githeri with Avocado",
    type: "dinner",
    calories: 500,
    nutrients: { carbohydrates: 75, protein: 22, fats: 15 }
  },
  {
    name: "Beans and Chapati",
    type: "dinner",
    calories: 520,
    nutrients: { carbohydrates: 70, protein: 25, fats: 12 }
  },
  {
    name: "Kenyan Beef Stew with Rice",
    type: "dinner",
    calories: 550,
    nutrients: { carbohydrates: 70, protein: 35, fats: 15 }
  },
  {
    name: "Pumpkin Soup with Bread",
    type: "dinner",
    calories: 400,
    nutrients: { carbohydrates: 50, protein: 15, fats: 10 }
  },
  {
    name: "Omena with Ugali and Greens",
    type: "dinner",
    calories: 500,
    nutrients: { carbohydrates: 60, protein: 30, fats: 12 }
  },
  {
    name: "Lentil Stew with Rice",
    type: "dinner",
    calories: 480,
    nutrients: { carbohydrates: 70, protein: 20, fats: 8 }
  },
  {
    name: "Mukimo with Fried Beef",
    type: "dinner",
    calories: 550,
    nutrients: { carbohydrates: 65, protein: 30, fats: 15 }
  },
  {
    name: "Nyama Choma with Ugali and Kachumbari",
    type: "dinner",
    calories: 650,
    nutrients: { carbohydrates: 55, protein: 45, fats: 20 }
  },
  // New dinner meals
  {
    name: "Kamande (Millet) with Beef and Vegetables",
    type: "dinner",
    calories: 520,
    nutrients: { carbohydrates: 60, protein: 32, fats: 14 }
  },
  {
    name: "Mchuzi wa Samaki (Fish Curry) with Rice",
    type: "dinner",
    calories: 580,
    nutrients: { carbohydrates: 72, protein: 38, fats: 16 }
  },
  {
    name: "Kienyeji Chicken with Ugali and Managu",
    type: "dinner",
    calories: 620,
    nutrients: { carbohydrates: 58, protein: 45, fats: 22 }
  },
  {
    name: "Mbaazi za Nazi (Pigeon Peas in Coconut) with Chapati",
    type: "dinner",
    calories: 540,
    nutrients: { carbohydrates: 75, protein: 22, fats: 16 }
  },
  {
    name: "Matumbo (Tripe) Stew with Rice",
    type: "dinner",
    calories: 510,
    nutrients: { carbohydrates: 65, protein: 35, fats: 14 }
  },
  {
    name: "Ugali with Sukuma Wiki",
    type: "dinner",
    calories: 420,
    nutrients: { carbohydrates: 65, protein: 12, fats: 8 }
  },
  {
    name: "Ugali with Sukuma Wiki and Fried Eggs",
    type: "dinner",
    calories: 520,
    nutrients: { carbohydrates: 65, protein: 24, fats: 16 }
  },
  {
    name: "Ugali with Sukuma Wiki and Avocado",
    type: "lunch",
    calories: 480,
    nutrients: { carbohydrates: 65, protein: 12, fats: 18 }
  },
  {
    name: "Ugali with Sukuma Wiki and Grilled Tilapia",
    type: "dinner",
    calories: 550,
    nutrients: { carbohydrates: 65, protein: 35, fats: 15 }
  },
  
  // Fusion and Modern Kenyan Meals
  {
    name: "Kenyan Burger (Beef Patty with Kachumbari)",
    type: "lunch",
    calories: 580,
    nutrients: { carbohydrates: 45, protein: 32, fats: 28 }
  },
  {
    name: "Sukuma Wiki Pizza",
    type: "dinner",
    calories: 620,
    nutrients: { carbohydrates: 65, protein: 28, fats: 25 }
  },
  {
    name: "Ugali Fries with Nyama Choma Dip",
    type: "snack",
    calories: 450,
    nutrients: { carbohydrates: 58, protein: 18, fats: 16 }
  },
  {
    name: "Kenyan Vegetable Wrap with Avocado",
    type: "lunch",
    calories: 420,
    nutrients: { carbohydrates: 48, protein: 15, fats: 18 }
  },
  {
    name: "Pilau Risotto with Tilapia",
    type: "dinner",
    calories: 580,
    nutrients: { carbohydrates: 72, protein: 35, fats: 16 }
  },
  
  // Health-Focused Meals
  {
    name: "Quinoa with Kenyan Vegetables",
    type: "lunch",
    calories: 380,
    nutrients: { carbohydrates: 52, protein: 18, fats: 8 }
  },
  {
    name: "Grilled Chicken Salad with Avocado",
    type: "lunch",
    calories: 420,
    nutrients: { carbohydrates: 20, protein: 45, fats: 22 }
  },
  {
    name: "Chia Pudding with Local Fruits",
    type: "breakfast",
    calories: 320,
    nutrients: { carbohydrates: 42, protein: 12, fats: 14 }
  },
  {
    name: "Steamed Fish with Sukuma Wiki and Sweet Potato",
    type: "dinner",
    calories: 450,
    nutrients: { carbohydrates: 40, protein: 48, fats: 12 }
  },
  {
    name: "Protein Smoothie with Baobab Powder",
    type: "snack",
    calories: 280,
    nutrients: { carbohydrates: 35, protein: 24, fats: 8 }
  }
];

export default mealsData;
