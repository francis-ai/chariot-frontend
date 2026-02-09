import React, { useState } from "react";
import { useTheme } from "../../context/ThemeContext";
import { ArrowLeft, Truck } from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const CreateWaybill = ({ onBack, waybillData }) => {
  const { darkMode } = useTheme();

  const [form, setForm] = useState({
    customer: waybillData?.customer || "",
    pickupLocation: waybillData?.pickupLocation || "",
    deliveryLocation: waybillData?.deliveryLocation || "",
    driver: waybillData?.driver || "",
    vehicle: waybillData?.vehicle || "",
    waybillDate: waybillData?.waybillDate || "",
    status: waybillData?.status || "Pending",
    notes: waybillData?.notes || "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!form.customer || !form.pickupLocation || !form.deliveryLocation || !form.driver || !form.vehicle || !form.waybillDate) {
      toast.error("Please fill all required fields", { autoClose: 2500 });
      return;
    }

    console.log("Waybill Submitted:", form);
    toast.success(`Waybill ${waybillData ? "updated" : "created"} successfully!`, { autoClose: 2000 });

    // Reset or go back
    onBack();
  };

  const inputClass = `mt-1 w-full rounded-full px-4 py-2 text-sm outline-none transition-colors focus:ring-2 focus:ring-blue-500 ${
    darkMode ? "bg-slate-700 text-slate-200 border border-slate-600" : "bg-slate-100 text-slate-900 border border-slate-300"
  }`;

  const textareaClass = `mt-1 w-full rounded-2xl px-4 py-3 text-sm outline-none transition-colors focus:ring-2 focus:ring-blue-500 ${
    darkMode ? "bg-slate-700 text-slate-200 border border-slate-600" : "bg-slate-100 text-slate-900 border border-slate-300"
  }`;

  return (
    <div className={`min-h-screen p-8 transition-colors ${darkMode ? "bg-slate-900 text-slate-200" : "bg-gradient-to-br from-slate-50 to-slate-100 text-slate-900"}`}>
      <ToastContainer />

      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button onClick={onBack} className="p-2 rounded-full hover:bg-slate-200 transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className={`text-2xl font-semibold ${darkMode ? "text-slate-200" : "text-slate-900"}`}>
            {waybillData ? "Edit Waybill" : "Create Waybill"}
          </h1>
          <p className={`text-sm ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
            Fill in delivery and logistics details
          </p>
        </div>
      </div>

      {/* Form Card */}
      <div className={`rounded-2xl shadow-xl p-8 max-w-4xl mx-auto transition-colors ${darkMode ? "bg-slate-800" : "bg-white"}`}>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Customer */}
          <div>
            <label className="text-sm font-medium mb-1">Customer Name *</label>
            <input
              type="text"
              name="customer"
              value={form.customer}
              onChange={handleChange}
              placeholder="ABC Corporation"
              className={inputClass}
              required
            />
          </div>

          {/* Waybill Date */}
          <div>
            <label className="text-sm font-medium mb-1">Waybill Date *</label>
            <input
              type="date"
              name="waybillDate"
              value={form.waybillDate}
              onChange={handleChange}
              className={inputClass}
              required
            />
          </div>

          {/* Pickup Location */}
          <div>
            <label className="text-sm font-medium mb-1">Pickup Location *</label>
            <input
              type="text"
              name="pickupLocation"
              value={form.pickupLocation}
              onChange={handleChange}
              placeholder="Lagos Warehouse"
              className={inputClass}
              required
            />
          </div>

          {/* Delivery Location */}
          <div>
            <label className="text-sm font-medium mb-1">Delivery Location *</label>
            <input
              type="text"
              name="deliveryLocation"
              value={form.deliveryLocation}
              onChange={handleChange}
              placeholder="Abuja Office"
              className={inputClass}
              required
            />
          </div>

          {/* Driver */}
          <div>
            <label className="text-sm font-medium mb-1">Driver Name *</label>
            <input
              type="text"
              name="driver"
              value={form.driver}
              onChange={handleChange}
              placeholder="John Driver"
              className={inputClass}
              required
            />
          </div>

          {/* Vehicle */}
          <div>
            <label className="text-sm font-medium mb-1">Vehicle *</label>
            <input
              type="text"
              name="vehicle"
              value={form.vehicle}
              onChange={handleChange}
              placeholder="Toyota Hilux (ABC-123XY)"
              className={inputClass}
              required
            />
          </div>

          {/* Status */}
          <div>
            <label className="text-sm font-medium mb-1">Status</label>
            <select
              name="status"
              value={form.status}
              onChange={handleChange}
              className={inputClass}
            >
              <option>Pending</option>
              <option>In Transit</option>
              <option>Delivered</option>
            </select>
          </div>

          {/* Notes */}
          <div className="md:col-span-2">
            <label className="text-sm font-medium mb-1">Additional Notes</label>
            <textarea
              name="notes"
              value={form.notes}
              onChange={handleChange}
              rows={4}
              placeholder="Optional delivery instructions..."
              className={textareaClass}
            />
          </div>

          {/* Actions */}
          <div className="md:col-span-2 flex justify-end gap-4 mt-6">
            <button
              type="button"
              onClick={() => { toast.info("Waybill creation cancelled", { autoClose: 2000 }); onBack(); }}
              className={`px-6 py-2 rounded-full transition-colors font-medium ${darkMode ? "bg-slate-600 text-slate-200 hover:bg-slate-500" : "bg-gray-200 text-gray-700 hover:bg-gray-300"}`}
            >
              Cancel
            </button>

            <button
              type="submit"
              className={`flex items-center gap-2 px-6 py-2 rounded-full shadow-lg transition-colors font-medium ${darkMode ? "bg-blue-600 text-white hover:bg-blue-500" : "bg-blue-600 text-white hover:bg-blue-700"}`}
            >
              <Truck size={16} />
              {waybillData ? "Update Waybill" : "Create Waybill"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateWaybill;
