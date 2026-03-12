import React, { useState, useEffect } from "react";
import { toast, ToastContainer } from "react-toastify";
import { X, Save } from "lucide-react";
import "react-toastify/dist/ReactToastify.css";
import API from "../utils/api";

export default function InvoiceForm({ onClose, onSave, darkMode, invoiceData }) {
  const [form, setForm] = useState({
    customer: "",
    invoice_date: new Date().toISOString().split('T')[0],
    due_date: "",
    item: "",
    description: "",
    quantity: 1,
    price: 0,
    discount: 0,
    notes: ""
  });
  const [customers, setCustomers] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState({ customers: true, items: true });
  const [selectedItemId, setSelectedItemId] = useState("");

  // Load invoice data if editing
  useEffect(() => {
    if (invoiceData) {
      setForm({
        customer: invoiceData.customer || "",
        invoice_date: invoiceData.invoice_date || new Date().toISOString().split('T')[0],
        due_date: invoiceData.due_date || "",
        item: invoiceData.item || "",
        description: invoiceData.description || "",
        quantity: invoiceData.quantity || 1,
        price: invoiceData.price || 0,
        discount: invoiceData.discount || 0,
        notes: invoiceData.notes || ""
      });
    }
  }, [invoiceData]);

  // Find the item ID for the select dropdown when items are loaded
  useEffect(() => {
    if (invoiceData && items.length > 0) {
      const item = items.find(i => i.product_name === invoiceData.item);
      if (item) {
        setSelectedItemId(String(item.id || item._id));
      }
    }
  }, [invoiceData, items]);

  // Fetch customers
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        setFetching(prev => ({ ...prev, customers: true }));
        const res = await API.get("/customers");
        console.log("Fetched customers:", res.data);
        setCustomers(res.data || []);
      } catch (err) {
        console.error("Fetch customers error:", err);
        toast.error("Failed to load customers");
        setCustomers([]);
      } finally {
        setFetching(prev => ({ ...prev, customers: false }));
      }
    };
    fetchCustomers();
  }, []);

  // Fetch inventory items
  useEffect(() => {
    const fetchItems = async () => {
      try {
        setFetching(prev => ({ ...prev, items: true }));
        const res = await API.get("/inventory");
        console.log("Fetched inventory items:", res.data);
        setItems(res.data || []);
      } catch (err) {
        console.error("Fetch inventory error:", err);
        // Don't show error toast for inventory, just log it
        setItems([]);
      } finally {
        setFetching(prev => ({ ...prev, items: false }));
      }
    };
    fetchItems();
  }, []);

  // Handle item selection - auto-fill price
  const handleItemChange = (e) => {
    const selectedId = e.target.value;
    setSelectedItemId(selectedId);
    
    const selectedItem = items.find(
      (item) => String(item.id) === String(selectedId) || String(item._id) === String(selectedId)
    );

    if (selectedItem) {
      setForm(prev => ({
        ...prev,
        item: selectedItem.product_name || selectedItem.name || "",
        price: Number(selectedItem.selling_price || selectedItem.price || 0),
        description: prev.description || selectedItem.description || ""
      }));
    } else {
      setForm(prev => ({
        ...prev,
        item: "",
        price: 0,
        description: ""
      }));
    }
  };

  // Calculations
  const subtotal = form.quantity * form.price;
  const total = subtotal - (form.discount || 0);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e, print = false) => {
    e.preventDefault();

    // Validation
    if (!form.customer) {
      toast.error("Please select a customer");
      return;
    }
    if (!form.invoice_date) {
      toast.error("Invoice date is required");
      return;
    }
    if (!form.due_date) {
      toast.error("Due date is required");
      return;
    }
    if (!form.item) {
      toast.error("Please select an item");
      return;
    }

    setLoading(true);
    try {
      await onSave(form);
      
      if (print) {
        toast.success("Invoice saved! Printing...");
        setTimeout(() => window.print(), 500);
      }
    } catch (err) {
      console.error("Form submission error:", err);
    } finally {
      setLoading(false);
    }
  };

  const inputClass = `w-full rounded-lg px-3 py-2 focus:ring-2 outline-none transition-colors ${
    darkMode 
      ? "bg-gray-700 text-gray-200 border border-gray-600 focus:ring-blue-500" 
      : "bg-white text-gray-900 border border-gray-300 focus:ring-blue-500"
  }`;

  const isLoading = fetching.customers || fetching.items;

  return (
    <>
      <ToastContainer />

      <div className="w-full">
        <div className="flex justify-between items-center mb-6">
          <h2 className={`text-lg font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
            {invoiceData ? 'Edit Invoice' : 'Create New Invoice'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className={`p-2 rounded-full transition-colors ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
          >
            <X size={20} />
          </button>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p>Loading form data...</p>
          </div>
        ) : (
          <form className="space-y-8" onSubmit={(e) => e.preventDefault()}>
            {/* Invoice Details */}
            <div>
              <h3 className={`text-md font-medium mb-4 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Invoice Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Customer *</label>
                  <select
                    name="customer"
                    value={form.customer}
                    onChange={handleChange}
                    required
                    disabled={loading}
                    className={inputClass}
                  >
                    <option value="">Select Customer</option>
                    {customers.length > 0 ? (
                      customers.map(customer => (
                        <option key={customer.id || customer._id} value={customer.name}>
                          {customer.company || customer.name}
                        </option>
                      ))
                    ) : (
                      <option value="" disabled>No customers available</option>
                    )}
                  </select>
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Invoice Date *</label>
                  <input
                    type="date"
                    name="invoice_date"
                    value={form.invoice_date}
                    onChange={handleChange}
                    required
                    disabled={loading}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Due Date *</label>
                  <input
                    type="date"
                    name="due_date"
                    value={form.due_date}
                    onChange={handleChange}
                    required
                    disabled={loading}
                    className={inputClass}
                  />
                </div>
              </div>
            </div>

            {/* Items */}
            <div>
              <h3 className={`text-md font-medium mb-4 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Items</h3>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div>
                  <label className={`text-sm mb-1 block ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Item *</label>
                  <select
                    value={selectedItemId}
                    onChange={handleItemChange}
                    required
                    disabled={loading}
                    className={inputClass}
                  >
                    <option value="">Select Item</option>
                    {items.length > 0 ? (
                      items.map(i => (
                        <option key={i.id || i._id} value={String(i.id || i._id)}>
                          {i.product_name} - ₦{(i.selling_price || i.price || 0).toLocaleString()}
                        </option>
                      ))
                    ) : (
                      <option value="" disabled>No items available</option>
                    )}
                  </select>
                  {items.length === 0 && (
                    <p className="text-xs text-red-500 mt-1">No inventory items found. Please add items in inventory first.</p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className={`text-sm mb-1 block ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Description</label>
                  <input
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    placeholder="Item description"
                    disabled={loading}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={`text-sm mb-1 block ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Quantity</label>
                  <input
                    type="number"
                    min="1"
                    name="quantity"
                    value={form.quantity}
                    onChange={handleChange}
                    disabled={loading}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={`text-sm mb-1 block ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Unit Price (₦)</label>
                  <input
                    type="number"
                    min="0"
                    name="price"
                    value={form.price}
                    onChange={handleChange}
                    disabled={loading}
                    readOnly
                    className={`${inputClass} ${darkMode ? 'bg-gray-600' : 'bg-gray-100'}`}
                  />
                  {form.price > 0 && (
                    <p className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      Auto-filled from inventory
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Notes & Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className={`text-sm mb-1 block ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Notes</label>
                <textarea
                  name="notes"
                  value={form.notes}
                  onChange={handleChange}
                  placeholder="Additional notes..."
                  rows={4}
                  disabled={loading}
                  className={`w-full rounded-lg px-3 py-2 transition-colors ${
                    darkMode 
                      ? 'bg-gray-700 text-gray-200 border border-gray-600' 
                      : 'bg-white text-gray-900 border border-gray-300'
                  }`}
                />
              </div>

              <div className={`rounded-lg p-5 space-y-3 transition-colors ${
                darkMode ? 'bg-gray-700 text-gray-200' : 'bg-gray-50 text-gray-900'
              }`}>
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>₦{subtotal.toLocaleString()}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span>Discount</span>
                  <input
                    type="number"
                    name="discount"
                    value={form.discount}
                    onChange={handleChange}
                    min="0"
                    disabled={loading}
                    className={`w-32 rounded px-2 py-1 text-right ${
                      darkMode 
                        ? 'bg-gray-600 text-gray-200 border border-gray-500' 
                        : 'bg-white text-gray-900 border border-gray-300'
                    }`}
                  />
                </div>

                <hr className={`${darkMode ? 'border-gray-600' : 'border-gray-300'}`} />

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
                disabled={loading}
                className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                  darkMode 
                    ? 'bg-gray-600 hover:bg-gray-500 text-gray-200' 
                    : 'bg-gray-300 hover:bg-gray-400 text-gray-800'
                } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={(e) => handleSubmit(e)}
                disabled={loading || items.length === 0 || customers.length === 0}
                className="px-6 py-2 rounded-lg font-medium bg-blue-600 hover:bg-blue-700 text-white transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    Save
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={(e) => handleSubmit(e, true)}
                disabled={loading || items.length === 0 || customers.length === 0}
                className={`px-6 py-2 rounded-lg font-medium border transition-colors ${
                  darkMode 
                    ? 'border-blue-600 text-blue-500 hover:bg-blue-600/20' 
                    : 'border-blue-600 text-blue-600 hover:bg-blue-50'
                } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                Save & Print
              </button>
            </div>
          </form>
        )}
      </div>
    </>
  );
}