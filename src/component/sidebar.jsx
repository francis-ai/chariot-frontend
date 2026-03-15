import React, { useState, useContext } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/authContext.jsx"; 
import {
  FaHome,
  FaFileInvoice,
  FaFileAlt,
  FaTruck,
  FaShoppingCart,
  FaBoxes,
  FaBuilding,
  FaUsers,
  FaChartBar,
  FaPlus ,
  FaClipboardList,
  FaSignOutAlt,
  FaFolder,
  FaBars,
  FaTimes
} from "react-icons/fa";

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false); 
  const location = useLocation(); 
  const { logout, user } = useContext(AuthContext);
  const navigate = useNavigate();
  const isSuperAdmin = user?.role === 'super-admin';

  const menuItems = [
    { icon: <FaHome />, label: "Dashboard", path: "/HomeDashboard" },
    { icon: <FaFileInvoice />, label: "Invoice", path: "/invoiceManagement" },
    { icon: <FaFileAlt />, label: "Quotation", path: "/QuotationPage" },
    { icon: <FaTruck />, label: "Waybill", path: "/Waybill" },
    { icon: <FaShoppingCart />, label: "Purchase Orders", path: "/ordermanagement" },
    { icon: <FaBoxes />, label: "Inventory", path: "/Inventory" },
    { icon: <FaBuilding />, label: "Supplier", path: "/Suppliershome" },
    { icon: <FaUsers />, label: "Customers", path: "/Customer" },
    { icon: <FaFolder  />, label: "Categories", path: "/Categories" },
    { icon: <FaChartBar />, label: "Report", path: "/Report" },
    { icon: <FaPlus  />, label: "Users", path: "/user" },
    { icon: <FaClipboardList />, label: "Activity Logs", path: "/activity-logs", superAdminOnly: true },
  
  
    ];

  return (
    <>
      {/* Mobile toggle button */}
      <div className="fixed top-4 classtoggle mt-15 right-4 z-50 md:hidden">
        <button
          onClick={() => setIsOpen(prev => !prev)}
          className="bg-red-600 text-white p-3 rounded-full shadow-lg text-2xl"
        >
          {isOpen ? <FaTimes /> : <FaBars />}
        </button>
      </div>

      {/* Sidebar */}
      <aside
        className={`
          bg-red-600 w-64 min-h-screen flex flex-col p-6 shadow-lg
          fixed top-0 left-0 z-40 transform transition-transform duration-300
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
          md:translate-x-0 md:static md:flex
        `}
      >
        {/* Logo / Title */}
       <img src="/logo.jpg" alt="Logo" className="w-20 h-20 rounded-full mb-4 mx-auto" />

        {/* Navigation */}
        <nav className="flex-1">
          <ul className="space-y-3 bg-white rounded-lg p-3">
            {menuItems.map((item, idx) => {
              const isActive = location.pathname === item.path;
              // Hide privileged menu items for non-super-admin users
              if ((item.label === 'Users' || item.superAdminOnly) && !isSuperAdmin) return null;
              return (
                <li key={idx}>
                  <Link
                    to={item.path}
                    className={`
                      flex items-center gap-3 p-3 rounded transition
                      ${isActive ? "bg-red-500 text-white" : "text-gray-800 hover:bg-red-100"}
                    `}
                    onClick={() => setIsOpen(false)} // Close sidebar on mobile after click
                  >
                    <span className={`w-5 h-5 flex justify-center ${isActive ? "text-white" : "text-red-600"}`}>
                      {item.icon}
                    </span>
                    <div className="flex flex-col leading-tight">
                      <span className="font-medium">{item.label}</span>
                      {item.label === "Users" && (
                        <span className={`text-[10px] ${isActive ? "text-red-100" : "text-gray-500"}`}>
                          Only super-admin is allowed
                        </span>
                      )}
                      {item.label === "Activity Logs" && (
                        <span className={`text-[10px] ${isActive ? "text-red-100" : "text-gray-500"}`}>
                          Only super-admin is allowed
                        </span>
                      )}
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer / Logout */}
        <div className="mt-auto">
          <button
            onClick={() => {
              logout();           // clear user & token
              navigate("/login"); // redirect to login page
            }}
            className="flex items-center gap-3 p-3 rounded hover:bg-red-500 transition w-full bg-white"
          >
            <FaSignOutAlt className="w-5 h-5 text-red-600" />
            <span className="text-gray-800 font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-30 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
