import React, { useState, useEffect } from "react";
import { useTheme } from "../../context/ThemeContext";
import { Save, X } from "lucide-react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const WaybillForm = ({ onCancel, onSave, waybillData, submitting }) => {
  const { darkMode } = useTheme();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    customer: "",
    pickup_location: "",
    delivery_location: "",
    driver: "",
    vehicle: "",
    waybill_date: new Date().toISOString().split('T')[0],
    status: "Pending",
    notes: "",
  });

  // Load data if editing
  useEffect(() => {
    if (waybillData) {
      console.log("Loading waybill data into form:", waybillData);
      
      setForm({
        customer: waybillData.customer || "",
        pickup_location: waybillData.pickup_location || "",
        delivery_location: waybillData.delivery_location || "",
        driver: waybillData.driver || "",
        vehicle: waybillData.vehicle || "",
        waybill_date: waybillData.waybill_date || new Date().toISOString().split('T')[0],
        status: waybillData.status || "Pending",
        notes: waybillData.notes || "",
      });
    }
  }, [waybillData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!form.customer?.trim()) {
      toast.error("Customer name is required");
      return;
    }
    if (!form.pickup_location?.trim()) {
      toast.error("Pickup location is required");
      return;
    }
    if (!form.delivery_location?.trim()) {
      toast.error("Delivery location is required");
      return;
    }
    if (!form.driver?.trim()) {
      toast.error("Driver name is required");
      return;
    }
    if (!form.vehicle?.trim()) {
      toast.error("Vehicle details are required");
      return;
    }
    if (!form.waybill_date) {
      toast.error("Waybill date is required");
      return;
    }

    setLoading(true);
    try {
      // Log the form data being submitted
      console.log("Form data being submitted:", form);
      
      await onSave(form);
    } catch (err) {
      console.error("Form submission error:", err);
    } finally {
      setLoading(false);
    }
  };

  const inputClass = `w-full rounded-xl px-4 py-3 text-sm outline-none transition-colors focus:ring-2 focus:ring-blue-500 ${
    darkMode 
      ? "bg-gray-700 text-gray-200 border border-gray-600" 
      : "bg-gray-100 text-gray-900 border border-gray-200"
  }`;

  const textareaClass = `w-full rounded-xl px-4 py-3 text-sm outline-none transition-colors focus:ring-2 focus:ring-blue-500 ${
    darkMode 
      ? "bg-gray-700 text-gray-200 border border-gray-600" 
      : "bg-gray-100 text-gray-900 border border-gray-200"
  }`;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Customer */}
        <div>
          <label className="text-sm font-medium mb-1 block">Customer Name *</label>
          <input
            type="text"
            name="customer"
            value={form.customer}
            onChange={handleChange}
            placeholder="ABC Corporation"
            className={inputClass}
            required
            disabled={loading || submitting}
          />
        </div>

        {/* Waybill Date */}
        <div>
          <label className="text-sm font-medium mb-1 block">Waybill Date *</label>
          <input
            type="date"
            name="waybill_date"
            value={form.waybill_date}
            onChange={handleChange}
            className={inputClass}
            required
            disabled={loading || submitting}
          />
        </div>

        {/* Pickup Location */}
        <div>
          <label className="text-sm font-medium mb-1 block">Pickup Location *</label>
          <input
            type="text"
            name="pickup_location"
            value={form.pickup_location}
            onChange={handleChange}
            placeholder="Lagos Warehouse"
            className={inputClass}
            required
            disabled={loading || submitting}
          />
        </div>

        {/* Delivery Location */}
        <div>
          <label className="text-sm font-medium mb-1 block">Delivery Location *</label>
          <input
            type="text"
            name="delivery_location"
            value={form.delivery_location}
            onChange={handleChange}
            placeholder="Abuja Office"
            className={inputClass}
            required
            disabled={loading || submitting}
          />
        </div>

        {/* Driver */}
        <div>
          <label className="text-sm font-medium mb-1 block">Driver Name *</label>
          <input
            type="text"
            name="driver"
            value={form.driver}
            onChange={handleChange}
            placeholder="John Driver"
            className={inputClass}
            required
            disabled={loading || submitting}
          />
        </div>

        {/* Vehicle */}
        <div>
          <label className="text-sm font-medium mb-1 block">Vehicle *</label>
          <input
            type="text"
            name="vehicle"
            value={form.vehicle}
            onChange={handleChange}
            placeholder="Toyota Hilux (ABC-123XY)"
            className={inputClass}
            required
            disabled={loading || submitting}
          />
        </div>

        {/* Status */}
        <div>
          <label className="text-sm font-medium mb-1 block">Status</label>
          <select
            name="status"
            value={form.status}
            onChange={handleChange}
            className={inputClass}
            disabled={loading || submitting}
          >
            <option value="Pending">Pending</option>
            <option value="In Transit">In Transit</option>
            <option value="Delivered">Delivered</option>
          </select>
        </div>

        {/* Notes - Full width */}
        <div className="md:col-span-2">
          <label className="text-sm font-medium mb-1 block">Additional Notes</label>
          <textarea
            name="notes"
            value={form.notes}
            onChange={handleChange}
            rows={3}
            placeholder="Optional delivery instructions..."
            className={textareaClass}
            disabled={loading || submitting}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 mt-6">
        <button
          type="button"
          onClick={onCancel}
          disabled={loading || submitting}
          className={`px-6 py-2.5 rounded-xl transition-colors font-medium flex items-center gap-2 ${
            darkMode 
              ? "bg-gray-700 text-gray-200 hover:bg-gray-600" 
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          } ${(loading || submitting) ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <X size={18} />
          Cancel
        </button>

        <button
          type="submit"
          disabled={loading || submitting}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium transition disabled:opacity-50"
        >
          {(loading || submitting) ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              {waybillData ? 'Updating...' : 'Creating...'}
            </>
          ) : (
            <>
              <Save size={18} />
              {waybillData ? 'Update Waybill' : 'Create Waybill'}
            </>
          )}
        </button>
      </div>
    </form>
  );
};

export default WaybillForm;