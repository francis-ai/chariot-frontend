import React, { useState, useEffect } from "react";
import { useTheme } from "../../context/ThemeContext";
import { Plus, Save, X } from "lucide-react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import API from "../../utils/api";

const WaybillForm = ({ onCancel, onSave, waybillData, submitting, customers = [], onCustomerCreated }) => {
  const { darkMode } = useTheme();
  const [loading, setLoading] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [customerSearch, setCustomerSearch] = useState("");
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    name: "",
    company: "",
    phone: "",
    email: "",
    status: "Active",
  });
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

  useEffect(() => {
    if (!customers.length || !form.customer) return;

    const matched = customers.find((customer) => {
      const label = [customer.company, customer.name].filter(Boolean).join(" - ");
      return form.customer === label || form.customer === customer.company || form.customer === customer.name;
    });

    if (matched) {
      setSelectedCustomerId(String(matched.id || matched._id));
    }
  }, [customers, form.customer]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const formatCustomerLabel = (customer) => {
    return [customer.company, customer.name].filter(Boolean).join(" - ") || customer.company || customer.name || "";
  };

  const filteredCustomers = customers.filter((customer) => {
    const searchValue = customerSearch.trim().toLowerCase();
    if (!searchValue) return true;
    return [customer.name, customer.company, customer.email]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(searchValue));
  });

  const handleCustomerChange = (e) => {
    const selectedId = e.target.value;
    setSelectedCustomerId(selectedId);

    const selectedCustomer = customers.find(
      (customer) => String(customer.id || customer._id) === String(selectedId)
    );

    if (!selectedCustomer) {
      setForm((prev) => ({ ...prev, customer: "" }));
      return;
    }

    setForm((prev) => ({ ...prev, customer: formatCustomerLabel(selectedCustomer) }));
  };

  const handleCreateCustomer = async () => {
    if (!newCustomer.name || !newCustomer.company) {
      toast.error("Customer name and company are required");
      return;
    }

    try {
      await API.post("/customers", newCustomer);
      const refreshed = onCustomerCreated ? await onCustomerCreated() : [];
      const customerList = Array.isArray(refreshed) ? refreshed : [];

      const created = customerList.find(
        (customer) =>
          customer.email === newCustomer.email ||
          (customer.name === newCustomer.name && customer.company === newCustomer.company)
      );

      if (created) {
        setSelectedCustomerId(String(created.id || created._id));
        setForm((prev) => ({ ...prev, customer: formatCustomerLabel(created) }));
      }

      setNewCustomer({ name: "", company: "", phone: "", email: "", status: "Active" });
      setShowCustomerModal(false);
      toast.success("Customer added successfully");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to add customer");
    }
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
          <div className="flex items-center justify-between mb-1">
            <label className="text-sm font-medium block">Customer Name *</label>
            <button
              type="button"
              onClick={() => setShowCustomerModal(true)}
              className="text-xs inline-flex items-center gap-1 px-2 py-1 rounded bg-blue-600 text-white hover:bg-blue-700"
            >
              <Plus size={12} /> Create customer
            </button>
          </div>
          <input
            type="text"
            value={customerSearch}
            onChange={(e) => setCustomerSearch(e.target.value)}
            placeholder="Search customer by name or company"
            className={`${inputClass} mb-2`}
            disabled={loading || submitting}
          />
          <select
            name="customer"
            value={selectedCustomerId}
            onChange={handleCustomerChange}
            className={inputClass}
            required
            disabled={loading || submitting}
          >
            <option value="">Select Customer</option>
            {filteredCustomers.map((customer) => (
              <option key={customer.id || customer._id} value={String(customer.id || customer._id)}>
                {formatCustomerLabel(customer)}
              </option>
            ))}
          </select>
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

      {showCustomerModal && (
        <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4">
          <div className={`w-full max-w-md rounded-xl p-6 shadow-xl ${darkMode ? "bg-gray-800 text-gray-200" : "bg-white text-gray-800"}`}>
            <h3 className="text-lg font-semibold mb-4">Create Customer</h3>

            <div className="space-y-3">
              <input
                type="text"
                placeholder="Customer name"
                value={newCustomer.name}
                onChange={(e) => setNewCustomer((prev) => ({ ...prev, name: e.target.value }))}
                className={inputClass}
              />
              <input
                type="text"
                placeholder="Company"
                value={newCustomer.company}
                onChange={(e) => setNewCustomer((prev) => ({ ...prev, company: e.target.value }))}
                className={inputClass}
              />
              <input
                type="text"
                placeholder="Phone"
                value={newCustomer.phone}
                onChange={(e) => setNewCustomer((prev) => ({ ...prev, phone: e.target.value }))}
                className={inputClass}
              />
              <input
                type="email"
                placeholder="Email"
                value={newCustomer.email}
                onChange={(e) => setNewCustomer((prev) => ({ ...prev, email: e.target.value }))}
                className={inputClass}
              />
            </div>

            <div className="flex justify-end gap-3 mt-5">
              <button
                type="button"
                onClick={() => setShowCustomerModal(false)}
                className={`px-4 py-2 rounded-lg ${darkMode ? "bg-gray-700 hover:bg-gray-600" : "bg-gray-200 hover:bg-gray-300"}`}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateCustomer}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </form>
  );
};

export default WaybillForm;