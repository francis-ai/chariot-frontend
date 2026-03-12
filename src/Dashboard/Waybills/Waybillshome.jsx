import React, { useState, useEffect } from 'react'; 
import { Truck, Search, Plus, Eye, X, Edit3, Trash2 } from 'lucide-react';
import WaybillForm from "./Waybillform";
import Sidebar from '../../component/sidebar';
import NavBar from '../../component/navigation';
import { useTheme } from "../../context/ThemeContext";
import API from "../../utils/api";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const WaybillManagement = () => {
  const { darkMode } = useTheme();
  const [activeTab, setActiveTab] = useState('All Waybills');
  const [searchTerm, setSearchTerm] = useState('');
  const [showWaybillModal, setShowWaybillModal] = useState(false);
  const [selectedWaybill, setSelectedWaybill] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState(null);
  const [waybills, setWaybills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const statusMap = {
    'Delivered': darkMode ? 'bg-emerald-700 text-emerald-100 border-emerald-600' : 'bg-emerald-100 text-emerald-700 border-emerald-200',
    'In Transit': darkMode ? 'bg-blue-700 text-blue-100 border-blue-600' : 'bg-blue-100 text-blue-700 border-blue-200',
    'Pending': darkMode ? 'bg-amber-700 text-amber-100 border-amber-600' : 'bg-amber-100 text-amber-700 border-amber-200',
  };

  // Fetch waybills on component mount
  useEffect(() => {
    fetchWaybills();
  }, []);

  const fetchWaybills = async () => {
    try {
      setLoading(true);
      const res = await API.get("/waybills");
      console.log("Fetched waybills:", res.data);
      
      // Map API response to component format
      const mappedWaybills = res.data.map(wb => ({
        id: wb.id || wb._id,
        waybill_number: wb.waybill_number || wb.id,
        customer: wb.customer || "",
        pickup_location: wb.pickup_location || "",
        delivery_location: wb.delivery_location || "",
        driver: wb.driver || "",
        vehicle: wb.vehicle || "",
        waybill_date: wb.waybill_date ? wb.waybill_date.split('T')[0] : "",
        status: wb.status || "Pending",
        notes: wb.notes || "",
      }));
      
      setWaybills(mappedWaybills);
    } catch (err) {
      console.error("Fetch waybills error:", err);
      toast.error(err.response?.data?.message || "Failed to fetch waybills");
      setWaybills([]);
    } finally {
      setLoading(false);
    }
  };

  // Filter waybills based on tab and search
  const filteredWaybills = waybills.filter(item => {
    const matchesTab = activeTab === 'All Waybills' || item.status === activeTab;
    const matchesSearch = searchTerm === '' || 
      Object.values(item).some(val =>
        val?.toString().toLowerCase().includes(searchTerm.toLowerCase())
      );
    return matchesTab && matchesSearch;
  });

  const handleView = (waybill) => {
    setSelectedWaybill(waybill);
    setShowViewModal(true);
  };

  const handleEdit = (waybill) => {
    setSelectedWaybill(waybill);
    setShowWaybillModal(true);
  };

  const handleSaveWaybill = async (waybillData) => {
    try {
      setSubmitting(true);
      
      // Log the incoming data for debugging
      console.log("Received waybill data from form:", waybillData);
      
      // Create payload with EXACT database field names from your SQL
      const payload = {
        customer: waybillData.customer,
        pickup_location: waybillData.pickup_location, // snake_case
        delivery_location: waybillData.delivery_location, // snake_case
        driver: waybillData.driver,
        vehicle: waybillData.vehicle,
        waybill_date: waybillData.waybill_date, // snake_case
        status: waybillData.status,
        notes: waybillData.notes || ""
      };

      console.log("Sending payload to API:", payload);

      if (selectedWaybill) {
        // Update existing waybill
        const res = await API.put(`/waybills/${selectedWaybill.id}`, payload);
        console.log("Update response:", res.data);
        toast.success("Waybill updated successfully!");
      } else {
        // Create new waybill
        const res = await API.post("/waybills", payload);
        console.log("Create response:", res.data);
        toast.success("Waybill created successfully!");
      }
      
      // Refresh the list
      await fetchWaybills();
      setShowWaybillModal(false);
      setSelectedWaybill(null);
    } catch (err) {
      console.error("Save waybill error:", err);
      console.error("Error response:", err.response?.data);
      toast.error(err.response?.data?.message || "Failed to save waybill");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteModal) return;
    
    setDeleting(true);
    try {
      await API.delete(`/waybills/${deleteModal.id}`);
      
      setWaybills(prev => prev.filter(w => w.id !== deleteModal.id));
      setDeleteModal(null);
      toast.success("Waybill deleted successfully!");
    } catch (err) {
      console.error("Delete waybill error:", err);
      toast.error(err.response?.data?.message || "Failed to delete waybill");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className={`flex flex-col md:flex-row min-h-screen transition-colors ${darkMode ? 'bg-gray-900 text-gray-200' : 'bg-[#f8fafc] text-gray-900'}`}>
      <ToastContainer position="top-right" autoClose={2500} hideProgressBar />
      <Sidebar />
      <div className="flex-1 flex flex-col gap-8 p-4 md:p-8">
        <NavBar />

        {/* Header */}
        <div className="flex mt-20 flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Waybill / Delivery Notes</h1>
            <p className="text-slate-500 text-sm">Manage and track your outgoing shipments</p>
          </div>
          <button
            onClick={() => { 
              setShowWaybillModal(true); 
              setSelectedWaybill(null); 
            }}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-blue-200"
          >
            <Plus size={20} />
            Create Waybill
          </button>
        </div>

        {/* Tabs and Controls */}
        <div className="w-full max-w-full lg:max-w-6xl mx-auto flex flex-col gap-6">

          {/* Tabs */}
          <div className="flex flex-wrap gap-2 mb-6 bg-slate-200/50 p-1.5 rounded-2xl">
            {['All Waybills', 'Pending', 'In Transit', 'Delivered'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                  activeTab === tab ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Controls */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900 p-4 rounded-2xl flex-wrap">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="Search waybills, drivers, or vehicles..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-800 border-none rounded-xl py-2.5 pl-10 pr-4 text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              />
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p>Loading waybills...</p>
            </div>
          )}

          {/* Empty State */}
          {!loading && filteredWaybills.length === 0 && (
            <div className={`text-center py-12 rounded-3xl border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-slate-200'}`}>
              <Truck size={48} className="mx-auto mb-4 text-slate-400" />
              <p className="text-slate-400 mb-4">No waybills found</p>
              <button
                onClick={() => { setShowWaybillModal(true); setSelectedWaybill(null); }}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Create your first waybill
              </button>
            </div>
          )}

          {/* Table */}
          {!loading && filteredWaybills.length > 0 && (
            <div className={`overflow-x-auto rounded-3xl shadow-sm border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-slate-200'}`}>
              <table className="w-full min-w-[1000px] text-left border-collapse">
                <thead>
                  <tr className={`border-b ${darkMode ? 'border-gray-600 bg-gray-700 text-gray-200' : 'border-slate-100 bg-slate-50 text-slate-400'}`}>
                    {['Waybill #', 'Customer', 'Date', 'Pickup', 'Delivery', 'Status', 'Actions'].map(h => (
                      <th key={h} className="px-4 py-3 text-[11px] font-black uppercase tracking-[0.05em]">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredWaybills.map(item => (
                    <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-gray-700 transition-colors group">
                      <td className="px-4 py-3 font-bold text-blue-600 truncate">{item.waybill_number || item.id}</td>
                      <td className="px-4 py-3 font-semibold truncate">{item.customer}</td>
                      <td className="px-4 py-3 text-sm">{item.waybill_date}</td>
                      <td className="px-4 py-3 text-sm truncate">{item.pickup_location}</td>
                      <td className="px-4 py-3 text-sm truncate">{item.delivery_location}</td>
                      {/* <td className="px-4 py-3 font-medium truncate">{item.driver}</td> */}
                      {/* <td className="px-4 py-3 text-sm truncate">{item.vehicle}</td> */}
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase border ${statusMap[item.status]}`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-2">
                          <button
                            className="p-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600 rounded-lg transition-all"
                            title="View Details"
                            onClick={() => handleView(item)}
                          >
                            <Eye size={18} />
                          </button>
                          <button
                            className="p-2 hover:bg-amber-50 dark:hover:bg-amber-900/20 text-amber-600 rounded-lg transition-all"
                            title="Edit"
                            onClick={() => handleEdit(item)}
                          >
                            <Edit3 size={18} />
                          </button>
                          <button
                            className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 rounded-lg transition-all"
                            title="Delete"
                            onClick={() => setDeleteModal(item)}
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
        </div>

        {/* Create/Edit Waybill Modal */}
        {showWaybillModal && (
          <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-4">
            <div className={`w-full max-w-2xl rounded-3xl shadow-lg p-6 max-h-[90vh] overflow-y-auto transition-colors ${darkMode ? 'bg-gray-800 text-gray-200' : 'bg-white text-gray-800'}`}>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">{selectedWaybill ? 'Edit Waybill' : 'Create Waybill'}</h2>
                <button
                  className={`p-2 rounded-full transition ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                  onClick={() => { setShowWaybillModal(false); setSelectedWaybill(null); }}
                  disabled={submitting}
                >
                  <X size={20} />
                </button>
              </div>
              <WaybillForm
                waybillData={selectedWaybill}
                onCancel={() => { setShowWaybillModal(false); setSelectedWaybill(null); }}
                onSave={handleSaveWaybill}
                submitting={submitting}
              />
            </div>
          </div>
        )}

        {/* View Modal */}
        {showViewModal && selectedWaybill && (
          <ViewWaybillModal
            waybill={selectedWaybill}
            onClose={() => { setShowViewModal(false); setSelectedWaybill(null); }}
            darkMode={darkMode}
          />
        )}

        {/* Delete Confirmation Modal */}
        {deleteModal && (
          <DeleteConfirmationModal
            title="Delete Waybill"
            onClose={() => setDeleteModal(null)}
            onConfirm={handleDelete}
            data={deleteModal}
            darkMode={darkMode}
            deleting={deleting}
          />
        )}
      </div>
    </div>
  );
};

/* ===================== VIEW MODAL ===================== */
const ViewWaybillModal = ({ waybill, onClose, darkMode }) => {
  const statusColors = {
    'Pending': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
    'In Transit': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    'Delivered': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-4">
      <div className={`w-full max-w-lg rounded-3xl shadow-lg p-6 relative ${darkMode ? 'bg-gray-800 text-gray-200' : 'bg-white text-gray-800'}`}>
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition"
        >
          <X size={20} />
        </button>

        <h2 className="text-xl font-bold mb-6">Waybill Details</h2>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs uppercase opacity-60 font-bold">Waybill #</label>
              <p className="font-semibold text-blue-600">{waybill.waybill_number || waybill.id}</p>
            </div>
            <div>
              <label className="text-xs uppercase opacity-60 font-bold">Status</label>
              <p className={`inline-block px-3 py-1 rounded-lg text-xs font-bold ${statusColors[waybill.status]}`}>
                {waybill.status}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs uppercase opacity-60 font-bold">Customer</label>
              <p className="font-medium">{waybill.customer}</p>
            </div>
            <div>
              <label className="text-xs uppercase opacity-60 font-bold">Date</label>
              <p>{waybill.waybill_date}</p>
            </div>
          </div>

          <div>
            <label className="text-xs uppercase opacity-60 font-bold">Pickup Location</label>
            <p className="font-medium">{waybill.pickup_location}</p>
          </div>

          <div>
            <label className="text-xs uppercase opacity-60 font-bold">Delivery Location</label>
            <p className="font-medium">{waybill.delivery_location}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs uppercase opacity-60 font-bold">Driver</label>
              <p>{waybill.driver}</p>
            </div>
            <div>
              <label className="text-xs uppercase opacity-60 font-bold">Vehicle</label>
              <p>{waybill.vehicle}</p>
            </div>
          </div>

          {waybill.notes && (
            <div>
              <label className="text-xs uppercase opacity-60 font-bold">Notes</label>
              <p className="text-sm bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">{waybill.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/* ===================== DELETE CONFIRMATION MODAL ===================== */
const DeleteConfirmationModal = ({ title, onClose, onConfirm, data, darkMode, deleting }) => {
  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-4">
      <div className={`w-full max-w-md rounded-3xl shadow-lg p-6 relative ${darkMode ? 'bg-gray-800 text-gray-200' : 'bg-white text-gray-800'}`}>
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
          
          <h2 className="text-xl font-bold mb-2">{title}</h2>
          
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            Are you sure you want to delete this waybill?
          </p>
          
          <div className={`p-4 rounded-lg text-left mb-4 ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
            <p className="font-bold text-lg">{data.waybill_number || data.id}</p>
            <p className="text-sm mt-2">Customer: {data.customer}</p>
            <p className="text-sm">Driver: {data.driver}</p>
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
              darkMode 
                ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
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

export default WaybillManagement;