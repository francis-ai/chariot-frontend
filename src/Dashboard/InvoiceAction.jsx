import React, { useState, useEffect } from "react";
import {
  Eye,
  Download,
  Edit3,
  ChevronLeft,
  ChevronRight,
  Search,
  X,
  Trash2,
} from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import API from "../utils/api";
import InvoiceForm from "./invoice";
import { downloadInvoicePdf } from "../utils/documentPdf";

const TABS = ["All Invoices", "Paid", "Unpaid", "Pending", "Overdue"];

const InvoiceDashboard = ({ invoices: propInvoices, loading: propLoading, onRefresh, darkMode }) => {
  const [activeTab, setActiveTab] = useState("All Invoices");
  const [invoices, setInvoices] = useState([]);
  const [search, setSearch] = useState("");
  const [perPage, setPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [viewOpen, setViewOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteModal, setDeleteModal] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Use props if provided, otherwise fetch locally
  useEffect(() => {
    if (propInvoices) {
      setInvoices(propInvoices);
    } else {
      fetchInvoices();
    }
  }, [propInvoices]);

  const fetchInvoices = async () => {
    try {
      const res = await API.get("/invoices");
      setInvoices(res.data);
    } catch (err) {
      toast.error("Failed to fetch invoices");
    }
  };

  const getStatusStyles = (status) => {
    switch (status) {
      case "Paid":
        return "bg-emerald-100 text-emerald-700";
      case "Unpaid":
        return "bg-amber-100 text-amber-700";
      case "Pending":
        return "bg-sky-100 text-sky-700";
      case "Overdue":
        return "bg-rose-100 text-rose-700";
      default:
        return "bg-slate-100 text-slate-700";
    }
  };

  const filteredInvoices = invoices.filter((inv) => {
    if (activeTab !== "All Invoices" && inv.status !== activeTab) return false;
    if (search && !inv.customer?.toLowerCase().includes(search.toLowerCase()) && 
        !inv.invoice_number?.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }
    return true;
  });

  const handleView = (invoice) => {
    setSelectedInvoice(invoice);
    setViewOpen(true);
  };

  const handleEdit = (invoice) => {
    setSelectedInvoice(invoice);
    setEditOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteModal) return;
    
    setDeleting(true);
    try {
      await API.delete(`/invoices/${deleteModal.id}`);
      toast.success("Invoice deleted successfully");
      if (onRefresh) onRefresh();
      setDeleteModal(null);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete invoice");
    } finally {
      setDeleting(false);
    }
  };

  const handleDownload = (invoice) => {
    downloadInvoicePdf(invoice)
      .then(() => toast.success("Invoice downloaded successfully!"))
      .catch(() => toast.error("Failed to download invoice PDF"));
  };

  const handleSaveEdit = async (updatedData) => {
    try {
      const subtotal = Number(updatedData.quantity || 0) * Number(updatedData.price || 0);
      const total = subtotal - Number(updatedData.discount || 0);
      const payload = {
        invoice_number: updatedData.invoice_number || selectedInvoice?.invoice_number || `CLT-${Date.now()}`,
        customer: updatedData.customer,
        invoice_date: updatedData.invoice_date,
        due_date: updatedData.due_date,
        item: updatedData.item,
        description: updatedData.description || "",
        quantity: Number(updatedData.quantity) || 0,
        price: Number(updatedData.price) || 0,
        discount: Number(updatedData.discount) || 0,
        total,
        signature_name: updatedData.signature_name || "",
        notes: updatedData.notes || "",
      };

      await API.put(`/invoices/${selectedInvoice.id}`, payload);
      toast.success("Invoice updated successfully");
      if (onRefresh) onRefresh();
      setEditOpen(false);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update invoice");
    }
  };

  const paginatedInvoices = filteredInvoices.slice(
    (currentPage - 1) * perPage,
    currentPage * perPage
  );

  return (
    <div className={`p-4 md:p-8 min-h-screen ${
      darkMode ? "bg-slate-900 text-white" : "bg-slate-50 text-slate-900"
    }`}>
      <ToastContainer />

      {/* Tabs */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => {
              setActiveTab(tab);
              setCurrentPage(1);
            }}
            className={`px-4 py-2 rounded-t-xl text-sm font-semibold transition ${
              activeTab === tab
                ? darkMode ? "bg-slate-700 text-white" : "bg-slate-800 text-white"
                : darkMode ? "text-slate-400 hover:text-white" : "text-slate-500 hover:text-slate-900"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-xl overflow-hidden shadow">
        <div className={`p-4 flex flex-wrap gap-3 justify-between ${
          darkMode ? "bg-slate-800 text-white" : "bg-slate-800 text-white"
        }`}>
          <div>
            Show
            <select
              value={perPage}
              onChange={(e) => setPerPage(Number(e.target.value))}
              className="mx-2 px-2 py-1 rounded bg-slate-700"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
            entries
          </div>

          <div className="relative w-64">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search invoices..."
              className="pl-9 py-2 w-full rounded bg-slate-700 outline-none text-white placeholder-slate-400"
            />
          </div>
        </div>

        {propLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p>Loading invoices...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left">
              <thead className={darkMode ? "bg-slate-700" : "bg-slate-100"}>
                <tr>
                  {["Invoice #", "Customer", "Date", "Due", "Item", "Total", "Status", "Actions"].map((h) => (
                    <th key={h} className="px-4 py-3 text-xs font-bold uppercase">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginatedInvoices.map((inv) => (
                  <tr key={inv.id} className={`border-b ${darkMode ? "border-slate-700 hover:bg-slate-800" : "border-slate-200 hover:bg-slate-50"}`}>
                    <td className="px-4 py-2 font-bold text-blue-600">{inv.invoice_number}</td>
                    <td className="px-4 py-2">{inv.customer}</td>
                    <td className="px-4 py-2">{inv.invoice_date}</td>
                    <td className="px-4 py-2">{inv.due_date}</td>
                    <td className="px-4 py-2">{inv.item}</td>
                    <td className="px-4 py-2 font-bold">₦{Number(inv.total).toLocaleString()}</td>
                    <td className="px-4 py-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusStyles(inv.status)}`}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleView(inv)}
                          className="p-2 hover:bg-blue-100 rounded"
                          title="View"
                        >
                          <Eye size={18} />
                        </button>
                        <button
                          onClick={() => handleDownload(inv)}
                          className="p-2 hover:bg-emerald-100 rounded"
                          title="Download"
                        >
                          <Download size={18} />
                        </button>
                        <button
                          onClick={() => handleEdit(inv)}
                          className="p-2 hover:bg-amber-100 rounded"
                          title="Edit"
                        >
                          <Edit3 size={18} />
                        </button>
                        <button
                          onClick={() => setDeleteModal(inv)}
                          className="p-2 hover:bg-red-100 rounded"
                          title="Delete"
                        >
                          <Trash2 size={18} />
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
        {!propLoading && filteredInvoices.length > 0 && (
          <div className={`p-4 flex justify-between items-center text-sm ${darkMode ? "bg-slate-800" : "bg-white"}`}>
            <span>
              Showing {(currentPage - 1) * perPage + 1}–
              {Math.min(currentPage * perPage, filteredInvoices.length)} of{" "}
              {filteredInvoices.length}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className="p-1 disabled:opacity-50"
              >
                <ChevronLeft />
              </button>
              <button
                onClick={() => setCurrentPage((p) =>
                  p * perPage < filteredInvoices.length ? p + 1 : p
                )}
                disabled={currentPage * perPage >= filteredInvoices.length}
                className="p-1 disabled:opacity-50"
              >
                <ChevronRight />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* View Modal */}
      {viewOpen && selectedInvoice && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className={`rounded-xl p-6 w-full max-w-lg shadow-xl ${
            darkMode ? "bg-slate-800 text-white" : "bg-white"
          }`}>
            <div className="flex justify-between mb-4">
              <h2 className="font-bold text-lg">Invoice Details</h2>
              <button onClick={() => setViewOpen(false)} className="p-1 hover:bg-gray-100 rounded">
                <X />
              </button>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs uppercase opacity-60">Invoice #</label>
                  <p className="font-semibold">{selectedInvoice.invoice_number}</p>
                </div>
                <div>
                  <label className="text-xs uppercase opacity-60">Status</label>
                  <p className={`inline-block px-2 py-1 rounded text-xs font-semibold ${getStatusStyles(selectedInvoice.status)}`}>
                    {selectedInvoice.status}
                  </p>
                </div>
                <div>
                  <label className="text-xs uppercase opacity-60">Customer</label>
                  <p>{selectedInvoice.customer}</p>
                </div>
                <div>
                  <label className="text-xs uppercase opacity-60">Date</label>
                  <p>{selectedInvoice.invoice_date}</p>
                </div>
                <div>
                  <label className="text-xs uppercase opacity-60">Due Date</label>
                  <p>{selectedInvoice.due_date}</p>
                </div>
                <div>
                  <label className="text-xs uppercase opacity-60">Item</label>
                  <p>{selectedInvoice.item}</p>
                </div>
                <div>
                  <label className="text-xs uppercase opacity-60">Quantity</label>
                  <p>{selectedInvoice.quantity}</p>
                </div>
                <div>
                  <label className="text-xs uppercase opacity-60">Price</label>
                  <p>₦{Number(selectedInvoice.price).toLocaleString()}</p>
                </div>
                <div>
                  <label className="text-xs uppercase opacity-60">Discount</label>
                  <p>₦{Number(selectedInvoice.discount || 0).toLocaleString()}</p>
                </div>
                <div>
                  <label className="text-xs uppercase opacity-60">Total</label>
                  <p className="font-bold">₦{Number(selectedInvoice.total).toLocaleString()}</p>
                </div>
              </div>
              {selectedInvoice.notes && (
                <div>
                  <label className="text-xs uppercase opacity-60">Notes</label>
                  <p className="text-sm bg-gray-50 p-2 rounded">{selectedInvoice.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editOpen && selectedInvoice && (
        <div className="fixed inset-0 bg-black/50 flex items-start sm:items-center justify-center z-50 overflow-y-auto p-4">
          <div className={`w-full max-w-4xl rounded-xl p-6 max-h-[90vh] overflow-y-auto ${
            darkMode ? "bg-slate-800" : "bg-white"
          }`}>
            <InvoiceForm
              invoiceData={selectedInvoice}
              onClose={() => setEditOpen(false)}
              onSave={handleSaveEdit}
              darkMode={darkMode}
            />
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className={`w-full max-w-md rounded-xl p-6 ${
            darkMode ? "bg-slate-800 text-white" : "bg-white"
          }`}>
            <div className="text-center mb-6">
              <div className="flex items-center justify-center mb-4">
                <div className={`w-20 h-20 rounded-full flex items-center justify-center ${
                  darkMode ? 'bg-red-900/20' : 'bg-red-100'
                }`}>
                  <Trash2 size={40} className="text-red-600" />
                </div>
              </div>
              
              <h2 className="text-xl font-bold mb-2">Delete Invoice</h2>
              
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                Are you sure you want to delete this invoice?
              </p>
              
              <div className={`p-4 rounded-lg text-left mb-4 ${
                darkMode ? 'bg-slate-700' : 'bg-gray-50'
              }`}>
                <p className="font-bold">{deleteModal.invoice_number}</p>
                <p className="text-sm mt-2">Customer: {deleteModal.customer}</p>
                <p className="text-sm">Amount: ₦{Number(deleteModal.total).toLocaleString()}</p>
              </div>
              
              <p className="text-sm text-red-600 font-medium">
                This action cannot be undone.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setDeleteModal(null)}
                disabled={deleting}
                className={`flex-1 px-4 py-2 rounded-lg font-medium transition ${
                  darkMode ? 'bg-slate-700 hover:bg-slate-600' : 'bg-gray-200 hover:bg-gray-300'
                } ${deleting ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 px-4 py-2 rounded-lg font-medium bg-red-600 hover:bg-red-700 text-white transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {deleting && (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                )}
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoiceDashboard;