import React, { useState, useCallback, useMemo } from "react";
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

  const daysInMonth = useMemo(() => new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 0).getDate(), [selectedMonth]);
  const firstDayOffset = useMemo(() => new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 1).getDay(), [selectedMonth]);

  const handleDateChange = useCallback((date) => setSelectedMonth(date), []);

  const getWeekOfMonth = useCallback((day) => Math.floor((day - 1 + firstDayOffset) / 7), [firstDayOffset]);
  
  const getMonthKey = (date) => {
	  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
	};
  const currentMonthMeals = meals[getMonthKey(selectedMonth)] || {};
  
  const handleDishAssign = useCallback((dishName) => {
  if (!dishName || selectedDay === null) return;
  
  const monthKey = getMonthKey(selectedMonth);

  setMeals((prev) => {
    const updatedMonthMeals = { ...(prev[monthKey] || {}) };
	
  if (updatedMonthMeals[selectedDay]?.includes(dishName)) {
     alert("This dish is already assigned for this day!");
      return prev;
    }

  if (meals[selectedDay]?.includes(dishName)) {
    alert("This dish is already assigned for this day!");
    return;
  }

    const week = getWeekOfMonth(selectedDay);
    const weeklyMeals = Object.keys(meals)
    .filter(day => getWeekOfMonth(day) === week)
    .map(day => updatedMonthMeals[day] || [])
    .flat();

    if (weeklyMeals.includes(dishName)) {
      alert("This dish is already assigned for this week!");
      return;
    }
	

   // Assign the dish
updatedMonthMeals[selectedDay] = [...(updatedMonthMeals[selectedDay] || []), dishName];

    return {
      ...prev,
      [monthKey]: updatedMonthMeals
    };
  });
  
  setIsModalOpen(false);
  
  }, [selectedDay, selectedMonth, meals, getWeekOfMonth]);

  const removeDish = (day, dishName) => {
    setMeals((prev) => {
      const updatedMeals = { ...prev };
      updatedMeals[day] = updatedMeals[day].filter(dish => dish !== dishName);
      if (updatedMeals[day].length === 0) delete updatedMeals[day];
      return updatedMeals;
    });
  };

  const editDish = (index) => {
    const name = prompt("Edit dish name:", dishes[index].name);
    if (!name) return;
    const ingredients = prompt("Edit ingredients (comma separated):", dishes[index].ingredients.join(", "));
    if (!ingredients) return;
    const category = prompt("Edit category (Protein, Vegetables, Mixed):", dishes[index].category);
	if (!category || !categories.includes(category)) return alert("Invalid category");

    
    setDishes((prev) => {
      const updatedDishes = [...prev];
      updatedDishes[index] = { name, ingredients: ingredients.split(",").map(i => i.trim()), category };
      return updatedDishes;
    });
  };

  const deleteDish = (index) => {
    setDishes((prev) => prev.filter((_, i) => i !== index));
  };
  
  const openModal = useCallback((day) => {
    setSelectedDay(day);
    setIsModalOpen(true);
  }, []);


  const handleAddDish = () => {
    const name = prompt("Enter the name of the dish:");
    if (!name) return;
    const ingredients = prompt("Enter ingredients (comma separated):");
    if (!ingredients) return;
    const category = prompt("Enter category (Protein, Vegetables, Mixed):");
    if (!categories.includes(category)) return alert("Invalid category");
    setDishes((prev) => [...prev, { name, ingredients: ingredients.split(",").map(i => i.trim()), category }]);
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
      if (setData === setMeals && typeof data !== "object") {
        alert("Invalid meal file format");
        return;
      }
      if (setData === setDishes && !Array.isArray(data)) {
        alert("Invalid dish file format");
        return;
      }
      setData(data);
    } catch (error) {
      alert("Invalid file format");
    }
  };
  reader.readAsText(file);
};

  const [isDishListVisible, setIsDishListVisible] = useState(true);


  const exportIngredients = () => {
    const usedDishes = Object.values(meals).flat();
    const ingredients = dishes
      .filter(dish => usedDishes.includes(dish.name))
      .map(dish => dish.ingredients)
      .flat();
    exportToFile("ingredients.json", Array.from(new Set(ingredients)));
  };


  return (
  
    <motion.div className="p-6 text-center bg-black min-h-screen">
      <h1 className="text-3xl font-bold text-orange-600">Monthly Meal Planner</h1>
      <div className="flex justify-center my-2">
        <DatePicker selected={selectedMonth} onChange={handleDateChange} className="border p-1 rounded-full text-center text-orange-500 text-bold" showMonthYearPicker  dateFormat="MMMM yyyy" />
      </div>
	  
	  {/* Buttons */}
	  <motion.div className="flex justify-center mt-2 space-x-2 py-2">
	  
		<button onClick={() => exportToFile("meals.json", meals)} className="bg-orange-500 text-white px-4 py-2 rounded-full hover:bg-orange-700">Export Meals</button>
        <button onClick={() => exportToFile("dishes.json", dishes)} className="bg-orange-400 text-white px-4 py-2 rounded-full hover:bg-orange-600">Export Dishes</button>
	    <input type="file" onChange={(e) => importFromFile(e, setMeals)} hidden id="importMeals" />
        <button onClick={() => document.getElementById("importMeals").click()} className="bg-orange-500 text-white px-4 py-2 rounded-full hover:bg-orange-700">Import Meals</button>
        <input type="file" onChange={(e) => importFromFile(e, setDishes)} hidden id="importDishes" />
        <button onClick={() => document.getElementById("importDishes").click()} className="bg-orange-400 text-white px-4 py-2 rounded-full hover:bg-orange-600">Import Dishes</button>
      </motion.div>	
	  
 {/* Weekday Headers */}
		<div className="grid grid-cols-7 gap-2 bg-orange-300 text-white font-bold py-2 my-1 rounded">
			  {["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].map((day, index) => (
				<div key={index} className="text-center">{day}</div>
			  ))}
		</div>
		  {/* Calendar Grid */}
      <motion.div className="grid grid-cols-7 gap-2 bg-orange-200 hover:bg-orange-100 p-4 rounded-lg shadow-lg">
        {[...Array(firstDayOffset)].map((_, index) => <div key={index} className="h-24"></div>)}
        {[...Array(daysInMonth)].map((_, index) => (
          <motion.div key={index + 1} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
		  

		  

		<div className="h-24 cursor-pointer hover:bg-orange-200 border rounded-lg flex flex-col justify-center items-center border-orange-500 border-2" onClick={() => openModal(index + 1)}>
              <p className="text-lg font-semibold">{index + 1}</p>
              <div className="text-sm text-orange-500 mt-1 font-bold">
                {(currentMonthMeals[index + 1] || []).map((dish, i) => (
                  <div key={i} className="flex justify-between items-center">
                    <span>{dish}</span>
                    <button className="flex justify-between items-center ml-1 text-red-500 font-bold" onClick={(e) => {e.stopPropagation() ;removeDish(index + 1, dish)}}>X</button>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>
	  
	  <button
  onClick={() => setIsDishListVisible((prev) => !prev)}
  className="bg-orange-500 text-white px-4 py-2 rounded-full hover:bg-orange-600 my-2"
>
  {isDishListVisible ? "Hide Dishes" : "Show Dishes"}
</button>

	  
{/* Dish List */}
<motion.div
  initial={{ opacity: 0, height: 0 }}
  animate={{ opacity: isDishListVisible ? 1 : 0, height: isDishListVisible ? "auto" : 0 }}
  transition={{ duration: 0.3 }}
  className="overflow-hidden"
>
  {dishes.map((dish, index) => (
    <div key={index} className="flex justify-between items-center bg-white p-2 rounded shadow mb-2">
      <span>{dish.name} ({dish.category})</span>
      <div>
        <button className="text-blue-500 mr-2" onClick={() => editDish(index)}>Edit</button>
        <button className="text-red-500" onClick={() => deleteDish(index)}>Delete</button>
      </div>
    </div>
  ))}
</motion.div>
		
		{/* Add Dish Buttons */}
      <motion.div className="flex justify-center mt-1 space-x-2">
        <button onClick={handleAddDish} className="bg-orange-500 text-white px-4 py-2 rounded-full hover:bg-orange-600">Add Dish</button>
		<button onClick={exportIngredients} className="bg-orange-500 text-white px-4 py-2 rounded-full hover:bg-orange-600">Export Ingredients</button>
		
      </motion.div>
	  {/* Dish Assignment Modal */}
{isModalOpen && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <h2 className="text-lg font-bold mb-4">Assign Dish to Day {selectedDay}</h2>
      {dishes.length === 0 ? (
        <p className="text-gray-500">No dishes available. Add some first!</p>
      ) : (
        dishes.map((dish, index) => (
          <button
            key={index}
            onClick={() => handleDishAssign(dish.name)}
            className="block w-full text-left p-2 hover:bg-gray-200 border rounded-md my-1"
          >
            {dish.name}
          </button>
        ))
      )}
      <button
        onClick={() => setIsModalOpen(false)}
        className="mt-4 bg-red-500 text-white px-4 py-2 rounded"
      >
        Close
      </button>
    </div>
  </div>
)}

    </motion.div>
  );
}