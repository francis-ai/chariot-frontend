import React, { useEffect, useMemo, useRef, useState } from "react";
import { toast, ToastContainer } from "react-toastify";
import { Plus, Save, X } from "lucide-react";
import "react-toastify/dist/ReactToastify.css";
import API from "../../utils/api";

// Default VAT rates per currency
const DEFAULT_VAT_RATES = {
  "NGN": 7.5,
  "USD": 0,
  "EUR": 19,
  "GBP": 20,
  "AUD": 10,
  "CAD": 5,
  "JPY": 10,
  "INR": 5,
};

const getDefaultVatRate = (currencyCode, currencies) => {
  const code = String(currencyCode || "NGN").toUpperCase();
  const matched = (Array.isArray(currencies) ? currencies : []).find(
    (row) => String(row.code || "").toUpperCase() === code
  );
  if (matched && Number.isFinite(Number(matched.vat_rate))) {
    return Number(matched.vat_rate);
  }
  return DEFAULT_VAT_RATES[code] || 0;
};

const normalizeArrayPayload = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.rows)) return payload.rows;
  return [];
};

const resolveRateToNgn = (currencyCode, currencies) => {
  const code = String(currencyCode || "NGN").toUpperCase();
  const matched = (Array.isArray(currencies) ? currencies : []).find(
    (row) => String(row.code || "").toUpperCase() === code
  );
  const rate = Number(matched?.rate_to_ngn);
  return Number.isFinite(rate) && rate > 0 ? rate : 1;
};

const convertAmount = (amount, fromCurrency, toCurrency, currencies) => {
  const fromRate = resolveRateToNgn(fromCurrency, currencies);
  const toRate = resolveRateToNgn(toCurrency, currencies);
  const numericAmount = Number(amount || 0);
  return Number.isFinite(numericAmount) ? (numericAmount * fromRate) / toRate : 0;
};

const roundToTwoDecimals = (value) => Number(Number(value || 0).toFixed(2));

const formatMoney = (amount, currencyCode) => {
  const code = String(currencyCode || "NGN").toUpperCase();
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: code,
      maximumFractionDigits: 2,
    }).format(Number(amount || 0));
  } catch (error) {
    return `${code} ${Number(amount || 0).toLocaleString()}`;
  }
};

