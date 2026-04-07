import React, { useMemo, useState } from "react";
import { toast, ToastContainer } from "react-toastify";
import { Plus, Save, X } from "lucide-react";
import "react-toastify/dist/ReactToastify.css";
import API from "../../utils/api";

const CreateQuotationForm = ({ onCancel, onSave, darkMode, customers = [], inventoryItems = [], onCustomerCreated }) => {
  const [formData, setFormData] = useState({
    customer: "",
    quotation_date: new Date().toISOString().split('T')[0],
    valid_until: "",
    vat_rate: 7.5,
    status: "Pending",
    notes: "",
    terms: "",
    signature_name: "",
    items: [
      {
        name: "",
        description: "",
        quantity: 1,
        price: 0,
      },
    ],
  });
  const [loading, setLoading] = useState(false);
  const [customerSearch, setCustomerSearch] = useState("");
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    name: "",
    company: "",
    phone: "",
    email: "",
    status: "Active",
  });

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
    if (!formData.items.length || formData.items.some((item) => !item.name || Number(item.quantity) <= 0 || Number(item.price) <= 0)) {
      toast.error("Add at least one valid item");
      return;
    }

    setLoading(true);
    try {
      const subtotal = formData.items.reduce((sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.price) || 0), 0);
      const vatAmount = subtotal * (Number(formData.vat_rate) || 0) / 100;
      const total = subtotal + vatAmount;

      await onSave({
        ...formData,
        subtotal,
        vat_amount: vatAmount,
        amount: total,
        items_json: JSON.stringify(formData.items),
      });
      
      // Reset form on success
      setFormData({
        customer: "",
        quotation_date: new Date().toISOString().split('T')[0],
        valid_until: "",
        vat_rate: 7.5,
        status: "Pending",
        notes: "",
        terms: "",
        signature_name: "",
        items: [
          {
            name: "",
            description: "",
            quantity: 1,
            price: 0,
          },
        ],
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

  const filteredCustomers = customers.filter((customer) => {
    const searchValue = customerSearch.trim().toLowerCase();
    if (!searchValue) return true;
    return [customer.name, customer.company, customer.email]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(searchValue));
  });

  const formatCustomerLabel = (customer) => {
    return [customer.company, customer.name].filter(Boolean).join(" - ") || customer.company || customer.name || "";
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
        setFormData((prev) => ({
          ...prev,
          customer: formatCustomerLabel(created),
          signature_name: created.name || created.company || "",
        }));
      }

      setNewCustomer({ name: "", company: "", phone: "", email: "", status: "Active" });
      setShowCustomerModal(false);
      toast.success("Customer added successfully");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to add customer");
    }
  };

  const subtotal = formData.items.reduce((sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.price) || 0), 0);
  const vatAmount = subtotal * (Number(formData.vat_rate) || 0) / 100;
  const total = subtotal + vatAmount;

  const itemOptions = useMemo(() => {
    return inventoryItems.map((inv) => ({
      id: inv.id,
      label: inv.product_name || inv.name || `Item ${inv.id}`,
      price: Number(inv.selling_price || inv.price || 0),
      description: inv.description || "",
    }));
  }, [inventoryItems]);

  const updateItem = (index, field, value) => {
    setFormData((prev) => {
      const items = [...prev.items];
      items[index] = { ...items[index], [field]: value };
      return { ...prev, items };
    });
  };

  const addItem = () => {
    setFormData((prev) => ({
      ...prev,
      items: [...prev.items, { name: "", description: "", quantity: 1, price: 0 }],
    }));
  };

  const removeItem = (index) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.length > 1 ? prev.items.filter((_, itemIndex) => itemIndex !== index) : prev.items,
    }));
  };

  return (
    <div className={`rounded-xl shadow-sm p-8 mb-10 transition-colors ${darkMode ? "bg-gray-800" : "bg-white"}`}>
      <ToastContainer />

      <h2 className={`text-xl font-semibold mb-6 ${darkMode ? "text-gray-200" : "text-gray-800"}`}>
        Create New Quotation
      </h2>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Customer Select */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className={`block text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
              Customer *
            </label>
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
            disabled={loading}
          />
          <select
            name="customer"
            value={formData.customer}
            onChange={handleChange}
            className={inputClass}
            required
            disabled={loading}
          >
            <option value="">Select Customer</option>
            {filteredCustomers.map(customer => (
              <option key={customer.id || customer._id} value={formatCustomerLabel(customer)}>
                {formatCustomerLabel(customer)}
              </option>
            ))}
          </select>
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
            <option value="Accepted">Accepted</option>
            <option value="Paid">Paid</option>
            <option value="Unpaid">Unpaid</option>
            <option value="Expired">Expired</option>
          </select>
        </div>

        <div>
          <label className={`block text-sm font-medium mb-1 ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
            VAT Rate (%)
          </label>
          <input
            type="number"
            name="vat_rate"
            value={formData.vat_rate}
            onChange={handleChange}
            min="0"
            step="0.1"
            className={inputClass}
            disabled={loading}
          />
        </div>

        <div>
          <label className={`block text-sm font-medium mb-1 ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
            Authorized Signature
          </label>
          <input
            type="text"
            name="signature_name"
            value={formData.signature_name}
            onChange={handleChange}
            placeholder="Enter signatory name"
            className={inputClass}
            disabled={loading}
          />
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

        <div className="md:col-span-2 space-y-4">
          <div className="flex items-center justify-between gap-4">
            <h3 className={`text-sm font-semibold ${darkMode ? "text-gray-200" : "text-gray-700"}`}>Quotation Items</h3>
            <button
              type="button"
              onClick={addItem}
              disabled={loading}
              className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700"
            >
              Add Item
            </button>
          </div>

          <div className="space-y-4">
            {formData.items.map((item, index) => (
              <div key={index} className={`grid grid-cols-1 md:grid-cols-12 gap-3 p-4 rounded-xl border ${darkMode ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-gray-50"}`}>
                <div className="md:col-span-3">
                  <label className={`block text-xs font-medium mb-1 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>Item name</label>
                  <select
                    value={item.name}
                    onChange={(e) => {
                      const selectedName = e.target.value;
                      const selected = itemOptions.find((opt) => opt.label === selectedName);
                      updateItem(index, "name", selectedName);
                      if (selected) {
                        if (!item.description) updateItem(index, "description", selected.description);
                        if (!Number(item.price)) updateItem(index, "price", selected.price);
                      }
                    }}
                    className={inputClass}
                    disabled={loading}
                  >
                    <option value="">Select Item</option>
                    {itemOptions.map((option) => (
                      <option key={option.id} value={option.label}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-4">
                  <label className={`block text-xs font-medium mb-1 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>Description</label>
                  <input
                    type="text"
                    value={item.description}
                    onChange={(e) => updateItem(index, "description", e.target.value)}
                    className={inputClass}
                    placeholder="Description"
                    disabled={loading}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className={`block text-xs font-medium mb-1 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>Qty</label>
                  <input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => updateItem(index, "quantity", e.target.value)}
                    className={inputClass}
                    disabled={loading}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className={`block text-xs font-medium mb-1 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>Price</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.price}
                    onChange={(e) => updateItem(index, "price", e.target.value)}
                    className={inputClass}
                    disabled={loading}
                  />
                </div>
                <div className="md:col-span-1 flex items-end justify-end">
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    disabled={loading || formData.items.length === 1}
                    className="px-3 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-50"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-xl border ${darkMode ? "border-gray-700 bg-gray-900" : "border-gray-200 bg-white"}`}>
            <div>
              <p className="text-sm opacity-70">Subtotal</p>
              <p className="text-lg font-semibold">₦{subtotal.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm opacity-70">VAT</p>
              <p className="text-lg font-semibold">₦{vatAmount.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm opacity-70">Total</p>
              <p className="text-lg font-semibold">₦{total.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="md:col-span-2">
          <label className={`block text-sm font-medium mb-1 ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
            Terms and Conditions
          </label>
          <textarea
            name="terms"
            value={formData.terms}
            onChange={handleChange}
            rows={4}
            placeholder="Enter quotation terms and conditions..."
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
    </div>
  );
};

export default CreateQuotationForm;