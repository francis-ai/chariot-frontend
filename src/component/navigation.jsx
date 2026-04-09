import React, { useState, useRef, useEffect, useContext } from "react";
import { FaUserCircle, FaSearch, FaMoon, FaSun, FaTimes } from "react-icons/fa";
import { useSearch } from "../context/searchcontex";
import { useTheme } from "../context/ThemeContext";
import { AuthContext } from "../context/authContext.jsx";
import { useNavigate } from "react-router-dom";
import API from "../utils/api";
import { toast } from "react-toastify";

const formatRoleLabel = (role) => {
  if (!role) return "User";

  return role
    .split("-")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

export default function NavBar() {
  const { user } = useContext(AuthContext);
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);
  const searchRef = useRef(null);
  const { searchQuery, setSearchQuery } = useSearch();
  const { darkMode, setDarkMode } = useTheme();
  const navigate = useNavigate();
  
  const [searchResults, setSearchResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [searching, setSearching] = useState(false);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowResults(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounced search
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (searchQuery.trim().length > 1) {
        performGlobalSearch();
      } else {
        setSearchResults([]);
        setShowResults(false);
      }
    }, 500);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  const performGlobalSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setSearching(true);
    try {
      const res = await API.get(`/dashboard/search?q=${encodeURIComponent(searchQuery)}`);
      console.log("Search results:", res.data);
      setSearchResults(res.data);
      setShowResults(res.data.length > 0);
    } catch (err) {
      console.error("Global search error:", err);
      toast.error("Failed to perform search");
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleResultClick = (result) => {
    setShowResults(false);
    setSearchQuery('');
    const basePath = user?.role === "super-admin" ? "/admin" : "";
    
    // Navigate based on result type
    switch (result.type) {
      case 'customer':
        navigate(`${basePath}/Customer?view=${result.id}`);
        toast.info(`Viewing customer: ${result.name}`);
        break;
      case 'product':
        navigate(`${basePath}/Inventory?view=${result.id}`);
        toast.info(`Viewing product: ${result.name}`);
        break;
      case 'supplier':
        navigate(`${basePath}/Suppliershome?view=${result.id}`);
        toast.info(`Viewing supplier: ${result.name}`);
        break;
      case 'purchaseOrder':
        navigate(`${basePath}/ordermanagement?view=${result.id}`);
        toast.info(`Viewing purchase order: ${result.po_number}`);
        break;
      case 'quotations':
        navigate(`${basePath}/QuotationPage?view=${result.id}`);
        toast.info(`Viewing quotation: ${result.quotation_number}`);
        break;
      case 'invoice':
        navigate(`${basePath}/invoiceManagement?view=${result.id}`);
        toast.info(`Viewing invoice: ${result.invoice_number}`);
        break;
      case 'waybill':
        navigate(`${basePath}/Waybill?view=${result.id}`);
        toast.info(`Viewing waybill: ${result.waybill_number}`);
        break;
      default:
        toast.info(`Found: ${result.name || result.customer || 'Item'}`);
    }
  };

  const getResultIcon = (type) => {
    switch (type) {
      case 'customer': return '👤';
      case 'product': return '📦';
      case 'supplier': return '🏢';
      case 'purchaseOrder': return '📋';
      case 'quotations': return '📄';
      default: return '🔍';
    }
  };

  const getResultSubtitle = (result) => {
    switch (result.type) {
      case 'customer':
        return result.email || result.phone || 'Customer';
      case 'product':
        return `SKU: ${result.sku || 'N/A'}`;
      case 'supplier':
        return result.email || 'Supplier';
      case 'purchaseOrder':
        return `Date: ${result.order_date || 'N/A'}`;
      case 'quotations':
        return `Customer: ${result.customer || 'N/A'}`;
      case 'invoice':
        return `Customer: ${result.customer || 'N/A'}`;
      case 'waybill':
        return `Customer: ${result.customer || 'N/A'}`;
      default:
        return '';
    }
  };

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
      <div className="flex-1 flex justify-center px-2 relative" ref={searchRef}>
        <div className="relative w-full max-w-xl">
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-300 text-sm z-10" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => searchResults.length > 0 && setShowResults(true)}
            placeholder="Search customers, products, suppliers, orders..."
            className="w-full pl-9 pr-10 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none transition-colors"
          />
          
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSearchResults([]);
                setShowResults(false);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              <FaTimes size={14} />
            </button>
          )}

          {/* Search Results Dropdown */}
          {showResults && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 max-h-96 overflow-y-auto z-50">
              {searching ? (
                <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                  <div className="animate-spin inline-block w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full mr-2"></div>
                  Searching...
                </div>
              ) : searchResults.length > 0 ? (
                <>
                  <div className="p-2 text-xs text-gray-500 dark:text-gray-400 border-b dark:border-gray-700">
                    Found {searchResults.length} results
                  </div>
                  {searchResults.map((result, index) => (
                    <button
                      key={`${result.type}-${result.id}-${index}`}
                      onClick={() => handleResultClick(result)}
                      className="w-full px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-gray-700 border-b last:border-0 dark:border-gray-700 transition flex items-start gap-3"
                    >
                      <span className="text-xl">{getResultIcon(result.type)}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-800 dark:text-gray-200 truncate">
                          {result.name || result.customer || result.po_number || result.quotation_number}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {getResultSubtitle(result)}
                        </p>
                        <span className="inline-block mt-1 px-2 py-0.5 text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full capitalize">
                          {result.type}
                        </span>
                      </div>
                    </button>
                  ))}
                </>
              ) : (
                <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                  No results found for "{searchQuery}"
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right: User */}
      <div className="relative flex-shrink-0" ref={dropdownRef}>
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-2 focus:outline-none"
        >
          <span className="hidden md:block text-gray-700 dark:text-gray-200 font-medium">
            {user?.username || user?.name || 'User'}
          </span>
          <FaUserCircle className="text-3xl text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition" />
        </button>

        {open && (
          <div className="absolute right-0 mt-3 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 z-50 transition-colors">
            <div className="text-sm">
              <p className="font-semibold text-gray-800 dark:text-gray-200 truncate">
                {user?.name || user?.username || 'Admin User'}
              </p>
              <p className="text-gray-500 dark:text-gray-300 truncate">
                {user?.email || 'admin@company.com'}
              </p>
              <p className="mt-1 text-xs inline-block bg-red-100 dark:bg-red-600 text-red-600 dark:text-red-100 px-2 py-1 rounded-full">
                {formatRoleLabel(user?.role)}
              </p>
            </div>

            <div className="border-t border-gray-200 dark:border-gray-600 mt-4 pt-3 space-y-2">
              <button 
                onClick={() => {
                  setOpen(false);
                  navigate('/profile');
                }}
                className="w-full text-left text-sm text-gray-600 dark:text-gray-200 hover:text-red-600 dark:hover:text-red-400 transition"
              >
                View Profile
              </button>
              <button 
                onClick={() => {
                  // Handle logout
                  localStorage.removeItem('token');
                  localStorage.removeItem('user');
                  window.location.href = user?.role === "super-admin" ? '/admin/login' : '/login';
                }}
                className="w-full bg-red-600 text-white rounded-lg py-2 text-sm hover:bg-red-700 transition"
              >
                Logout
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}