const CreateQuotationForm = ({ onCancel, onSave, darkMode, customers = [], inventoryItems = [], onCustomerCreated, documentLabel = "Quotation", documentType = "quotation" }) => {
  const [formData, setFormData] = useState({
    customer: "",
    quotation_date: new Date().toISOString().split('T')[0],
    valid_until: "",
    currency: "NGN",
    discount_rate: 0,
    vat_rate: 7.5,
    status: "Pending",
    notes: "",
    terms: "",
    items: [
      {
        name: "",
        item_code: "",
        description: "",
        quantity: 1,
        price: 0,
        manual: true,
      },
    ],
  });
  const [loading, setLoading] = useState(false);
  const [customerSearch, setCustomerSearch] = useState("");
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showItemModal, setShowItemModal] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    name: "",
    company: "",
    phone: "",
    email: "",
    address: "",
    status: "Active",
  });
  const [newItem, setNewItem] = useState({
    product_name: "",
    category: "General",
    current_stock: "",
    min_stock: "",
    purchase_price: "",
    selling_price: "",
  });
  const [currencies, setCurrencies] = useState([]);
  const [loadingCurrencies, setLoadingCurrencies] = useState(true);
  const previousCurrencyRef = useRef("NGN");

  const safeCurrencies = Array.isArray(currencies) ? currencies : [];

  const currencyOptions = useMemo(() => {
    const fromDb = safeCurrencies
      .map((row) => String(row.code || "").toUpperCase())
      .filter(Boolean);
    return Array.from(new Set(["NGN", ...fromDb]));
  }, [safeCurrencies]);

  const selectedCurrencyRate = useMemo(
    () => resolveRateToNgn(formData.currency, safeCurrencies),
    [formData.currency, safeCurrencies]
  );

  useEffect(() => {
    const fetchCurrencies = async () => {
      try {
        setLoadingCurrencies(true);
        const res = await API.get("/currencies");
        const rows = normalizeArrayPayload(res.data).map((row) => ({
          ...row,
          code: String(row.code || "").toUpperCase(),
          rate_to_ngn: Number(row.rate_to_ngn || 1),
        }));
        setCurrencies(rows);
      } catch (error) {
        console.error("Fetch currencies error:", error);
        toast.error("Failed to load currencies");
        setCurrencies([{ code: "NGN", name: "Nigerian Naira", rate_to_ngn: 1 }]);
      } finally {
        setLoadingCurrencies(false);
      }
    };

    fetchCurrencies();
  }, []);

  useEffect(() => {
    previousCurrencyRef.current = String(formData.currency || "NGN").toUpperCase();
  }, []);

  useEffect(() => {
    const prevCurrency = String(previousCurrencyRef.current || "NGN").toUpperCase();
    const nextCurrency = String(formData.currency || "NGN").toUpperCase();
    if (prevCurrency === nextCurrency) return;

    // Get the default VAT rate for the selected currency
    const newVatRate = getDefaultVatRate(nextCurrency, safeCurrencies);

    setFormData((prev) => ({
      ...prev,
      vat_rate: newVatRate,
      items: prev.items.map((item) => ({
        ...item,
        price: roundToTwoDecimals(convertAmount(item.price, prevCurrency, nextCurrency, safeCurrencies)),
      })),
    }));

    previousCurrencyRef.current = nextCurrency;
  }, [formData.currency, safeCurrencies]);

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
      toast.error(`${documentLabel} date is required`);
      return;
    }
    if (!formData.valid_until) {
      toast.error("Valid until date is required");
      return;
    }
    if (!formData.items.length || formData.items.some((item) => !item.name || Number(item.quantity) <= 0 || Number(item.price) < 0)) {
      toast.error("Add at least one valid item with price");
      return;
    }

    setLoading(true);
    try {
      const selectedCurrency = String(formData.currency || "NGN").trim().toUpperCase();
      const subtotal = formData.items.reduce((sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.price) || 0), 0);
      const discountRate = Math.max(0, Math.min(100, Number(formData.discount_rate || 0)));
      const discountAmount = (subtotal * discountRate) / 100;
      const taxableSubtotal = Math.max(0, subtotal - discountAmount);
      const vatAmount = taxableSubtotal * (Number(formData.vat_rate) || 0) / 100;
      const total = taxableSubtotal + vatAmount;

      const lowStockRows = formData.items
        .map((item) => {
          const selected = inventoryItems.find((inv) => (inv.product_name || inv.name || "") === item.name);
          const available = Number(selected?.current_stock || 0);
          return {
            ...item,
            available,
            isLow: Number(item.quantity || 0) > available,
          };
        })
        .filter((item) => item.name && item.isLow);

      if (lowStockRows.length > 0) {
        const message = lowStockRows
          .map((item) => `${item.name}: requested ${item.quantity}, available ${item.available}`)
          .join(" | ");
        toast.error(`Low stock detected. ${message}`);
        return;
      }

      await onSave({
        ...formData,
        currency: selectedCurrency,
        subtotal,
        discount_rate: discountRate,
        discount_amount: discountAmount,
        taxable_subtotal: taxableSubtotal,
        vat_amount: vatAmount,
        amount: total,
        items_json: JSON.stringify({
          items: formData.items,
          discount_rate: discountRate,
          discount_amount: discountAmount,
          subtotal_before_discount: subtotal,
        }),
      });
      
      // Reset form on success
      setFormData({
        customer: "",
        quotation_date: new Date().toISOString().split('T')[0],
        valid_until: "",
        currency: "NGN",
        discount_rate: 0,
        vat_rate: 7.5,
        status: "Pending",
        notes: "",
        terms: "",
        items: [
          {
            name: "",
            item_code: "",
            description: "",
            quantity: 1,
            price: 0,
            manual: true,
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
        }));
      }

      setNewCustomer({ name: "", company: "", phone: "", email: "", address: "", status: "Active" });
      setShowCustomerModal(false);
      toast.success("Customer added successfully");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to add customer");
    }
  };

  const handleCreateItem = async () => {
    if (!newItem.product_name?.trim()) {
      toast.error("Item name is required");
      return;
    }

    try {
      await API.post("/inventory", {
        ...newItem,
        current_stock: Number(newItem.current_stock || 0),
        min_stock: Number(newItem.min_stock || 0),
        purchase_price: Number(newItem.purchase_price || 0),
        selling_price: Number(newItem.selling_price || 0),
        sku: `SKU-${Date.now()}`,
      });
      toast.success("Item added successfully");
      setShowItemModal(false);
      setNewItem({
        product_name: "",
        category: "General",
        current_stock: "",
        min_stock: "",
        purchase_price: "",
        selling_price: "",
      });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to add item");
    }
  };

  const subtotal = formData.items.reduce((sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.price) || 0), 0);
  const discountRate = Math.max(0, Math.min(100, Number(formData.discount_rate || 0)));
  const discountAmount = (subtotal * discountRate) / 100;
  const taxableSubtotal = Math.max(0, subtotal - discountAmount);
  const vatAmount = taxableSubtotal * (Number(formData.vat_rate) || 0) / 100;
  const total = taxableSubtotal + vatAmount;

  const getAvailableStock = (itemName) => {
    const selected = inventoryItems.find((inv) => (inv.product_name || inv.name || "") === itemName);
    return Number(selected?.current_stock || 0);
  };

  const itemOptions = useMemo(() => {
    return inventoryItems.map((inv) => ({
      id: inv.id,
      label: inv.product_name || inv.name || `Item ${inv.id}`,
      item_code: inv.item_code || "",
      price: roundToTwoDecimals(inv.selling_price || inv.price || 0),
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
      items: [...prev.items, { name: "", item_code: "", description: "", quantity: 1, price: 0, manual: true }],
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
        {`Create New ${documentLabel}`}
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

        {/* Document Date */}
        <div>
          <label className={`block text-sm font-medium mb-1 ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
            {`${documentLabel} Date *`}
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
            Discount (%)
          </label>
          <input
            type="number"
            name="discount_rate"
            value={formData.discount_rate}
            onChange={handleChange}
            min="0"
            max="100"
            step="0.1"
            className={inputClass}
            disabled={loading}
          />
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
            Currency *
          </label>
          <select
            name="currency"
            value={formData.currency}
            onChange={handleChange}
            className={inputClass}
            disabled={loading || loadingCurrencies}
          >
            {currencyOptions.map((currency) => (
              <option key={currency} value={currency}>{currency}</option>
            ))}
          </select>
          <p className="text-xs mt-1 opacity-80">Rate: 1 {formData.currency} = {selectedCurrencyRate.toLocaleString()} NGN</p>
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
            placeholder={`Additional details about this ${documentLabel.toLowerCase()}...`}
            rows={4}
            className={inputClass}
            disabled={loading}
          />
        </div>

        <div className="md:col-span-2 space-y-4">
          <div className="flex items-center justify-between gap-4">
            <h3 className={`text-sm font-semibold ${darkMode ? "text-gray-200" : "text-gray-700"}`}>{`${documentLabel} Items`}</h3>
          </div>

          <div className="space-y-4">
            {formData.items.map((item, index) => (
              <div key={index} className={`grid grid-cols-1 md:grid-cols-12 gap-3 p-4 rounded-xl border ${darkMode ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-gray-50"}`}>
                <div className="md:col-span-3">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <label className={`block text-xs font-medium ${darkMode ? "text-gray-400" : "text-gray-600"}`}>Item *</label>
                    <button
                      type="button"
                      onClick={() => updateItem(index, "manual", !item.manual)}
                      className="text-xs px-2 py-1 rounded bg-slate-600 text-white hover:bg-slate-700"
                    >
                      {item.manual ? "Select from inventory" : "Manual entry"}
                    </button>
                  </div>
                  {item.manual ? (
                    <input
                      value={item.name || ""}
                      onChange={(e) => updateItem(index, "name", e.target.value)}
                      placeholder="Enter item name"
                      disabled={loading}
                      className={inputClass}
                    />
                  ) : (
                    <select
                      value={item.name || ""}
                      onChange={(e) => {
                        const selectedName = e.target.value;
                        const selected = itemOptions.find((opt) => opt.label === selectedName);
                        updateItem(index, "name", selectedName);
                        if (selected) {
                          if (!item.description) updateItem(index, "description", selected.description);
                          if (!Number(item.price)) updateItem(index, "price", roundToTwoDecimals(Number(selected.price || 0) / selectedCurrencyRate));
                          updateItem(index, "item_code", selected.item_code || "");
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
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className={`block text-xs font-medium mb-1 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>Item Code</label>
                  <input
                    type="text"
                    value={item.item_code || ""}
                    onChange={(e) => updateItem(index, "item_code", e.target.value)}
                    className={inputClass}
                    placeholder="Optional item code"
                    disabled={loading}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className={`block text-xs font-medium mb-1 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>Description</label>
                  <input
                    type="text"
                    value={item.description || ""}
                    onChange={(e) => updateItem(index, "description", e.target.value)}
                    className={inputClass}
                    placeholder="Description"
                    disabled={loading}
                  />
                </div>

                <div className="md:col-span-1">
                  <label className={`block text-xs font-medium mb-1 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>Qty</label>
                  <input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => updateItem(index, "quantity", e.target.value)}
                    className={inputClass}
                    disabled={loading}
                  />
                  {item.name && !item.manual && Number(item.quantity || 0) > getAvailableStock(item.name) ? (
                    <p className="text-xs text-red-500 mt-1">
                      Low stock: requested {Number(item.quantity || 0)}, available {getAvailableStock(item.name)}
                    </p>
                  ) : null}
                </div>

                <div className="md:col-span-2">
                  <label className={`block text-xs font-medium mb-1 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                    Unit Price ({formData.currency || "NGN"})
                  </label>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.price}
                    onChange={(e) => updateItem(index, "price", e.target.value)}
                    onBlur={(e) => {
                      const value = parseFloat(e.target.value || 0).toFixed(2);
                      updateItem(index, "price", value);
                    }}
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

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowItemModal(true)}
              disabled={loading}
              className="px-3 py-2 rounded-lg bg-slate-700 text-white text-sm font-medium hover:bg-slate-800"
            >
              Create Item
            </button>
            <button
              type="button"
              onClick={addItem}
              disabled={loading}
              className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700"
            >
              Add Item
            </button>
          </div>

          <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-xl border ${darkMode ? "border-gray-700 bg-gray-900" : "border-gray-200 bg-white"}`}>
            <div>
              <p className="text-sm opacity-70">Subtotal</p>
              <p className="text-lg font-semibold">{formatMoney(subtotal, formData.currency)}</p>
            </div>
            <div>
              <p className="text-sm opacity-70">Discount</p>
              <p className="text-lg font-semibold">{formatMoney(discountAmount, formData.currency)}</p>
            </div>
            <div>
              <p className="text-sm opacity-70">VAT</p>
              <p className="text-lg font-semibold">{formatMoney(vatAmount, formData.currency)}</p>
            </div>
            <div>
              <p className="text-sm opacity-70">Taxable Subtotal</p>
              <p className="text-lg font-semibold">{formatMoney(taxableSubtotal, formData.currency)}</p>
            </div>
            <div>
              <p className="text-sm opacity-70">Total</p>
              <p className="text-lg font-semibold">{formatMoney(total, formData.currency)}</p>
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
            placeholder={`Enter ${documentLabel.toLowerCase()} terms and conditions...`}
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
                {`Save ${documentLabel}`}
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
              <textarea
                placeholder="Address"
                rows={3}
                value={newCustomer.address}
                onChange={(e) => setNewCustomer((prev) => ({ ...prev, address: e.target.value }))}
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

      {showItemModal && (
        <div className="fixed inset-0 z-[70] bg-black/50 flex items-center justify-center p-4">
          <div className={`w-full max-w-xl rounded-xl p-6 shadow-xl ${darkMode ? "bg-gray-800 text-gray-200" : "bg-white text-gray-800"}`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Create Item</h3>
              <button type="button" onClick={() => setShowItemModal(false)} className="p-2 rounded hover:bg-gray-200/30">
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input className={inputClass} placeholder="Item name *" value={newItem.product_name} onChange={(e) => setNewItem((prev) => ({ ...prev, product_name: e.target.value }))} />
              <input className={inputClass} placeholder="Category" value={newItem.category} onChange={(e) => setNewItem((prev) => ({ ...prev, category: e.target.value }))} />
              <input className={inputClass} type="number" placeholder="Opening stock" value={newItem.current_stock} onChange={(e) => setNewItem((prev) => ({ ...prev, current_stock: e.target.value }))} />
              <input className={inputClass} type="number" placeholder="Min stock" value={newItem.min_stock} onChange={(e) => setNewItem((prev) => ({ ...prev, min_stock: e.target.value }))} />
              <input className={inputClass} type="number" placeholder="Purchase price" value={newItem.purchase_price} onChange={(e) => setNewItem((prev) => ({ ...prev, purchase_price: e.target.value }))} />
              <input className={inputClass} type="number" placeholder="Selling price" value={newItem.selling_price} onChange={(e) => setNewItem((prev) => ({ ...prev, selling_price: e.target.value }))} />
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button type="button" onClick={() => setShowItemModal(false)} className={`px-4 py-2 rounded ${darkMode ? "bg-gray-600" : "bg-gray-200"}`}>Cancel</button>
              <button type="button" onClick={handleCreateItem} className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700">Save Item</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateQuotationForm;