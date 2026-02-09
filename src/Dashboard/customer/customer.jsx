import React, { useMemo, useState } from "react";
import Navigation from "../../component/navigation";
import Sidebar from "../../component/sidebar";
import { useSearch } from "../../context/searchcontex";
import { X, Plus } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";

export default function CustomersDashboard() {
  const { searchQuery, setSearchQuery } = useSearch();
  const { darkMode } = useTheme();

  // Customer state
  const [customers, setCustomers] = useState([
    { id: "CUST-001", name: "John Doe", email: "john.doe@example.com", phone: "+234 800 123 4567", company: "Tech Solutions Ltd", status: "Active" },
    { id: "CUST-002", name: "Jane Smith", email: "jane.smith@example.com", phone: "+234 801 987 6543", company: "Creative Agency", status: "Inactive" },
    { id: "CUST-003", name: "Michael Johnson", email: "michael.j@example.com", phone: "+234 802 111 2222", company: "Supply Co.", status: "Active" },
    { id: "CUST-004", name: "Emily Davis", email: "emily.d@example.com", phone: "+234 803 333 4444", company: "Retail Partners", status: "Active" },
  ]);

  const [showAddModal, setShowAddModal] = useState(false);

  // Filtered customers
  const filteredCustomers = useMemo(() => {
    if (!searchQuery.trim()) return customers;
    const lower = searchQuery.toLowerCase();
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(lower) ||
        c.email.toLowerCase().includes(lower) ||
        c.phone.includes(lower) ||
        c.company.toLowerCase().includes(lower) ||
        c.status.toLowerCase().includes(lower)
    );
  }, [searchQuery, customers]);

  // Add new customer
  const handleAddCustomer = (newCustomer) => {
    setCustomers(prev => [
      { ...newCustomer, id: `CUST-${String(prev.length + 1).padStart(3, "0")}` },
      ...prev
    ]);
    setShowAddModal(false);
  };

  const bgClass = darkMode ? "bg-gray-900 text-gray-100" : "bg-gray-100 text-gray-900";
  const inputBg = darkMode ? "bg-gray-800 text-gray-100 placeholder-gray-400" : "bg-white text-gray-900 placeholder-gray-500";

  return (
    <div className={`min-h-screen flex ${bgClass}`}>
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Navigation */}
        <Navigation />

        <main className="flex-1 p-6 mt-20 max-w-7xl mx-auto">
          {/* Header + Search + New Customer */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <h1 className="text-2xl md:text-3xl font-bold">
              Customer Management
            </h1>
            <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search customers..."
                className={`w-full sm:w-64 px-3 py-2 rounded-lg shadow focus:outline-none focus:ring-1 focus:ring-blue-600 ${inputBg}`}
              />
              <button
                onClick={() => setShowAddModal(true)}
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
                  {["ID","Name","Email","Phone","Company","Status"].map((h) => (
                    <th key={h} className="px-4 py-2 text-xs font-bold uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className={darkMode ? "divide-gray-700" : "divide-gray-100"}>
                {filteredCustomers.length > 0 ? (
                  filteredCustomers.map((c) => (
                    <tr key={c.id} className={`hover:bg-blue-50/30 transition-colors ${darkMode ? "hover:bg-gray-700" : ""}`}>
                      <td className="px-4 py-2 font-mono text-sm text-blue-600">{c.id}</td>
                      <td className="px-4 py-2 font-medium">{c.name}</td>
                      <td className="px-4 py-2 text-sm">{c.email}</td>
                      <td className="px-4 py-2 text-sm">{c.phone}</td>
                      <td className="px-4 py-2">{c.company}</td>
                      <td className="px-4 py-2">
                        <span
                          className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                            c.status === "Active"
                              ? "bg-green-100 text-green-600"
                              : "bg-red-100 text-red-600"
                          }`}
                        >
                          {c.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-center text-gray-400">
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
              filteredCustomers.map((c) => (
                <div key={c.id} className={`rounded-2xl shadow p-4 flex flex-col gap-2 ${darkMode ? "bg-gray-800 text-gray-100" : "bg-white"}`}>
                  <div className="flex justify-between items-center">
                    <p className="font-bold text-blue-600">{c.id}</p>
                    <span
                      className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                        c.status === "Active"
                          ? "bg-green-100 text-green-600"
                          : "bg-red-100 text-red-600"
                      }`}
                    >
                      {c.status}
                    </span>
                  </div>
                  <p className="font-medium">{c.name}</p>
                  <p className="text-sm">{c.email}</p>
                  <p className="text-sm">{c.phone}</p>
                  <p className="text-sm">{c.company}</p>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center">No customers found for "{searchQuery}"</p>
            )}
          </div>

          {/* Add Customer Modal */}
          {showAddModal && (
            <AddCustomerModal
              onClose={() => setShowAddModal(false)}
              onSave={handleAddCustomer}
              darkMode={darkMode}
            />
          )}
        </main>
      </div>
    </div>
  );
}

/* ================== ADD CUSTOMER MODAL ================== */
const AddCustomerModal = ({ onClose, onSave, darkMode }) => {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    status: "Active",
  });
  const [errors, setErrors] = useState({});

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = "Name is required";
    if (!form.email.trim()) errs.email = "Email is required";
    if (!form.phone.trim()) errs.phone = "Phone is required";
    if (!form.company.trim()) errs.company = "Company is required";
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
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-200"
        >
          <X size={18} />
        </button>
        <h2 className="text-lg font-bold mb-4">Add New Customer</h2>

        <div className="flex flex-col gap-3">
          {["name","email","phone","company"].map((field) => (
            <div key={field} className="flex flex-col">
              <input
                className={`px-3 py-2 rounded-lg shadow focus:outline-none focus:ring-1 focus:ring-blue-600 ${inputBg}`}
                placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
                value={form[field]}
                onChange={(e) => setForm({ ...form, [field]: e.target.value })}
              />
              {errors[field] && <span className="text-red-600 text-xs mt-1">{errors[field]}</span>}
            </div>
          ))}

          <select
            className={`px-3 py-2 rounded-lg shadow focus:outline-none focus:ring-1 focus:ring-blue-600 ${inputBg}`}
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
          >
            <option>Active</option>
            <option>Inactive</option>
          </select>

          <button
            onClick={handleSave}
            className="mt-2 w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-bold"
          >
            Save Customer
          </button>
        </div>
      </div>
    </div>
  );
};
