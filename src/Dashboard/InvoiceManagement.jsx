import React, { useState } from "react";
import { FaPlus, FaPrint } from "react-icons/fa";
import Sidebar from "../component/sidebar";
import NavBar from "../component/navigation";
import InvoiceForm from "./invoice";
import InvoiceAction from "./InvoiceAction";
import { useTheme } from "../context/ThemeContext";

export default function InvoiceManagement() {
  const [showInvoice, setShowInvoice] = useState(false);
  const { darkMode } = useTheme();

  return (
    <div className={`min-h-screen block lg:flex transition-colors ${darkMode ? "bg-gray-900" : "bg-gray-100"}`}>

      {/* ===== Sidebar ===== */}
      <Sidebar />

      {/* ===== Main Content Area ===== */}
      <div className="flex-1 flex flex-col">

        {/* ===== Top Navbar ===== */}
        <NavBar />

        {/* ===== Page Content ===== */}
        <main className="p-4 md:p-6 mt-20 lg:p-8 flex-1">

          {/* ================= Header + Stats Card Container ================= */}
          <div className={`rounded-xl shadow-sm p-6 transition-colors ${darkMode ? "bg-gray-800 text-gray-100" : "bg-white text-gray-800"}`}>

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
              <div>
                <h1 className={`text-2xl font-bold transition-colors ${darkMode ? "text-gray-100" : "text-gray-800"}`}>
                  Invoice Management
                </h1>
                <p className={`text-sm mt-1 transition-colors ${darkMode ? "text-gray-300" : "text-gray-500"}`}>
                  Create, manage and print invoices
                </p>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-3">
                {showInvoice ? (
                  <button
                    onClick={() => setShowInvoice(false)}
                    className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition"
                  >
                    <FaPlus />
                    Close Invoice
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => setShowInvoice(true)}
                      className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition"
                    >
                      <FaPlus />
                      Create Invoice
                    </button>
                    <button
                      className={`flex items-center gap-2 border px-4 py-2 rounded-lg transition
                        ${darkMode ? "border-gray-600 text-gray-200 hover:bg-gray-700" : "border-gray-300 text-gray-700 hover:bg-gray-100"}`}
                    >
                      <FaPrint />
                      Print
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">

              <div className={`rounded-lg p-5 transition-colors ${darkMode ? "bg-gray-700 text-gray-100" : "bg-gray-50 text-gray-800"}`}>
                <p className={`text-sm mb-1 ${darkMode ? "text-gray-300" : "text-gray-500"}`}>Total Invoices</p>
                <h2 className="text-3xl font-bold">0</h2>
              </div>

              <div className={`rounded-lg p-5 transition-colors ${darkMode ? "bg-gray-700 text-gray-100" : "bg-gray-50 text-gray-800"}`}>
                <p className={`text-sm mb-1 ${darkMode ? "text-gray-300" : "text-gray-500"}`}>Total Amount</p>
                <h2 className="text-3xl font-bold">₦0</h2>
              </div>

              <div className={`rounded-lg p-5 transition-colors ${darkMode ? "bg-gray-700 text-gray-100" : "bg-gray-50 text-gray-800"}`}>
                <p className={`text-sm mb-1 ${darkMode ? "text-gray-300" : "text-gray-500"}`}>Pending Invoices</p>
                <h2 className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">0</h2>
              </div>

            </div>
          </div>

          {/* ================= Invoice Form ================= */}
          {showInvoice && (
            <div className={`mt-8 p-6 rounded-xl shadow-sm transition-colors 
              ${darkMode ? "bg-gray-800 text-gray-100" : "bg-white text-gray-800"}`}
            >
              <InvoiceForm onClose={() => setShowInvoice(false)} />
            </div>
          )}

          {/* ================= Invoice Actions ================= */}
          <div className="mt-6">
            <InvoiceAction />
          </div>

        </main>
      </div>
    </div>
  );
}
