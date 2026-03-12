import React, { useState } from "react";
import { useTheme } from "../../context/ThemeContext";
import { toast, ToastContainer } from "react-toastify";
import { Save, X } from "lucide-react";
import "react-toastify/dist/ReactToastify.css";

const CreateQuotationForm = ({ onCancel, onSave, darkMode, customers = [] }) => {
  const [formData, setFormData] = useState({
    customer: "",
    quotation_date: new Date().toISOString().split('T')[0],
    valid_until: "",
    amount: "",
    status: "Pending",
    notes: "",
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.customer) {
      toast.error("Please select a customer");
      return;
    }
    if (!formData.quotation_date) {
      toast.error("Quotation date is required");
      return;
    }
    if (!formData.valid_until) {
      toast.error("Valid until date is required");
      return;
    }
    if (!formData.amount || formData.amount <= 0) {
      toast.error("Valid amount is required");
      return;
    }

    setLoading(true);
    try {
      await onSave(formData);
      
      // Reset form on success
      setFormData({
        customer: "",
        quotation_date: new Date().toISOString().split('T')[0],
        valid_until: "",
        amount: "",
        status: "Pending",
        notes: "",
      });
    } catch (err) {
      console.error("Form submission error:", err);
    } finally {
      setLoading(false);
    }
  };

  const inputClass = `w-full px-4 py-2.5 rounded-lg outline-none transition-colors focus:ring-2 focus:ring-blue-500 ${
    darkMode ? "bg-gray-700 text-gray-200 border border-gray-600" : "bg-gray-50 text-gray-900 border border-gray-300"
  }`;

  return (
    <div className={`rounded-xl shadow-sm p-8 mb-10 transition-colors ${darkMode ? "bg-gray-800" : "bg-white"}`}>
      <ToastContainer />

      <h2 className={`text-xl font-semibold mb-6 ${darkMode ? "text-gray-200" : "text-gray-800"}`}>
        Create New Quotation
      </h2>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Customer Select */}
        <div>
          <label className={`block text-sm font-medium mb-1 ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
            Customer *
          </label>
          <select
            name="customer"
            value={formData.customer}
            onChange={handleChange}
            className={inputClass}
            required
            disabled={loading}
          >
            <option value="">Select Customer</option>
            {customers.map(customer => (
              <option key={customer.id} value={customer.company}>
                {customer.company}
              </option>
            ))}
          </select>
        </div>

        {/* Amount */}
        <div>
          <label className={`block text-sm font-medium mb-1 ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
            Amount (₦) *
          </label>
          <input
            type="number"
            name="amount"
            value={formData.amount}
            onChange={handleChange}
            placeholder="245000"
            className={inputClass}
            min="0"
            step="0.01"
            required
            disabled={loading}
          />
        </div>

        {/* Quotation Date */}
        <div>
          <label className={`block text-sm font-medium mb-1 ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
            Quotation Date *
          </label>
          <input
            type="date"
            name="quotation_date"
            value={formData.quotation_date}
            onChange={handleChange}
            className={inputClass}
            required
            disabled={loading}
          />
        </div>

        {/* Valid Until */}
        <div>
          <label className={`block text-sm font-medium mb-1 ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
            Valid Until *
          </label>
          <input
            type="date"
            name="valid_until"
            value={formData.valid_until}
            onChange={handleChange}
            className={inputClass}
            required
            disabled={loading}
          />
        </div>

        {/* Status */}
        <div>
          <label className={`block text-sm font-medium mb-1 ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
            Status
          </label>
          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
            className={inputClass}
            disabled={loading}
          >
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Expired">Expired</option>
          </select>
        </div>

        {/* Notes */}
        <div className="md:col-span-2">
          <label className={`block text-sm font-medium mb-1 ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
            Notes (Optional)
          </label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            placeholder="Additional details about this quotation..."
            rows={4}
            className={inputClass}
            disabled={loading}
          />
        </div>

        {/* Actions */}
        <div className="md:col-span-2 flex justify-end gap-4 mt-4">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className={`px-6 py-2.5 rounded-lg transition-colors font-medium flex items-center gap-2 ${
              darkMode 
                ? "bg-gray-600 text-gray-200 hover:bg-gray-500" 
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <X size={18} />
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 rounded-lg transition-colors font-medium bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Saving...
              </>
            ) : (
              <>
                <Save size={18} />
                Save Quotation
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateQuotationForm;