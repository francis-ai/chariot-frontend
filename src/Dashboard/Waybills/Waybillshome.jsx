import React, { useState } from 'react'; 
import { Truck, Search, Plus, MapPin, FileText, Eye, X } from 'lucide-react';
import WaybillForm from "./Waybillform";
import Sidebar from '../../component/sidebar';
import NavBar from '../../component/navigation';
import { useTheme } from "../../context/ThemeContext";

const WaybillManagement = () => {
  const { darkMode } = useTheme(); // Theme support
  const [activeTab, setActiveTab] = useState('Delivered');
  const [searchTerm, setSearchTerm] = useState('');
  const [showWaybillModal, setShowWaybillModal] = useState(false); // Modal for Create
  const [selectedWaybill, setSelectedWaybill] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false); // Modal for viewing/editing

  const data = [
    { id: 'WB-2023-0045', customer: 'ABC Corporation', date: '2023-10-16', driver: 'John Driver', vehicle: 'Toyota Hilux (ABC-123XY)', status: 'In Transit' },
    { id: 'WB-2023-0044', customer: 'XYZ Enterprises', date: '2023-10-15', driver: 'Mike Wilson', vehicle: 'Ford Transit (XYZ-789AB)', status: 'Delivered' },
    { id: 'WB-2023-0043', customer: 'Global Solutions Ltd', date: '2023-10-14', driver: 'Sarah James', vehicle: 'Nissan Urvan (DEF-456GH)', status: 'Pending' },
    { id: 'WB-2023-0042', customer: 'Tech Innovations', date: '2023-10-12', driver: 'John Driver', vehicle: 'Toyota Hilux (ABC-123XY)', status: 'Delivered' },
  ];

  const statusMap = {
    'Delivered': darkMode ? 'bg-emerald-700 text-emerald-100 border-emerald-600' : 'bg-emerald-100 text-emerald-700 border-emerald-200',
    'In Transit': darkMode ? 'bg-blue-700 text-blue-100 border-blue-600' : 'bg-blue-100 text-blue-700 border-blue-200',
    'Pending': darkMode ? 'bg-amber-700 text-amber-100 border-amber-600' : 'bg-amber-100 text-amber-700 border-amber-200',
  };

  const filteredData = data.filter(item => {
    const matchesTab = activeTab === 'All Waybills' || item.status === activeTab;
    const matchesSearch = Object.values(item).some(val =>
      val.toLowerCase().includes(searchTerm.toLowerCase())
    );
    return matchesTab && matchesSearch;
  });

  const handleViewEdit = (waybill) => {
    setSelectedWaybill(waybill);
    setShowViewModal(true);
  };

  const handleEditFromModal = (updatedWaybill) => {
    console.log('Updated Waybill:', updatedWaybill);
    setShowViewModal(false);
    setSelectedWaybill(null);
  };

  return (
    <div className={`flex flex-col md:flex-row min-h-screen transition-colors ${darkMode ? 'bg-gray-900 text-gray-200' : 'bg-[#f8fafc] text-gray-900'}`}>
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
            <div className="flex items-center gap-2 text-slate-400 text-sm flex-wrap">
              <span>Show</span>
              <select className="bg-slate-800 border-none rounded-lg text-white px-2 py-1">
                <option>10</option>
                <option>25</option>
              </select>
              <span>entries</span>
            </div>
          </div>

          {/* Table */}
          <div className={`overflow-x-auto rounded-3xl shadow-sm border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-slate-200'}`}>
            <table className="w-full min-w-[500px] text-left border-collapse">
              <thead>
                <tr className={`border-b ${darkMode ? 'border-gray-600 bg-gray-700 text-gray-200' : 'border-slate-100 bg-slate-50 text-slate-400'}`}>
                  {['Waybill #', 'Customer', 'Date', 'Driver', 'Vehicle', 'Status', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-[11px] font-black uppercase tracking-[0.05em]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredData.map(item => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-4 py-3 font-bold text-blue-600 truncate">{item.id}</td>
                    <td className="px-4 py-3 font-semibold truncate">{item.customer}</td>
                    <td className="px-4 py-3 text-sm">{item.date}</td>
                    <td className="px-4 py-3 font-medium truncate">{item.driver}</td>
                    <td className="px-4 py-3 text-sm truncate">{item.vehicle}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase border ${statusMap[item.status]}`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 flex flex-wrap gap-2">
                      <button
                        className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg transition-all"
                        title="View Details"
                        onClick={() => handleViewEdit(item)}
                      >
                        <Eye size={18} />
                      </button>
                      <button
                        className="p-2 hover:bg-sky-50 text-sky-600 rounded-lg transition-all"
                        title="Track Location"
                      >
                        <MapPin size={18} />
                      </button>
                      <button
                        className="p-2 hover:bg-amber-50 text-amber-600 rounded-lg transition-all"
                        title="Edit"
                        onClick={() => handleViewEdit(item)}
                      >
                        <FileText size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredData.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center py-6 text-slate-400 font-medium">No waybills found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Create Waybill Modal */}
        {showWaybillModal && (
          <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-4">
            <div className={`w-full max-w-md rounded-3xl shadow-lg p-4 sm:p-6 max-h-[80vh] overflow-y-auto transition-colors ${darkMode ? 'bg-gray-800 text-gray-200' : 'bg-white text-gray-800'}`}>
              <button
                className={`absolute top-3 right-3 p-2 rounded-full transition ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                onClick={() => setShowWaybillModal(false)}
              >
                <X size={20} />
              </button>
              <h2 className="text-lg font-bold mb-3">Create Waybill</h2>
              <WaybillForm
                onCancel={() => setShowWaybillModal(false)}
              />
            </div>
          </div>
        )}

        {/* View/Edit Modal */}
        {showViewModal && selectedWaybill && (
          <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-4">
            <div className={`w-full max-w-sm rounded-3xl shadow-lg p-4 sm:p-6 max-h-[80vh] overflow-y-auto transition-colors ${darkMode ? 'bg-gray-800 text-gray-200' : 'bg-white text-gray-800'}`}>
              <button
                className={`absolute top-3 right-3 p-2 rounded-full transition ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                onClick={() => { setShowViewModal(false); setSelectedWaybill(null); }}
              >
                <X size={20} />
              </button>
              <h2 className="text-lg font-bold mb-3">Waybill Details</h2>
              <WaybillForm
                waybillData={selectedWaybill}
                compact
                onCancel={() => { setShowViewModal(false); setSelectedWaybill(null); }}
                onSave={handleEditFromModal}
              />
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default WaybillManagement;
