import React, { useMemo, useState, useEffect } from "react";
import { useContext } from "react";
import Navigation from "../../component/navigation";
import Sidebar from "../../component/sidebar";
import { useSearch } from "../../context/searchcontex";
import { Eye, X, Plus, Edit, Trash2 } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import { AuthContext } from "../../context/authContext";
import API from "../../utils/api";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function CustomersDashboard() {
  const { searchQuery, setSearchQuery } = useSearch();
  const { darkMode } = useTheme();
  const PAGE_SIZE = 10;

  const [customers, setCustomers] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editCustomer, setEditCustomer] = useState(null);
  const [viewCustomer, setViewCustomer] = useState(null);
  const [deleteModal, setDeleteModal] = useState(null); // For delete confirmation
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const { user } = useContext(AuthContext);
  const canDeleteCustomer = ["super-admin", "admin"].includes(String(user?.role || "").toLowerCase());

  // Fetch customers
  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const res = await API.get("/customers");
      setCustomers(res.data);
    } catch (err) {
      toast.error("Failed to fetch customers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  // Filtered customers
  const filteredCustomers = useMemo(() => {
    if (!searchQuery.trim()) return customers;
    const lower = searchQuery.toLowerCase();
    return customers.filter(
      (c) =>
        c.name?.toLowerCase().includes(lower) ||
        c.email?.toLowerCase().includes(lower) ||
        c.phone?.includes(lower) ||
        c.company?.toLowerCase().includes(lower) ||
        c.address?.toLowerCase().includes(lower) ||
        c.status?.toLowerCase().includes(lower)
    );
  }, [searchQuery, customers]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, customers.length]);

  const totalPages = Math.max(1, Math.ceil(filteredCustomers.length / PAGE_SIZE));
  const paginatedCustomers = useMemo(() => {
    return filteredCustomers.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  }, [filteredCustomers, currentPage]);

  // Add or edit customer
  const handleSaveCustomer = async (customerData) => {
    try {
      if (editCustomer) {
        const res = await API.put(`/customers/${editCustomer.id}`, customerData);
        setCustomers(prev =>
          prev.map(c => (c.id === editCustomer.id ? { ...c, ...customerData } : c))
        );
        toast.success(res.data.message || "Customer updated successfully");
        setEditCustomer(null);
      } else {
        const res = await API.post("/customers", customerData);
        const addedCustomer = { id: res.data.customerId || res.data.id, ...customerData };
        setCustomers(prev => [addedCustomer, ...prev]);
        toast.success(res.data.message || "Customer added successfully");
      }
      setShowAddModal(false);
    } catch (err) {
      toast.error(err.response?.data?.message || "Operation failed");
    }
  };

  // Delete customer
  const handleDeleteCustomer = async () => {
    if (!deleteModal) return;
    
    setDeleting(true);
    try {
      await API.delete(`/customers/${deleteModal.id}`);
      setCustomers(prev => prev.filter(c => c.id !== deleteModal.id));
      setDeleteModal(null);
      toast.success("Customer deleted successfully");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete customer");
    } finally {
      setDeleting(false);
    }
  };

  const bgClass = darkMode ? "bg-gray-900 text-gray-100" : "bg-gray-100 text-gray-900";
  const inputBg = darkMode ? "bg-gray-800 text-gray-100 placeholder-gray-400" : "bg-white text-gray-900 placeholder-gray-500";

  return (
    <div className={`min-h-screen flex ${bgClass}`}>
      <ToastContainer position="top-right" autoClose={2500} hideProgressBar />
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Navigation />
        <main className="p-4 md:p-6 mt-20 space-y-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <h1 className="text-2xl md:text-3xl font-bold">Customer Management</h1>
            <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search customers..."
                className={`w-full sm:w-64 px-3 py-2 rounded-lg shadow focus:outline-none focus:ring-1 focus:ring-blue-600 ${inputBg}`}
              />
              <button
                onClick={() => { setShowAddModal(true); setEditCustomer(null); }}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold"
              >
                <Plus size={16} /> New Customer
              </button>
            </div>
          </div>

          {/* Customer Table - Desktop */}
          <div className={`hidden md:block rounded-2xl shadow overflow-x-auto ${darkMode ? "bg-gray-800" : "bg-white"}`}>
            <table className="w-full text-left min-w-[800px]">
              <thead className={darkMode ? "bg-gray-700" : "bg-gray-50"}>
                <tr>
                  {["ID", "Name", "Email", "Phone", "Company", "Added By", "Status", "Action"].map((h) => (
                    <th key={h} className="px-4 py-2 text-xs font-bold uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className={darkMode ? "divide-gray-700" : "divide-gray-100"}>
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-6 text-center">Loading...</td>
                  </tr>
                ) : filteredCustomers.length > 0 ? (
                  paginatedCustomers.map(c => (
                    <tr key={c.id} className={`hover:bg-blue-50/30 transition-colors ${darkMode ? "hover:bg-gray-700" : ""}`}>
                      <td className="px-4 py-2 font-mono text-sm text-blue-600">{c.id}</td>
                      <td className="px-4 py-2 font-medium">{c.name}</td>
                      <td className="px-4 py-2 text-sm">{c.email}</td>
                      <td className="px-4 py-2 text-sm">{c.phone}</td>
                      <td className="px-4 py-2">{c.company}</td>
                      <td className="px-4 py-2 text-sm">{c.created_by_name || "System"}</td>
                      <td className="px-4 py-2">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                          c.status === "Active"
                            ? "bg-green-100 text-green-600"
                            : "bg-red-100 text-red-600"
                        }`}>{c.status}</span>
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex gap-2">
                          <button
                            onClick={() => setViewCustomer(c)}
                            className="bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded flex items-center gap-1 text-xs"
                          >
                            <Eye size={14} /> View
                          </button>
                          <button
                            onClick={() => { setEditCustomer(c); setShowAddModal(true); }}
                            className="bg-yellow-400 hover:bg-yellow-500 text-white px-2 py-1 rounded flex items-center gap-1 text-xs"
                          >
                            <Edit size={14} /> Edit
                          </button>
                          {canDeleteCustomer && (
                            <button
                              onClick={() => setDeleteModal(c)}
                              className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded flex items-center gap-1 text-xs"
                            >
                              <Trash2 size={14} /> Delete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="px-4 py-6 text-center text-gray-400">
                      No customers found for "{searchQuery}"
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Customer Cards - Mobile */}
          <div className="md:hidden space-y-3">
            {filteredCustomers.length > 0 ? (
              paginatedCustomers.map(c => (
                <div key={c.id} className={`rounded-2xl shadow p-4 flex flex-col gap-2 ${darkMode ? "bg-gray-800 text-gray-100" : "bg-white"}`}>
                  <div className="flex justify-between items-center">
                    <p className="font-bold text-blue-600">{c.id}</p>
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                      c.status === "Active"
                        ? "bg-green-100 text-green-600"
                        : "bg-red-100 text-red-600"
                    }`}>{c.status}</span>
                  </div>
                  <p className="font-medium">{c.name}</p>
                  <p className="text-sm">{c.email}</p>
                  <p className="text-sm">{c.phone}</p>
                  <p className="text-sm">{c.company}</p>
                  <p className="text-xs opacity-70">Added by: {c.created_by_name || "System"}</p>
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => setViewCustomer(c)}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded flex items-center gap-1 text-xs"
                    >
                      <Eye size={14} /> View
                    </button>
                    <button
                      onClick={() => { setEditCustomer(c); setShowAddModal(true); }}
                      className="bg-yellow-400 hover:bg-yellow-500 text-white px-2 py-1 rounded flex items-center gap-1 text-xs"
                    >
                      <Edit size={14} /> Edit
                    </button>
                    {canDeleteCustomer && (
                      <button
                        onClick={() => setDeleteModal(c)}
                        className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded flex items-center gap-1 text-xs"
                      >
                        <Trash2 size={14} /> Delete
                      </button>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center">No customers found for "{searchQuery}"</p>
            )}
          </div>

          {/* Add/Edit Customer Modal */}
          {!loading && filteredCustomers.length > 0 && (
            <div className="flex flex-col md:flex-row justify-between items-center gap-2 mt-3 text-xs transition-colors">
              <span className="italic">{`Showing ${(currentPage - 1) * PAGE_SIZE + 1} to ${Math.min(currentPage * PAGE_SIZE, filteredCustomers.length)} of ${filteredCustomers.length} entries`}</span>
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

          {/* Add/Edit Customer Modal */}
          {showAddModal && (
            <AddCustomerModal
              onClose={() => { setShowAddModal(false); setEditCustomer(null); }}
              onSave={handleSaveCustomer}
              darkMode={darkMode}
              editCustomer={editCustomer}
            />
          )}

          {/* View Customer Modal */}
          {viewCustomer && (
            <ViewCustomerModal
              customer={viewCustomer}
              onClose={() => setViewCustomer(null)}
              darkMode={darkMode}
            />
          )}

          {/* Delete Confirmation Modal */}
          {deleteModal && canDeleteCustomer && (
            <DeleteConfirmationModal
              onClose={() => setDeleteModal(null)}
              onConfirm={handleDeleteCustomer}
              customer={deleteModal}
              darkMode={darkMode}
              deleting={deleting}
            />
          )}
        </main>
      </div>
    </div>
  );
}

/* ================== ADD CUSTOMER MODAL ================== */
const AddCustomerModal = ({ onClose, onSave, darkMode, editCustomer }) => {
  const [form, setForm] = useState({ name: "", email: "", phone: "", company: "", address: "", status: "Active" });
  const [errors, setErrors] = useState({});

  React.useEffect(() => {
    if (editCustomer) setForm(editCustomer); // pre-fill for editing
  }, [editCustomer]);

  const validate = () => {
    const errs = {};
    if (!form.name?.trim()) errs.name = "Name is required";
    if (!form.email?.trim()) errs.email = "Email is required";
    if (!form.phone?.trim()) errs.phone = "Phone is required";
    if (!form.company?.trim()) errs.company = "Company is required";
    if (!form.address?.trim()) errs.address = "Address is required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    onSave(form);
  };

  const inputBg = darkMode ? "bg-gray-800 text-gray-100 placeholder-gray-400" : "bg-white text-gray-900 placeholder-gray-500";

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className={`rounded-2xl p-6 w-full max-w-md relative shadow-lg ${darkMode ? "bg-gray-800 text-gray-100" : "bg-white"}`}>
        <button onClick={onClose} className="absolute top-3 right-3 text-gray-400 hover:text-gray-200">
          <X size={18} />
        </button>
        <h2 className="text-lg font-bold mb-4">{editCustomer ? "Edit Customer" : "Add New Customer"}</h2>
        <div className="flex flex-col gap-3">
          {["name","email","phone","company", "address"].map(field => (
            <div key={field} className="flex flex-col">
              <input
                className={`px-3 py-2 rounded-lg shadow focus:outline-none focus:ring-1 focus:ring-blue-600 ${inputBg}`}
                placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
                value={form[field] || ''}
                onChange={e => setForm({ ...form, [field]: e.target.value })}
              />
              {errors[field] && <span className="text-red-600 text-xs mt-1">{errors[field]}</span>}
            </div>
          ))}

          <select
            className={`px-3 py-2 rounded-lg shadow focus:outline-none focus:ring-1 focus:ring-blue-600 ${inputBg}`}
            value={form.status}
            onChange={e => setForm({ ...form, status: e.target.value })}
          >
            <option>Active</option>
            <option>Inactive</option>
          </select>

          <button 
            onClick={handleSave} 
            className="mt-2 w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-bold"
          >
            {editCustomer ? "Update Customer" : "Save Customer"}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ================== VIEW CUSTOMER MODAL ================== */
const ViewCustomerModal = ({ customer, onClose, darkMode }) => {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className={`rounded-2xl p-6 w-full max-w-md relative shadow-lg ${darkMode ? "bg-gray-800 text-gray-100" : "bg-white"}`}>
        <button onClick={onClose} className="absolute top-3 right-3 text-gray-400 hover:text-gray-200">
          <X size={18} />
        </button>

        <h2 className="text-lg font-bold mb-4">Customer Details</h2>

        <div className="space-y-2 text-sm">
          <p><strong>ID:</strong> {customer.id}</p>
          <p><strong>Name:</strong> {customer.name || "-"}</p>
          <p><strong>Email:</strong> {customer.email || "-"}</p>
          <p><strong>Phone:</strong> {customer.phone || "-"}</p>
          <p><strong>Company:</strong> {customer.company || "-"}</p>
          <p><strong>Address:</strong> {customer.address || "-"}</p>
          <p><strong>Status:</strong> {customer.status || "-"}</p>
          <p><strong>Added By:</strong> {customer.created_by_name || "System"}</p>
        </div>
      </div>
    </div>
  );
};

/* ================== DELETE CONFIRMATION MODAL ================== */
const DeleteConfirmationModal = ({ onClose, onConfirm, customer, darkMode, deleting }) => {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className={`rounded-2xl p-6 w-full max-w-md relative shadow-lg ${darkMode ? "bg-gray-800 text-gray-100" : "bg-white"}`}>
        <button 
          onClick={onClose} 
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-200"
          disabled={deleting}
        >
          <X size={18} />
        </button>

        <div className="text-center mb-6">
          <div className="flex items-center justify-center mb-4">
            <div className={`w-20 h-20 rounded-full flex items-center justify-center ${
              darkMode ? "bg-red-900/20" : "bg-red-100"
            }`}>
              <Trash2 size={40} className="text-red-600" />
            </div>
          </div>
          
          <h2 className="text-xl font-bold mb-2">Delete Customer</h2>
          
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            Are you sure you want to delete this customer?
          </p>
          
          <div className={`p-4 rounded-lg text-left mb-4 ${darkMode ? "bg-gray-700" : "bg-gray-50"}`}>
            <p className="font-bold text-lg">{customer.name}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">ID: {customer.id}</p>
            {customer.email && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Email: {customer.email}</p>
            )}
            {customer.phone && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Phone: {customer.phone}</p>
            )}
            {customer.company && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Company: {customer.company}</p>
            )}
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Status: <span className={customer.status === "Active" ? "text-green-600" : "text-red-600"}>
                {customer.status}
              </span>
            </p>
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
              darkMode 
                ? "bg-gray-700 hover:bg-gray-600 text-white" 
                : "bg-gray-200 hover:bg-gray-300 text-gray-800"
            } ${deleting ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
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
  );
};