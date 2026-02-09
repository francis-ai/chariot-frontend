import React from "react";
import Navigation from "../component/navigation";
import Sidebar from "../component/sidebar";
import SalesOverview from "./SalesOverview";
import { useTheme } from "../context/ThemeContext";

export default function HomeDashboard() {
  const { darkMode } = useTheme(); // Get dark mode globally

  return (
    <div className={`min-h-screen flex ${darkMode ? "bg-gray-900" : "bg-gray-100"} transition-colors`}>
      
      {/* Sidebar */}
      <Sidebar />

      {/* Main Area */}
      <div className="flex-1 flex flex-col">
        
        {/* Top Navigation */}
        <Navigation />

        {/* Page Content */}
        <main className="flex-1 p-6 mt-20">
          
          <h1 className={`text-2xl md:text-3xl font-bold mb-8 ${darkMode ? "text-gray-100" : "text-gray-800"}`}>
            Welcome to Chariot
          </h1>

          {/* Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
            
            <div className={`p-6 rounded-xl shadow-sm transition-colors ${darkMode ? "bg-gray-800 text-gray-100" : "bg-white text-gray-800"}`}>
              <h2 className={`${darkMode ? "text-gray-300" : "text-gray-600"}`}>Invoices This Month</h2>
              <p className="text-3xl font-bold mt-3">0</p>
              <span className="mt-4 inline-block px-3 py-1 text-sm rounded-full bg-green-100 dark:bg-green-700 text-green-600 dark:text-green-100">
                +0% from last month
              </span>
            </div>

            <div className={`p-6 rounded-xl shadow-sm transition-colors ${darkMode ? "bg-gray-800 text-gray-100" : "bg-white text-gray-800"}`}>
              <h2 className={`${darkMode ? "text-gray-300" : "text-gray-600"}`}>Pending Quotations</h2>
              <p className="text-3xl font-bold mt-3">0</p>
              <p className="mt-4 text-sm text-yellow-600 dark:text-yellow-400">0 awaiting approval</p>
            </div>

            <div className={`p-6 rounded-xl shadow-sm transition-colors ${darkMode ? "bg-gray-800 text-gray-100" : "bg-white text-gray-800"}`}>
              <h2 className={`${darkMode ? "text-gray-300" : "text-gray-600"}`}>Waybills This Month</h2>
              <p className="text-3xl font-bold mt-3">0</p>
              <p className="mt-4 text-sm text-green-600 dark:text-green-400">+0% from last month</p>
            </div>

            <div className={`p-6 rounded-xl shadow-sm transition-colors ${darkMode ? "bg-gray-800 text-gray-100" : "bg-white text-gray-800"}`}>
              <h2 className={`${darkMode ? "text-gray-300" : "text-gray-600"}`}>Inventory Items</h2>
              <p className="text-3xl font-bold mt-3">0</p>
              <p className="mt-4 text-sm text-red-600 dark:text-red-400">−0% from last month</p>
            </div>
          </div>

          {/* Sales Chart Under Cards */}
          <SalesOverview />
         
        </main>
      </div>
    </div>
  );
}
