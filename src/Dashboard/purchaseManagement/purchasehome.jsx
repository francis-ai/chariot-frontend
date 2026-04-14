import React, { useState } from 'react';
import { Eye, Edit3, Plus, X, Download } from 'lucide-react';
import Addsupplier from './Addpurchase';
import NavBar from '../../component/navigation';
import Sidebar from '../../component/sidebar';
import API from '../../utils/api';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { downloadPurchaseOrderPdf } from '../../utils/documentPdf';

const ERPDashboard = () => {
  const [activeTab, setActiveTab] = useState('All');
  const [viewModal, setViewModal] = useState(null);
  const [editModal, setEditModal] = useState(null);
  const [addModal, setAddModal] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [tableData, setTableData] = useState([]);

  const fetchPurchaseOrders = async () => {
    try {
      const res = await API.get('/purchase-orders');
      const mapped = (Array.isArray(res.data) ? res.data : []).map((po) => ({
        id: po.po_number || `PO-${po.id}`,
        backend_id: po.id,
        entity: po.supplier_name || 'Unknown Supplier',
        date: po.order_date ? po.order_date.split('T')[0] : '',
        secondaryDate: po.delivery_date ? po.delivery_date.split('T')[0] : '',
        amount: `₦${Number(po.total_amount || 0).toLocaleString()}`,
        amount_value: Number(po.total_amount || 0),
        item: po.item || '',
        supplier_id: po.supplier_id,
        status: po.status || 'Pending',
        vat_rate: Number(po.vat_rate || 0),
        vat_amount: Number(po.vat_amount || 0),
        tax_rate: Number(po.tax_rate || 0),
        tax_amount: Number(po.tax_amount || 0),
      }));
      setTableData(mapped);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load purchase orders');
      setTableData([]);
    }
  };

  React.useEffect(() => {
    fetchPurchaseOrders();
  }, []);

  const handleCreatedPurchaseOrder = async (payload) => {
    await fetchPurchaseOrders();
    setAddModal(false);
    if (payload?.emailSent) {
      toast.success('Purchase order created and sent to supplier email');
      return;
    }
    toast.success('Purchase order created successfully');
  };

  const stats = [
    { label: 'Total POs', value: tableData.length, color: 'text-slate-800' },
    { label: 'Pending', value: tableData.filter(d => d.status === 'Pending').length, color: 'text-amber-600' },
    { label: 'Total Value', value: '₦1.4M', color: 'text-blue-600' },
    { label: 'Avg. Days', value: '5', color: 'text-emerald-600' },
  ];

  const getStatusStyles = (status) => {
    const base = "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ";
    switch (status) {
      case 'Pending': return base + "bg-amber-50 text-amber-600";
      case 'Approved': return base + "bg-emerald-50 text-emerald-600";
      case 'Received': return base + "bg-blue-50 text-blue-600";
      case 'REJECTED': return base + "bg-rose-50 text-rose-700";
      default: return base + "bg-slate-50 text-slate-600";
    }
  };

  const handleSaveEdit = (updated) => {
    setTableData(prev => prev.map(row => row.id === updated.id ? updated : row));
    setEditModal(null);
  };

  const handleDownload = (row) => {
    downloadPurchaseOrderPdf({
      po_number: row.id,
      supplier_name: row.entity,
      order_date: row.date,
      delivery_date: row.secondaryDate,
      total_amount: row.amount,
      status: row.status,
      vat_rate: row.vat_rate || 0,
      vat_amount: row.vat_amount || 0,
      tax_rate: row.tax_rate || 0,
      tax_amount: row.tax_amount || 0,
    })
      .then(() => toast.success('Purchase order downloaded successfully!'))
      .catch(() => toast.error('Failed to download purchase order PDF'));
  };

  const tabs = ['All', 'Pending', 'Approved', 'Received', 'REJECTED'];

  const filteredData = tableData.filter(row => activeTab === 'All' || row.status === activeTab);

  return (
    <div className="flex min-h-screen font-sans text-slate-900 bg-slate-50">
      <ToastContainer position="top-right" autoClose={2500} hideProgressBar />

      {/* Sidebar */}
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <div className="flex-1 flex flex-col">
        {/* Navbar - Fixed */}
        <div className="fixed top-0 left-0 right-0 z-50">
          <NavBar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        </div>

        {/* Main content */}
        <main className="flex-1  p-4 md:p-8 max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-3">
            <div>
              <h1 className="text-2xl md:text-3xl font-black tracking-tight">Purchase Orders</h1>
              <p className="text-slate-500 text-sm md:text-base">Manage company procurement</p>
            </div>
            <button
              onClick={() => setAddModal(true)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 md:px-5 py-2 rounded-xl font-bold shadow-sm"
            >
              <Plus size={18} /> New Record
            </button>
          </div>

          {/* Stats / Cards */}
          <div className="mt-20 grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            {stats.map((stat, idx) => (
              <div key={idx} className="bg-white p-3 sm:p-4 rounded-2xl shadow-sm text-center">
                <p className={`text-lg  md:text-xl font-black ${stat.color}`}>{stat.value}</p>
                <p className="text-[9px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div className="flex flex-wrap gap-2 mb-4">
            {tabs.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1 text-sm font-bold transition-all rounded-full whitespace-nowrap
                  ${activeTab === tab ? 'bg-slate-800 text-white shadow' : 'text-slate-500 hover:bg-slate-200/50'}`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Table for Desktop */}
          <div className="hidden md:block bg-white rounded-2xl shadow-xl overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50">
                  <th className="px-3 py-2 text-[10px] sm:text-xs font-black text-slate-400 uppercase">Ref #</th>
                  <th className="px-3 py-2 text-[10px] sm:text-xs font-black text-slate-400 uppercase">Partner</th>
                  <th className="px-3 py-2 text-[10px] sm:text-xs font-black text-slate-400 uppercase">Date</th>
                  <th className="px-3 py-2 text-[10px] sm:text-xs font-black text-slate-400 uppercase">Expected</th>
                  <th className="px-3 py-2 text-[10px] sm:text-xs font-black text-slate-400 uppercase">Amount</th>
                  <th className="px-3 py-2 text-[10px] sm:text-xs font-black text-slate-400 uppercase">Status</th>
                  <th className="px-3 py-2 text-[10px] sm:text-xs font-black text-slate-400 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredData.map(row => (
                  <tr key={row.id} className="hover:bg-blue-50/30 transition-colors">
                    <td className="px-3 py-2 font-bold text-blue-600 text-sm">{row.id}</td>
                    <td className="px-3 py-2 font-bold text-slate-700 text-sm">{row.entity}</td>
                    <td className="px-3 py-2 text-slate-500 text-xs">{row.date}</td>
                    <td className="px-3 py-2 text-slate-500 text-xs">{row.secondaryDate}</td>
                    <td className="px-3 py-2 font-bold text-slate-900 text-sm">{row.amount}</td>
                    <td className="px-3 py-2">
                      <span className={getStatusStyles(row.status)}>{row.status}</span>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center space-x-2">
                        <button onClick={() => setViewModal(row)} className="p-2 text-blue-500 hover:bg-blue-100 rounded-lg"><Eye size={16}/></button>
                        <button onClick={() => handleDownload(row)} className="p-2 text-emerald-500 hover:bg-emerald-100 rounded-lg"><Download size={16}/></button>
                        <button onClick={() => setEditModal(row)} className="p-2 text-amber-500 hover:bg-amber-100 rounded-lg"><Edit3 size={16}/></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-3">
            {filteredData.map(row => (
              <div key={row.id} className="bg-white p-4 rounded-2xl shadow-sm flex flex-col">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <p className="text-xs font-black text-blue-600 uppercase">{row.id}</p>
                    <p className="font-bold text-slate-800 text-sm">{row.entity}</p>
                    <p className="text-xs text-slate-500">{row.date} - {row.secondaryDate}</p>
                    <p className="font-bold text-slate-900">{row.amount}</p>
                    <span className={getStatusStyles(row.status)}>{row.status}</span>
                  </div>
                  <div className="flex flex-col gap-2">
                    <button onClick={() => setViewModal(row)} className="p-3 bg-blue-50 text-blue-600 rounded-xl"><Eye size={18}/></button>
                    <button onClick={() => handleDownload(row)} className="p-3 bg-emerald-50 text-emerald-600 rounded-xl"><Download size={18}/></button>
                    <button onClick={() => setEditModal(row)} className="p-3 bg-amber-50 text-amber-600 rounded-xl"><Edit3 size={18}/></button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Modals */}
          {viewModal && <Modal title="View PO" onClose={() => setViewModal(null)}>
            <div className="space-y-1 text-sm">
              <p><strong>Ref #:</strong> {viewModal.id}</p>
              <p><strong>Partner:</strong> {viewModal.entity}</p>
              <p><strong>Item:</strong> {viewModal.item || '-'}</p>
              <p><strong>Date:</strong> {viewModal.date}</p>
              <p><strong>Expected:</strong> {viewModal.secondaryDate}</p>
              <p><strong>Amount:</strong> {viewModal.amount}</p>
              <p><strong>Status:</strong> {viewModal.status}</p>
              <button onClick={() => handleDownload(viewModal)} className="mt-3 inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-lg font-semibold">
                <Download size={16} /> Download PDF
              </button>
            </div>
          </Modal>}

          {editModal && <Modal title="Edit PO" onClose={() => setEditModal(null)}>
            <EditForm data={editModal} onSave={handleSaveEdit} />
          </Modal>}

          {addModal && <Modal title="Create Purchase Order" onClose={() => setAddModal(false)}>
            <Addsupplier onCreated={handleCreatedPurchaseOrder} />
          </Modal>}
        </main>
      </div>
    </div>
  );
};

/* ================= MODAL ================= */
const Modal = ({ title, children, onClose }) => (
  <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 w-full max-w-md relative shadow-lg">
      <button onClick={onClose} className="absolute top-3 right-3 text-slate-500 hover:text-slate-900"><X /></button>
      <h2 className="text-lg font-bold mb-3">{title}</h2>
      {children}
    </div>
  </div>
);

/* ================= EDIT FORM ================= */
const EditForm = ({ data, onSave }) => {
  const [form, setForm] = useState(data);
  return (
    <div className="flex flex-col gap-2">
      <input className="shadow rounded px-3 py-2 w-full" value={form.entity} onChange={e => setForm({...form, entity: e.target.value})} placeholder="Partner" />
      <input type="date" className="shadow rounded px-3 py-2 w-full" value={form.date} onChange={e => setForm({...form, date: e.target.value})} />
      <input type="date" className="shadow rounded px-3 py-2 w-full" value={form.secondaryDate} onChange={e => setForm({...form, secondaryDate: e.target.value})} />
      <input className="shadow rounded px-3 py-2 w-full" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} placeholder="Amount" />
      <select className=" shadow rounded px-3 py-2 w-full" value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
        <option>Pending</option>
        <option>Approved</option>
        <option>Received</option>
        <option>REJECTED</option>
      </select>
      <button onClick={() => onSave(form)} className="bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-xl font-bold mt-2">Save</button>
    </div>
  );
};

export default ERPDashboard;
