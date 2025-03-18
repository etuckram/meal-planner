import React, { useState } from "react";
import { motion } from "framer-motion";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

export default function MealPlanner() {
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [meals, setMeals] = useState({});
  const [dishes, setDishes] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState(null);
  const categories = ["Protein", "Vegetables", "Mixed"];

  const getDaysInMonth = (date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const getFirstDayOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();

  const handleDateChange = (date) => setSelectedMonth(date);

  const handleDishAssign = (dishName) => {
    if (dishName && selectedDay !== null) {
      setMeals((prev) => ({
        ...prev,
        [selectedDay]: [...(prev[selectedDay] || []), dishName],
      }));
    }
    setIsModalOpen(false);
  };

  const openModal = (day) => {
    setSelectedDay(day);
    setIsModalOpen(true);
  };

  const handleAddDish = () => {
    const name = prompt("Enter the name of the dish:");
    if (!name) return;
    const ingredients = prompt("Enter ingredients (comma separated):");
    if (!ingredients) return;
    const category = prompt("Enter category (Protein, Vegetables, Mixed):");
    if (!categories.includes(category)) return alert("Invalid category");
    setDishes([...dishes, { name, ingredients: ingredients.split(",").map(i => i.trim()), category }]);
  };

  const exportToFile = (filename, data) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
  };

  const importFromFile = (event, setData) => {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        setData(data);
      } catch (error) {
        alert("Invalid file format");
      }
    };
    reader.readAsText(file);
  };

  const generateGroceryList = () => {
    let groceryList = "Ingredients List:\n";
    const ingredients = {};
    Object.values(meals).flat().forEach(dishName => {
      const dish = dishes.find(d => d.name === dishName);
      if (dish) {
        dish.ingredients.forEach(ingredient => {
          ingredients[ingredient] = (ingredients[ingredient] || 0) + 1;
        });
      }
    });
    groceryList += Object.entries(ingredients).map(([ingredient, count]) => `${ingredient} x${count}`).join("\n");
    const blob = new Blob([groceryList], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "grocery_list.txt";
    a.click();
  };

  return (
    <motion.div
      className="p-6 text-center bg-orange-100 min-h-screen"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
    >
      <h1 className="text-3xl font-bold text-orange-600 drop-shadow-md">
        Monthly Meal Planner
      </h1>
      <div className="flex justify-center my-4">
        <DatePicker
          selected={selectedMonth}
          onChange={handleDateChange}
          className="border p-2 rounded"
          dateFormat="MMMM yyyy"
          showMonthYearPicker
        />
      </div>

      {/* Calendar Grid */}
      <motion.div
        className="grid grid-cols-7 gap-2 bg-white p-4 rounded-lg shadow-lg"
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        {[...Array(getFirstDayOfMonth(selectedMonth))].map((_, index) => (
          <div key={`empty-${index}`} className="h-24"></div>
        ))}
        {[...Array(getDaysInMonth(selectedMonth))].map((_, index) => (
          <motion.div
            key={`day-${index + 1}`}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <div
              className="h-24 cursor-pointer hover:bg-orange-200 transition duration-300 ease-in-out border rounded-lg flex flex-col justify-center items-center relative"
              onClick={() => openModal(index + 1)}
            >
              <p className="text-lg font-semibold">{index + 1}</p>
              <div className="text-sm text-gray-600 mt-1">
                {Array.isArray(meals[index + 1]) ? meals[index + 1].map((dish, i) => (
				<p key={i}>{dish}</p>
					)) : null}
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Dish Selection Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
          <div className="bg-white p-6 rounded shadow-lg w-80">
            <h2 className="text-xl font-bold mb-4">Select a Dish</h2>
            {dishes.length > 0 ? (
              dishes.map((dish, i) => (
                <button
                  key={i}
                  className="block w-full text-left p-2 border-b hover:bg-gray-200"
                  onClick={() => handleDishAssign(dish.name)}
                >
                  {dish.name} ({dish.category})
                </button>
              ))
            ) : (
              <p>No dishes available</p>
            )}
            <button
              className="mt-4 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Buttons */}
      <motion.div
        className="flex justify-center mt-4 space-x-4"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <button onClick={handleAddDish} className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-all">Add Dish</button>
        <button onClick={generateGroceryList} className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-all">Generate Grocery List</button>
        <button onClick={() => exportToFile("meals.json", meals)} className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-all">Export Meals</button>
        <input type="file" onChange={(e) => importFromFile(e, setMeals)} className="hidden" id="importMeals" />
        <button onClick={() => document.getElementById("importMeals").click()} className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-all">Import Meals</button>
        <button onClick={() => exportToFile("dishes.json", dishes)} className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-all">Export Dishes</button>
        <input type="file" onChange={(e) => importFromFile(e, setDishes)} className="hidden" id="importDishes" />
        <button onClick={() => document.getElementById("importDishes").click()} className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-all">Import Dishes</button>
      </motion.div>
    </motion.div>
  );
}
