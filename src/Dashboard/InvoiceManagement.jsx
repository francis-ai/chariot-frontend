import React, { useState, useEffect } from "react";
import { FaPlus, FaPrint } from "react-icons/fa";
import Sidebar from "../component/sidebar";
import NavBar from "../component/navigation";
import InvoiceForm from "./invoice";
import InvoiceAction from "./InvoiceAction";
import { useTheme } from "../context/ThemeContext";
import API from "../utils/api";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function InvoiceManagement() {
  const [showInvoice, setShowInvoice] = useState(false);
  const { darkMode } = useTheme();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    totalAmount: 0,
    pending: 0
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
        description: inv.description || "",
        quantity: parseInt(inv.quantity) || 0,
        price: parseFloat(inv.price) || 0,
        discount: parseFloat(inv.discount) || 0,
        total: parseFloat(inv.total) || 0,  // Ensure this is a number
        formatted_total: `₦${(parseFloat(inv.total) || 0).toLocaleString()}`,
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
    
    const pending = invoices.filter(inv => inv.status === "Pending" || inv.status === "Unpaid").length;
    
    setStats({
      total,
      totalAmount,
      pending
    });
  };

  const handleSaveInvoice = async (invoiceData) => {
    try {
      // Calculate total
      const subtotal = invoiceData.quantity * invoiceData.price;
      const total = subtotal - (invoiceData.discount || 0);
      
      const payload = {
        invoice_number: invoiceData.invoice_number || `CLT-${Date.now()}`,
        customer: invoiceData.customer,
        signature_name: invoiceData.signature_name || "",
        invoice_date: invoiceData.invoice_date,
        due_date: invoiceData.due_date,
        item: invoiceData.item,
        description: invoiceData.description || "",
        quantity: parseInt(invoiceData.quantity) || 0,
        price: parseFloat(invoiceData.price) || 0,
        discount: parseFloat(invoiceData.discount) || 0,
        total: total,
        status: invoiceData.status || "Unpaid",
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
                  Create, manage and print invoices
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
                    <button
                      onClick={() => window.print()}
                      className={`flex items-center gap-2 border px-4 py-2 rounded-lg transition
                        ${darkMode ? "border-gray-600 text-gray-200 hover:bg-gray-700" : "border-gray-300 text-gray-700 hover:bg-gray-100"}`}
                    >
                      <FaPrint />
                      Print
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Stats */}
            {!loading && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className={`rounded-lg p-5 transition-colors ${darkMode ? "bg-gray-700 text-gray-100" : "bg-gray-50 text-gray-800"}`}>
                  <p className={`text-sm mb-1 ${darkMode ? "text-gray-300" : "text-gray-500"}`}>Total Invoices</p>
                  <h2 className="text-3xl font-bold">{stats.total}</h2>
                </div>

                <div className={`rounded-lg p-5 transition-colors ${darkMode ? "bg-gray-700 text-gray-100" : "bg-gray-50 text-gray-800"}`}>
                  <p className={`text-sm mb-1 ${darkMode ? "text-gray-300" : "text-gray-500"}`}>Total Amount</p>
                  <h2 className="text-3xl font-bold">
                    {stats.totalAmount ? `₦${stats.totalAmount.toLocaleString()}` : '₦0'}
                  </h2>
                </div>

                <div className={`rounded-lg p-5 transition-colors ${darkMode ? "bg-gray-700 text-gray-100" : "bg-gray-50 text-gray-800"}`}>
                  <p className={`text-sm mb-1 ${darkMode ? "text-gray-300" : "text-gray-500"}`}>Pending Invoices</p>
                  <h2 className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">{stats.pending}</h2>
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
            />
          </div>
        </main>
      </div>
    </div>
  );
}