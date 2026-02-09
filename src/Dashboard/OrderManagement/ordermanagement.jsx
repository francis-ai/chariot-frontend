import React, { useState, useEffect } from "react";
import { Eye, Edit3, Plus, X } from "lucide-react";
import Sidebar from "../../component/sidebar";
import NavBar from "../../component/navigation";
import { useTheme } from "../../context/ThemeContext";

/* ===================== DASHBOARD ===================== */
const EnterpriseDashboard = () => {
  const { darkMode } = useTheme();

  const [activeTab, setActiveTab] = useState("All Purchase Orders");
  const [tableData, setTableData] = useState([]);
  const [viewModal, setViewModal] = useState(null);
  const [editModal, setEditModal] = useState(null);
  const [createModal, setCreateModal] = useState(false);

  /* ===================== STATS ===================== */
  const stats = [
    { label: "Total POs", value: "0" },
    { label: "Pending Approval", value: "0" },
    { label: "Total PO Value", value: "₦0" },
    { label: "Avg. Delivery (Days)", value: "0" },
  ];

  /* ===================== DATA ===================== */
  const originalData = [
    { id: "PO-2023-0030", supplier: "Supplier A", date: "2026-01-01", delivery: "2026-01-10", amount: "₦100,000", status: "Pending" },
    { id: "PO-2023-0029", supplier: "Supplier B", date: "2026-01-02", delivery: "2026-01-12", amount: "₦200,000", status: "Approved" },
    { id: "PO-2023-0028", supplier: "Supplier C", date: "2026-01-03", delivery: "2026-01-15", amount: "₦150,000", status: "Received" },
    { id: "PO-2023-0027", supplier: "Supplier D", date: "2026-01-04", delivery: "2026-01-18", amount: "₦120,000", status: "Approved" },
    { id: "PO-2023-0026", supplier: "Supplier E", date: "2026-01-05", delivery: "2026-01-20", amount: "₦180,000", status: "Approved" },
  ];

  const tabs = ["All Purchase Orders", "Received", "Approved", "Pending"];

  useEffect(() => {
    if (activeTab === "All Purchase Orders") {
      const approved = originalData.filter(d => d.status === "Approved").slice(0, 3);
      const others = originalData.filter(d => !approved.includes(d));
      setTableData([...approved, ...others]);
    } else {
      setTableData(originalData.filter(po => po.status === activeTab));
    }
  }, [activeTab]);

  const getStatusStyle = (status) => {
    switch (status) {
      case "Pending": return "bg-orange-100 text-orange-600";
      case "Approved": return "bg-emerald-100 text-emerald-600";
      case "Received": return "bg-cyan-100 text-cyan-600";
      default: return "bg-gray-100 text-gray-600";
    }
  };

  const handleSaveEdit = (updated) => {
    setTableData(prev => prev.map(row => row.id === updated.id ? updated : row));
    setEditModal(null);
  };

  const handleSaveCreate = (newRow) => {
    setTableData(prev => [newRow, ...prev]);
    setCreateModal(false);
  };

  return (
    <div className={`min-h-screen flex flex-col md:flex-row ${darkMode ? "bg-gray-900 text-gray-200" : "bg-gray-50 text-gray-800"}`}>

      {/* SIDEBAR */}
      <aside className=" md:block w-64 fixed top-0 h-screen z-40">
        <Sidebar />
      </aside>

      {/* MAIN */}
      <main className="flex-1 md:ml-64 flex flex-col">

        {/* NAVBAR */}
        <div className={`sticky top-0 z-30 ${darkMode ? "bg-gray-900" : "bg-gray-50"}`}>
          <NavBar />
        </div>

        <div className="p-4 md:p-6 space-y-4">

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
              className="flex items-center gap-2 bg-[#1d7cf2] text-white px-3 py-2 rounded-md"
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
                className={`px-3 py-1 text-sm rounded-full ${
                  activeTab === tab
                    ? "bg-[#1d7cf2] text-white"
                    : darkMode
                      ? "bg-gray-700 text-gray-300"
                      : "bg-gray-200 text-gray-600"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* TABLE */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[600px]">
              <thead className="opacity-70">
                <tr>
                  <th className="px-2 py-2 text-left">PO #</th>
                  <th className="px-2 py-2 text-left">Supplier</th>
                  <th className="px-2 py-2 text-left">Date</th>
                  <th className="px-2 py-2 text-left">Delivery</th>
                  <th className="px-2 py-2 text-left">Amount</th>
                  <th className="px-2 py-2 text-left">Status</th>
                  <th className="px-2 py-2 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {tableData.map(row => (
                  <tr key={row.id} className={darkMode ? "hover:bg-gray-800" : "hover:bg-gray-100"}>
                    <td className="px-2 py-1 text-blue-500 font-medium">{row.id}</td>
                    <td className="px-2 py-1">{row.supplier}</td>
                    <td className="px-2 py-1">{row.date}</td>
                    <td className="px-2 py-1">{row.delivery}</td>
                    <td className="px-2 py-1 font-bold">{row.amount}</td>
                    <td className="px-2 py-1">
                      <span className={`px-2 py-0.5 text-xs rounded-full ${getStatusStyle(row.status)}`}>
                        {row.status}
                      </span>
                    </td>
                    <td className="px-2 py-1 flex justify-center gap-2">
                      <button onClick={() => setViewModal(row)} className="text-blue-500"><Eye size={14} /></button>
                      <button onClick={() => setEditModal(row)} className="text-amber-500"><Edit3 size={14} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>
      </main>

      {/* MODALS */}
      {viewModal && <Modal title="View Purchase Order" onClose={() => setViewModal(null)} content={viewModal} />}
      {editModal && <Modal title="Edit Purchase Order" onClose={() => setEditModal(null)} form={editModal} onSave={handleSaveEdit} />}
      {createModal && <Modal title="Create Purchase Order" onClose={() => setCreateModal(false)} create onSave={handleSaveCreate} />}
    </div>
  );
};

/* ===================== MODAL ===================== */
const Modal = ({ title, onClose, content, form, create, onSave }) => {
  const { darkMode } = useTheme();

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className={`w-full max-w-md rounded-lg p-4 relative ${darkMode ? "bg-gray-800 text-gray-200" : "bg-white text-gray-800"}`}>
        <button onClick={onClose} className="absolute top-3 right-3"><X /></button>
        <h2 className="text-lg font-bold mb-3">{title}</h2>

        {content && (
          <div className="space-y-1 text-sm">
            {Object.entries(content).map(([k, v]) => (
              <p key={k}><strong>{k}:</strong> {v}</p>
            ))}
          </div>
        )}

        {(form || create) && <FormComponent data={form} create={create} onSave={onSave} />}
      </div>
    </div>
  );
};

/* ===================== FORM ===================== */
const FormComponent = ({ data, create, onSave }) => {
  const { darkMode } = useTheme();

  const [form, setForm] = useState(data || {
    id: "",
    supplier: "",
    date: "",
    delivery: "",
    amount: "",
    status: "Pending",
  });

  const inputStyle = `px-2 py-1 rounded w-full ${
    darkMode ? "bg-gray-700 text-white" : "bg-gray-100"
  }`;

  return (
    <div className="flex flex-col gap-2 mt-3">
      <input className={inputStyle} placeholder="PO #" value={form.id} onChange={e => setForm({ ...form, id: e.target.value })} />
      <input className={inputStyle} placeholder="Supplier" value={form.supplier} onChange={e => setForm({ ...form, supplier: e.target.value })} />
      <input type="date" className={inputStyle} value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
      <input type="date" className={inputStyle} value={form.delivery} onChange={e => setForm({ ...form, delivery: e.target.value })} />
      <input className={inputStyle} placeholder="Amount" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} />
      <select className={inputStyle} value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
        <option>Pending</option>
        <option>Approved</option>
        <option>Received</option>
      </select>

      <button
        onClick={() => onSave({ ...form, id: form.id || `PO-${Date.now()}` })}
        className="bg-[#1d7cf2] text-white py-2 rounded mt-2"
      >
        Save
      </button>
    </div>
  );
};

export default EnterpriseDashboard;
