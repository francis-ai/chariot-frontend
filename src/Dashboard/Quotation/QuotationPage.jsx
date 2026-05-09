import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ArrowRight, Eye, Download, Edit3, Plus, Trash2, X } from 'lucide-react';
import CreateQuotation from "../Quotation/createquoation";
import NavBar from '../../component/navigation';
import Sidebar from '../../component/sidebar';
import { useTheme } from "../../context/ThemeContext";
import API from "../../utils/api";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { downloadQuotationPdf } from "../../utils/documentPdf";

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

// Modal Component for Viewing/Editing
const QuotationModal = ({ quotation, onClose, editable = false, onSave, darkMode, customers = [], inventoryItems = [], documentLabel = "Quotation" }) => {
  const [form, setForm] = useState({ ...quotation });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (quotation) {
      setForm({ ...quotation });
    }
  }, [quotation]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const normalizeItems = (rawForm) => {
    const sourceItems = Array.isArray(rawForm.items)
      ? rawForm.items
      : (() => {
          try {
            const parsed = rawForm.items_json ? JSON.parse(rawForm.items_json) : [];
            if (Array.isArray(parsed)) return parsed;
            if (parsed && Array.isArray(parsed.items)) return parsed.items;
            return [];
          } catch (error) {
            return [];
          }
        })();

    return sourceItems.map((item) => ({
      name: item.name || item.item || "",
      item_code: item.item_code || item.code || "",
      description: item.description || "",
      quantity: Number(item.quantity ?? item.qty ?? 0) || 0,
      price: Number(item.price || 0) || 0,
      manual: item.manual !== undefined ? item.manual : false,
    }));
  };

  const handleItemChange = (index, field, value) => {
    setForm((prev) => {
      const updatedItems = normalizeItems(prev);
      updatedItems[index] = {
        ...updatedItems[index],
        [field]: field === "quantity" || field === "price" ? Number(value || 0) : value,
      };
      return { ...prev, items: updatedItems };
    });
  };

  const handleAddItem = () => {
    setForm((prev) => ({
      ...prev,
      items: [...normalizeItems(prev), { name: "", item_code: "", description: "", quantity: 1, price: 0, manual: true }],
    }));
  };

  const handleRemoveItem = (index) => {
    setForm((prev) => {
      const updatedItems = normalizeItems(prev).filter((_, itemIndex) => itemIndex !== index);
      return {
        ...prev,
        items: updatedItems.length ? updatedItems : [{ name: "", item_code: "", description: "", quantity: 1, price: 0, manual: true }],
      };
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const normalizedItems = normalizeItems(form).filter((item) => item.name && Number(item.quantity) > 0);
      const subtotalValue = normalizedItems.reduce((sum, item) => sum + Number(item.quantity || 0) * Number(item.price || 0), 0);
      const discountRate = Math.max(0, Math.min(100, Number(form.discount_rate || 0)));
      const discountAmount = (subtotalValue * discountRate) / 100;
      const taxableSubtotalValue = Math.max(0, subtotalValue - discountAmount);
      const vatRateValue = Number(form.vat_rate || 0);
      const vatAmountValue = Number((taxableSubtotalValue * vatRateValue) / 100);
      const amountValue = Number(taxableSubtotalValue + vatAmountValue);

      await onSave({
        ...form,
        items: normalizedItems,
        discount_rate: discountRate,
        discount_amount: discountAmount,
        taxable_subtotal: taxableSubtotalValue,
        items_json: JSON.stringify({
          items: normalizedItems,
          discount_rate: discountRate,
          discount_amount: discountAmount,
          subtotal_before_discount: subtotalValue,
        }),
        subtotal: subtotalValue,
        vat_amount: vatAmountValue,
        amount: amountValue,
      });
    } finally {
      setSaving(false);
    }
  };

  // Get customer name from customers list
  const getCustomerName = () => {
    if (form.customer) return form.customer;
    if (form.customer_id) {
      const customer = customers.find(c => c.id === form.customer_id || c._id === form.customer_id);
      return customer ? customer.name : `Customer #${form.customer_id}`;
    }
    return '';
  };

  const items = normalizeItems(form);

  const itemOptions = inventoryItems.map((inv) => ({
    id: inv.id,
    label: inv.product_name || inv.name || `Item ${inv.id}`,
    item_code: inv.item_code || "",
    price: Number(inv.selling_price || inv.price || 0),
    description: inv.description || "",
  }));

  const subtotal = items.reduce((sum, item) => sum + (Number(item.quantity || 0) * Number(item.price || 0)), 0);
  const discountRate = Math.max(0, Math.min(100, Number(form.discount_rate || 0)));
  const discountAmount = (subtotal * discountRate) / 100;
  const taxableSubtotal = Math.max(0, subtotal - discountAmount);
  const vatRate = Number(form.vat_rate || 0);
  const vatAmount = Number((taxableSubtotal * vatRate) / 100);
  const total = Number(taxableSubtotal + vatAmount);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-start sm:items-center justify-center p-4 overflow-y-auto z-50">
      <div className={`w-full max-w-2xl relative p-6 rounded-xl shadow-xl max-h-[90vh] overflow-y-auto ${darkMode ? 'bg-gray-800 text-gray-200' : 'bg-white text-gray-800'}`}>
        <button
          onClick={onClose}
          disabled={saving}
          className={`absolute top-4 right-4 p-2 rounded-full transition ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
        >
          <X size={20} />
        </button>

        <h2 className="text-xl font-bold mb-6">{editable ? `Edit ${documentLabel}` : `View ${documentLabel}`}</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col">
            <label className="text-sm font-medium mb-1">{`${documentLabel} #`}</label>
            <span className={`px-3 py-2 border rounded-lg w-full ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-100 border-gray-300'}`}>
              {form.quotation_number || form.id}
            </span>
          </div>

          <div className="flex flex-col">
            <label className="text-sm font-medium mb-1">Status</label>
            {editable ? (
              <select
                name="status"
                value={form.status}
                onChange={handleChange}
                disabled={saving}
                className={`px-3 py-2 border rounded-lg outline-none w-full ${
                  darkMode ? 'bg-gray-700 border-gray-600 text-gray-200' : 'bg-gray-100 border-gray-300 text-gray-800'
                }`}
              >
                <option value="Pending">Pending</option>
                <option value="Approved">Approved</option>
                <option value="Accepted">Accepted</option>
                <option value="Paid">Paid</option>
                <option value="Unpaid">Unpaid</option>
                <option value="Rejected">Rejected</option>
                <option value="Expired">Expired</option>
              </select>
            ) : (
              <span className={`px-3 py-2 border rounded-lg w-full ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-100 border-gray-300'}`}>
                {form.status}
              </span>
            )}
          </div>

          <div className="flex flex-col">
            <label className="text-sm font-medium mb-1">Customer</label>
            {editable ? (
              <select
                name="customer"
                value={form.customer}
                onChange={handleChange}
                disabled={saving}
                className={`px-3 py-2 border rounded-lg outline-none w-full ${
                  darkMode ? 'bg-gray-700 border-gray-600 text-gray-200' : 'bg-gray-100 border-gray-300 text-gray-800'
                }`}
              >
                <option value="">Select Customer</option>
                {customers.map(customer => (
                  <option key={customer.id || customer._id} value={[customer.company, customer.name].filter(Boolean).join(" - ")}>
                    {[customer.company, customer.name].filter(Boolean).join(" - ")}
                  </option>
                ))}
              </select>
            ) : (
              <span className={`px-3 py-2 border rounded-lg w-full ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-100 border-gray-300'}`}>
                {getCustomerName()}
              </span>
            )}
          </div>

          <div className="flex flex-col">
            <label className="text-sm font-medium mb-1">{`${documentLabel} Date`}</label>
            {editable ? (
              <input
                type="date"
                name="quotation_date"
                value={form.quotation_date}
                onChange={handleChange}
                disabled={saving}
                className={`px-3 py-2 border rounded-lg outline-none w-full ${
                  darkMode ? 'bg-gray-700 border-gray-600 text-gray-200' : 'bg-gray-100 border-gray-300 text-gray-800'
                }`}
              />
            ) : (
              <span className={`px-3 py-2 border rounded-lg w-full ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-100 border-gray-300'}`}>
                {form.quotation_date}
              </span>
            )}
          </div>

          <div className="flex flex-col">
            <label className="text-sm font-medium mb-1">Valid Until</label>
            {editable ? (
              <input
                type="date"
                name="valid_until"
                value={form.valid_until}
                onChange={handleChange}
                disabled={saving}
                className={`px-3 py-2 border rounded-lg outline-none w-full ${
                  darkMode ? 'bg-gray-700 border-gray-600 text-gray-200' : 'bg-gray-100 border-gray-300 text-gray-800'
                }`}
              />
            ) : (
              <span className={`px-3 py-2 border rounded-lg w-full ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-100 border-gray-300'}`}>
                {form.valid_until}
              </span>
            )}
          </div>

          <div className="flex flex-col">
            <label className="text-sm font-medium mb-1">Amount</label>
            <span className={`px-3 py-2 border rounded-lg w-full font-bold ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-100 border-gray-300'}`}>
              {formatMoney(total, form.currency || "NGN")}
            </span>
          </div>

          <div className="flex flex-col">
            <label className="text-sm font-medium mb-1">VAT Rate</label>
            {editable ? (
              <input
                type="number"
                name="vat_rate"
                value={form.vat_rate || 0}
                onChange={handleChange}
                disabled={saving}
                className={`px-3 py-2 border rounded-lg outline-none w-full ${
                  darkMode ? 'bg-gray-700 border-gray-600 text-gray-200' : 'bg-gray-100 border-gray-300 text-gray-800'
                }`}
              />
            ) : (
              <span className={`px-3 py-2 border rounded-lg w-full ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-100 border-gray-300'}`}>
                {vatRate}%
              </span>
            )}
          </div>

          <div className="flex flex-col">
            <label className="text-sm font-medium mb-1">Added By</label>
            <span className={`px-3 py-2 border rounded-lg w-full ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-100 border-gray-300'}`}>
              {form.created_by_name || "System"}
            </span>
          </div>

          <div className="md:col-span-2">
            <label className="text-sm font-medium mb-1">Terms and Conditions</label>
            {editable ? (
              <textarea
                name="terms"
                value={form.terms || ''}
                onChange={handleChange}
                disabled={saving}
                rows={4}
                className={`px-3 py-2 border rounded-lg outline-none w-full ${
                  darkMode ? 'bg-gray-700 border-gray-600 text-gray-200' : 'bg-gray-100 border-gray-300 text-gray-800'
                }`}
              />
            ) : (
              <p className={`px-3 py-2 border rounded-lg w-full ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-100 border-gray-300'}`}>
                {form.terms || 'No terms provided'}
              </p>
            )}
          </div>

          <div className="md:col-span-2">
            <label className="text-sm font-medium mb-1">Items</label>
            <div className={`rounded-lg border p-3 ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-100 border-gray-300'}`}>
              {editable ? (
                <div className="space-y-3">
                  {items.map((item, index) => (
                    <div key={`editable-item-${index}`} className="grid grid-cols-1 md:grid-cols-12 gap-2">
                      <div className="md:col-span-3">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <label className="text-xs font-medium opacity-70">Item *</label>
                          <button
                            type="button"
                            onClick={() => handleItemChange(index, "manual", !item.manual)}
                            className="text-xs px-2 py-1 rounded bg-slate-600 text-white hover:bg-slate-700"
                          >
                            {item.manual ? "Select from inventory" : "Manual entry"}
                          </button>
                        </div>
                        {item.manual ? (
                          <input
                            type="text"
                            value={item.name}
                            disabled={saving}
                            onChange={(e) => handleItemChange(index, "name", e.target.value)}
                            placeholder="Enter item name"
                            className={`px-3 py-2 border rounded-lg outline-none w-full ${
                              darkMode ? 'bg-gray-800 border-gray-600 text-gray-200' : 'bg-white border-gray-300 text-gray-800'
                            }`}
                          />
                        ) : (
                          <select
                            value={item.name}
                            disabled={saving}
                            onChange={(e) => {
                              const selectedName = e.target.value;
                              const selected = itemOptions.find((opt) => opt.label === selectedName);
                              handleItemChange(index, "name", selectedName);
                              if (selected) {
                                if (!item.description) handleItemChange(index, "description", selected.description);
                                if (!Number(item.price)) handleItemChange(index, "price", selected.price);
                                handleItemChange(index, "item_code", selected.item_code || "");
                              }
                            }}
                            className={`px-3 py-2 border rounded-lg outline-none w-full ${
                              darkMode ? 'bg-gray-800 border-gray-600 text-gray-200' : 'bg-white border-gray-300 text-gray-800'
                            }`}
                          >
                            <option value="">Select Item</option>
                            {itemOptions.map((option) => (
                              <option key={option.id} value={option.label}>{option.label}</option>
                            ))}
                          </select>
                        )}
                      </div>

                      <div className="md:col-span-2">
                        <label className="text-xs font-medium opacity-70">Item Code</label>
                        <input
                          type="text"
                          value={item.item_code || ""}
                          disabled={saving}
                          onChange={(e) => handleItemChange(index, "item_code", e.target.value)}
                          placeholder="Optional item code"
                          className={`px-3 py-2 border rounded-lg outline-none w-full ${
                            darkMode ? 'bg-gray-800 border-gray-600 text-gray-200' : 'bg-white border-gray-300 text-gray-800'
                          }`}
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="text-xs font-medium opacity-70">Description</label>
                        <input
                          type="text"
                          value={item.description}
                          disabled={saving}
                          onChange={(e) => handleItemChange(index, "description", e.target.value)}
                          className={`px-3 py-2 border rounded-lg outline-none w-full ${
                            darkMode ? 'bg-gray-800 border-gray-600 text-gray-200' : 'bg-white border-gray-300 text-gray-800'
                          }`}
                        />
                      </div>

                      <div className="md:col-span-1">
                        <label className="text-xs font-medium opacity-70">Qty</label>
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          disabled={saving}
                          onChange={(e) => handleItemChange(index, "quantity", e.target.value)}
                          className={`px-3 py-2 border rounded-lg outline-none w-full ${
                            darkMode ? 'bg-gray-800 border-gray-600 text-gray-200' : 'bg-white border-gray-300 text-gray-800'
                          }`}
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="text-xs font-medium opacity-70">Price</label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.price}
                          disabled={saving}
                          onChange={(e) => handleItemChange(index, "price", e.target.value)}
                          className={`px-3 py-2 border rounded-lg outline-none w-full ${
                            darkMode ? 'bg-gray-800 border-gray-600 text-gray-200' : 'bg-white border-gray-300 text-gray-800'
                          }`}
                        />
                      </div>

                      <div className="md:col-span-1 flex items-end justify-end">
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(index)}
                          disabled={saving || items.length === 1}
                          className="px-2 py-2 rounded-lg bg-red-600 text-white text-xs hover:bg-red-700 disabled:opacity-50"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={handleAddItem}
                    disabled={saving}
                    className="px-3 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                  >
                    Add Item
                  </button>
                </div>
              ) : items.length > 0 ? (
                <div className="space-y-2">
                  {items.map((item, index) => (
                    <div key={`${item.name || item.item || index}`} className="flex flex-col md:flex-row md:justify-between gap-1 text-sm">
                      <span className="font-medium">{item.name || `Item ${index + 1}`}</span>
                      <span>{item.quantity || 0} x {formatMoney(item.price || 0, form.currency || "NGN")} = {formatMoney((item.quantity || 0) * (item.price || 0), form.currency || "NGN")}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm opacity-70">No items attached</p>
              )}
            </div>
          </div>

          {form.notes && (
            <div className="md:col-span-2">
              <label className="text-sm font-medium mb-1">Notes</label>
              <p className={`px-3 py-2 border rounded-lg w-full ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-100 border-gray-300'}`}>
                {form.notes}
              </p>
            </div>
          )}
        </div>

        {editable && (
          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={onClose}
              disabled={saving}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                darkMode ? 'bg-gray-600 hover:bg-gray-700' : 'bg-gray-300 hover:bg-gray-400'
              }`}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 rounded-lg font-medium bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
            >
              {saving && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// Delete Confirmation Modal
const DeleteConfirmationModal = ({ onClose, onConfirm, data, darkMode, deleting }) => {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className={`w-full max-w-md rounded-xl p-6 relative ${darkMode ? 'bg-gray-800 text-gray-200' : 'bg-white text-gray-800'}`}>
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition"
          disabled={deleting}
        >
          <X size={20} />
        </button>

        <div className="text-center mb-6">
          <div className="flex items-center justify-center mb-4">
            <div className={`w-20 h-20 rounded-full flex items-center justify-center ${
              darkMode ? 'bg-red-900/20' : 'bg-red-100'
            }`}>
              <Trash2 size={40} className="text-red-600" />
            </div>
          </div>
          
          <h2 className="text-xl font-bold mb-2">{`Delete ${documentLabel}`}</h2>
          
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            {`Are you sure you want to delete this ${documentLabel.toLowerCase()}?`}
          </p>
          
          <div className={`p-4 rounded-lg text-left mb-4 ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
            <p className="font-bold text-lg">{data.quotation_number || data.id}</p>
            <p className="text-sm mt-2">Customer: {data.customer}</p>
            <p className="text-sm">Amount: {formatMoney(data.amount || 0, data.currency || "NGN")}</p>
            <p className="text-sm">Status: {data.status}</p>
          </div>
          
          <p className="text-sm text-red-600 font-medium">
            This action cannot be undone.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={deleting}
            className={`flex-1 px-4 py-2 rounded-lg font-medium transition ${
              darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'
            } ${deleting ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={deleting}
            className="flex-1 px-4 py-2 rounded-lg font-medium bg-red-600 hover:bg-red-700 text-white transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {deleting && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
            {deleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
};

// Main Quotation Management Component
const QuotationManagement = ({ documentType = "quotation" }) => {
  const { darkMode } = useTheme();
  const isProforma = String(documentType || "quotation").toLowerCase() === "proforma";
  const documentLabel = isProforma ? "Proforma Invoice" : "Quotation";
  const documentLabelPlural = isProforma ? "Proforma Invoices" : "Quotations";
  const documentTabAll = `All ${documentLabelPlural}`;
  const PAGE_SIZE = 10;
  const [newQuotation, setNewQuotation] = useState(false);
  const [activeTab, setActiveTab] = useState(documentTabAll);
  const [modalData, setModalData] = useState(null);
  const [isEditable, setIsEditable] = useState(false);
  const [deleteModal, setDeleteModal] = useState(null);
  const [quotations, setQuotations] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [currencies, setCurrencies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [stats, setStats] = useState([
    { label: `Total ${documentLabelPlural}`, value: "0" },
    { label: `Pending ${documentLabelPlural}`, value: "0" },
    { label: "Total Value", value: "₦0" },
    { label: "Avg. Value", value: "₦0" },
  ]);
  const [searchParams] = useSearchParams();
  const focusQuotationId = searchParams.get("view");
  const [convertingQuotationId, setConvertingQuotationId] = useState(null);

  const tabs = [documentTabAll, 'Pending', 'Accepted', 'Paid', 'Unpaid', 'Expired'];

  const fetchCurrencies = async () => {
    try {
      const res = await API.get("/currencies");
      const rows = normalizeArrayPayload(res.data).map((row) => ({
        ...row,
        code: String(row.code || "").toUpperCase(),
        rate_to_ngn: Number(row.rate_to_ngn || 1),
      }));
      setCurrencies(rows);
    } catch (err) {
      console.error("Fetch currencies error:", err);
      setCurrencies([{ code: "NGN", name: "Nigerian Naira", rate_to_ngn: 1 }]);
    }
  };

  // Fetch customers on mount
  const fetchCustomers = async () => {
    try {
      const res = await API.get("/customers/catalog");
      console.log("Fetched customers:", res.data);
      
      // Map customers to a consistent format - CHANGE name TO company
      const mappedCustomers = res.data.map(customer => ({
        id: customer.id || customer._id,
        company: customer.company || "",
        name: customer.name || "",
        email: customer.email || "",
        phone: customer.phone || "",
      }));
      
      setCustomers(mappedCustomers);
      return mappedCustomers;
    } catch (err) {
      console.error("Fetch customers error:", err);
      toast.error("Failed to fetch customers");
      setCustomers([]);
      return [];
    }
  };

  // Fetch quotations on mount
  const fetchQuotations = async () => {
    try {
      setLoading(true);
      const res = await API.get("/quotation");
      console.log("Fetched quotations:", res.data);
      
      // Map API response to component format
      const mappedQuotations = res.data.map(q => ({
        id: q.id || q._id,
        quotation_number: q.quotation_number || q.id,
        type: String(q.type || (isProforma ? "proforma" : "quotation")).toLowerCase(),
        customer: q.customer || "",
        quotation_date: q.quotation_date ? q.quotation_date.split('T')[0] : "",
        valid_until: q.valid_until ? q.valid_until.split('T')[0] : "",
        amount: q.amount || 0,
        currency: String(q.currency || "NGN").toUpperCase(),
        subtotal: q.subtotal || 0,
        vat_rate: q.vat_rate || 0,
        vat_amount: q.vat_amount || 0,
        items_json: q.items_json || "",
        items: (() => {
          try {
            const parsed = q.items_json ? JSON.parse(q.items_json) : [];
            if (Array.isArray(parsed)) return parsed;
            if (parsed && Array.isArray(parsed.items)) return parsed.items;
            return [];
          } catch (error) {
            return [];
          }
        })(),
        discount_rate: Number(q.discount_rate || (() => {
          try {
            const parsed = q.items_json ? JSON.parse(q.items_json) : null;
            return Number(parsed?.discount_rate || 0);
          } catch (error) {
            return 0;
          }
        })()),
        formatted_amount: formatMoney(Number(q.amount || 0), q.currency || "NGN"),
        status: q.status || "Pending",
        notes: q.notes || "",
        terms: q.terms || "",
        signature_name: q.signature_name || "",
        created_by_name: q.created_by_name || "",
      }));
      
      const filteredQuotations = mappedQuotations.filter((row) => String(row.type || "quotation").toLowerCase() === documentType.toLowerCase());
      setQuotations(filteredQuotations);
      calculateStats(filteredQuotations);
    } catch (err) {
      console.error("Fetch quotations error:", err);
      toast.error(err.response?.data?.message || "Failed to fetch quotations");
      setQuotations([]);
    } finally {
      setLoading(false);
    }
  };

  // const calculateStats = (quoteList) => {
  //   const totalQuotes = quoteList.length;
  //   const pendingCount = quoteList.filter(q => q.status === "Pending").length;
  //   const totalValue = quoteList.reduce((sum, q) => sum + (q.amount || 0), 0);
  //   const avgValue = totalQuotes > 0 ? totalValue / totalQuotes : 0;

  //   setStats([
  //     { label: "Total Quotations", value: totalQuotes.toString() },
  //     { label: "Pending Quotations", value: pendingCount.toString() },
  //     { label: "Total Value", value: `₦${totalValue.toLocaleString()}` },
  //     { label: "Avg. Value", value: `₦${avgValue.toLocaleString()}` },
  //   ]);
  // };

  const calculateStats = (quoteList) => {
    const totalQuotes = quoteList.length;

    const pendingCount = quoteList.filter(
      (q) => (q.status || "").toLowerCase() === "pending"
    ).length;

    // 🔥 Clean and convert amount safely
    const totalValue = quoteList.reduce((sum, q) => {
      let amount = q.amount;

      // Handle string amounts like "₦48,300"
      if (typeof amount === "string") {
        amount = amount.replace(/[₦,]/g, ""); // remove currency + commas
      }

      amount = Number(amount);

      return sum + (isNaN(amount) ? 0 : amount);
    }, 0);

    const avgValue = totalQuotes > 0 ? totalValue / totalQuotes : 0;

    setStats([
      { label: `Total ${documentLabelPlural}`, value: totalQuotes.toString() },
      { label: `Pending ${documentLabelPlural}`, value: pendingCount.toString() },
      { label: "Total Value", value: `₦${totalValue.toLocaleString()}` },
      { label: "Avg. Value", value: `₦${avgValue.toLocaleString()}` },
    ]);
  };

  const fetchInventoryCatalog = async () => {
    try {
      const res = await API.get("/inventory/catalog");
      setInventoryItems(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Fetch inventory catalog error:", err);
      toast.error("Failed to fetch inventory items");
      setInventoryItems([]);
    }
  };

  // Initial data fetch
  useEffect(() => {
    const loadData = async () => {
      await fetchCurrencies();
      await fetchCustomers();
      await fetchInventoryCatalog();
      await fetchQuotations();
    };
    loadData();
  }, []);

  const handleSaveQuotation = async (quotationData) => {
    try {
      setSubmitting(true);
      
      // Generate quotation number if not exists
      const quotation_number = quotationData.quotation_number || `CLTQUO-${Date.now().toString().slice(-8)}`;
      const selectedCurrency = String(quotationData.currency || "NGN").toUpperCase();
      const selectedRate = resolveRateToNgn(selectedCurrency, currencies);

      const parsedItems = Array.isArray(quotationData.items) ? quotationData.items : (() => {
        try {
          return quotationData.items_json ? JSON.parse(quotationData.items_json) : [];
        } catch (error) {
          return [];
        }
      })();

      const itemsInSelectedCurrency = Array.isArray(parsedItems)
        ? parsedItems
        : (Array.isArray(parsedItems?.items) ? parsedItems.items : []);

      const itemsInNgn = itemsInSelectedCurrency.map((item) => ({
        ...item,
        price: Number((Number(item.price || 0) * selectedRate).toFixed(2)),
      }));

      const subtotalInSelectedCurrency = Number(
        quotationData.subtotal || itemsInSelectedCurrency.reduce((sum, item) => sum + (Number(item.quantity || item.qty || 0) * Number(item.price || 0)), 0)
      );
      const discountRate = Math.max(0, Math.min(100, Number(quotationData.discount_rate || 0)));
      const discountAmountInSelectedCurrency = (subtotalInSelectedCurrency * discountRate) / 100;
      const taxableSubtotalInSelectedCurrency = Math.max(0, subtotalInSelectedCurrency - discountAmountInSelectedCurrency);
      const vatRate = Number(quotationData.vat_rate || 0);
      const vatAmountInSelectedCurrency = Number(quotationData.vat_amount || (taxableSubtotalInSelectedCurrency * vatRate) / 100);
      const amountInSelectedCurrency = Number(quotationData.amount || taxableSubtotalInSelectedCurrency + vatAmountInSelectedCurrency);

      const subtotal = Number((subtotalInSelectedCurrency * selectedRate).toFixed(2));
      const discountAmount = Number((discountAmountInSelectedCurrency * selectedRate).toFixed(2));
      const vatAmount = Number((vatAmountInSelectedCurrency * selectedRate).toFixed(2));
      const amount = Number((amountInSelectedCurrency * selectedRate).toFixed(2));
      
      const payload = {
        quotation_number: quotation_number,
        type: documentType,
        customer: quotationData.customer,
        quotation_date: quotationData.quotation_date,
        valid_until: quotationData.valid_until,
        subtotal,
        discount_rate: discountRate,
        vat_rate: vatRate,
        vat_amount: vatAmount,
        amount,
        currency: selectedCurrency,
        status: quotationData.status,
        notes: quotationData.notes || "",
        terms: quotationData.terms || "",
        signature_name: quotationData.signature_name || "",
        items_json: JSON.stringify({
          items: itemsInNgn,
          discount_rate: discountRate,
          discount_amount: discountAmount,
          subtotal_before_discount: subtotal,
        }),
      };

      console.log(`Saving ${documentLabel.toLowerCase()} with payload:`, payload);

      if (quotationData.id) {
        // Update existing
        await API.put(`/quotation/${quotationData.id}`, payload);
        toast.success(`${documentLabel} updated successfully!`);
      } else {
        // Create new
        await API.post("/quotation", payload);
        toast.success(`${documentLabel} created successfully!`);
      }
      
      await fetchQuotations(); // Refresh with latest data
      setModalData(null);
      setNewQuotation(false);
    } catch (err) {
      console.error("Save document error:", err);
      toast.error(err.response?.data?.message || `Failed to save ${documentLabel.toLowerCase()}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteModal) return;
    
    setDeleting(true);
    try {
      await API.delete(`/quotation/${deleteModal.id}`);
      
      setQuotations(prev => prev.filter(q => q.id !== deleteModal.id));
      setDeleteModal(null);
      toast.success(`${documentLabel} deleted successfully!`);
    } catch (err) {
      console.error("Delete document error:", err);
      toast.error(err.response?.data?.message || `Failed to delete ${documentLabel.toLowerCase()}`);
    } finally {
      setDeleting(false);
    }
  };

  const handleDownload = (quotation) => {
    downloadQuotationPdf({ ...quotation, type: quotation.type || documentType })
      .then(() => toast.success(`${documentLabel} downloaded successfully!`))
      .catch(() => toast.error(`Failed to download ${documentLabel.toLowerCase()} PDF`));
  };

  const handleConvertQuotation = async (quotation, convertTo) => {
    if (!quotation?.id) return;
    if (!convertTo) return;

    setConvertingQuotationId(quotation.id);
    try {
      await API.post(`/quotation/${quotation.id}/convert`, { convert_to: convertTo });
      const convertedLabel = convertTo === "invoice"
        ? "invoice"
        : convertTo === "proforma"
          ? "proforma"
          : "quotation";
      toast.success(`${documentLabel} converted to ${convertedLabel} successfully!`);
      await fetchQuotations();
    } catch (err) {
      console.error("Convert quotation error:", err);
      const convertedLabel = convertTo === "invoice"
        ? "invoice"
        : convertTo === "proforma"
          ? "proforma"
          : "quotation";
      toast.error(err.response?.data?.message || `Failed to convert ${documentLabel.toLowerCase()} to ${convertedLabel}`);
    } finally {
      setConvertingQuotationId(null);
    }
  };

  const getStatusStyles = (status) => {
    switch (status) {
      case 'Accepted':
        return darkMode
          ? 'bg-emerald-700 text-emerald-100 border-emerald-600'
          : 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'Paid':
        return darkMode
          ? 'bg-green-700 text-green-100 border-green-600'
          : 'bg-green-50 text-green-700 border-green-100';
      case 'Unpaid':
        return darkMode
          ? 'bg-orange-700 text-orange-100 border-orange-600'
          : 'bg-orange-50 text-orange-700 border-orange-100';
      case 'Pending':
        return darkMode
          ? 'bg-amber-700 text-amber-100 border-amber-600'
          : 'bg-amber-50 text-amber-700 border-amber-100';
      case 'Expired':
        return darkMode
          ? 'bg-rose-700 text-rose-100 border-rose-600'
          : 'bg-rose-50 text-rose-700 border-rose-100';
      default:
        return darkMode
          ? 'bg-slate-700 text-slate-200 border-slate-600'
          : 'bg-slate-50 text-slate-600 border-slate-100';
    }
  };

  const filteredQuotations = quotations.filter(q => {
    if (focusQuotationId && String(q.id) !== String(focusQuotationId)) return false;
    const matchesTab = activeTab === documentTabAll || q.status === activeTab;
    const searchValue = searchTerm.trim().toLowerCase();
    const matchesSearch = !searchValue || [q.customer, q.quotation_number, q.notes]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(searchValue));
    return matchesTab && matchesSearch;
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchTerm, quotations.length]);

  useEffect(() => {
    if (!focusQuotationId || !quotations.length) return;
    const matched = quotations.find((q) => String(q.id) === String(focusQuotationId));
    if (matched) {
      setModalData(matched);
      setIsEditable(false);
      setActiveTab(documentTabAll);
      setSearchTerm("");
      setCurrentPage(1);
    }
  }, [focusQuotationId, quotations]);

  const totalPages = Math.max(1, Math.ceil(filteredQuotations.length / PAGE_SIZE));
  const paginatedQuotations = filteredQuotations.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  return (
    <div className={`flex min-h-screen flex-col md:flex-row transition-colors ${
      darkMode ? 'bg-gray-900 text-gray-200' : 'bg-gray-50 text-gray-800'
    }`}>
      <ToastContainer position="top-right" autoClose={2500} hideProgressBar />
      <Sidebar />

      <div className="flex-1 flex flex-col">
        <NavBar />

        <main className="p-4 mt-20 md:p-6 lg:p-8 flex-1">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <h1 className="text-2xl font-bold tracking-tight">{`${documentLabel} Management`}</h1>
            <button
              onClick={() => setNewQuotation(!newQuotation)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all shadow-md active:scale-95 bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus size={18} />
              {newQuotation ? 'Back to Dashboard' : `Create ${documentLabel}`}
            </button>
          </div>

          {/* Stats Cards */}
          {!newQuotation && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-6">
              {stats.map(stat => (
                <div
                  key={stat.label}
                  className={`p-4 rounded-xl ${
                    darkMode ? "bg-gray-800" : "bg-white"
                  }`}
                >
                  <p className="text-2xl font-black">{stat.value}</p>
                  <p className="text-xs uppercase opacity-60">{stat.label}</p>
                </div>
              ))}
            </div>
          )}

            <div className="mb-4 flex justify-start md:justify-end">
              <div className="w-full md:w-96">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={`Search ${documentLabel.toLowerCase()} by number or customer`}
                  className={`w-full px-4 py-2 rounded-lg border outline-none ${darkMode ? 'bg-gray-800 border-gray-700 text-gray-100' : 'bg-white border-gray-300 text-gray-800'}`}
                />
              </div>
            </div>

          {newQuotation ? (
            <CreateQuotation 
              onCancel={() => setNewQuotation(false)} 
              onSave={handleSaveQuotation}
              darkMode={darkMode}
              customers={customers}
              inventoryItems={inventoryItems}
              onCustomerCreated={fetchCustomers}
              documentLabel={documentLabel}
              documentType={documentType}
            />
          ) : (
            <>
              {/* Tabs */}
              <div className="flex flex-wrap gap-2 mb-4 border-b border-gray-200">
                {tabs.map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-3 py-1 text-sm font-semibold rounded-md transition-all ${
                      activeTab === tab
                        ? 'bg-blue-50 text-blue-600'
                        : darkMode
                        ? 'bg-gray-800 text-gray-200 hover:bg-gray-700'
                        : 'bg-gray-100 text-slate-600 hover:bg-gray-200'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* Loading State */}
              {loading && (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p>{`Loading ${documentLabelPlural.toLowerCase()}...`}</p>
                </div>
              )}

              {/* Empty State */}
              {!loading && filteredQuotations.length === 0 && (
                <div className={`text-center py-12 rounded-xl border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                  <p className="text-gray-400 mb-4">{`No ${documentLabelPlural.toLowerCase()} found`}</p>
                  <button
                    onClick={() => setNewQuotation(true)}
                    className="text-blue-600 hover:text-blue-700 font-medium"
                  >
                    {`Create your first ${documentLabel.toLowerCase()}`}
                  </button>
                </div>
              )}

              {/* Table */}
              {!loading && filteredQuotations.length > 0 && (
                <div className={`overflow-x-auto rounded-xl border shadow-sm transition-colors ${
                  darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                }`}>
                  <table className="min-w-full table-auto">
                    <thead className={`transition-colors ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                      <tr>
                        {[`${documentLabel} #`, 'Customer', 'Date', 'Valid Until', 'Amount', 'Status', 'Actions'].map((h) => (
                          <th key={h} className="px-4 py-2 text-xs font-bold uppercase">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedQuotations.map((q) => (
                        <tr key={q.id} className={`hover:transition-colors ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`}>
                          <td className="px-4 py-2 font-semibold text-blue-600 truncate">{q.quotation_number}</td>
                          <td className="px-4 py-2 truncate">{q.customer}</td>
                          <td className="px-4 py-2 text-sm truncate">{q.quotation_date}</td>
                          <td className="px-4 py-2 text-sm truncate">{q.valid_until}</td>
                          <td className="px-4 py-2 font-bold truncate">{q.formatted_amount}</td>
                          <td className="px-4 py-2">
                            <span className={`px-2 py-1 rounded text-xs font-semibold border uppercase ${getStatusStyles(q.status)}`}>
                              {q.status}
                            </span>
                          </td>
                          <td className="px-4 py-2">
                            <div className="flex flex-wrap gap-1">
                              <button
                                onClick={() => { setModalData(q); setIsEditable(false); }}
                                className="p-2 rounded-md transition-colors bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white"
                                title="View"
                              >
                                <Eye size={16} />
                              </button>
                              <button
                                onClick={() => handleDownload(q)}
                                className="p-2 rounded-md transition-colors bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white"
                                title="Download"
                              >
                                <Download size={16} />
                              </button>
                              <button
                                onClick={() => handleConvertQuotation(q, "invoice")}
                                disabled={convertingQuotationId === q.id}
                                className="flex items-center gap-1 p-2 rounded-md transition-colors bg-slate-50 text-slate-600 hover:bg-slate-600 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Convert to Invoice"
                              >
                                <ArrowRight size={16} />
                                <span className="text-[10px] font-semibold uppercase">INV</span>
                              </button>
                              <button
                                onClick={() => handleConvertQuotation(q, String(q.type || documentType || "quotation").toLowerCase() === "proforma" ? "quotation" : "proforma")}
                                disabled={convertingQuotationId === q.id}
                                className="flex items-center gap-1 p-2 rounded-md transition-colors bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                                title={`Convert to ${String(q.type || documentType || "quotation").toLowerCase() === "proforma" ? "Quotation" : "Proforma"}`}
                              >
                                <ArrowRight size={16} />
                                <span className="text-[10px] font-semibold uppercase">
                                  {String(q.type || documentType || "quotation").toLowerCase() === "proforma" ? "QUO" : "PRO"}
                                </span>
                              </button>
                              <button
                                onClick={() => { setModalData(q); setIsEditable(true); }}
                                className="p-2 rounded-md transition-colors bg-amber-50 text-amber-600 hover:bg-amber-600 hover:text-white"
                                title="Edit"
                              >
                                <Edit3 size={16} />
                              </button>
                              <button
                                onClick={() => setDeleteModal(q)}
                                className="p-2 rounded-md transition-colors bg-red-50 text-red-600 hover:bg-red-600 hover:text-white"
                                title="Delete"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Pagination */}
              {!loading && filteredQuotations.length > 0 && (
                <div className="flex flex-col md:flex-row justify-between items-center gap-2 mt-3 text-xs transition-colors">
                  <span className="italic">{`Showing ${(currentPage - 1) * PAGE_SIZE + 1} to ${Math.min(currentPage * PAGE_SIZE, filteredQuotations.length)} of ${filteredQuotations.length} entries`}</span>
                  <div className="flex gap-1">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1.5 border rounded hover:bg-gray-50 disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="px-4 py-1.5 bg-gray-800 text-white rounded hover:bg-gray-700 disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {/* View/Edit Modal */}
          {modalData && (
            <QuotationModal
              quotation={modalData}
              editable={isEditable}
              onClose={() => setModalData(null)}
              onSave={handleSaveQuotation}
              darkMode={darkMode}
              customers={customers}
              inventoryItems={inventoryItems}
              documentLabel={documentLabel}
            />
          )}

          {/* Delete Confirmation Modal */}
          {deleteModal && (
            <DeleteConfirmationModal
              onClose={() => setDeleteModal(null)}
              onConfirm={handleDelete}
              data={deleteModal}
              darkMode={darkMode}
              deleting={deleting}
            />
          )}
        </main>
      </div>
    </div>
  );
};

export default QuotationManagement;