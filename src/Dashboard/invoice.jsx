import React, { useState } from "react";
import { toast, ToastContainer } from "react-toastify";
import { X } from "lucide-react";
import "react-toastify/dist/ReactToastify.css";
import { useTheme } from "../context/ThemeContext";

export default function InvoiceForm({ onClose }) {
  const { darkMode } = useTheme();

  const [form, setForm] = useState({
    customer: "",
    invoiceDate: "",
    dueDate: "",
    item: "",
    description: "",
    quantity: 1,
    price: 0,
    discount: 0,
    notes: ""
  });

  const taxRate = 0.075;
  const subtotal = form.quantity * form.price;
  const tax = subtotal * taxRate;
  const total = subtotal + tax - form.discount;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = (e, print = false) => {
    e.preventDefault();

    if (!form.customer || !form.invoiceDate || !form.dueDate || !form.item) {
      toast.error("Please fill all required fields", { autoClose: 3000 });
      return;
    }

    if (print) {
      toast.success("Invoice saved! Printing...", { autoClose: 2000 });
      setTimeout(() => window.print(), 500);
    } else {
      toast.success("Invoice saved successfully", { autoClose: 3000 });
    }

    // Reset form
    setForm({
      customer: "",
      invoiceDate: "",
      dueDate: "",
      item: "",
      description: "",
      quantity: 1,
      price: 0,
      discount: 0,
      notes: ""
    });

    if (onClose) onClose();
  };

  return (
    <>
      <ToastContainer />

      {/* Modal Overlay */}
      <div
        className={`fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 md:p-8 transition-colors ${darkMode ? 'bg-black/70' : 'bg-black/40'}`}
        onClick={onClose} // Clicking outside closes modal
      >
        <div
          className={`w-full max-w-4xl relative rounded-xl shadow-xl transition-colors ${darkMode ? 'bg-slate-800 text-slate-200' : 'bg-white text-slate-900'}`}
          onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside modal
        >
          {/* Close Icon */}
          <button
            type="button"
            onClick={onClose}
            className={`absolute top-4 right-4 p-2 rounded-full transition-colors ${darkMode ? 'hover:bg-slate-700' : 'hover:bg-gray-100'}`}
          >
            <X size={20} />
          </button>

          {/* Form */}
          <form className="p-6 space-y-8" onSubmit={(e) => e.preventDefault()}>
            {/* Invoice Details */}
            <div>
              <h2 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-slate-200' : 'text-gray-800'}`}>Invoice Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-slate-300' : 'text-gray-600'}`}>Customer *</label>
                  <select
                    name="customer"
                    value={form.customer}
                    onChange={handleChange}
                    required
                    className={`w-full rounded-lg px-3 py-2 focus:ring-2 outline-none transition-colors ${darkMode ? 'bg-slate-700 text-slate-200 border border-slate-600 focus:ring-red-500' : 'bg-white text-slate-900 border border-gray-300 focus:ring-red-500'}`}
                  >
                    <option value="">Select Customer</option>
                    <option>ABC Corporation</option>
                    <option>Global Solutions</option>
                  </select>
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-slate-300' : 'text-gray-600'}`}>Invoice Date *</label>
                  <input
                    type="date"
                    name="invoiceDate"
                    value={form.invoiceDate}
                    onChange={handleChange}
                    required
                    className={`w-full rounded-lg px-3 py-2 focus:ring-2 outline-none transition-colors ${darkMode ? 'bg-slate-700 text-slate-200 border border-slate-600 focus:ring-red-500' : 'bg-white text-slate-900 border border-gray-300 focus:ring-red-500'}`}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-slate-300' : 'text-gray-600'}`}>Due Date *</label>
                  <input
                    type="date"
                    name="dueDate"
                    value={form.dueDate}
                    onChange={handleChange}
                    required
                    className={`w-full rounded-lg px-3 py-2 focus:ring-2 outline-none transition-colors ${darkMode ? 'bg-slate-700 text-slate-200 border border-slate-600 focus:ring-red-500' : 'bg-white text-slate-900 border border-gray-300 focus:ring-red-500'}`}
                  />
                </div>
              </div>
            </div>

            {/* Items */}
            <div>
              <h2 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-slate-200' : 'text-gray-800'}`}>Items</h2>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div>
                  <label className={`text-sm mb-1 block ${darkMode ? 'text-slate-300' : 'text-gray-600'}`}>Item *</label>
                  <select
                    name="item"
                    value={form.item}
                    onChange={handleChange}
                    required
                    className={`w-full rounded-lg px-3 py-2 transition-colors ${darkMode ? 'bg-slate-700 text-slate-200 border border-slate-600' : 'bg-white text-slate-900 border border-gray-300'}`}
                  >
                    <option value="">Select Item</option>
                    <option>Generator</option>
                    <option>Industrial Pump</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className={`text-sm mb-1 block ${darkMode ? 'text-slate-300' : 'text-gray-600'}`}>Description</label>
                  <input
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    placeholder="Item description"
                    className={`w-full rounded-lg px-3 py-2 transition-colors ${darkMode ? 'bg-slate-700 text-slate-200 border border-slate-600' : 'bg-white text-slate-900 border border-gray-300'}`}
                  />
                </div>

                <div>
                  <label className={`text-sm mb-1 block ${darkMode ? 'text-slate-300' : 'text-gray-600'}`}>Qty</label>
                  <input
                    type="number"
                    min="1"
                    name="quantity"
                    value={form.quantity}
                    onChange={handleChange}
                    className={`w-full rounded-lg px-3 py-2 transition-colors ${darkMode ? 'bg-slate-700 text-slate-200 border border-slate-600' : 'bg-white text-slate-900 border border-gray-300'}`}
                  />
                </div>

                <div>
                  <label className={`text-sm mb-1 block ${darkMode ? 'text-slate-300' : 'text-gray-600'}`}>Unit Price</label>
                  <input
                    type="number"
                    min="0"
                    name="price"
                    value={form.price}
                    onChange={handleChange}
                    className={`w-full rounded-lg px-3 py-2 transition-colors ${darkMode ? 'bg-slate-700 text-slate-200 border border-slate-600' : 'bg-white text-slate-900 border border-gray-300'}`}
                  />
                </div>
              </div>
            </div>

            {/* Notes & Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className={`text-sm mb-1 block ${darkMode ? 'text-slate-300' : 'text-gray-600'}`}>Notes</label>
                <textarea
                  name="notes"
                  value={form.notes}
                  onChange={handleChange}
                  placeholder="Additional notes..."
                  className={`w-full h-32 rounded-lg px-3 py-2 transition-colors ${darkMode ? 'bg-slate-700 text-slate-200 border border-slate-600' : 'bg-white text-slate-900 border border-gray-300'}`}
                />
              </div>

              <div className={`rounded-lg p-5 space-y-3 transition-colors ${darkMode ? 'bg-slate-700 text-slate-200' : 'bg-gray-50 text-gray-900'}`}>
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>₦{subtotal.toLocaleString()}</span>
                </div>

                <div className="flex justify-between">
                  <span>Tax (7.5%)</span>
                  <span>₦{tax.toLocaleString()}</span>
                </div>

                <div className="flex justify-between">
                  <span>Discount</span>
                  <input
                    type="number"
                    name="discount"
                    value={form.discount}
                    onChange={handleChange}
                    className={`w-32 rounded px-2 py-1 text-right transition-colors ${darkMode ? 'bg-slate-700 text-slate-200 border border-slate-600' : 'bg-white text-slate-900 border border-gray-300'}`}
                  />
                </div>

                <hr className={`${darkMode ? 'border-slate-600' : 'border-gray-300'}`} />

                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span>₦{total.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-4">
              <button
                type="button"
                onClick={onClose}
                className={`px-6 py-2 rounded-lg font-medium transition-colors ${darkMode ? 'bg-slate-600 hover:bg-slate-500 text-slate-200' : 'bg-gray-300 hover:bg-gray-400 text-gray-800'}`}
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={(e) => handleSubmit(e)}
                className={`px-6 py-2 rounded-lg font-medium transition-colors ${darkMode ? 'bg-red-700 hover:bg-red-600 text-white' : 'bg-red-600 hover:bg-red-700 text-white'}`}
              >
                Save
              </button>

              <button
                type="button"
                onClick={(e) => handleSubmit(e, true)}
                className={`px-6 py-2 rounded-lg font-medium border transition-colors ${darkMode ? 'border-red-600 text-red-500 hover:bg-red-600/20' : 'border-red-600 text-red-600 hover:bg-red-50'}`}
              >
                Save & Print
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
