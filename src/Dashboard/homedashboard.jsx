import React, { useState, useEffect } from "react";
import Navigation from "../component/navigation";
import Sidebar from "../component/sidebar";
import SalesOverview from "./SalesOverview";
import { useTheme } from "../context/ThemeContext";
import API from "../utils/api";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function HomeDashboard() {
  const { darkMode } = useTheme();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    invoices: 0,
    quotations: 0,
    waybills: 0,
    inventory: 0,
    monthlySales: []
  });

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      const res = await API.get("/dashboard");
      console.log("Dashboard stats:", res.data);
      setStats(res.data);
    } catch (err) {
      console.error("Fetch dashboard stats error:", err);
      toast.error(err.response?.data?.message || "Failed to load dashboard stats");
    } finally {
      setLoading(false);
    }
  };

  // Calculate percentage changes (placeholder logic - you can enhance this based on your data)
  const calculatePercentage = (current, previous) => {
    if (!previous || previous === 0) return 0;
    return ((current - previous) / previous * 100).toFixed(1);
  };

  return (
    <div className={`min-h-screen flex ${darkMode ? "bg-gray-900" : "bg-gray-100"} transition-colors`}>
      <ToastContainer position="top-right" autoClose={2500} hideProgressBar />
      
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

          {/* Loading State */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className={`p-6 rounded-xl shadow-sm animate-pulse ${darkMode ? "bg-gray-800" : "bg-white"}`}>
                  <div className={`h-4 w-24 rounded ${darkMode ? "bg-gray-700" : "bg-gray-200"}`}></div>
                  <div className={`h-8 w-16 rounded mt-3 ${darkMode ? "bg-gray-700" : "bg-gray-200"}`}></div>
                  <div className={`h-6 w-32 rounded mt-4 ${darkMode ? "bg-gray-700" : "bg-gray-200"}`}></div>
                </div>
              ))}
            </div>
          ) : (
            /* Stat Cards */
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
              
              {/* Invoices Card - Commented out as requested */}
              
              <div className={`p-6 rounded-xl shadow-sm transition-colors ${darkMode ? "bg-gray-800 text-gray-100" : "bg-white text-gray-800"}`}>
                <h2 className={`${darkMode ? "text-gray-300" : "text-gray-600"}`}>Invoices This Month</h2>
                <p className="text-3xl font-bold mt-3">{stats.invoices || 0}</p>
                <span className="mt-4 inline-block px-3 py-1 text-sm rounded-full bg-green-100 dark:bg-green-700 text-green-600 dark:text-green-100">
                  +{calculatePercentage(stats.invoices || 0, 0)}% from last month
                </span>
              </div>
             

              {/* Pending Quotations */}
              <div className={`p-6 rounded-xl shadow-sm transition-colors ${darkMode ? "bg-gray-800 text-gray-100" : "bg-white text-gray-800"}`}>
                <h2 className={`${darkMode ? "text-gray-300" : "text-gray-600"}`}>Pending Quotations</h2>
                <p className="text-3xl font-bold mt-3">{stats.quotations || 0}</p>
                <p className="mt-4 text-sm text-yellow-600 dark:text-yellow-400">
                  {stats.quotations || 0} awaiting approval
                </p>
              </div>

              {/* Waybills This Month */}
              <div className={`p-6 rounded-xl shadow-sm transition-colors ${darkMode ? "bg-gray-800 text-gray-100" : "bg-white text-gray-800"}`}>
                <h2 className={`${darkMode ? "text-gray-300" : "text-gray-600"}`}>Waybills This Month</h2>
                <p className="text-3xl font-bold mt-3">{stats.waybills || 0}</p>
                <p className="mt-4 text-sm text-green-600 dark:text-green-400">
                  +{calculatePercentage(stats.waybills || 0, 0)}% from last month
                </p>
              </div>

              {/* Inventory Items */}
              <div className={`p-6 rounded-xl shadow-sm transition-colors ${darkMode ? "bg-gray-800 text-gray-100" : "bg-white text-gray-800"}`}>
                <h2 className={`${darkMode ? "text-gray-300" : "text-gray-600"}`}>Inventory Items</h2>
                <p className="text-3xl font-bold mt-3">{stats.inventory || 0}</p>
                <p className="mt-4 text-sm text-blue-600 dark:text-blue-400">
                  Total products in stock
                </p>
              </div>
            </div>
          )}

          {/* Sales Chart Under Cards */}
          <SalesOverview monthlySales={stats.monthlySales} loading={loading} />
         
        </main>
      </div>
    </div>
  );
}