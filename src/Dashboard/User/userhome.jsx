import React, { useState } from 'react';
import { Eye, Edit3, Plus, X } from 'lucide-react';
import NavBar from '../../component/navigation';
import Sidebar from '../../component/sidebar';
import FileNewUser from '../User/AddUserForm'; // <-- Add User page/component
import { useTheme } from '../../context/ThemeContext';

// Modal for Add / View / Edit
const Modal = ({ title, children, onClose, darkMode }) => (
  <div
    className={`fixed inset-0 flex items-center justify-center z-50 p-4 backdrop-blur-sm ${
      darkMode ? 'bg-slate-900/60' : 'bg-slate-900/30'
    }`}
  >
    <div
      className={`w-full max-w-md rounded-xl p-6 relative shadow-lg transition-colors ${
        darkMode ? 'bg-slate-800 text-slate-200' : 'bg-white text-slate-900'
      }`}
    >
      <button
        onClick={onClose}
        className={`absolute top-4 right-4 transition-colors ${
          darkMode ? 'text-slate-400 hover:text-slate-100' : 'text-slate-400 hover:text-slate-900'
        }`}
      >
        <X size={20} />
      </button>
      <h2 className="text-xl font-black mb-4">{title}</h2>
      {children}
    </div>
  </div>
);

