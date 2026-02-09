import React, { useState, useRef, useEffect } from "react";
import { FaUserCircle, FaSearch, FaMoon, FaSun } from "react-icons/fa";
import { useSearch } from "../context/searchcontex";
import { useTheme } from "../context/ThemeContext";

export default function NavBar() {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);
  const { searchQuery, setSearchQuery } = useSearch();
  const { darkMode, setDarkMode } = useTheme();

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <nav className="bg-white dark:bg-gray-900 shadow-sm px-4 md:px-6 py-3 flex items-center justify-between gap-4 transition-colors">
      
      {/* Left: Dark/Light Toggle */}
      <div className="flex items-center gap-3 flex-shrink-0">
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="p-2 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-yellow-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition"
          title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {darkMode ? <FaSun size={18} /> : <FaMoon size={18} />}
        </button>
      </div>

      {/* Center: Search */}
      <div className="flex-1 flex justify-center px-2">
        <div className="relative w-full max-w-xl">
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-300 text-sm" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search customers, products, orders..."
            className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none transition-colors"
          />
        </div>
      </div>

      {/* Right: User */}
      <div className="relative flex-shrink-0" ref={dropdownRef}>
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-2 focus:outline-none"
        >
          <span className="hidden md:block text-gray-700 dark:text-gray-200 font-medium">
            Admin User
          </span>
          <FaUserCircle className="text-3xl text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition" />
        </button>

        {open && (
          <div className="absolute right-0 mt-3 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 z-50 transition-colors">
            <div className="text-sm">
              <p className="font-semibold text-gray-800 dark:text-gray-200 truncate">Admin User</p>
              <p className="text-gray-500 dark:text-gray-300 truncate">admin@company.com</p>
              <p className="mt-1 text-xs inline-block bg-red-100 dark:bg-red-600 text-red-600 dark:text-red-100 px-2 py-1 rounded-full">
                Administrator
              </p>
            </div>

            <div className="border-t border-gray-200 dark:border-gray-600 mt-4 pt-3 space-y-2">
              <button className="w-full text-left text-sm text-gray-600 dark:text-gray-200 hover:text-red-600 dark:hover:text-red-400 transition">
                View Profile
              </button>
              <button className="w-full bg-red-600 text-white rounded-lg py-2 text-sm hover:bg-red-700 transition">
                Logout
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
