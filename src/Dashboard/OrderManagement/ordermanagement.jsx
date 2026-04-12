import React, { useState, useEffect } from "react";
import { Eye, Edit3, Plus, X, Save, Trash2 } from "lucide-react";
import Sidebar from "../../component/sidebar";
import NavBar from "../../component/navigation";
import { useTheme } from "../../context/ThemeContext";
import API from "../../utils/api";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

/* ===================== DASHBOARD ===================== */
const EnterpriseDashboard = () => {
  const { darkMode } = useTheme();
  const PAGE_SIZE = 10;

  const [activeTab, setActiveTab] = useState("All Purchase Orders");
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [viewModal, setViewModal] = useState(null);
  const [editModal, setEditModal] = useState(null);
  const [createModal, setCreateModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState(null); // For delete confirmation
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [stats, setStats] = useState([
    { label: "Total POs", value: "0" },
    { label: "Pending Approval", value: "0" },
    { label: "Total PO Value", value: "₦0" },
    { label: "Avg. Delivery (Days)", value: "0" },
  ]);

  const tabs = ["All Purchase Orders", "Pending", "Approved", "Received"];

  // Fetch purchase orders on component mount
  useEffect(() => {
    fetchPurchaseOrders();
  }, []);

  // Filter data when active tab changes
  useEffect(() => {
    filterData();
  }, [activeTab, purchaseOrders]);

  const fetchPurchaseOrders = async () => {
    try {
      setLoading(true);
      const res = await API.get("/purchase-orders");
      console.log("Fetched purchase orders:", res.data);
      
      // Map API response to component format
      const mappedOrders = res.data.map(po => ({
        id: po.id || po.po_id || po._id,
        po_number: po.po_number,
        supplier_id: po.supplier_id,
        supplier_name: po.supplier_name || "",
        order_date: po.order_date ? po.order_date.split('T')[0] : "",
        delivery_date: po.delivery_date ? po.delivery_date.split('T')[0] : "",
        total_amount: Number(po.total_amount || 0),
        formatted_amount: `₦${Number(po.total_amount || 0).toLocaleString()}`,
        status: po.status || "Pending",
        created_by_name: po.created_by_name || "",
        created_at: po.created_at,
        updated_at: po.updated_at
      }));
      
      setPurchaseOrders(mappedOrders);
      calculateStats(mappedOrders);
    } catch (err) {
      console.error("Fetch purchase orders error:", err);
      toast.error(err.response?.data?.message || "Failed to fetch purchase orders");
      setPurchaseOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (orders) => {
    const totalPOs = orders.length;
    const pendingCount = orders.filter(po => po.status === "Pending").length;
    const totalValue = orders.reduce((sum, po) => sum + (po.total_amount || 0), 0);
    
    // Calculate average delivery days
    let totalDays = 0;
    let daysCount = 0;
    orders.forEach(po => {
      if (po.order_date && po.delivery_date) {
        const orderDate = new Date(po.order_date);
        const deliveryDate = new Date(po.delivery_date);
        const diffDays = Math.round((deliveryDate - orderDate) / (1000 * 60 * 60 * 24));
        if (diffDays > 0) {
          totalDays += diffDays;
          daysCount++;
        }
      }
    });
    const avgDays = daysCount > 0 ? Math.round(totalDays / daysCount) : 0;

    setStats([
      { label: "Total POs", value: totalPOs.toString() },
      { label: "Pending Approval", value: pendingCount.toString() },
      { label: "Total PO Value", value: `₦${totalValue.toLocaleString()}` },
      { label: "Avg. Delivery (Days)", value: avgDays.toString() },
    ]);
  };

  const filterData = () => {
    let scopedRows = activeTab === "All Purchase Orders"
      ? purchaseOrders
      : purchaseOrders.filter((po) => po.status === activeTab);

    const query = searchTerm.trim().toLowerCase();
    if (query) {
      scopedRows = scopedRows.filter((po) =>
        [po.po_number, po.supplier_name, po.status]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(query))
      );
    }

    setFilteredData(scopedRows);
  };

  useEffect(() => {
    filterData();
  }, [searchTerm]);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchTerm, filteredData.length]);

  const totalPages = Math.max(1, Math.ceil(filteredData.length / PAGE_SIZE));
  const paginatedData = filteredData.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  /* ===================== CREATE ===================== */
  const handleCreate = async (poData) => {
    try {
      const payload = {
        po_number: poData.po_number || `CLTPO-${Date.now().toString().slice(-8)}`,
        supplier_id: poData.supplier_id,
        order_date: poData.order_date,
        delivery_date: poData.delivery_date || null,
        total_amount: parseFloat(poData.total_amount) || 0,
        status: poData.status || "Pending"
      };

      console.log("Creating PO with payload:", payload);
      await API.post("/purchase-orders", payload);
      
      // Fetch updated list to get the complete data with supplier name
      await fetchPurchaseOrders();
      setCreateModal(false);
      toast.success("Purchase order created successfully!");
    } catch (err) {
      console.error("Create PO error:", err);
      toast.error(err.response?.data?.message || "Failed to create purchase order");
    }
  };

  /* ===================== UPDATE ===================== */
  const handleUpdate = async (poData) => {
    try {
      const payload = {
        po_number: poData.po_number,
        supplier_id: poData.supplier_id,
        order_date: poData.order_date,
        delivery_date: poData.delivery_date || null,
        total_amount: parseFloat(poData.total_amount) || 0,
        status: poData.status
      };

      console.log("Updating PO with payload:", payload);
      await API.put(`/purchase-orders/${poData.id}`, payload);

      // Fetch updated list
      await fetchPurchaseOrders();
      setEditModal(null);
      toast.success("Purchase order updated successfully!");
    } catch (err) {
      console.error("Update PO error:", err);
      toast.error(err.response?.data?.message || "Failed to update purchase order");
    }
  };

  /* ===================== DELETE ===================== */
  const handleDelete = async () => {
    if (!deleteModal) return;
    
    try {
      await API.delete(`/purchase-orders/${deleteModal.id}`);
      
      setPurchaseOrders(prev => prev.filter(po => po.id !== deleteModal.id));
      setDeleteModal(null);
      toast.success("Purchase order deleted successfully!");
    } catch (err) {
      console.error("Delete PO error:", err);
      toast.error(err.response?.data?.message || "Failed to delete purchase order");
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case "Pending": return "bg-orange-100 text-orange-600 dark:bg-orange-900 dark:text-orange-300";
      case "Approved": return "bg-emerald-100 text-emerald-600 dark:bg-emerald-900 dark:text-emerald-300";
      case "Received": return "bg-cyan-100 text-cyan-600 dark:bg-cyan-900 dark:text-cyan-300";
      default: return "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300";
    }
  };

  return (
    <div className={`min-h-screen flex flex-col md:flex-row ${darkMode ? "bg-gray-900 text-gray-200" : "bg-gray-50 text-gray-800"}`}>
      <ToastContainer position="top-right" autoClose={2500} hideProgressBar />

      {/* SIDEBAR */}
      <aside className="md:block w-64 fixed top-0 h-screen z-40">
        <Sidebar />
      </aside>

      {/* MAIN */}
      <main className="flex-1 md:ml-64 flex flex-col">

        {/* NAVBAR */}
        <div className={`sticky top-0 z-30 ${darkMode ? "bg-gray-900" : "bg-gray-50"}`}>
          <NavBar />
        </div>

        <div className="p-4 md:p-6 mt-20 space-y-4">

          {/* STATS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
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

          {/* HEADER */}
          <div className="flex flex-col sm:flex-row justify-between gap-3">
            <h1 className="text-lg font-bold">Purchase Order Management</h1>
            <button
              onClick={() => setCreateModal(true)}
              className="flex items-center gap-2 bg-[#1d7cf2] text-white px-3 py-2 rounded-md hover:bg-blue-600 transition"
            >
              <Plus size={16} /> Create Purchase Order
            </button>
          </div>

          {/* TABS */}
          <div className="flex flex-wrap gap-2">
            {tabs.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1 text-sm rounded-full transition ${
                  activeTab === tab
                    ? "bg-[#1d7cf2] text-white"
                    : darkMode
                      ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                      : "bg-gray-200 text-gray-600 hover:bg-gray-300"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="w-full sm:w-96">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search PO number, supplier or status"
              className={`w-full px-4 py-2 rounded-lg border outline-none ${darkMode ? "bg-gray-800 border-gray-700 text-gray-100" : "bg-white border-gray-300 text-gray-800"}`}
            />
          </div>

          {/* LOADING STATE */}
          {loading && (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p>Loading purchase orders...</p>
            </div>
          )}

          {/* EMPTY STATE */}
          {!loading && filteredData.length === 0 && (
            <div className={`text-center py-12 rounded-2xl ${darkMode ? "bg-gray-800" : "bg-white"}`}>
              <p className="text-gray-400 mb-4">No purchase orders found</p>
              <button
                onClick={() => setCreateModal(true)}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Create your first purchase order
              </button>
            </div>
          )}

          {/* TABLE */}
          {!loading && filteredData.length > 0 && (
            <div className={`rounded-xl border overflow-x-auto ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
              <table className="w-full text-sm min-w-[800px]">
                <thead className={`${darkMode ? "bg-gray-700" : "bg-gray-50"}`}>
                  <tr>
                    <th className="px-3 py-2 text-left font-bold uppercase text-xs">PO #</th>
                    <th className="px-3 py-2 text-left font-bold uppercase text-xs">Supplier</th>
                    <th className="px-3 py-2 text-left font-bold uppercase text-xs">Order Date</th>
                    <th className="px-3 py-2 text-left font-bold uppercase text-xs hidden sm:table-cell">Delivery Date</th>
                    <th className="px-3 py-2 text-left font-bold uppercase text-xs">Amount</th>
                    <th className="px-3 py-2 text-left font-bold uppercase text-xs">Status</th>
                    <th className="px-3 py-2 text-center font-bold uppercase text-xs">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedData.map(row => (
                    <tr key={row.id} className={`border-t ${darkMode ? "hover:bg-gray-700 border-gray-700" : "hover:bg-gray-50 border-gray-100"}`}>
                      <td className="px-3 py-2 text-blue-500 font-medium truncate">{row.po_number}</td>
                      <td className="px-3 py-2 truncate">{row.supplier_name}</td>
                      <td className="px-3 py-2 text-sm truncate">{row.order_date}</td>
                      <td className="px-3 py-2 text-sm hidden sm:table-cell truncate">{row.delivery_date || '-'}</td>
                      <td className="px-3 py-2 font-bold truncate">{row.formatted_amount}</td>
                      <td className="px-3 py-2">
                        <span className={`px-2 py-1 text-xs rounded-full inline-block ${getStatusStyle(row.status)}`}>
                          {row.status}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex justify-center gap-1 flex-wrap">
                          <button 
                            onClick={() => setViewModal(row)} 
                            className="text-blue-500 hover:text-blue-600 p-1.5 hover:bg-blue-50 rounded transition"
                            title="View"
                          >
                            <Eye size={16} />
                          </button>
                          <button 
                            onClick={() => setEditModal(row)} 
                            className="text-amber-500 hover:text-amber-600 p-1.5 hover:bg-amber-50 rounded transition"
                            title="Edit"
                          >
                            <Edit3 size={16} />
                          </button>
                          <button 
                            onClick={() => setDeleteModal(row)} 
                            className="text-red-500 hover:text-red-600 p-1.5 hover:bg-red-50 rounded transition"
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

          {!loading && filteredData.length > 0 && (
            <div className="flex flex-col md:flex-row justify-between items-center gap-2 mt-3 text-xs transition-colors">
              <span className="italic">{`Showing ${(currentPage - 1) * PAGE_SIZE + 1} to ${Math.min(currentPage * PAGE_SIZE, filteredData.length)} of ${filteredData.length} entries`}</span>
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

        </div>
      </main>

      {/* VIEW MODAL */}
      {viewModal && (
        <ViewModal 
          title="View Purchase Order" 
          onClose={() => setViewModal(null)} 
          data={viewModal} 
          darkMode={darkMode}
        />
      )}
      
      {/* EDIT MODAL */}
      {editModal && (
        <FormModal 
          title="Edit Purchase Order" 
          onClose={() => setEditModal(null)} 
          data={editModal}
          onSave={handleUpdate}
          darkMode={darkMode}
        />
      )}
      
      {/* CREATE MODAL */}
      {createModal && (
        <FormModal 
          title="Create Purchase Order" 
          onClose={() => setCreateModal(false)} 
          create={true}
          onSave={handleCreate}
          darkMode={darkMode}
        />
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteModal && (
        <DeleteConfirmationModal
          title="Delete Purchase Order"
          onClose={() => setDeleteModal(null)}
          onConfirm={handleDelete}
          data={deleteModal}
          darkMode={darkMode}
        />
      )}
    </div>
  );
};

/* ===================== VIEW MODAL ===================== */
const ViewModal = ({ title, onClose, data, darkMode }) => {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className={`w-full max-w-md rounded-lg p-6 relative ${darkMode ? "bg-gray-800 text-gray-200" : "bg-white text-gray-800"}`}>
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
        >
          <X />
        </button>
        
        <h2 className="text-xl font-bold mb-4">{title}</h2>

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs uppercase opacity-60">PO Number</label>
              <p className="font-semibold text-blue-500">{data.po_number}</p>
            </div>
            <div>
              <label className="text-xs uppercase opacity-60">Supplier</label>
              <p className="font-semibold">{data.supplier_name}</p>
            </div>
            <div>
              <label className="text-xs uppercase opacity-60">Order Date</label>
              <p className="font-semibold">{data.order_date}</p>
            </div>
            <div>
              <label className="text-xs uppercase opacity-60">Delivery Date</label>
              <p className="font-semibold">{data.delivery_date || '-'}</p>
            </div>
            <div>
              <label className="text-xs uppercase opacity-60">Amount</label>
              <p className="font-bold text-green-600">{data.formatted_amount}</p>
            </div>
            <div>
              <label className="text-xs uppercase opacity-60">Status</label>
              <p className="font-semibold">{data.status}</p>
            </div>
            <div>
              <label className="text-xs uppercase opacity-60">Added By</label>
              <p className="font-semibold">{data.created_by_name || "System"}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ===================== FORM MODAL ===================== */
const FormModal = ({ title, onClose, data, create, onSave, darkMode }) => {
  const [form, setForm] = useState(data ? {
    id: data.id,
    po_number: data.po_number,
    supplier_id: data.supplier_id || "",
    order_date: data.order_date || new Date().toISOString().split('T')[0],
    delivery_date: data.delivery_date || "",
    total_amount: data.total_amount || "",
    status: data.status || "Pending"
  } : {
    po_number: `PO-${Date.now()}`,
    supplier_id: "",
    order_date: new Date().toISOString().split('T')[0],
    delivery_date: "",
    total_amount: "",
    status: "Pending"
  });

  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchingSuppliers, setFetchingSuppliers] = useState(true);
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [newSupplier, setNewSupplier] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    address: "",
    city: "",
    country: "",
  });

  // Fetch suppliers for dropdown
  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        setFetchingSuppliers(true);
        const res = await API.get("/suppliers/catalog");
        console.log("Fetched suppliers:", res.data);
        setSuppliers(res.data);
      } catch (err) {
        console.error("Fetch suppliers error:", err);
        toast.error("Failed to fetch suppliers");
      } finally {
        setFetchingSuppliers(false);
      }
    };
    fetchSuppliers();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    // Validation
    if (!form.supplier_id) {
      toast.error("Please select a supplier");
      return;
    }
    if (!form.order_date) {
      toast.error("Order date is required");
      return;
    }
    if (!form.total_amount || form.total_amount <= 0) {
      toast.error("Valid amount is required");
      return;
    }

    setLoading(true);
    try {
      await onSave(form);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSupplier = async () => {
    if (!newSupplier.name) {
      toast.error("Supplier name is required");
      return;
    }

    try {
      await API.post("/suppliers", newSupplier);
      const res = await API.get("/suppliers/catalog");
      const supplierList = res.data || [];
      setSuppliers(supplierList);

      const created = supplierList.find(
        (supplier) =>
          supplier.email === newSupplier.email ||
          (supplier.name === newSupplier.name && supplier.company === newSupplier.company)
      );

      if (created) {
        setForm((prev) => ({ ...prev, supplier_id: String(created.id || created._id) }));
      }

      setShowSupplierModal(false);
      setNewSupplier({ name: "", email: "", phone: "", company: "", address: "", city: "", country: "" });
      toast.success("Supplier added successfully");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create supplier");
    }
  };

  const inputStyle = `px-3 py-2 rounded w-full ${
    darkMode ? "bg-gray-700 text-white" : "bg-gray-100"
  } focus:outline-none focus:ring-2 focus:ring-blue-500`;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-start sm:items-center justify-center z-50 overflow-y-auto p-4">
      <div className={`w-full max-w-md rounded-lg p-6 relative max-h-[90vh] overflow-y-auto ${darkMode ? "bg-gray-800 text-gray-200" : "bg-white text-gray-800"}`}>
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
        >
          <X />
        </button>
        
        <h2 className="text-xl font-bold mb-4">{title}</h2>

        <div className="flex flex-col gap-3">
          {create && (
            <div>
              <label className="text-sm font-medium mb-1 block">PO Number</label>
              <input
                name="po_number"
                value={form.po_number}
                onChange={handleChange}
                className={inputStyle}
                placeholder="PO Number"
                readOnly
              />
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-sm font-medium block">Supplier *</label>
              <button
                type="button"
                onClick={() => setShowSupplierModal(true)}
                className="text-xs px-2 py-1 rounded bg-blue-600 text-white hover:bg-blue-700"
              >
                New Supplier
              </button>
            </div>
            <select
              name="supplier_id"
              value={form.supplier_id}
              onChange={handleChange}
              className={inputStyle}
              required
              disabled={fetchingSuppliers}
            >
              <option value="">
                {fetchingSuppliers ? "Loading suppliers..." : "Select Supplier"}
              </option>
              {suppliers.map(s => (
                <option key={s.id || s._id} value={s.id || s._id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-sm font-medium mb-1 block">Order Date *</label>
              <input
                type="date"
                name="order_date"
                value={form.order_date}
                onChange={handleChange}
                className={inputStyle}
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Delivery Date</label>
              <input
                type="date"
                name="delivery_date"
                value={form.delivery_date}
                onChange={handleChange}
                className={inputStyle}
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">Amount (₦) *</label>
            <input
              type="number"
              name="total_amount"
              value={form.total_amount}
              onChange={handleChange}
              className={inputStyle}
              placeholder="Enter amount"
              min="0"
              step="0.01"
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">Status</label>
            <select
              name="status"
              value={form.status}
              onChange={handleChange}
              className={inputStyle}
            >
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Received">Received</option>
            </select>
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading || fetchingSuppliers}
            className="w-full bg-[#1d7cf2] text-white py-3 rounded mt-2 hover:bg-blue-600 transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading && (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            )}
            <Save size={18} /> {create ? 'Create Purchase Order' : 'Save Changes'}
          </button>
        </div>

        {showSupplierModal ? (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className={`w-full max-w-2xl rounded-xl p-6 ${darkMode ? "bg-gray-800 text-gray-200" : "bg-white text-gray-800"}`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Create Supplier</h3>
                <button type="button" onClick={() => setShowSupplierModal(false)} className="p-2 rounded hover:bg-gray-200/30">
                  <X size={18} />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input className={inputStyle} placeholder="Name *" value={newSupplier.name} onChange={(e) => setNewSupplier((prev) => ({ ...prev, name: e.target.value }))} />
                <input className={inputStyle} placeholder="Company" value={newSupplier.company} onChange={(e) => setNewSupplier((prev) => ({ ...prev, company: e.target.value }))} />
                <input className={inputStyle} placeholder="Email" value={newSupplier.email} onChange={(e) => setNewSupplier((prev) => ({ ...prev, email: e.target.value }))} />
                <input className={inputStyle} placeholder="Phone" value={newSupplier.phone} onChange={(e) => setNewSupplier((prev) => ({ ...prev, phone: e.target.value }))} />
                <input className={inputStyle} placeholder="City" value={newSupplier.city} onChange={(e) => setNewSupplier((prev) => ({ ...prev, city: e.target.value }))} />
                <input className={inputStyle} placeholder="Country" value={newSupplier.country} onChange={(e) => setNewSupplier((prev) => ({ ...prev, country: e.target.value }))} />
                <textarea className={`md:col-span-2 ${inputStyle}`} placeholder="Address" value={newSupplier.address} onChange={(e) => setNewSupplier((prev) => ({ ...prev, address: e.target.value }))} />
              </div>

              <div className="mt-4 flex justify-end gap-2">
                <button type="button" onClick={() => setShowSupplierModal(false)} className={`px-4 py-2 rounded ${darkMode ? "bg-gray-600" : "bg-gray-200"}`}>Cancel</button>
                <button type="button" onClick={handleCreateSupplier} className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700">Save Supplier</button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

/* ===================== DELETE CONFIRMATION MODAL ===================== */
const DeleteConfirmationModal = ({ title, onClose, onConfirm, data, darkMode }) => {
  const [deleting, setDeleting] = useState(false);

  const handleConfirm = async () => {
    setDeleting(true);
    try {
      await onConfirm();
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className={`w-full max-w-md rounded-lg p-6 relative ${darkMode ? "bg-gray-800 text-gray-200" : "bg-white text-gray-800"}`}>
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          disabled={deleting}
        >
          <X />
        </button>
        
        <h2 className="text-xl font-bold mb-4">{title}</h2>

        <div className="mb-6">
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
              <Trash2 size={32} className="text-red-600 dark:text-red-400" />
            </div>
          </div>
          
          <p className="text-center mb-2">
            Are you sure you want to delete this purchase order?
          </p>
          <p className="text-center font-bold text-lg">
            {data.po_number} - {data.supplier_name}
          </p>
          <p className="text-center text-sm opacity-60 mt-2">
            This action cannot be undone.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={deleting}
            className={`flex-1 px-4 py-2 rounded-lg font-medium transition ${
              darkMode 
                ? "bg-gray-700 hover:bg-gray-600 text-gray-200" 
                : "bg-gray-200 hover:bg-gray-300 text-gray-800"
            } ${deleting ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
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

export default EnterpriseDashboard;