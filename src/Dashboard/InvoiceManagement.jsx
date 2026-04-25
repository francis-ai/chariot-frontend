import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { FaPlus } from "react-icons/fa";
import Sidebar from "../component/sidebar";
import NavBar from "../component/navigation";
import InvoiceForm from "./invoice";
import InvoiceAction from "./InvoiceAction";
import { useTheme } from "../context/ThemeContext";
import API from "../utils/api";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

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

export default function InvoiceManagement() {
  const [showInvoice, setShowInvoice] = useState(false);
  const { darkMode } = useTheme();
  const [searchParams] = useSearchParams();
  const focusInvoiceId = searchParams.get("view");
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    paid: 0,
    unpaid: 0,
    pending: 0,
    totalAmount: 0,
    paidAmount: 0,
    unpaidAmount: 0,
    pendingAmount: 0,
  });

  // Fetch invoices on mount
  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const res = await API.get("/invoices");
      console.log("Fetched invoices:", res.data);
      
      // Map API response to component format
      const mappedInvoices = res.data.map(inv => ({
        id: inv.id || inv._id,
        invoice_number: inv.invoice_number,
        customer: inv.customer || "",
        created_by: inv.created_by,
        created_by_name: inv.created_by_name || "",
        signature_name: inv.signature_name || "",
        signature_image: inv.signature_image || "",
        invoice_date: inv.invoice_date ? inv.invoice_date.split('T')[0] : "",
        due_date: inv.due_date ? inv.due_date.split('T')[0] : "",
        item: inv.item || "",
        items_json: inv.items_json || "",
        items: (() => {
          if (Array.isArray(inv.items)) return inv.items;
          if (typeof inv.items_json === "string" && inv.items_json.trim()) {
            try {
              const parsed = JSON.parse(inv.items_json);
              return Array.isArray(parsed) ? parsed : [];
            } catch (error) {
              return [];
            }
          }
          return [];
        })(),
        description: inv.description || "",
        quantity: parseInt(inv.quantity) || 0,
        price: parseFloat(inv.price) || 0,
        discount: parseFloat(inv.discount) || 0,
        tax_rate: parseFloat(inv.vat_rate ?? inv.tax_rate) || 0,
        tax_amount: parseFloat(inv.vat_amount ?? inv.tax_amount) || 0,
        currency: String(inv.currency || "NGN").toUpperCase(),
        total: parseFloat(inv.total) || 0,  // Ensure this is a number
        formatted_total: formatMoney(parseFloat(inv.total) || 0, inv.currency || "NGN"),
        notes: inv.notes || "",
        status: inv.status || getInvoiceStatus(inv.due_date, inv.total)
      }));
      
      setInvoices(mappedInvoices);
      calculateStats(mappedInvoices);
    } catch (err) {
      console.error("Fetch invoices error:", err);
      toast.error(err.response?.data?.message || "Failed to fetch invoices");
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  };

  const getInvoiceStatus = (dueDate, total) => {
    if (!dueDate || total === 0) return "Pending";
    
    const today = new Date();
    const due = new Date(dueDate);
    const diffDays = Math.ceil((due - today) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return "Overdue";
    if (diffDays <= 7) return "Pending";
    return "Unpaid";
  };

  const calculateStats = (invoices) => {
    const total = invoices.length;
    
    // Ensure totalAmount is treated as a number
    const totalAmount = invoices.reduce((sum, inv) => {
      const amount = parseFloat(inv.total) || 0;
      return sum + amount;
    }, 0);
    
    const paidInvoices = invoices.filter(inv => String(inv.status || "").toLowerCase() === "paid");
    const unpaidInvoices = invoices.filter(inv => String(inv.status || "").toLowerCase() === "unpaid");
    const pendingInvoices = invoices.filter(inv => String(inv.status || "").toLowerCase() === "pending");
    const pending = invoices.filter(inv => inv.status === "Pending" || inv.status === "Unpaid").length;
    const paid = paidInvoices.length;
    const unpaid = unpaidInvoices.length;
    const pendingOnly = pendingInvoices.length;

    const paidAmount = paidInvoices.reduce((sum, inv) => sum + (parseFloat(inv.total) || 0), 0);
    const unpaidAmount = unpaidInvoices.reduce((sum, inv) => sum + (parseFloat(inv.total) || 0), 0);
    const pendingAmount = pendingInvoices.reduce((sum, inv) => sum + (parseFloat(inv.total) || 0), 0);
    
    setStats({
      total,
      paid,
      unpaid,
      pending: pendingOnly || pending,
      totalAmount,
      paidAmount,
      unpaidAmount,
      pendingAmount,
    });
  };

  const handleSaveInvoice = async (invoiceData) => {
    try {
      const normalizedItems = Array.isArray(invoiceData.items)
        ? invoiceData.items
            .map((row) => ({
              name: String(row.name || row.item || row.product_name || "").trim(),
              item_code: String(row.item_code || row.code || "").trim(),
              description: row.description || "",
              quantity: Number(row.quantity || row.qty || 0),
              price: Number(row.price || 0),
            }))
            .filter((row) => row.name && row.quantity > 0)
        : [];

      const lineItems = normalizedItems.length
        ? normalizedItems
        : [
            {
              name: invoiceData.item,
              item_code: invoiceData.item_code || "",
              description: invoiceData.description || "",
              quantity: Number(invoiceData.quantity || 0),
              price: Number(invoiceData.price || 0),
            },
          ].filter((row) => row.name && row.quantity > 0);

      const firstItem = lineItems[0] || { name: "", description: "", quantity: 0, price: 0 };
      const subtotal = lineItems.reduce(
        (sum, row) => sum + Number(row.quantity || 0) * Number(row.price || 0),
        0
      );
      const discount = Math.max(0, Math.min(100, Number(invoiceData.discount || 0)));
      const discountAmount = (subtotal * discount) / 100;
      const taxableBase = Math.max(0, subtotal - discountAmount);
      const taxRate = Number(invoiceData.tax_rate || invoiceData.vat_rate || 0);
      const explicitTaxAmount = Number(invoiceData.tax_amount || invoiceData.vat_amount);
      const taxAmount = Number.isFinite(explicitTaxAmount) ? explicitTaxAmount : (taxableBase * taxRate) / 100;
      const total = taxableBase + taxAmount;
      
      const payload = {
        invoice_number: invoiceData.invoice_number || `CLTINV-${Date.now()}`,
        customer: invoiceData.customer,
        signature_name: invoiceData.signature_name || "",
        invoice_date: invoiceData.invoice_date,
        due_date: invoiceData.due_date,
        item: firstItem.name,
        description: firstItem.description || "",
        quantity: parseInt(firstItem.quantity) || 0,
        price: parseFloat(firstItem.price) || 0,
        items: lineItems,
        items_json: JSON.stringify(lineItems),
        discount,
        tax_rate: taxRate,
        tax_amount: taxAmount,
        vat_rate: taxRate,
        vat_amount: taxAmount,
        total: total,
        currency: String(invoiceData.currency || "NGN").toUpperCase(),
        status: invoiceData.status || "Unpaid",
        signature_name: invoiceData.signature_name || "",
        signature_image: invoiceData.signature_image || "",
        notes: invoiceData.notes || ""
      };

      console.log("Saving invoice with payload:", payload);

      if (invoiceData.id) {
        // Update existing invoice
        await API.put(`/invoices/${invoiceData.id}`, payload);
        toast.success("Invoice updated successfully!");
      } else {
        // Create new invoice
        await API.post("/invoices", payload);
        toast.success("Invoice created successfully!");
      }
      
      await fetchInvoices(); // Refresh the list
      setShowInvoice(false);
    } catch (err) {
      console.error("Save invoice error:", err);
      toast.error(err.response?.data?.message || "Failed to save invoice");
    }
  };

  return (
    <div className={`min-h-screen block lg:flex transition-colors ${darkMode ? "bg-gray-900" : "bg-gray-100"}`}>
      <ToastContainer position="top-right" autoClose={2500} hideProgressBar />
      <Sidebar />

      <div className="flex-1 flex flex-col">
        <NavBar />

        <main className="p-4 md:p-6 mt-20 lg:p-8 flex-1">
          <div className={`rounded-xl shadow-sm p-6 transition-colors ${darkMode ? "bg-gray-800 text-gray-100" : "bg-white text-gray-800"}`}>
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
              <div>
                <h1 className={`text-2xl font-bold transition-colors ${darkMode ? "text-gray-100" : "text-gray-800"}`}>
                  Invoice Management
                </h1>
                <p className={`text-sm mt-1 transition-colors ${darkMode ? "text-gray-300" : "text-gray-500"}`}>
                  Create and manage invoices
                </p>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-3">
                {showInvoice ? (
                  <button
                    onClick={() => setShowInvoice(false)}
                    className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition"
                  >
                    <FaPlus />
                    Close Invoice
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => setShowInvoice(true)}
                      className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition"
                    >
                      <FaPlus />
                      Create Invoice
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Stats */}
            {!loading && (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
                <div className={`rounded-lg p-5 transition-colors ${darkMode ? "bg-gray-700 text-gray-100" : "bg-gray-50 text-gray-800"}`}>
                  <p className={`text-sm mb-1 ${darkMode ? "text-gray-300" : "text-gray-500"}`}>Total Invoices</p>
                  <h2 className="text-3xl font-bold">{stats.total}</h2>
                  <p className="text-xs mt-2 opacity-80">{Number(stats.totalAmount || 0).toLocaleString()} (mixed currencies)</p>
                </div>

                <div className={`rounded-lg p-5 transition-colors ${darkMode ? "bg-gray-700 text-gray-100" : "bg-gray-50 text-gray-800"}`}>
                  <p className={`text-sm mb-1 ${darkMode ? "text-gray-300" : "text-gray-500"}`}>Paid</p>
                  <h2 className="text-3xl font-bold text-green-600 dark:text-green-400">{stats.paid}</h2>
                  <p className="text-xs mt-2 opacity-80">{Number(stats.paidAmount || 0).toLocaleString()} (mixed currencies)</p>
                </div>

                <div className={`rounded-lg p-5 transition-colors ${darkMode ? "bg-gray-700 text-gray-100" : "bg-gray-50 text-gray-800"}`}>
                  <p className={`text-sm mb-1 ${darkMode ? "text-gray-300" : "text-gray-500"}`}>Unpaid</p>
                  <h2 className="text-3xl font-bold text-orange-600 dark:text-orange-400">{stats.unpaid}</h2>
                  <p className="text-xs mt-2 opacity-80">{Number(stats.unpaidAmount || 0).toLocaleString()} (mixed currencies)</p>
                </div>

                <div className={`rounded-lg p-5 transition-colors ${darkMode ? "bg-gray-700 text-gray-100" : "bg-gray-50 text-gray-800"}`}>
                  <p className={`text-sm mb-1 ${darkMode ? "text-gray-300" : "text-gray-500"}`}>Pending</p>
                  <h2 className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">{stats.pending}</h2>
                  <p className="text-xs mt-2 opacity-80">{Number(stats.pendingAmount || 0).toLocaleString()} (mixed currencies)</p>
                </div>

                <div className={`rounded-lg p-5 transition-colors sm:col-span-2 xl:col-span-4 ${darkMode ? "bg-gray-700 text-gray-100" : "bg-gray-50 text-gray-800"}`}>
                  <p className={`text-sm mb-1 ${darkMode ? "text-gray-300" : "text-gray-500"}`}>Total Amount</p>
                  <h2 className="text-3xl font-bold">
                    {stats.totalAmount ? `${stats.totalAmount.toLocaleString()} (mixed currencies)` : '0 (mixed currencies)'}
                  </h2>
                </div>
              </div>
            )}
          </div>

          {/* Invoice Form */}
          {showInvoice && (
            <div className={`mt-8 p-6 rounded-xl shadow-sm transition-colors 
              ${darkMode ? "bg-gray-800 text-gray-100" : "bg-white text-gray-800"}`}
            >
              <InvoiceForm 
                onClose={() => setShowInvoice(false)} 
                onSave={handleSaveInvoice}
                darkMode={darkMode}
              />
            </div>
          )}

          {/* Invoice Actions/List */}
          <div className="mt-6">
            <InvoiceAction 
              invoices={invoices}
              loading={loading}
              onRefresh={fetchInvoices}
              darkMode={darkMode}
              focusId={focusInvoiceId}
            />
          </div>
        </main>
      </div>
    </div>
  );
}