const UniversalManagement = ({ type = 'Supplier' }) => {
  const { darkMode } = useTheme();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [modalData, setModalData] = useState(null); // For view/edit modal
  const [showAddUser, setShowAddUser] = useState(false); // For Add User page/modal

  const viewConfig = {
    Supplier: {
      title: 'Supplier Management',
      btnLabel: 'Add Supplier',
      headers: [
        'Supplier ID',
        'Supplier Name',
        'Contact Person',
        'Phone',
        'Email',
        'Total Orders',
        'Total Spent',
        'Actions',
      ],
      data: [
        {
          id: 'SUP-001',
          name: 'Electronics Wholesale Ltd',
          contact: 'James Smith',
          phone: '+234 803 111 2222',
          email: 'james@ewl.com',
          col1: '15',
          col2: '₦2,450,000',
        },
        {
          id: 'SUP-002',
          name: 'Office Supplies Co',
          contact: 'Mary Johnson',
          phone: '+234 802 333 4444',
          email: 'mary@osc.com',
          col1: '8',
          col2: '₦890,000',
        },
      ],
    },
    Customer: {
      title: 'Customer Management',
      btnLabel: 'Add Customer',
      headers: [
        'Customer ID',
        'Customer Name',
        'Contact Person',
        'Phone',
        'Email',
        'Total Invoices',
        'Total Value',
        'Actions',
      ],
      data: [
        {
          id: 'CUST-001',
          name: 'ABC Corporation',
          contact: 'David Wilson',
          phone: '+234 801 234 5678',
          email: 'david@abccorp.com',
          col1: '25',
          col2: '₦2,450,000',
        },
      ],
    },
    User: {
      title: 'User Management',
      btnLabel: 'Add User',
      headers: [
        'User ID',
        'Full Name',
        'Username',
        'Email',
        'Role',
        'Status',
        'Last Login',
        'Actions',
      ],
      data: [
        {
          id: 'USR-001',
          name: 'Admin User',
          username: 'admin',
          email: 'admin@businesspro.com',
          role: 'admin',
          status: 'Active',
          login: '2023-10-16 09:15',
        },
      ],
    },
  }[type];

  const getRoleStyle = (role) =>
    'px-3 py-0.5 rounded text-[10px] font-bold uppercase tracking-tight bg-cyan-100 text-cyan-600 border border-cyan-200';
  const getStatusStyle = (status) =>
    status === 'Active'
      ? 'px-3 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-100 text-emerald-600 border border-emerald-200'
      : 'px-3 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-500 border border-slate-200';

  return (
    <div className={`flex min-h-screen transition-colors ${darkMode ? 'bg-slate-900' : 'bg-[#f8fafc]'}`}>
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0">
        <NavBar onMenuClick={() => setIsSidebarOpen(true)} />

        <main className="p-4 mt-20 md:p-8 w-full max-w-[1600px] mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h1 className={`text-2xl font-black ${darkMode ? 'text-slate-100' : 'text-[#1e293b]'}`}>
              {viewConfig.title}
            </h1>
            <button
              onClick={() =>
                type === 'User'
                  ? setShowAddUser(true)
                  : setModalData({ type: 'Add', title: `Add New ${type}` })
              }
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-bold text-sm shadow-sm transition-all"
            >
              <Plus size={16} strokeWidth={3} /> {viewConfig.btnLabel}
            </button>
          </div>

          {/* Table */}
          <div
            className={`rounded-lg shadow-sm border overflow-hidden transition-colors ${
              darkMode ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <div
              className={`p-3 flex flex-col md:flex-row justify-between items-center gap-4 transition-colors ${
                darkMode ? 'bg-slate-700 text-slate-200' : 'bg-[#334155] text-white'
              }`}
            >
              <div className="flex items-center text-xs gap-2">
                <span>Show</span>
                <select
                  className={`rounded px-2 py-1 outline-none cursor-pointer transition-colors ${
                    darkMode ? 'bg-slate-600 text-slate-200 border-none' : 'bg-[#1e293b] text-white border-none'
                  }`}
                >
                  <option>10</option>
                  <option>25</option>
                </select>
                <span>entries</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs ${darkMode ? 'text-slate-300' : 'text-white/70'} hidden sm:block`}>
                  Search:
                </span>
                <input
                  type="text"
                  placeholder={`Search ${type.toLowerCase()}s...`}
                  className={`w-full sm:w-64 rounded px-3 py-1.5 text-sm outline-none transition-colors ${
                    darkMode ? 'bg-slate-700 text-slate-200 placeholder-slate-400' : 'bg-white text-slate-900 placeholder-slate-400'
                  }`}
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left min-w-[1100px]">
                <thead>
                  <tr
                    className={`border-b transition-colors ${
                      darkMode ? 'border-slate-600 bg-slate-800 text-slate-200' : 'border-slate-100 bg-white text-slate-500'
                    }`}
                  >
                    {viewConfig.headers.map((header) => (
                      <th
                        key={header}
                        className="px-4 py-4 text-[11px] font-black uppercase tracking-wider border-r last:border-0"
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {viewConfig.data.map((item, idx) => (
                    <tr
                      key={idx}
                      className={`hover:bg-slate-50/50 transition-colors ${
                        darkMode ? 'hover:bg-slate-700/50' : 'hover:bg-slate-50/50'
                      }`}
                    >
                      <td className="px-4 py-3 text-sm">{item.id}</td>
                      <td className="px-4 py-3 text-sm font-bold">{item.name || item.contact}</td>
                      <td className="px-4 py-3 text-sm">{item.contact || item.username}</td>
                      <td className="px-4 py-3 text-sm">{item.phone || item.email}</td>
                      {type === 'User' ? (
                        <>
                          <td className="px-4 py-3 text-[13px]">
                            <span className={getRoleStyle(item.role)}>{item.role}</span>
                          </td>
                          <td className="px-4 py-3 text-[13px]">
                            <span className={getStatusStyle(item.status)}>{item.status}</span>
                          </td>
                          <td className="px-4 py-3 text-[13px]">{item.login}</td>
                        </>
                      ) : (
                        <>
                          <td className="px-4 py-3 text-sm text-blue-600 hover:underline cursor-pointer">{item.email}</td>
                          <td className="px-4 py-3 text-sm font-bold">{item.col1}</td>
                          <td className="px-4 py-3 text-sm font-black">{item.col2}</td>
                        </>
                      )}
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button
                            className="p-1.5 border border-blue-600 text-blue-600 rounded hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                            onClick={() =>
                              setModalData({ type: 'View', title: `View ${type}`, item })
                            }
                          >
                            <Eye size={14} strokeWidth={2.5} />
                          </button>
                          <button
                            className="p-1.5 border border-amber-500 text-amber-500 rounded hover:bg-amber-500 hover:text-white transition-all shadow-sm"
                            onClick={() =>
                              setModalData({ type: 'Edit', title: `Edit ${type}`, item })
                            }
                          >
                            <Edit3 size={14} strokeWidth={2.5} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div
              className={`p-4 flex flex-col sm:flex-row justify-between items-center gap-4 transition-colors ${
                darkMode ? 'bg-slate-700 border-t border-slate-600 text-slate-300' : 'bg-white border-t border-slate-100 text-slate-400'
              }`}
            >
              <span className="text-[12px] font-bold uppercase tracking-tighter">
                Showing 1 to {viewConfig.data.length} of {viewConfig.data.length} entries
              </span>
              <div className="flex items-center gap-1">
                <button className="px-3 py-1 font-bold text-sm text-slate-400 hover:text-slate-900">Previous</button>
                <button className="px-3 py-1 bg-blue-600 text-white rounded text-sm font-bold">1</button>
                <button className="px-3 py-1 font-bold text-sm text-slate-400 hover:text-slate-900">Next</button>
              </div>
            </div>
          </div>
        </main>

        {/* Add / View / Edit Modal */}
        {modalData && (
          <Modal title={modalData.title} onClose={() => setModalData(null)} darkMode={darkMode}>
            {modalData.type === 'Add' && (
              <div className="flex flex-col gap-4">
                <input
                  type="text"
                  placeholder={`${type} Name`}
                  className={`w-full rounded px-3 py-2 transition-colors ${
                    darkMode ? 'bg-slate-700 text-slate-200 border border-slate-600' : 'bg-white text-slate-900 border border-slate-200'
                  }`}
                />
                <input
                  type="text"
                  placeholder="Contact Person"
                  className={`w-full rounded px-3 py-2 transition-colors ${
                    darkMode ? 'bg-slate-700 text-slate-200 border border-slate-600' : 'bg-white text-slate-900 border border-slate-200'
                  }`}
                />
                <input
                  type="text"
                  placeholder="Phone"
                  className={`w-full rounded px-3 py-2 transition-colors ${
                    darkMode ? 'bg-slate-700 text-slate-200 border border-slate-600' : 'bg-white text-slate-900 border border-slate-200'
                  }`}
                />
                <input
                  type="email"
                  placeholder="Email"
                  className={`w-full rounded px-3 py-2 transition-colors ${
                    darkMode ? 'bg-slate-700 text-slate-200 border border-slate-600' : 'bg-white text-slate-900 border border-slate-200'
                  }`}
                />
                <button className="bg-blue-600 text-white px-4 py-2 rounded font-bold">
                  Save {type}
                </button>
              </div>
            )}
            {(modalData.type === 'View' || modalData.type === 'Edit') && (
              <div className="flex flex-col gap-4">
                <p>
                  <b>ID:</b> {modalData.item.id}
                </p>
                <p>
                  <b>Name:</b> {modalData.item.name || modalData.item.contact}
                </p>
                <p>
                  <b>Email/Phone:</b> {modalData.item.email || modalData.item.phone}
                </p>
                {type === 'User' && <p><b>Role:</b> {modalData.item.role}</p>}
                {modalData.type === 'Edit' && (
                  <button className="bg-amber-500 text-white px-4 py-2 rounded font-bold">
                    Save Changes
                  </button>
                )}
              </div>
            )}
          </Modal>
        )}

        {/* Add User Page */}
        {showAddUser && <FileNewUser onClose={() => setShowAddUser(false)} />}
      </div>
    </div>
  );
};

export default UniversalManagement;
