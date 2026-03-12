import React, { useState, useEffect } from "react";
import { Eye, Edit3, Plus, X, Save, Trash2 } from "lucide-react";
import NavBar from "../../component/navigation";
import Sidebar from "../../component/sidebar";
import AddSupplier from "./Addsupplier";
import { useTheme } from "../../context/ThemeContext";
import API from "../../utils/api";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const SupplierManagement = () => {
  const { darkMode } = useTheme();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [viewModal, setViewModal] = useState(null);
  const [editModal, setEditModal] = useState(null);
  const [formData, setFormData] = useState({});
  const [isAddPage, setIsAddPage] = useState(false);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState(null);

  // Fetch suppliers on component mount
  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const res = await API.get("/suppliers");
      console.log("Fetched suppliers:", res.data);
      
      // Map API response to component format - matching database fields
      const mappedSuppliers = res.data.map(supplier => ({
        id: supplier.id || supplier._id,
        name: supplier.name || "",
        phone: supplier.phone || "",
        email: supplier.email || "",
        company: supplier.company || "",
        address: supplier.address || "",
        city: supplier.city || "",
        country: supplier.country || "",
        // These might come from joined tables or calculations
        orders: supplier.total_orders || 0,
        spent: supplier.total_spent ? `₦${Number(supplier.total_spent).toLocaleString()}` : "₦0",
        created_at: supplier.created_at,
        updated_at: supplier.updated_at
      }));
      
      setSuppliers(mappedSuppliers);
    } catch (err) {
      console.error("Fetch suppliers error:", err);
      toast.error(err.response?.data?.message || "Failed to fetch suppliers");
      setSuppliers([]);
    } finally {
      setLoading(false);
    }
  };

  /* ---------- ADD SUPPLIER ---------- */
  const handleAddSupplier = async (supplierData) => {
    try {
      console.log("Received supplier data:", supplierData);
      
      // Payload matches database fields exactly
      const payload = {
        name: supplierData.name,
        email: supplierData.email || null,
        phone: supplierData.phone,
        company: supplierData.company || null,
        address: supplierData.address || null,
        city: supplierData.city || null,
        country: supplierData.country || null
      };

      console.log("Sending payload:", payload);

      const res = await API.post("/suppliers", payload);
      console.log("API Response:", res.data);
      
      // Add new supplier to list using the response data
      const newSupplier = {
        id: res.data.id || res.data._id,
        name: payload.name,
        phone: payload.phone,
        email: payload.email,
        company: payload.company,
        address: payload.address,
        city: payload.city,
        country: payload.country,
        orders: 0,
        spent: "₦0"
      };
      
      setSuppliers(prev => [newSupplier, ...prev]);
      setIsAddPage(false);
      toast.success("Supplier added successfully!");
    } catch (err) {
      console.error("Add supplier error:", err);
      console.error("Error response:", err.response?.data);
      toast.error(err.response?.data?.message || "Failed to add supplier");
    }
  };

  /* ---------- EDIT ---------- */
  const openEdit = (supplier) => {
    setEditModal(supplier);
    setFormData({ ...supplier });
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    try {
      // Payload matches database fields exactly
      const payload = {
        name: formData.name,
        email: formData.email || null,
        phone: formData.phone,
        company: formData.company || null,
        address: formData.address || null,
        city: formData.city || null,
        country: formData.country || null
      };

      await API.put(`/suppliers/${formData.id}`, payload);

      setSuppliers((prev) =>
        prev.map((s) => (s.id === formData.id ? { ...s, ...formData } : s))
      );
      setEditModal(null);
      toast.success("Supplier updated successfully!");
    } catch (err) {
      console.error("Update supplier error:", err);
      toast.error(err.response?.data?.message || "Failed to update supplier");
    }
  };

  /* ---------- DELETE ---------- */
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this supplier?")) return;
    
    try {
      setDeleteId(id);
      await API.delete(`/suppliers/${id}`);
      
      setSuppliers(prev => prev.filter(s => s.id !== id));
      toast.success("Supplier deleted successfully!");
    } catch (err) {
      console.error("Delete supplier error:", err);
      toast.error(err.response?.data?.message || "Failed to delete supplier");
    } finally {
      setDeleteId(null);
    }
  };

  /* ---------- ADD PAGE ---------- */
  if (isAddPage) {
    return (
      <div className={`flex min-h-screen ${darkMode ? "bg-slate-900 text-white" : "bg-slate-50 text-slate-900"}`}>
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        <div className="flex-1 flex flex-col">
          <NavBar onMenuClick={() => setIsSidebarOpen(true)} />
          <main className="p-6 max-w-7xl mx-auto w-full">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-black">Add Supplier</h1>
              <button
                onClick={() => setIsAddPage(false)}
                className="flex items-center gap-2 bg-rose-600 text-white px-4 py-2 rounded-xl shadow-lg hover:bg-rose-700"
              >
                <X size={18} /> Cancel
              </button>
            </div>
            <AddSupplier onSave={handleAddSupplier} />
          </main>
        </div>
      </div>
    );
  }

  /* ---------- MAIN ---------- */
  return (
    <div className={`block lg:flex min-h-screen ${darkMode ? "bg-slate-900 text-white" : "bg-slate-50 text-slate-900"}`}>
      <ToastContainer position="top-right" autoClose={2500} hideProgressBar />
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <div className="flex-1 flex flex-col">
        <NavBar onMenuClick={() => setIsSidebarOpen(true)} />

        <main className="p-6 mt-20 max-w-7xl mx-auto w-full">
          <div className="lg:flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-black">Supplier Management</h1>
              <p className="text-sm text-slate-400 mt-1">Manage your suppliers and vendors</p>
            </div>
            <button
              onClick={() => setIsAddPage(true)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-xl font-bold shadow-lg"
            >
              <Plus size={18} /> Add Supplier
            </button>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p>Loading suppliers...</p>
            </div>
          )}

          {/* Empty State */}
          {!loading && suppliers.length === 0 && (
            <div className={`text-center py-12 rounded-2xl ${darkMode ? "bg-slate-800" : "bg-white"}`}>
              <p className="text-slate-400 mb-4">No suppliers found</p>
              <button
                onClick={() => setIsAddPage(true)}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Add your first supplier
              </button>
            </div>
          )}

          {/* TABLE */}
          {!loading && suppliers.length > 0 && (
            <div className={`rounded-2xl shadow-xl overflow-hidden ${darkMode ? "bg-slate-800" : "bg-white"}`}>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1000px]">
                  <thead className={darkMode ? "bg-slate-700" : "bg-slate-100"}>
                    <tr>
                      {["ID", "Name", "Phone", "Email", "Company", "City", "Country", "Actions"].map((h) => (
                        <th key={h} className="px-4 py-3 text-xs uppercase font-bold text-left opacity-70">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {suppliers.map((s) => (
                      <tr key={s.id} className={`hover:bg-opacity-50 ${darkMode ? "hover:bg-slate-700" : "hover:bg-slate-50"}`}>
                        <td className="px-4 py-3 font-bold text-blue-500 text-sm">{s.id}</td>
                        <td className="px-4 py-3 font-medium">{s.name}</td>
                        <td className="px-4 py-3">{s.phone}</td>
                        <td className="px-4 py-3 text-blue-500">{s.email || '-'}</td>
                        <td className="px-4 py-3">{s.company || '-'}</td>
                        {/* <td className="px-4 py-3">{s.address || '-'}</td> */}
                        <td className="px-4 py-3">{s.city || '-'}</td>
                        <td className="px-4 py-3">{s.country || '-'}</td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <button
                              onClick={() => setViewModal(s)}
                              className={`p-2 rounded-xl shadow-md ${
                                darkMode ? "bg-blue-900 text-blue-300 hover:bg-blue-800" : "bg-blue-50 text-blue-600 hover:bg-blue-100"
                              }`}
                              title="View"
                            >
                              <Eye size={16} />
                            </button>
                            <button
                              onClick={() => openEdit(s)}
                              className={`p-2 rounded-xl shadow-md ${
                                darkMode ? "bg-amber-900 text-amber-300 hover:bg-amber-800" : "bg-amber-50 text-amber-600 hover:bg-amber-100"
                              }`}
                              title="Edit"
                            >
                              <Edit3 size={16} />
                            </button>
                            <button
                              onClick={() => handleDelete(s.id)}
                              disabled={deleteId === s.id}
                              className={`p-2 rounded-xl shadow-md ${
                                darkMode ? "bg-red-900 text-red-300 hover:bg-red-800" : "bg-red-50 text-red-600 hover:bg-red-100"
                              } ${deleteId === s.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                              title="Delete"
                            >
                              {deleteId === s.id ? (
                                <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                              ) : (
                                <Trash2 size={16} />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* VIEW MODAL */}
      {viewModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className={`w-full max-w-lg rounded-2xl p-6 shadow-2xl relative ${darkMode ? "bg-slate-800 text-white" : "bg-white text-slate-900"}`}>
            <button
              onClick={() => setViewModal(null)}
              className="absolute top-4 right-4 opacity-60 hover:opacity-100"
            >
              <X />
            </button>

            <h2 className="text-xl font-black mb-6">Supplier Details</h2>

            <div className="grid grid-cols-1 gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] uppercase font-bold opacity-60 mb-1 block">ID</label>
                  <p className="font-semibold">{viewModal.id}</p>
                </div>
                <div>
                  <label className="text-[11px] uppercase font-bold opacity-60 mb-1 block">Name</label>
                  <p className="font-semibold">{viewModal.name}</p>
                </div>
                <div>
                  <label className="text-[11px] uppercase font-bold opacity-60 mb-1 block">Phone</label>
                  <p className="font-semibold">{viewModal.phone}</p>
                </div>
                <div>
                  <label className="text-[11px] uppercase font-bold opacity-60 mb-1 block">Email</label>
                  <p className="font-semibold text-blue-500">{viewModal.email || '-'}</p>
                </div>
                <div>
                  <label className="text-[11px] uppercase font-bold opacity-60 mb-1 block">Company</label>
                  <p className="font-semibold">{viewModal.company || '-'}</p>
                </div>
                <div>
                  <label className="text-[11px] uppercase font-bold opacity-60 mb-1 block">Address</label>
                  <p className="font-semibold">{viewModal.address || '-'}</p>
                </div>
                <div>
                  <label className="text-[11px] uppercase font-bold opacity-60 mb-1 block">City</label>
                  <p className="font-semibold">{viewModal.city || '-'}</p>
                </div>
                <div>
                  <label className="text-[11px] uppercase font-bold opacity-60 mb-1 block">Country</label>
                  <p className="font-semibold">{viewModal.country || '-'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {editModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className={`w-full max-w-2xl rounded-2xl p-6 shadow-2xl relative ${darkMode ? "bg-slate-800 text-white" : "bg-white text-slate-900"}`}>
            <button
              onClick={() => setEditModal(null)}
              className="absolute top-4 right-4 opacity-60 hover:opacity-100"
            >
              <X />
            </button>

            <h2 className="text-xl font-black mb-6">Edit Supplier</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-bold opacity-70 mb-1 block">Name *</label>
                <input
                  name="name"
                  value={formData.name || ''}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 rounded-xl shadow-inner focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    darkMode ? "bg-slate-700 text-white" : "bg-slate-100"
                  }`}
                />
              </div>
              <div>
                <label className="text-sm font-bold opacity-70 mb-1 block">Phone *</label>
                <input
                  name="phone"
                  value={formData.phone || ''}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 rounded-xl shadow-inner focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    darkMode ? "bg-slate-700 text-white" : "bg-slate-100"
                  }`}
                />
              </div>
              <div>
                <label className="text-sm font-bold opacity-70 mb-1 block">Email</label>
                <input
                  name="email"
                  type="email"
                  value={formData.email || ''}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 rounded-xl shadow-inner focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    darkMode ? "bg-slate-700 text-white" : "bg-slate-100"
                  }`}
                />
              </div>
              <div>
                <label className="text-sm font-bold opacity-70 mb-1 block">Company</label>
                <input
                  name="company"
                  value={formData.company || ''}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 rounded-xl shadow-inner focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    darkMode ? "bg-slate-700 text-white" : "bg-slate-100"
                  }`}
                />
              </div>
              <div>
                <label className="text-sm font-bold opacity-70 mb-1 block">Address</label>
                <input
                  name="address"
                  value={formData.address || ''}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 rounded-xl shadow-inner focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    darkMode ? "bg-slate-700 text-white" : "bg-slate-100"
                  }`}
                />
              </div>
              <div>
                <label className="text-sm font-bold opacity-70 mb-1 block">City</label>
                <input
                  name="city"
                  value={formData.city || ''}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 rounded-xl shadow-inner focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    darkMode ? "bg-slate-700 text-white" : "bg-slate-100"
                  }`}
                />
              </div>
              <div>
                <label className="text-sm font-bold opacity-70 mb-1 block">Country</label>
                <input
                  name="country"
                  value={formData.country || ''}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 rounded-xl shadow-inner focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    darkMode ? "bg-slate-700 text-white" : "bg-slate-100"
                  }`}
                />
              </div>
            </div>

            <button
              onClick={handleSave}
              className="mt-8 w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-black shadow-xl active:scale-95"
            >
              <Save size={18} /> Save Changes
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupplierManagement;