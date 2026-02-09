import React, { useState } from 'react';
import { Eye, Download, Edit3, Plus, Search, Filter } from 'lucide-react';
import CreateQuotation from "../Quotation/createquoation"; // ensure correct path
import NavBar from '../../component/navigation';
import Sidebar from '../../component/sidebar';
import { useTheme } from "../../context/ThemeContext";

// Modal Component for Viewing/Editing
const QuotationModal = ({ quotation, onClose, editable = false, onSave }) => {
  const { darkMode } = useTheme();
  const [form, setForm] = useState({ ...quotation });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  return (
    <div
      className={`fixed inset-0 flex items-center justify-center z-50 p-4 transition-colors ${
        darkMode ? 'bg-black bg-opacity-60' : 'bg-gray-200 bg-opacity-50'
      }`}
    >
      <div
        className={`w-full max-w-full sm:max-w-md md:max-w-2xl relative p-4 sm:p-6 space-y-6 rounded-xl shadow-xl transition-transform transform scale-100 ${
          darkMode ? 'bg-gray-800 text-gray-200' : 'bg-white text-gray-800'
        }`}
      >
        <button
          onClick={onClose}
          className={`absolute top-4 right-4 p-2 rounded-full transition ${
            darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
          }`}
        >
          ✕
        </button>

        <h2 className="text-xl font-bold">{editable ? 'Edit Quotation' : 'View Quotation'}</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {['id', 'customer', 'date', 'valid', 'amount', 'status'].map((field) => (
            <div key={field} className="flex flex-col">
              <label className="text-sm font-medium">{field.toUpperCase()}</label>
              {editable && field !== 'id' ? (
                <input
                  name={field}
                  value={form[field]}
                  onChange={handleChange}
                  className={`px-3 py-2 border rounded-lg outline-none w-full transition-colors ${
                    darkMode
                      ? 'bg-gray-700 border-gray-600 text-gray-200 focus:ring-blue-500'
                      : 'bg-gray-100 border-gray-300 text-gray-800 focus:ring-blue-500'
                  }`}
                />
              ) : (
                <span
                  className={`px-3 py-2 border rounded-lg w-full truncate transition-colors ${
                    darkMode ? 'bg-gray-700 border-gray-600 text-gray-200' : 'bg-gray-100 border-gray-300 text-gray-800'
                  }`}
                >
                  {form[field]}
                </span>
              )}
            </div>
          ))}
        </div>

        {editable && (
          <div className="flex flex-col sm:flex-row justify-end gap-3">
            <button
              onClick={onClose}
              className={`px-4 py-2 rounded-lg font-medium w-full sm:w-auto transition-colors ${
                darkMode ? 'bg-gray-600 hover:bg-gray-700 text-gray-200' : 'bg-gray-300 hover:bg-gray-400 text-gray-800'
              }`}
            >
              Cancel
            </button>
            <button
              onClick={() => { onSave(form); onClose(); }}
              className={`px-4 py-2 rounded-lg font-medium w-full sm:w-auto transition-colors ${
                darkMode ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              Save
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// Main Quotation Management Component
const QuotationManagement = () => {
  const { darkMode } = useTheme();
  const [newQuotation, setNewQuotation] = useState(false);
  const [activeTab, setActiveTab] = useState('All Quotations');
  const [modalData, setModalData] = useState(null);
  const [isEditable, setIsEditable] = useState(false);
  const [quotations, setQuotations] = useState([
    { id: 'QUT-2023-0020', customer: 'ABC Corporation', date: '2023-10-16', valid: '2023-10-30', amount: '₦245,000', status: 'Pending' },
    { id: 'QUT-2023-0019', customer: 'New Ventures Inc', date: '2023-10-15', valid: '2023-10-29', amount: '₦189,000', status: 'Pending' },
    { id: 'QUT-2023-0018', customer: 'Global Solutions Ltd', date: '2023-10-13', valid: '2023-10-27', amount: '₦320,000', status: 'Accepted' },
    { id: 'QUT-2023-0017', customer: 'Tech Innovations', date: '2023-10-05', valid: '2023-10-19', amount: '₦89,000', status: 'Expired' },
  ]);

  const getStatusStyles = (status) => {
    switch (status) {
      case 'Accepted':
        return darkMode
          ? 'bg-emerald-700 text-emerald-100 border-emerald-600'
          : 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'Pending':
        return darkMode
          ? 'bg-amber-700 text-amber-100 border-amber-600'
          : 'bg-amber-50 text-amber-700 border-amber-100';
      case 'Expired':
        return darkMode
          ? 'bg-rose-700 text-rose-100 border-rose-600'
          : 'bg-rose-50 text-rose-700 border-rose-100';
      default:
        return darkMode
          ? 'bg-slate-700 text-slate-200 border-slate-600'
          : 'bg-slate-50 text-slate-600 border-slate-100';
    }
  };

  const handleSave = (updatedQuotation) => {
    setQuotations((prev) => prev.map((q) => (q.id === updatedQuotation.id ? updatedQuotation : q)));
  };

  return (
    <div
      className={`flex min-h-screen flex-col md:flex-row transition-colors ${
        darkMode ? 'bg-gray-900 text-gray-200' : 'bg-gray-50 text-gray-800'
      }`}
    >
      <Sidebar />

      <div className="flex-1 flex flex-col">
        <NavBar />

        <main className="p-4 mt-20  md:p-6 lg:p-8 flex-1">

          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <h1 className="text-2xl font-bold tracking-tight">Quotation Management</h1>
            <button
              onClick={() => setNewQuotation(!newQuotation)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all shadow-md active:scale-95 bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus size={18} />
              {newQuotation ? 'Back to Dashboard' : 'Create Quotation'}
            </button>
          </div>

          {newQuotation ? (
            <CreateQuotation onCancel={() => setNewQuotation(false)} />
          ) : (
            <>
              {/* Tabs */}
              <div className="flex flex-wrap gap-2 mb-4 border-b border-gray-200">
                {['All Quotations', 'Pending', 'Accepted', 'Expired'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-3 py-1 text-sm font-semibold rounded-md transition-all ${
                      activeTab === tab
                        ? 'bg-blue-50 text-blue-600'
                        : darkMode
                        ? 'bg-gray-800 text-gray-200 hover:bg-gray-700'
                        : 'bg-gray-100 text-slate-600 hover:bg-gray-200'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* Table */}
              <div
                className={`overflow-x-auto rounded-xl border shadow-sm transition-colors ${
                  darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                }`}
              >
                <table className="min-w-full table-auto">
                  <thead className={`transition-colors ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                    <tr>
                      {['Quotation #', 'Customer', 'Date', 'Valid Until', 'Amount', 'Status', 'Actions'].map((h) => (
                        <th key={h} className="px-4 py-2 text-xs font-bold uppercase">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {quotations
                      .filter((q) => activeTab === 'All Quotations' || q.status === activeTab)
                      .map((q) => (
                        <tr key={q.id} className={`hover:transition-colors ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`}>
                          <td className="px-4 py-2 font-semibold text-blue-600 truncate">{q.id}</td>
                          <td className="px-4 py-2 truncate">{q.customer}</td>
                          <td className="px-4 py-2 text-sm truncate">{q.date}</td>
                          <td className="px-4 py-2 text-sm truncate">{q.valid}</td>
                          <td className="px-4 py-2 font-bold truncate">{q.amount}</td>
                          <td className="px-4 py-2">
                            <span className={`px-2 py-1 rounded text-xs font-semibold border uppercase ${getStatusStyles(q.status)}`}>
                              {q.status}
                            </span>
                          </td>
                          <td className="px-4 py-2 flex flex-wrap gap-1">
                            <button
                              onClick={() => { setModalData(q); setIsEditable(false); }}
                              className="p-2 rounded-md transition-colors bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white"
                            >
                              <Eye size={16} />
                            </button>
                            <button
                              onClick={() => alert(`Downloading ${q.id}`)}
                              className="p-2 rounded-md transition-colors bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white"
                            >
                              <Download size={16} />
                            </button>
                            <button
                              onClick={() => { setModalData(q); setIsEditable(true); }}
                              className="p-2 rounded-md transition-colors bg-amber-50 text-amber-600 hover:bg-amber-600 hover:text-white"
                            >
                              <Edit3 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex flex-col md:flex-row justify-between items-center gap-2 mt-3 text-xs transition-colors">
                <span className="italic">{`Showing 1 to ${quotations.length} of ${quotations.length} entries`}</span>
                <div className="flex gap-1">
                  <button className="px-3 py-1.5 border rounded hover:bg-gray-50">Previous</button>
                  <button className="px-4 py-1.5 bg-gray-800 text-white rounded hover:bg-gray-700">Next</button>
                </div>
              </div>
            </>
          )}

          {/* Modal */}
          {modalData && (
            <QuotationModal
              quotation={modalData}
              editable={isEditable}
              onClose={() => setModalData(null)}
              onSave={handleSave}
            />
          )}
        </main>
      </div>
    </div>
  );
};

export default QuotationManagement;
