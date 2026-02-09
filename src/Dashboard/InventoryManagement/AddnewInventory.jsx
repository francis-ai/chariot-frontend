import React, { useState } from "react";
import { toast, ToastContainer } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';
import { useTheme } from "../../context/ThemeContext";

export default function AddInventoryItem() {
  const { darkMode } = useTheme();

  const [productName, setProductName] = useState("");
  const [sku, setSku] = useState("AUTO-001");
  const [category, setCategory] = useState("");
  const [currentStock, setCurrentStock] = useState(0);
  const [minStock, setMinStock] = useState(10);
  const [purchasePrice, setPurchasePrice] = useState("");
  const [sellingPrice, setSellingPrice] = useState("");
  const [description, setDescription] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!productName || !category || !purchasePrice || !sellingPrice) {
      toast.error("Required fields missing!", { autoClose: 2000 });
      return;
    }
    toast.success("Item added successfully!", { autoClose: 2000 });
    // Reset form
    setProductName(""); setCategory(""); setCurrentStock(0); setMinStock(10);
    setPurchasePrice(""); setSellingPrice(""); setDescription("");
  };

  const inputClass = `w-full p-2 border rounded text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
    darkMode ? "bg-slate-700 border-slate-600 text-slate-200 placeholder:text-slate-400" : "bg-gray-50 border-gray-300 text-gray-900 placeholder:text-gray-400"
  }`;

  const textareaClass = `w-full p-2 border rounded text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
    darkMode ? "bg-slate-700 border-slate-600 text-slate-200 placeholder:text-slate-400" : "bg-gray-50 border-gray-300 text-gray-900 placeholder:text-gray-400"
  }`;

  return (
    <div className={`flex justify-center items-start py-4 px-4 min-h-screen transition-colors ${
      darkMode ? "bg-slate-900 text-slate-200" : "bg-gray-50 text-gray-900"
    }`}>
      <ToastContainer position="top-right" autoClose={2000} hideProgressBar />

      <form
        onSubmit={handleSubmit}
        className={`shadow-md rounded-lg p-6 w-full max-w-2xl space-y-4 border transition-colors ${
          darkMode ? "bg-slate-800 border-slate-700" : "bg-white border-gray-100"
        }`}
      >
        <div className="flex justify-between items-center mb-1">
          <h2 className={`text-lg font-bold ${darkMode ? "text-slate-200" : "text-gray-800"}`}>New Inventory Item</h2>
          <span className={`text-xs ${darkMode ? "text-slate-400" : "text-gray-400"}`}>* Required</span>
        </div>

        {/* Row 1: Name & SKU */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="md:col-span-2">
            <label className="block text-xs font-bold uppercase mb-1">Product Name *</label>
            <input
              type="text"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              className={inputClass}
              placeholder="e.g. Wireless Mouse"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase mb-1">SKU</label>
            <input
              type="text"
              value={sku}
              readOnly
              className={`w-full p-2 rounded text-sm ${darkMode ? "bg-slate-700 border-slate-600 text-slate-400" : "bg-gray-50 border-gray-200 text-gray-500"}`}
            />
          </div>
        </div>

        {/* Row 2: Category & Stocks */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-bold uppercase mb-1">Category *</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className={inputClass}
              required
            >
              <option value="">Select...</option>
              <option value="Electronics">Electronics</option>
              <option value="Apparel">Apparel</option>
              <option value="Furniture">Furniture</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase mb-1">Current Stock</label>
            <input
              type="number"
              value={currentStock}
              onChange={(e) => setCurrentStock(Number(e.target.value))}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase mb-1">Min. Level</label>
            <input
              type="number"
              value={minStock}
              onChange={(e) => setMinStock(Number(e.target.value))}
              className={inputClass}
            />
          </div>
        </div>

        {/* Row 3: Pricing */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold uppercase mb-1">Purchase Price (₦) *</label>
            <input
              type="number"
              value={purchasePrice}
              onChange={(e) => setPurchasePrice(e.target.value)}
              className={inputClass}
              placeholder="0.00"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase mb-1">Selling Price (₦) *</label>
            <input
              type="number"
              value={sellingPrice}
              onChange={(e) => setSellingPrice(e.target.value)}
              className={inputClass}
              placeholder="0.00"
              required
            />
          </div>
        </div>

        {/* Row 4: Description */}
        <div>
          <label className="block text-xs font-bold uppercase mb-1">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows="3"
            className={textareaClass}
            placeholder="Short details..."
          ></textarea>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end gap-2 pt-2 border-t transition-colors border-gray-100">
          <button
            type="button"
            onClick={() => {
              setProductName(""); setCategory(""); setCurrentStock(0); setMinStock(10);
              setPurchasePrice(""); setSellingPrice(""); setDescription("");
              toast.info("Form cleared", { autoClose: 1500 });
            }}
            className={`px-4 py-1.5 text-sm font-medium rounded transition-colors ${
              darkMode ? "text-slate-200 hover:text-slate-100" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Clear
          </button>
          <button
            type="submit"
            className={`px-6 py-1.5 text-sm font-bold rounded shadow transition-colors ${
              darkMode ? "bg-blue-600 text-white hover:bg-blue-500" : "bg-blue-600 text-white hover:bg-blue-700"
            }`}
          >
            Save Item
          </button>
        </div>
      </form>
    </div>
  );
}
