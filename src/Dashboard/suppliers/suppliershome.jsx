import React, { useState } from "react";
import { Eye, Edit3, Plus, X, Save } from "lucide-react";
import NavBar from "../../component/navigation";
import Sidebar from "../../component/sidebar";
import AddSupplier from "./Addsupplier";
import { useTheme } from "../../context/ThemeContext";

const SupplierManagement = () => {
  const { darkMode } = useTheme();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [viewModal, setViewModal] = useState(null);
  const [editModal, setEditModal] = useState(null);
  const [formData, setFormData] = useState({});
  const [isAddPage, setIsAddPage] = useState(false);

  const [suppliers, setSuppliers] = useState([
    { id: "SUP-001", name: "Electronics Wholesale Ltd", contact: "James Smith", phone: "+234 803 111 2222", email: "james@ewl.com", orders: 15, spent: "₦2,450,000" },
    { id: "SUP-002", name: "Office Supplies Co", contact: "Mary Johnson", phone: "+234 802 333 4444", email: "mary@osc.com", orders: 8, spent: "₦890,000" },
    { id: "SUP-003", name: "Furniture Manufacturers", contact: "Robert Brown", phone: "+234 804 555 6666", email: "robert@fm.com", orders: 5, spent: "₦1,560,000" },
    { id: "SUP-004", name: "Stationery Distributors", contact: "Sarah Williams", phone: "+234 805 777 8888", email: "sarah@sd.com", orders: 12, spent: "₦450,000" },
  ]);

  /* ---------- EDIT ---------- */
  const openEdit = (supplier) => {
    setEditModal(supplier);
    setFormData({ ...supplier });
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = () => {
    setSuppliers((prev) =>
      prev.map((s) => (s.id === formData.id ? formData : s))
    );
    setEditModal(null);
  };

  /* ---------- ADD PAGE ---------- */
  if (isAddPage) {
    return (
      <div className={`flex mt-20 min-h-screen ${darkMode ? "bg-slate-900 text-white" : "bg-slate-50 text-slate-900"}`}>
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        <div className="flex-1 flex flex-col">
          <NavBar onMenuClick={() => setIsSidebarOpen(true)} />
          <main className="p-6 max-w-7xl mx-auto w-full">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-black">Add Supplier</h1>
              <button
                onClick={() => setIsAddPage(false)}
                className="flex items-center gap-2 bg-rose-600 text-white px-4 py-2 rounded-xl shadow-lg"
              >
                <X size={18} /> Cancel
              </button>
            </div>
            <AddSupplier />
          </main>
        </div>
      </div>
    );
  }

  /* ---------- MAIN ---------- */
  return (
    <div className={` block lg:flex min-h-screen ${darkMode ? "bg-slate-900 text-white" : "bg-slate-50 text-slate-900"}`}>
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <div className="flex-1 flex flex-col">
        <NavBar onMenuClick={() => setIsSidebarOpen(true)} />

        <main className="p-6 mt-20 max-w-7xl mx-auto w-full">
          <div className="lg:flex justify-between items-center mb-6">
            <h1 className="text-2xl font-black">Supplier Management</h1>
            <button
              onClick={() => setIsAddPage(true)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-xl font-bold shadow-lg"
            >
              <Plus size={18} /> Add Supplier
            </button>
          </div>

          {/* TABLE */}
          <div className={`rounded-2xl shadow-xl overflow-hidden ${darkMode ? "bg-slate-800" : "bg-white"}`}>
            <table className="w-full min-w-[900px]">
              <thead className={darkMode ? "bg-slate-700" : "bg-slate-100"}>
                <tr>
                  {["ID", "Name", "Contact", "Phone", "Email", "Orders", "Spent", "Actions"].map((h) => (
                    <th key={h} className="px-4 py-3 text-xs uppercase font-bold text-left opacity-70">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {suppliers.map((s) => (
                  <tr key={s.id} className={`hover:bg-opacity-50 ${darkMode ? "hover:bg-slate-700" : "hover:bg-slate-50"}`}>
                    <td className="px-4 py-3 font-bold">{s.id}</td>
                    <td className="px-4 py-3">{s.name}</td>
                    <td className="px-4 py-3">{s.contact}</td>
                    <td className="px-4 py-3">{s.phone}</td>
                    <td className="px-4 py-3 text-blue-500">{s.email}</td>
                    <td className="px-4 py-3">{s.orders}</td>
                    <td className="px-4 py-3 font-bold">{s.spent}</td>
                    <td className="px-4 py-3 flex gap-2">
                      <button
                        onClick={() => setViewModal(s)}
                        className={`p-2 rounded-xl shadow-md ${darkMode ? "bg-blue-900 text-blue-300" : "bg-blue-50 text-blue-600"}`}
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        onClick={() => openEdit(s)}
                        className={`p-2 rounded-xl shadow-md ${darkMode ? "bg-amber-900 text-amber-300" : "bg-amber-50 text-amber-600"}`}
                      >
                        <Edit3 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </main>
      </div>

      {/* MODAL */}
      {(viewModal || editModal) && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className={`w-full max-w-lg rounded-2xl p-6 shadow-2xl relative ${darkMode ? "bg-slate-800 text-white" : "bg-white text-slate-900"}`}>
            <button
              onClick={() => {
                setViewModal(null);
                setEditModal(null);
              }}
              className="absolute top-4 right-4 opacity-60 hover:opacity-100"
            >
              <X />
            </button>

            <h2 className="text-xl font-black mb-6">
              {viewModal ? "Supplier Details" : "Edit Supplier"}
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {Object.keys(viewModal || editModal).map((key) => (
                <div key={key}>
                  <label className="text-[11px] uppercase font-bold opacity-60 mb-1 block">
                    {key}
                  </label>

                  {editModal ? (
                    <input
                      name={key}
                      value={formData[key]}
                      onChange={handleChange}
                      className={`w-full px-4 py-2 rounded-xl shadow-inner focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        darkMode ? "bg-slate-700 text-white" : "bg-slate-100"
                      }`}
                    />
                  ) : (
                    <p className="font-semibold opacity-90">{viewModal[key]}</p>
                  )}
                </div>
              ))}
            </div>

            {editModal && (
              <button
                onClick={handleSave}
                className="mt-8 w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-black shadow-xl active:scale-95"
              >
                <Save size={18} /> Save Changes
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SupplierManagement;
