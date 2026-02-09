import React, { useState } from "react";
import { useTheme } from "../../context/ThemeContext";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const CreateQuotationForm = () => {
  const { darkMode } = useTheme();
  const [formData, setFormData] = useState({
    customer: "",
    quotationDate: "",
    validUntil: "",
    amount: "",
    status: "Pending",
    notes: "",
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.customer || !formData.quotationDate || !formData.validUntil || !formData.amount) {
      toast.error("Please fill all required fields", { autoClose: 2500 });
      return;
    }

    toast.success("Quotation saved successfully!", { autoClose: 2000 });
    console.log("Quotation Submitted:", formData);

    // Reset form
    setFormData({
      customer: "",
      quotationDate: "",
      validUntil: "",
      amount: "",
      status: "Pending",
      notes: "",
    });
  };

  const handleCancel = () => {
    toast.info("Quotation creation cancelled", { autoClose: 2000 });
    setFormData({
      customer: "",
      quotationDate: "",
      validUntil: "",
      amount: "",
      status: "Pending",
      notes: "",
    });
  };

  const inputClass = `w-full px-4 py-2.5 rounded-lg outline-none transition-colors focus:ring-2 focus:ring-blue-500 ${
    darkMode ? "bg-slate-700 text-slate-200 border border-slate-600" : "bg-gray-50 text-gray-900 border border-gray-300"
  }`;

  return (
    <div className={`rounded-xl shadow-sm p-8 mb-10 transition-colors ${darkMode ? "bg-slate-800" : "bg-white"}`}>
      <ToastContainer />

      <h2 className={`text-xl font-semibold mb-6 ${darkMode ? "text-slate-200" : "text-slate-800"}`}>
        Create New Quotation
      </h2>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Customer */}
        <div>
          <label className={`block text-sm font-medium mb-1 ${darkMode ? "text-slate-300" : "text-gray-600"}`}>
            Customer Name *
          </label>
          <input
            type="text"
            name="customer"
            value={formData.customer}
            onChange={handleChange}
            placeholder="ABC Corporation"
            className={inputClass}
            required
          />
        </div>

        {/* Amount */}
        <div>
          <label className={`block text-sm font-medium mb-1 ${darkMode ? "text-slate-300" : "text-gray-600"}`}>
            Amount (₦) *
          </label>
          <input
            type="number"
            name="amount"
            value={formData.amount}
            onChange={handleChange}
            placeholder="245000"
            className={inputClass}
            required
          />
        </div>

        {/* Quotation Date */}
        <div>
          <label className={`block text-sm font-medium mb-1 ${darkMode ? "text-slate-300" : "text-gray-600"}`}>
            Quotation Date *
          </label>
          <input
            type="date"
            name="quotationDate"
            value={formData.quotationDate}
            onChange={handleChange}
            className={inputClass}
            required
          />
        </div>

        {/* Valid Until */}
        <div>
          <label className={`block text-sm font-medium mb-1 ${darkMode ? "text-slate-300" : "text-gray-600"}`}>
            Valid Until *
          </label>
          <input
            type="date"
            name="validUntil"
            value={formData.validUntil}
            onChange={handleChange}
            className={inputClass}
            required
          />
        </div>

        {/* Status */}
        <div>
          <label className={`block text-sm font-medium mb-1 ${darkMode ? "text-slate-300" : "text-gray-600"}`}>
            Status
          </label>
          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
            className={inputClass}
          >
            <option value="Pending">Pending</option>
            <option value="Accepted">Accepted</option>
            <option value="Expired">Expired</option>
          </select>
        </div>

        {/* Notes */}
        <div className="md:col-span-2">
          <label className={`block text-sm font-medium mb-1 ${darkMode ? "text-slate-300" : "text-gray-600"}`}>
            Notes (Optional)
          </label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            placeholder="Additional details about this quotation..."
            rows={4}
            className={inputClass}
          />
        </div>

        {/* Actions */}
        <div className="md:col-span-2 flex justify-end gap-4 mt-4">
          <button
            type="button"
            onClick={handleCancel}
            className={`px-6 py-2.5 rounded-lg transition-colors font-medium ${
              darkMode ? "bg-slate-600 text-slate-200 hover:bg-slate-500" : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            Cancel
          </button>
          <button
            type="submit"
            className={`px-6 py-2.5 rounded-lg transition-colors font-medium ${
              darkMode ? "bg-blue-600 text-white hover:bg-blue-500" : "bg-blue-600 text-white hover:bg-blue-700 shadow"
            }`}
          >
            Save Quotation
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateQuotationForm;
