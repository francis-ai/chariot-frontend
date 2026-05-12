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
    address: "",
    status: "Active",
  });
  const [form, setForm] = useState({
    customer: "",
    pickup_location: "",
    delivery_location: "",
    driver: "",
    vehicle: "",
    quotation_ids: "",
    invoice_ids: "",
    product_list: "",
    waybill_date: new Date().toISOString().split('T')[0],
    status: "Pending",
    notes: "",
  });
  const [invoicesForCustomer, setInvoicesForCustomer] = useState([]);
  const [quotationsForCustomer, setQuotationsForCustomer] = useState([]);
  const [proformasForCustomer, setProformasForCustomer] = useState([]);
  const [selectedQuotationItems, setSelectedQuotationItems] = useState([]);
  const [selectedInvoiceItems, setSelectedInvoiceItems] = useState([]);
  const [selectedProformaItems, setSelectedProformaItems] = useState([]);
  const [manualProducts, setManualProducts] = useState("");

  const formatDocumentItems = (items) => {
    const rows = Array.isArray(items) ? items : [];
    if (!rows.length) return [];

    return rows
      .map((item) => {
        const name = item?.name || item?.item || item?.product_name || "Item";
        const qty = Number(item?.quantity || item?.qty || 1);
        const code = item?.item_code ? `${item.item_code} - ` : "";
        return `${code}${name} x ${qty}`;
      })
      .filter(Boolean);
  };

  const renderProductGroup = (label, items) => {
    const rows = Array.isArray(items) ? items : [];
    if (!rows.length) return "";
    return `${label}: ${rows.join(", ")}`;
  };

  const buildCombinedProductReview = (quotationItems, invoiceItems, proformaItems, manualText) => {
    const sections = [
      renderProductGroup("Quotation", quotationItems),
      renderProductGroup("Invoice", invoiceItems),
      renderProductGroup("Proforma", proformaItems),
      String(manualText || "").trim() ? `Manual: ${String(manualText || "").trim()}` : "",
    ].filter(Boolean);

    return sections.join("\n");
  };

  const loadDocumentItems = async (documentId, source) => {
    if (!documentId) {
      if (source === "invoice") setSelectedInvoiceItems([]);
      if (source === "proforma") setSelectedProformaItems([]);
      if (source === "quotation") setSelectedQuotationItems([]);
      return;
    }

    try {
      const endpoint = source === "invoice" ? "/invoices" : "/quotation";
      const res = await API.get(endpoint);
      const rows = Array.isArray(res.data) ? res.data : [];
      const found = rows.find((row) => String(row.id) === String(documentId) || String(row.invoice_number || row.quotation_number) === String(documentId));
      if (!found) return;

      const items = Array.isArray(found.items)
        ? found.items
        : (() => {
            try {
              const parsed = typeof found.items_json === "string" && found.items_json.trim() ? JSON.parse(found.items_json) : [];
              if (Array.isArray(parsed)) return parsed;
              if (parsed && Array.isArray(parsed.items)) return parsed.items;
              return [];
            } catch (error) {
              return [];
            }
          })();

      const formattedItems = formatDocumentItems(items);

      if (source === "invoice") {
        setSelectedInvoiceItems(formattedItems);
      } else if (source === "proforma") {
        setSelectedProformaItems(formattedItems);
      } else {
        setSelectedQuotationItems(formattedItems);
      }

      setForm((prev) => ({
        ...prev,
        [source === "invoice" ? "invoice_ids" : source === "proforma" ? "quotation_ids" : "quotation_ids"]: String(documentId),
      }));
    } catch (error) {
      console.error(`Failed to load ${source} items`, error);
    }
  };

  // Load data if editing
  useEffect(() => {
    if (waybillData) {
      console.log("Loading waybill data into form:", waybillData);
      
      setForm({
        customer: waybillData.customer || "",
        pickup_location: waybillData.pickup_location || "",
        delivery_location: waybillData.delivery_location || "",
        driver: waybillData.driver || waybillData.delivered_by || "",
        vehicle: waybillData.vehicle || waybillData.mode_of_delivery || "",
        quotation_ids: waybillData.quotation_ids || waybillData.quotation_id || "",
        invoice_ids: waybillData.invoice_ids || waybillData.invoice_id || "",
        product_list: waybillData.product_list || waybillData.items || "",
        waybill_date: waybillData.waybill_date || new Date().toISOString().split('T')[0],
        status: waybillData.status || "Pending",
        notes: waybillData.notes || "",
      });

      setManualProducts(String(waybillData.product_list || waybillData.items || ""));
      setSelectedQuotationItems([]);
      setSelectedInvoiceItems([]);
      setSelectedProformaItems([]);
    }
  }, [waybillData]);

  useEffect(() => {
    const combined = buildCombinedProductReview(
      selectedQuotationItems,
      selectedInvoiceItems,
      selectedProformaItems,
      manualProducts
    );

    setForm((prev) => ({
      ...prev,
      product_list: combined || String(manualProducts || "").trim(),
    }));
  }, [selectedQuotationItems, selectedInvoiceItems, selectedProformaItems, manualProducts]);

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

  useEffect(() => {
    if (selectedCustomerId) return;
    setSelectedQuotationItems([]);
    setSelectedInvoiceItems([]);
    setSelectedProformaItems([]);
  }, [selectedCustomerId]);

  // When customer is selected, fetch related invoices / quotations / proformas
  useEffect(() => {
    const fetchDocuments = async () => {
      if (!selectedCustomerId) {
        setInvoicesForCustomer([]);
        setQuotationsForCustomer([]);
        setProformasForCustomer([]);
        return;
      }

      try {
        const [invRes, quoRes] = await Promise.all([API.get('/invoices'), API.get('/quotation')]);

        // Match by label used in invoice/quotation.customer (company - name)
        const selectedLabel = form.customer;

        const invList = (Array.isArray(invRes.data) ? invRes.data : []).filter(inv => String(inv.customer || '').includes(selectedLabel));
        const quoList = (Array.isArray(quoRes.data) ? quoRes.data : []).filter(q => String(q.customer || '').includes(selectedLabel));

        setInvoicesForCustomer(invList);
        setQuotationsForCustomer(quoList.filter(q => String(q.type || '').toLowerCase() !== 'proforma'));
        setProformasForCustomer(quoList.filter(q => String(q.type || '').toLowerCase() === 'proforma'));
      } catch (err) {
        console.error('Error fetching related documents:', err);
        setInvoicesForCustomer([]);
        setQuotationsForCustomer([]);
        setProformasForCustomer([]);
      }
    };

    fetchDocuments();
  }, [selectedCustomerId, form.customer]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleManualProductsChange = (e) => {
    setManualProducts(e.target.value);
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
    setSelectedQuotationItems([]);
    setSelectedInvoiceItems([]);
    setSelectedProformaItems([]);

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

      setNewCustomer({ name: "", company: "", phone: "", email: "", address: "", status: "Active" });
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
    // Removed validation for pickup_location, delivery_location, driver, vehicle, waybill_date to make them optional

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
          <label className="text-sm font-medium mb-1 block">Waybill Date</label>
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
          <label className="text-sm font-medium mb-1 block">Pickup Location</label>
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
          <label className="text-sm font-medium mb-1 block">Delivery Location</label>
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
          <label className="text-sm font-medium mb-1 block">Driver Name</label>
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
          <label className="text-sm font-medium mb-1 block">Vehicle</label>
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

        <div className="md:col-span-2">
          <label className="text-sm font-medium mb-1 block">Quotation</label>
          {quotationsForCustomer.length > 0 && (
            <select
              className={`${inputClass} mb-2`}
              onChange={(e) => {
                const val = e.target.value;
                loadDocumentItems(val, "quotation");
              }}
              disabled={loading || submitting}
            >
              <option value="">Select from customer quotations</option>
              {quotationsForCustomer.map(q => (
                <option key={q.id} value={q.id}>{`${q.quotation_number || q.id} — ${String(q.customer || '').slice(0,40)}`}</option>
              ))}
            </select>
          )}
          {selectedQuotationItems.length > 0 && (
            <div className={`mt-2 rounded-xl p-3 text-sm ${darkMode ? "bg-gray-700 text-gray-100" : "bg-gray-50 text-gray-800"}`}>
              <p className="text-xs uppercase font-bold opacity-60 mb-1">Quotation Items</p>
              <p>{selectedQuotationItems.join(", ")}</p>
            </div>
          )}
        </div>

        <div className="md:col-span-2">
          <label className="text-sm font-medium mb-1 block">Invoice</label>
          {invoicesForCustomer.length > 0 && (
            <select
              className={`${inputClass} mb-2`}
              onChange={(e) => {
                const val = e.target.value;
                loadDocumentItems(val, "invoice");
              }}
              disabled={loading || submitting}
            >
              <option value="">Select from customer invoices</option>
              {invoicesForCustomer.map(i => (
                <option key={i.id} value={i.id}>{`${i.invoice_number || i.id} — ${String(i.customer || '').slice(0,40)}`}</option>
              ))}
            </select>
          )}
          {selectedInvoiceItems.length > 0 && (
            <div className={`mt-2 rounded-xl p-3 text-sm ${darkMode ? "bg-gray-700 text-gray-100" : "bg-gray-50 text-gray-800"}`}>
              <p className="text-xs uppercase font-bold opacity-60 mb-1">Invoice Items</p>
              <p>{selectedInvoiceItems.join(", ")}</p>
            </div>
          )}
        </div>

        {/* Proforma picker */}
        {proformasForCustomer.length > 0 && (
          <div className="md:col-span-2">
            <label className="text-sm font-medium mb-1 block">Proforma</label>
            <select
              className={inputClass}
              onChange={(e) => {
                const val = e.target.value;
                loadDocumentItems(val, "proforma");
              }}
              disabled={loading || submitting}
            >
              <option value="">Select Proforma</option>
              {proformasForCustomer.map(p => (
                <option key={p.id} value={p.id}>{`${p.quotation_number || p.id} — ${String(p.customer || '').slice(0,40)}`}</option>
              ))}
            </select>
            {selectedProformaItems.length > 0 && (
              <div className={`mt-2 rounded-xl p-3 text-sm ${darkMode ? "bg-gray-700 text-gray-100" : "bg-gray-50 text-gray-800"}`}>
                <p className="text-xs uppercase font-bold opacity-60 mb-1">Proforma Items</p>
                <p>{selectedProformaItems.join(", ")}</p>
              </div>
            )}
          </div>
        )}

        <div className="md:col-span-2">
          <label className="text-sm font-medium mb-1 block">Manual Products</label>
          <textarea
            name="manual_products"
            value={manualProducts}
            onChange={handleManualProductsChange}
            rows={2}
            placeholder="Enter additional products manually, one line or comma-separated"
            className={textareaClass}
            disabled={loading || submitting}
          />
        </div>

        <div className="md:col-span-2">
          <label className="text-sm font-medium mb-1 block">Products Review</label>
          <textarea
            name="product_list"
            value={form.product_list}
            onChange={handleChange}
            rows={2}
            placeholder="Combined review of selected document items and manual products"
            className={textareaClass}
            readOnly
            disabled={loading || submitting}
          />
          <p className="text-xs mt-1 opacity-70">This review is built from the selected invoice, quotation, proforma, and manual products.</p>
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
    </form>
  );
};

export default WaybillForm;