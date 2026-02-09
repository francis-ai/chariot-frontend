import React, { useState } from "react";
import {
  Eye,
  Edit3,
  Plus,
  Package,
  AlertTriangle,
  TrendingUp,
  X,
  ArrowRightLeft,
} from "lucide-react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import AddnewInventory from "./AddnewInventory";

import NavBar from "../../component/navigation";
import Sidebar from "../../component/sidebar";
import { useTheme } from "../../context/ThemeContext";

const InventoryDashboard = () => {
  const { darkMode } = useTheme();

  const [viewModal, setViewModal] = useState(null);
  const [editModal, setEditModal] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [categories, setCategories] = useState([
    "Electronics",
    "Office Supplies",
    "Furniture",
  ]);

  const [inventoryData, setInventoryData] = useState([
    {
      sku: "SKU-001",
      name: "Laptop - Dell XPS 13",
      category: "Electronics",
      stock: 25,
      min: 10,
      price: "₦450,000",
      total: "₦11,250,000",
      status: "In Stock",
    },
  ]);

  const stats = [
    { label: "Total Items", value: inventoryData.length, icon: <Package /> },
    { label: "Total Value", value: "₦13.3M", icon: <TrendingUp /> },
    { label: "Low Stock Items", value: "3", icon: <AlertTriangle /> },
    { label: "Out of Stock", value: "1", icon: <X /> },
  ];

  const getStatusStyle = (status) => {
    const base = "px-3 py-1 rounded-full text-[10px] font-bold uppercase";
    if (status === "In Stock")
      return `${base} bg-emerald-100 text-emerald-700`;
    if (status === "Low Stock")
      return `${base} bg-amber-100 text-amber-700`;
    return `${base} bg-rose-100 text-rose-700`;
  };

  // ✅ CATEGORY ADD HANDLER (SOURCE OF TRUTH)
  const handleAddCategory = (name) => {
    const trimmed = name.trim();

    if (!trimmed) {
      toast.error("Category name is required");
      return;
    }

    if (categories.includes(trimmed)) {
      toast.error("Category already exists");
      return;
    }

    setCategories((prev) => [...prev, trimmed]);
    toast.success(`Category "${trimmed}" added`);
    setIsCategoryModalOpen(false);
  };

  return (
    <div
      className={`min-h-screen lg:flex ${
        darkMode ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-900"
      }`}
    >
      <ToastContainer position="top-right" autoClose={2500} hideProgressBar />
      <Sidebar />

      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <div className="flex-1">
        <NavBar onMenuClick={() => setIsSidebarOpen(true)} />

        <main className="p-4 mt-20 md:p-8 max-w-7xl mx-auto">
          {/* HEADER */}
          <div className="flex flex-col md:flex-row justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl font-black">Inventory Management</h1>
              <p className="text-sm text-slate-400">
                Monitor and control your warehouse stock
              </p>
            </div>

            <div className="flex gap-2 flex-wrap">
            

              <button
                onClick={() => setIsAddModalOpen(true)}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold"
              >
                <Plus size={18} /> Add Item
              </button>

              <button
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold border ${
                  darkMode
                    ? "bg-slate-800 border-slate-700 hover:bg-slate-700"
                    : "bg-white border-slate-200 hover:bg-slate-50"
                }`}
              >
                <ArrowRightLeft size={18} /> Stock Adjustment
              </button>
            </div>
          </div>

          {/* STATS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {stats.map((s, i) => (
              <div
                key={i}
                className={`p-5 rounded-2xl border ${
                  darkMode
                    ? "bg-slate-800 border-slate-700"
                    : "bg-white border-slate-200"
                }`}
              >
                <p className="text-2xl font-black">{s.value}</p>
                <p className="text-xs uppercase text-slate-400 mt-1">
                  {s.label}
                </p>
              </div>
            ))}
          </div>

          {/* TABLE */}
          <div
            className={`rounded-2xl border overflow-hidden ${
              darkMode
                ? "bg-slate-800 border-slate-700"
                : "bg-white border-slate-200"
            }`}
          >
            <table className="w-full min-w-[900px]">
              <thead>
                <tr className="text-xs uppercase text-slate-400 border-b">
                  {[
                    "SKU",
                    "Product",
                    "Category",
                    "Stock",
                    "Min",
                    "Price",
                    "Total",
                    "Status",
                    "Actions",
                  ].map((h) => (
                    <th key={h} className="px-6 py-4 text-left">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {inventoryData.map((item) => (
                  <tr
                    key={item.sku}
                    className="border-t hover:bg-blue-500/5"
                  >
                    <td className="px-6 py-4 text-blue-500 font-bold">
                      {item.sku}
                    </td>
                    <td className="px-6 py-4 font-bold">{item.name}</td>
                    <td className="px-6 py-4">{item.category}</td>
                    <td className="px-6 py-4">{item.stock}</td>
                    <td className="px-6 py-4">{item.min}</td>
                    <td className="px-6 py-4">{item.price}</td>
                    <td className="px-6 py-4 font-bold">{item.total}</td>
                    <td className="px-6 py-4">
                      <span className={getStatusStyle(item.status)}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 flex gap-2">
                      <Eye size={16} />
                      <Edit3 size={16} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </main>

        {/* ADD ITEM MODAL */}
        {isAddModalOpen && (
          <Modal
            title="Add Inventory Item"
            onClose={() => setIsAddModalOpen(false)}
            darkMode={darkMode}
          >
            <AddnewInventory
              categories={categories}
              onClose={() => setIsAddModalOpen(false)}
            />
          </Modal>
        )}

      
      </div>
    </div>
  );
};

/* ---------- MODAL ---------- */
const Modal = ({ title, children, onClose, darkMode }) => (
  <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
    <div
      className={`w-full max-w-md rounded-2xl p-6 relative ${
        darkMode ? "bg-slate-800 text-white" : "bg-white text-slate-900"
      }`}
    >
      <button onClick={onClose} className="absolute top-4 right-4">
        <X />
      </button>
      <h2 className="text-xl font-black mb-4">{title}</h2>
      {children}
    </div>
  </div>
);

export default InventoryDashboard;
