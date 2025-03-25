import React, { useState, useCallback, useMemo, useEffect } from "react";
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
  const [selectedDish, setSelectedDish] = useState("");
  const [assignedDish, setAssignedDish] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(null);

  const getTimestamp = () => {
    const now = new Date();
    const MM = String(now.getMonth() + 1).padStart(2, "0"); // Month (01-12)
    const DD = String(now.getDate()).padStart(2, "0"); // Day (01-31)
    const YYYY = now.getFullYear(); // Year (2025)
    const HH = String(now.getHours()).padStart(2, "0"); // Hours (00-23)
    const MIN = String(now.getMinutes()).padStart(2, "0"); // Minutes (00-59)
    const SS = String(now.getSeconds()).padStart(2, "0"); // Seconds (00-59)
  
    return `${MM}${DD}${YYYY}_${HH}${MIN}${SS}`; // Format: MMDDYYYY_HHMMSS
  };
  
  
  
  const daysInMonth = useMemo(
    () =>
      new Date(
        selectedMonth.getFullYear(),
        selectedMonth.getMonth() + 1,
        0
      ).getDate(),
    [selectedMonth]
  );
  const firstDayOffset = useMemo(
    () =>
      new Date(
        selectedMonth.getFullYear(),
        selectedMonth.getMonth(),
        1
      ).getDay(),
    [selectedMonth]
  );

  const handleDateChange = useCallback((date) => setSelectedMonth(date), []);

  const getWeekOfMonth = useCallback(
    (day) => Math.floor((day - 1 + firstDayOffset) / 7),
    [firstDayOffset]
  );

  const getMonthKey = (date) => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
      2,
      "0"
    )}`;
  };
  const currentMonthMeals = meals[getMonthKey(selectedMonth)] || {};

  // Assign Dish for the day
  const handleDishAssign = useCallback(
    (dishName) => {
      if (!dishName || selectedDay === null) return;

      const monthKey = getMonthKey(selectedMonth);

      setMeals((prevMeals) => {
        const updatedMonthMeals = { ...(prevMeals[monthKey] || {}) };

        // Prevent duplicate assignment for the same day
        if (updatedMonthMeals[selectedDay]?.includes(dishName)) {
          alert("This dish is already assigned for this day!");
          return prevMeals;
        }
      // Get all meals in the same week
      const week = getWeekOfMonth(selectedDay);
      const weeklyMeals = Object.keys(updatedMonthMeals) // Iterate over days in the selected month
        .filter((day) => getWeekOfMonth(Number(day)) === week) // Ensure day is treated as a number
        .map((day) => updatedMonthMeals[day] || [])
        .flat();

      // Prevent duplicate assignment for the same week
      if (weeklyMeals.includes(dishName)) {
        alert("This dish is already assigned for this week!");
        return prevMeals;
      }

        // Assign the dish
        updatedMonthMeals[selectedDay] = [
          ...(updatedMonthMeals[selectedDay] || []),
          dishName,
        ];

        const sortedMonthMeals = Object.fromEntries(
          Object.entries(updatedMonthMeals).sort(([dayA], [dayB]) => dayA - dayB)
        );

        return {
          ...prevMeals,
          [monthKey]: sortedMonthMeals,
        };
      });

      setIsModalOpen(false);
    },
    [selectedDay, selectedMonth, meals, getWeekOfMonth]
  );

  const removeDish = (day, dishName) => {
    setMeals((prev) => {
      const monthKey = getMonthKey(selectedMonth);
      const updatedMonthMeals = { ...prev[monthKey] };
  
      if (updatedMonthMeals[day]) {
        updatedMonthMeals[day] = updatedMonthMeals[day].filter(
          (dish) => dish !== dishName
        );
  
        if (updatedMonthMeals[day].length === 0) {
          delete updatedMonthMeals[day];
        }
      }
  
      return {
        ...prev,
        [monthKey]: updatedMonthMeals,
      };
    });
  };

  const editDish = (index) => {
    const name = prompt("Edit dish name:", dishes[index].name);
    if (!name) return;
    const ingredients = prompt(
      "Edit ingredients (comma separated):",
      dishes[index].ingredients.join(", ")
    );
    if (!ingredients) return;
    const category = prompt(
      "Edit category (Protein, Vegetables, Mixed):",
      dishes[index].category
    );
    if (!category || !categories.includes(category))
      return alert("Invalid category");

    setDishes((prev) => {
      const updatedDishes = [...prev];
      updatedDishes[index] = {
        name,
        ingredients: ingredients.split(",").map((i) => i.trim()),
        category,
      };
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

    if (dishes.some(dish => dish.name.toLowerCase() === name.toLowerCase())) {
      alert("This dish already exists!");
      return;
    }

    if (!name) return;
    const ingredients = prompt("Enter ingredients (comma separated):");

    if (!ingredients) return;
    const category = prompt("Enter category (Protein, Vegetables, Mixed):");

    if (!categories.includes(category)) return alert("Invalid category");
    
    setDishes((prev) => [
      ...prev,
      {
        name,
        ingredients: ingredients.split(",").map((i) => i.trim()),
        category,
      },
    ]);
  };

  const exportToFile = (filename, data) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
  };

  const importFromFile = (event, setData, expectedType) => {
    const file = event.target.files[0];
    if (!file) return;

    if (
      !window.confirm(
        `⚠️ Warning: Importing ${expectedType} will override your existing data! 
        Consider exporting first to avoid losing changes. Do you want to continue?`
      )
    ) {
      event.target.value = ""; // Reset file input if the user cancels
      return;
    }
  
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
  
        // Validate the file format
        if (expectedType === "meals" && typeof data !== "object") {
          alert("Invalid meals file format");
          return;
        }
        if (expectedType === "dishes" && !Array.isArray(data)) {
          alert("Invalid dishes file format");
          return;
        }
  
        // Set the state properly
        setData(data); // Directly update the state with parsed JSON data
  
        // Reset file input to allow re-import
        event.target.value = "";
      } catch (error) {
        alert("Invalid file format");
      }
    };
    reader.readAsText(file);
  };
  
  useEffect(() => {
    const timeout = setTimeout(() => {
      localStorage.setItem("meals", JSON.stringify(meals));
    }, 500);
    return () => clearTimeout(timeout);
  }, [meals]);
  
  useEffect(() => {
    const timeout = setTimeout(() => {
      localStorage.setItem("dishes", JSON.stringify(dishes));
    }, 500);
    return () => clearTimeout(timeout);
  }, [dishes]);
  
  
  const [isDishListVisible, setIsDishListVisible] = useState(true);

  const exportIngredients = () => {
    const usedDishes = Object.values(meals)
      .map((monthData) => Object.values(monthData).flat())
      .flat();
  
    const ingredients = dishes
      .filter((dish) => usedDishes.includes(dish.name))
      .map((dish) => dish.ingredients)
      .flat();
  
    if (ingredients.length === 0) {
      alert("No ingredients to export!");
      return;
    }
  
    const uniqueIngredients = Array.from(new Set(ingredients));
  
    // Generate timestamp in MMDDYYYY_HHMMSS format
    const timestamp = new Date().toLocaleString("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }).replace(/[\/,:\s]/g, "").replace(/^(\d{2})(\d{2})(\d{4})/, "$1$2$3_");
  
    // Export file with timestamp
    exportToFile(`ingredients_${timestamp}.json`, uniqueIngredients);
  };
  

  return (
    <motion.div className="p-1 text-center bg-black min-h-screen">
      <h1 className="text-3xl font-bold text-orange-600">
        Monthly Meal Planner
      </h1>
      <div className="flex justify-center my-2">
        <div className="flex justify-center justify-center">
          {/* Previous Month Button */}
          <button
            onClick={() =>
              setSelectedMonth(
                (prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1)
              )
            }
            className="text-xl text-orange-600 hover:text-orange-800 px-1"
          >
            <svg
              className="w-6 h-6 text-gray-800 dark:text-white transform rotate-180"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              fill="orange"
              viewBox="0 0 24 24"
            >
              <path
                fillRule="evenodd"
                d="M3 4a1 1 0 0 0-.822 1.57L6.632 12l-4.454 6.43A1 1 0 0 0 3 20h13.153a1 1 0 0 0 .822-.43l4.847-7a1 1 0 0 0 0-1.14l-4.847-7a1 1 0 0 0-.822-.43H3Z"
                clipRule="evenodd"
              />
            </svg>
          </button>

          {/* Month Picker */}
          <DatePicker
            selected={selectedMonth}
            onChange={handleDateChange}
            className="border p-1 rounded-full text-center text-orange-500 font-bold"
            showMonthYearPicker
            dateFormat="MMMM yyyy"
          />
        </div>

        {/* Next Month Button */}
        <button
          onClick={() =>
            setSelectedMonth(
              (prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1)
            )
          }
          className="text-xl text-orange-600 hover:text-orange-800 px-1"
        >
          <svg
            className="w-6 h-6 text-gray-800 dark:text-white"
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            fill="orange"
            viewBox="0 0 24 24"
          >
            <path
              fillRule="evenodd"
              d="M3 4a1 1 0 0 0-.822 1.57L6.632 12l-4.454 6.43A1 1 0 0 0 3 20h13.153a1 1 0 0 0 .822-.43l4.847-7a1 1 0 0 0 0-1.14l-4.847-7a1 1 0 0 0-.822-.43H3Z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>


      {/* Export Buttons */}
      <motion.div className="flex justify-center space-x-1 p-1">
        
        <button
          onClick={() => exportToFile(`meals_${getTimestamp()}.json`, meals)}
          className="bg-orange-400 text-white px-4 py-2 my-2 rounded-full hover:bg-orange-700"
        >
          Export Meals
        </button>
        <button
          onClick={() => exportToFile(`dishes_${getTimestamp()}.json`, dishes)}
          className="bg-orange-400 text-white px-4 py-2 my-2 rounded-full hover:bg-orange-600"
        >
          Export Dish
        </button>

        {/* Import Buttons */}
        <input
          type="file"
          onChange={(e) => importFromFile(e, setMeals, "meals")}
          hidden
          id="importMeals"
        />
        <button
          onClick={() => document.getElementById("importMeals").click()}
          className="bg-orange-500 text-white px-4 py-2 my-2 rounded-full hover:bg-orange-700"
        >
          ⚠️ Import Meals
        </button>

        <input
          type="file"
          onChange={(e) => importFromFile(e, setDishes, "dishes")}
          hidden
          id="importDishes"
        />
        <button
          onClick={() => document.getElementById("importDishes").click()}
          className="bg-orange-500 text-white px-4 py-2 my-2 rounded-full hover:bg-orange-600"
        >
          ⚠️ Import Dish
        </button>

         {/* Export Ingredients Buttons */}
        <button
          onClick={exportIngredients}
          className="bg-orange-400 text-white px-4 py-2 my-2 rounded-full hover:bg-orange-600"
        >
          Export Ingredients
        </button>
      </motion.div>

      {/* Weekday Headers */}
      <div className="grid grid-cols-7 p-4 gap-2 text-white font-bold py-1 my-1 rounded bg-orange-200">
        {[
          "Sunday",
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
        ].map((day, index) => (
          <div
            key={index}
            className="text-center border-2 border-orange-500 p-2 rounded-lg bg-orange-400"
          >
            {day}
          </div>
        ))}
      </div>
      {/* Calendar Grid */}
      <motion.div className="grid grid-cols-7 gap-2 bg-orange-200 hover:bg-orange-100 p-1 rounded-lg shadow-lg">
        {[...Array(firstDayOffset)].map((_, index) => (
          <div key={index} className="h-24"></div>
        ))}
        {[...Array(daysInMonth)].map((_, index) => (
          <motion.div
            key={index + 1}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <div
              className="h-24 cursor-pointer hover:bg-orange-200 border rounded-lg flex flex-col justify-center items-center border-orange-500 border-2"
              onClick={() => openModal(index + 1)}
            >
              <p className="text-lg font-semibold">{index + 1}</p>
              <div className="text-sm text-orange-500 font-bold">
                {(currentMonthMeals[index + 1] || []).map((dish, i) => (
                  <div key={i} className="">
                    <span>{dish}</span>
                    <button className="" onClick={(e) => {e.stopPropagation(); 

					removeDish(index + 1, dish);}}>
          ❌
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>



 {/* Dish List */}
      <label className="mt-2 text-3xl text-orange-500 font-bold">🥑Low Carb Food List🥑</label> <br/>
      <div className="text-center text-white font-bold"> 
      <select 
    className="border bg-orange-500 rounded-full text-center hover:bg-orange-500 active:bg-yellow-500" 
    value={selectedDish} 
    onChange={(e) => {
      const dishName = e.target.value;
      const dishIndex = dishes.findIndex(dish => dish.name === dishName);
      setSelectedDish(dishName);
      setSelectedIndex(dishIndex);
    }}
  >
                  <option value="" disabled>Select a Dish</option>
                  {dishes.map ((dish, index) => (<option key={index}>{dish.name}</option>))}
                  
     </select><br />
     </div> 

        {/* Add Dish Buttons */}
        <motion.div className="flex justify-center font-bold">
        <button
          onClick={handleAddDish}
          className="pl-1 text-white mr-2"
        >
          ➕Add Dish
        </button>
      
              <button
                className="pl-1 text-blue-500 mr-2"
                onClick={() => editDish(selectedIndex)}
              >
              ✏️Edit Dish
              </button>
              
              <button
    className="text-red-500"
    onClick={() => {
      if (selectedIndex !== null) deleteDish(selectedIndex);
    }}
    disabled={selectedIndex === null} // Prevent errors if no dish is selected
  >
    ❌Delete Dish
  </button>
  </motion.div> 

      {/* Dish Assignment Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-orange bg-opacity-10 flex justify-center items-center">
          <div className="bg-orange-200 p-6 rounded-xl shadow-xl border-2 border-orange-500" >
            <h2 className="text-lg font-bold mb-4">
              Assign Dish to {selectedMonth.toLocaleDateString("en-US", { month: "long",})} {selectedDay}
            </h2>
            {dishes.length === 0 ? (
              <p className="text-gray-500">
                No dishes available. Add some first!
              </p> ) : (<select className="mt-4 bg-orange-400 text-white px-4 py-2 mx-1 rounded"  value={assignedDish} onChange={(e)=> setAssignedDish(e.target.value)}>
                  <option value="" disabled>Select a dish</option>
                  {dishes.map ((dish, index) => <option key={index}>{dish.name}</option>)}
              </select>)}
          
            <button
              onClick={() => handleDishAssign(assignedDish)}
              className="mt-4 bg-red-500 hover:bg-orange-400 text-white px-4 py-2 mx-1 rounded" disabled={!assignedDish}>
              Assign Dish
            </button>

            <button
              onClick={() => setIsModalOpen(false)}
              className="mt-4 bg-red-500 hover:bg-orange-400 text-white px-4 py-2 rounded">
              Close
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
}