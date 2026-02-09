import React, { useState, useEffect } from "react";
import {
  Eye,
  Download,
  Edit3,
  ChevronLeft,
  ChevronRight,
  Search,
  X,
} from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useTheme } from "../context/ThemeContext";

const TABS = ["All Invoices", "Paid", "Unpaid", "Pending", "Overdue"];

const InvoiceDashboard = () => {
  const { darkMode } = useTheme();
  const [activeTab, setActiveTab] = useState("All Invoices");
  const [invoices, setInvoices] = useState([]);
  const [search, setSearch] = useState("");
  const [perPage, setPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [viewOpen, setViewOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({});

  useEffect(() => {
    setInvoices([
      {
        id: "INV-001",
        customer: "ABC Corp",
        date: "2023-10-15",
        due: "2023-10-30",
        amount: 245000,
        status: "Unpaid",
      },
      {
        id: "INV-002",
        customer: "XYZ Ent",
        date: "2023-10-14",
        due: "2023-10-29",
        amount: 178500,
        status: "Paid",
      },
      {
        id: "INV-003",
        customer: "Global Sol",
        date: "2023-10-12",
        due: "2023-10-27",
        amount: 320000,
        status: "Overdue",
      },
      {
        id: "INV-004",
        customer: "TechNova Ltd",
        date: "2023-10-18",
        due: "2023-11-02",
        amount: 150000,
        status: "Pending",
      },
    ]);
  }, []);

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

    if (
      search &&
      !inv.customer.toLowerCase().includes(search.toLowerCase()) &&
      !inv.id.toLowerCase().includes(search.toLowerCase())
    )
      return false;

    return true;
  });

  const handleView = (invoice) => {
    setSelectedInvoice(invoice);
    setViewOpen(true);
  };

  const handleEdit = (invoice) => {
    setEditForm(invoice);
    setEditOpen(true);
  };

  const saveEdit = () => {
    setInvoices((prev) =>
      prev.map((inv) => (inv.id === editForm.id ? editForm : inv))
    );
    toast.success("Invoice updated successfully");
    setEditOpen(false);
  };

  return (
    <div
      className={`p-4 md:p-8 min-h-screen ${
        darkMode
          ? "bg-slate-900 text-white"
          : "bg-slate-50 text-slate-900"
      }`}
    >
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
                ? "bg-slate-800 text-white"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-xl overflow-hidden shadow">
        <div className="p-4 flex flex-wrap gap-3 justify-between bg-slate-800 text-white">
          <div>
            Show
            <select
              value={perPage}
              onChange={(e) => setPerPage(Number(e.target.value))}
              className="mx-2 px-2 py-1 rounded bg-slate-700"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
            </select>
            entries
          </div>

          <div className="relative w-64">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search invoices..."
              className="pl-9 py-2 w-full rounded bg-slate-700 outline-none"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-left">
            <thead className="bg-slate-100">
              <tr>
                {[
                  "Invoice",
                  "Customer",
                  "Date",
                  "Due",
                  "Amount",
                  "Status",
                  "Actions",
                ].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-xs font-bold uppercase"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredInvoices
                .slice(
                  (currentPage - 1) * perPage,
                  currentPage * perPage
                )
                .map((inv) => (
                  <tr key={inv.id} className="shadow">
                    <td className="px-4 py-2 font-bold text-blue-600">
                      {inv.id}
                    </td>
                    <td className="px-4 py-2">{inv.customer}</td>
                    <td className="px-4 py-2">{inv.date}</td>
                    <td className="px-4 py-2">{inv.due}</td>
                    <td className="px-4 py-2 font-bold">
                      ₦{inv.amount.toLocaleString()}
                    </td>
                    <td className="px-4 py-2">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusStyles(
                          inv.status
                        )}`}
                      >
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-4 py-2 flex gap-2">
                      <button
                        onClick={() => handleView(inv)}
                        className="p-2 hover:bg-blue-100 rounded"
                      >
                        <Eye size={18} />
                      </button>
                      <button className="p-2 hover:bg-emerald-100 rounded">
                        <Download size={18} />
                      </button>
                      <button
                        onClick={() => handleEdit(inv)}
                        className="p-2 hover:bg-amber-100 rounded"
                      >
                        <Edit3 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 flex justify-between items-center text-sm">
          <span>
            Showing {(currentPage - 1) * perPage + 1}–
            {Math.min(currentPage * perPage, filteredInvoices.length)} of{" "}
            {filteredInvoices.length}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() =>
                setCurrentPage((p) => Math.max(p - 1, 1))
              }
            >
              <ChevronLeft />
            </button>
            <button
              onClick={() =>
                setCurrentPage((p) =>
                  p * perPage < filteredInvoices.length ? p + 1 : p
                )
              }
            >
              <ChevronRight />
            </button>
          </div>
        </div>
      </div>

      {/* View Modal */}
      {viewOpen && selectedInvoice && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg shadow-xl">
            <div className="flex justify-between mb-4">
              <h2 className="font-bold text-lg">Invoice Details</h2>
              <button onClick={() => setViewOpen(false)}>
                <X />
              </button>
            </div>

            <table className="w-full text-sm">
              <tbody>
                {Object.entries(selectedInvoice).map(([k, v]) => (
                  <tr key={k}>
                    <td className="py-2 font-semibold capitalize">{k}</td>
                    <td className="py-2">
                      {k === "amount"
                        ? `₦${v.toLocaleString()}`
                        : v}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg shadow-2xl">
            <div className="flex justify-between mb-4">
              <h2 className="font-bold text-lg">Edit Invoice</h2>
              <button onClick={() => setEditOpen(false)}>
                <X />
              </button>
            </div>

            <div className="space-y-4">
              {["customer", "date", "due", "amount"].map((field) => (
                <input
                  key={field}
                  value={editForm[field]}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      [field]: e.target.value,
                    })
                  }
                  placeholder={field}
                  className="w-full px-4 py-3 rounded-xl shadow outline-none"
                />
              ))}

              <select
                value={editForm.status}
                onChange={(e) =>
                  setEditForm({
                    ...editForm,
                    status: e.target.value,
                  })
                }
                className="w-full px-4 py-3 rounded-xl shadow outline-none"
              >
                <option>Paid</option>
                <option>Unpaid</option>
                <option>Pending</option>
                <option>Overdue</option>
              </select>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={saveEdit}
                  className="px-5 py-2 bg-blue-600 text-white rounded-xl"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoiceDashboard;
