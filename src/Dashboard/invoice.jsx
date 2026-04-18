import React, { useMemo, useState, useEffect } from "react";
import { toast, ToastContainer } from "react-toastify";
import { X, Save, Plus } from "lucide-react";
import "react-toastify/dist/ReactToastify.css";
import API from "../utils/api";

export default function InvoiceForm({ onClose, onSave, darkMode, invoiceData }) {
  const [form, setForm] = useState({
    customer: "",
    status: "Unpaid",
    invoice_date: new Date().toISOString().split('T')[0],
    due_date: "",
    item: "",
    description: "",
    quantity: "",
    price: "",
    discount: 0,
    tax_rate: 0,
    tax_amount: 0,
    notes: ""
  });
  const [customers, setCustomers] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState({ customers: true, items: true });
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [customerSearch, setCustomerSearch] = useState("");
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showItemModal, setShowItemModal] = useState(false);
  const [lineItems, setLineItems] = useState([
    {
      name: "",
      description: "",
      quantity: 1,
      price: 0,
    },
  ]);
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

  // Load invoice data if editing
  useEffect(() => {
    if (invoiceData) {
      let parsedItems = [];
      if (Array.isArray(invoiceData.items) && invoiceData.items.length > 0) {
        parsedItems = invoiceData.items;
      } else if (typeof invoiceData.items_json === "string" && invoiceData.items_json.trim()) {
        try {
          const value = JSON.parse(invoiceData.items_json);
          parsedItems = Array.isArray(value) ? value : [];
        } catch (error) {
          parsedItems = [];
        }
      }

      if (parsedItems.length === 0 && invoiceData.item) {
        parsedItems = [
          {
            name: invoiceData.item,
            description: invoiceData.description || "",
            quantity: Number(invoiceData.quantity || 1),
            price: Number(invoiceData.price || 0),
          },
        ];
      }

      const firstItem = parsedItems.length
        ? parsedItems[0]
        : { name: "", description: "", quantity: 1, price: 0 };

      setLineItems([
        {
          name: firstItem.name || firstItem.item || firstItem.product_name || "",
          description: firstItem.description || "",
          quantity: Number(firstItem.quantity || firstItem.qty || 1),
          price: Number(firstItem.price || firstItem.unit_price || 0),
        },
      ]);

      setForm({
        customer: invoiceData.customer || "",
        status: invoiceData.status || "Unpaid",
        invoice_date: invoiceData.invoice_date || new Date().toISOString().split('T')[0],
        due_date: invoiceData.due_date || "",
        item: invoiceData.item || "",
        description: invoiceData.description || "",
        quantity: invoiceData.quantity || "",
        price: invoiceData.price || "",
        discount: invoiceData.discount || 0,
        tax_rate: Number(invoiceData.vat_rate ?? invoiceData.tax_rate ?? 0),
        tax_amount: Number(invoiceData.vat_amount ?? invoiceData.tax_amount ?? 0),
        notes: invoiceData.notes || ""
      });
    }
  }, [invoiceData]);

  useEffect(() => {
    if (!customers.length) return;

    const matchedCustomer = customers.find((customer) => {
      const displayName = [customer.company, customer.name].filter(Boolean).join(" - ") || customer.company || customer.name || "";
      return displayName === form.customer || customer.company === form.customer;
    });

    if (matchedCustomer) {
      setSelectedCustomerId(String(matchedCustomer.id || matchedCustomer._id));
    }
  }, [customers, form.customer]);

  // Fetch customers
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        setFetching(prev => ({ ...prev, customers: true }));
        const res = await API.get("/customers/catalog");
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
        const res = await API.get("/inventory/catalog");
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

  const updateLineItem = (index, field, value) => {
    setLineItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

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

    const displayName = [selectedCustomer.company, selectedCustomer.name].filter(Boolean).join(" - ") || selectedCustomer.company || selectedCustomer.name || "";
    setForm((prev) => ({
      ...prev,
      customer: displayName,
    }));
  };

  // Calculations
  const subtotal = lineItems.reduce(
    (sum, item) => sum + Number(item.quantity || 0) * Number(item.price || 0),
    0
  );
  const taxableBase = Math.max(0, subtotal - Number(form.discount || 0));
  const computedTaxAmount = (taxableBase * Number(form.tax_rate || 0)) / 100;
  const effectiveTaxAmount = Number.isFinite(Number(form.tax_amount))
    ? Number(form.tax_amount)
    : computedTaxAmount;
  const total = taxableBase + effectiveTaxAmount;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => {
      const next = { ...prev, [name]: value };
      if (name === "tax_rate") {
        const lineSubtotal = lineItems.reduce(
          (sum, row) => sum + Number(row.quantity || 0) * Number(row.price || 0),
          0
        );
        const nextBase = Math.max(0, lineSubtotal - Number(next.discount || 0));
        next.tax_amount = Number(((nextBase * Number(value || 0)) / 100).toFixed(2));
      }
      return next;
    });
  };

  const handleCreateCustomer = async () => {
    if (!newCustomer.name || !newCustomer.company) {
      toast.error("Customer name and company are required");
      return;
    }

    try {
      await API.post("/customers", newCustomer);
      const res = await API.get("/customers/catalog");
      const updatedCustomers = res.data || [];
      setCustomers(updatedCustomers);

      const created = updatedCustomers.find(
        (customer) =>
          customer.email === newCustomer.email ||
          (customer.name === newCustomer.name && customer.company === newCustomer.company)
      );

      if (created) {
        const createdId = String(created.id || created._id);
        setSelectedCustomerId(createdId);
        setForm((prev) => ({
          ...prev,
          customer: [created.company, created.name].filter(Boolean).join(" - ") || created.company || created.name || "",
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
      const payload = {
        ...newItem,
        current_stock: Number(newItem.current_stock || 0),
        min_stock: Number(newItem.min_stock || 0),
        purchase_price: Number(newItem.purchase_price || 0),
        selling_price: Number(newItem.selling_price || 0),
        sku: `SKU-${Date.now()}`,
      };

      await API.post("/inventory", payload);
      const res = await API.get("/inventory/catalog");
      const updatedItems = res.data || [];
      setItems(updatedItems);

      const created = updatedItems.find((item) => (item.product_name || item.name) === payload.product_name);
      if (created) {
        setForm((prev) => ({
          ...prev,
          item: created.product_name || created.name || "",
        }));

        setLineItems([
          {
            name: created.product_name || created.name || "",
            description: created.description || "",
            quantity: 1,
            price: Number(created.selling_price || created.price || 0),
          },
        ]);
      }

      setShowItemModal(false);
      setNewItem({
        product_name: "",
        category: "General",
        current_stock: "",
        min_stock: "",
        purchase_price: "",
        selling_price: "",
      });
      toast.success("Item added successfully");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to add item");
    }
  };

  const handleSubmit = async (e) => {
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
    const normalizedItems = lineItems
      .map((item) => ({
        name: String(item.name || "").trim(),
        description: item.description || "",
        quantity: Number(item.quantity || 0),
        price: Number(item.price || 0),
      }))
      .filter((item) => item.name && item.quantity > 0);

    if (!normalizedItems.length) {
      toast.error("Please add at least one item");
      return;
    }

    const firstItem = normalizedItems[0];

    setLoading(true);
    try {
      await onSave({
        ...form,
        item: firstItem.name,
        description: firstItem.description,
        quantity: firstItem.quantity,
        price: firstItem.price,
        items: [firstItem],
        items_json: JSON.stringify([firstItem]),
      });
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
  const filteredCustomers = customers.filter((customer) => {
    const searchValue = customerSearch.trim().toLowerCase();
    if (!searchValue) return true;
    return [customer.name, customer.company, customer.email]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(searchValue));
  });

  const itemOptions = useMemo(
    () =>
      items.map((inv) => ({
        id: inv.id || inv._id,
        label: inv.product_name || inv.name || "",
        price: Number(inv.selling_price || inv.price || 0),
        description: inv.description || "",
      })),
    [items]
  );

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
                  <div className="flex items-center justify-between mb-1">
                    <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Customer *</label>
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
                    disabled={loading}
                    className={`${inputClass} mb-2`}
                  />
                  <select
                    name="customer"
                    value={selectedCustomerId}
                    onChange={handleCustomerChange}
                    required
                    disabled={loading}
                    className={inputClass}
                  >
                    <option value="">Select Customer</option>
                    {filteredCustomers.length > 0 ? (
                      filteredCustomers.map(customer => (
                        <option key={customer.id || customer._id} value={String(customer.id || customer._id)}>
                          {[customer.company, customer.name].filter(Boolean).join(" - ")}
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
              <div className={`grid grid-cols-1 md:grid-cols-12 gap-3 p-4 rounded-xl border ${darkMode ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-gray-50"}`}>
                <div className="md:col-span-3">
                  <label className={`text-sm block ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Item *</label>
                  <select
                    value={lineItems[0]?.name || ""}
                    onChange={(e) => {
                      const selectedName = e.target.value;
                      const selected = itemOptions.find((option) => option.label === selectedName);
                      updateLineItem(0, "name", selectedName);
                      if (selected) {
                        if (!lineItems[0]?.description) {
                          updateLineItem(0, "description", selected.description);
                        }
                        if (!Number(lineItems[0]?.price || 0)) {
                          updateLineItem(0, "price", selected.price);
                        }
                      }
                    }}
                    required
                    disabled={loading}
                    className={inputClass}
                  >
                    <option value="">Select Item</option>
                    {itemOptions.length > 0 ? (
                      itemOptions.map((option) => (
                        <option key={String(option.id)} value={option.label}>
                          {option.label}
                        </option>
                      ))
                    ) : (
                      <option value="" disabled>No items available</option>
                    )}
                  </select>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setShowItemModal(true)}
                      className="text-xs inline-flex items-center gap-1 px-2 py-1 rounded bg-slate-700 text-white hover:bg-slate-800"
                    >
                      <Plus size={12} /> Create item
                    </button>
                  </div>
                  {items.length === 0 && (
                    <p className="text-xs text-red-500 mt-1">No inventory items found. Please add items in inventory first.</p>
                  )}
                </div>

                <div className="md:col-span-4">
                  <label className={`text-sm mb-1 block ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Description</label>
                  <input
                    value={lineItems[0]?.description || ""}
                    onChange={(e) => updateLineItem(0, "description", e.target.value)}
                    placeholder="Item description"
                    disabled={loading}
                    className={inputClass}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className={`text-sm mb-1 block ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Quantity</label>
                  <input
                    type="number"
                    min="1"
                    value={lineItems[0]?.quantity || 1}
                    onChange={(e) => updateLineItem(0, "quantity", e.target.value)}
                    placeholder="Enter quantity"
                    disabled={loading}
                    className={inputClass}
                  />
                </div>

                <div className="md:col-span-3">
                  <label className={`text-sm mb-1 block ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Unit Price (₦)</label>
                  <input
                    type="number"
                    min="0"
                    value={lineItems[0]?.price || 0}
                    onChange={(e) => updateLineItem(0, "price", e.target.value)}
                    placeholder="Unit price"
                    disabled={loading}
                    className={inputClass}
                  />
                </div>
              </div>
            </div>

            <div>
              <h3 className={`text-md font-medium mb-4 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Approval</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className={`text-sm mb-1 block ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Invoice Status</label>
                  <select
                    name="status"
                    value={form.status}
                    onChange={handleChange}
                    disabled={loading}
                    className={inputClass}
                  >
                    <option value="Unpaid">Unpaid</option>
                    <option value="Paid">Paid</option>
                    <option value="Pending">Pending</option>
                    <option value="Overdue">Overdue</option>
                  </select>
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

                <div className="flex justify-between items-center">
                  <span>VAT / Tax Rate (%)</span>
                  <input
                    type="number"
                    name="tax_rate"
                    value={form.tax_rate}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    disabled={loading}
                    className={`w-32 rounded px-2 py-1 text-right ${
                      darkMode
                        ? 'bg-gray-600 text-gray-200 border border-gray-500'
                        : 'bg-white text-gray-900 border border-gray-300'
                    }`}
                  />
                </div>

                <div className="flex justify-between items-center">
                  <span>VAT / Tax Amount</span>
                  <input
                    type="number"
                    name="tax_amount"
                    value={form.tax_amount}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    disabled={loading}
                    className={`w-32 rounded px-2 py-1 text-right ${
                      darkMode
                        ? 'bg-gray-600 text-gray-200 border border-gray-500'
                        : 'bg-white text-gray-900 border border-gray-300'
                    }`}
                  />
                </div>

                <div className="flex justify-between">
                  <span>Taxable Base</span>
                  <span>₦{taxableBase.toLocaleString()}</span>
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
                    Processing...
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    Submit Invoice
                  </>
                )}
              </button>

            </div>
          </form>
        )}
      </div>

      {showCustomerModal ? (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className={`w-full max-w-lg rounded-xl p-6 ${darkMode ? "bg-gray-800 text-gray-200" : "bg-white text-gray-800"}`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Create Customer</h3>
              <button type="button" onClick={() => setShowCustomerModal(false)} className="p-2 rounded hover:bg-gray-200/30">
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input className={inputClass} placeholder="Name *" value={newCustomer.name} onChange={(e) => setNewCustomer((prev) => ({ ...prev, name: e.target.value }))} />
              <input className={inputClass} placeholder="Company *" value={newCustomer.company} onChange={(e) => setNewCustomer((prev) => ({ ...prev, company: e.target.value }))} />
              <input className={inputClass} placeholder="Phone" value={newCustomer.phone} onChange={(e) => setNewCustomer((prev) => ({ ...prev, phone: e.target.value }))} />
              <input className={inputClass} placeholder="Email" value={newCustomer.email} onChange={(e) => setNewCustomer((prev) => ({ ...prev, email: e.target.value }))} />
              <textarea
                className={`md:col-span-2 ${inputClass}`}
                placeholder="Address"
                rows={3}
                value={newCustomer.address}
                onChange={(e) => setNewCustomer((prev) => ({ ...prev, address: e.target.value }))}
              />
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button type="button" onClick={() => setShowCustomerModal(false)} className={`px-4 py-2 rounded ${darkMode ? "bg-gray-600" : "bg-gray-200"}`}>Cancel</button>
              <button type="button" onClick={handleCreateCustomer} className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700">Save Customer</button>
            </div>
          </div>
        </div>
      ) : null}

      {showItemModal ? (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className={`w-full max-w-xl rounded-xl p-6 ${darkMode ? "bg-gray-800 text-gray-200" : "bg-white text-gray-800"}`}>
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
      ) : null}
    </>
  );
}