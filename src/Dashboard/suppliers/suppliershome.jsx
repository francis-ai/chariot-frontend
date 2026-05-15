import React, { useState, useEffect } from "react";
import { Eye, Edit3, Plus, X, Save, Trash2, Upload, Download } from "lucide-react";
import NavBar from "../../component/navigation";
import Sidebar from "../../component/sidebar";
import AddSupplier from "./Addsupplier";
import { useTheme } from "../../context/ThemeContext";
import API from "../../utils/api";
import { ToastContainer, toast } from "react-toastify";
import { useLocation, useNavigate } from "react-router-dom";
import "react-toastify/dist/ReactToastify.css";
import * as XLSX from "xlsx";

const SupplierManagement = () => {
  const { darkMode } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const PAGE_SIZE = 10;

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [viewModal, setViewModal] = useState(null);
  const [editModal, setEditModal] = useState(null);
  const [deleteModal, setDeleteModal] = useState(null); // For delete confirmation
  const [formData, setFormData] = useState({});
  const isAddPage = new URLSearchParams(location.search).get("mode") === "add";
  const [suppliers, setSuppliers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  // Bulk upload states
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkRows, setBulkRows] = useState([]);
  const [bulkErrors, setBulkErrors] = useState([]);
  const [bulkUploading, setBulkUploading] = useState(false);
  const [bulkFileName, setBulkFileName] = useState("");

  const bulkTemplateColumns = ["name", "company", "phone", "email", "address", "city", "country"];

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
        created_by_name: supplier.created_by_name || "",
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

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, suppliers.length]);

  const filteredSuppliers = suppliers.filter((supplier) => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return true;
    return [supplier.name, supplier.company, supplier.email, supplier.phone, supplier.city, supplier.country]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(query));
  });

  const totalPages = Math.max(1, Math.ceil(filteredSuppliers.length / PAGE_SIZE));
  const paginatedSuppliers = filteredSuppliers.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

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
      navigate(`${location.pathname}`, { replace: true });
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
  const handleDelete = async () => {
    if (!deleteModal) return;
    
    setDeleting(true);
    try {
      await API.delete(`/suppliers/${deleteModal.id}`);
      
      setSuppliers(prev => prev.filter(s => s.id !== deleteModal.id));
      setDeleteModal(null);
      toast.success("Supplier deleted successfully!");
    } catch (err) {
      console.error("Delete supplier error:", err);
      toast.error(err.response?.data?.message || "Failed to delete supplier");
    } finally {
      setDeleting(false);
    }
  };

    /* ---------- BULK UPLOAD ---------- */
    const handleBulkFileUpload = (event) => {
      const file = event.target.files[0];
      if (!file) return;

      setBulkFileName(file.name);
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: "array" });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

          if (jsonData.length < 2) {
            toast.error("Spreadsheet must have at least a header row and one data row");
            return;
          }

          const headers = jsonData[0].map(h => String(h || "").trim().toLowerCase());
          const rows = jsonData.slice(1).map((row, index) => {
            const obj = { __row: index + 2 };
            headers.forEach((header, colIndex) => {
              obj[header] = row[colIndex] || "";
            });
            return obj;
          })
          // remove fully-empty rows (common when spreadsheets have trailing blank lines)
          .filter(r => {
            const keys = Object.keys(r).filter(k => k !== "__row");
            return keys.some(k => String(r[k] || "").trim() !== "");
          });

          const errors = [];
          const validRows = rows.filter((row) => {
            const rowNum = row.__row;
            const name = String(row.name || "").trim();
            const company = String(row.company || "").trim();
            const email = String(row.email || "").trim();

            if (!name && !company) {
              errors.push(`Row ${rowNum}: At least name or company is required`);
              return false;
            }
            if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
              errors.push(`Row ${rowNum}: Invalid email format`);
              return false;
            }
            return true;
          });

          setBulkRows(validRows);
          setBulkErrors(errors);
          if (errors.length) {
            toast.warn(`Found ${errors.length} row issue(s). Please fix and re-upload.`);
          } else {
            toast.success(`Loaded ${validRows.length} valid row(s)`);
          }
        } catch (error) {
          console.error("File read error:", error);
          toast.error("Failed to read spreadsheet. Upload .xlsx, .xls, or .csv file.");
        }
      };
      reader.readAsArrayBuffer(file);
    };

    const handleBulkUpload = async () => {
      if (!bulkRows.length) {
        toast.error("No valid rows to upload");
        return;
      }
      if (bulkErrors.length) {
        toast.error("Fix spreadsheet errors before uploading");
        return;
      }

      setBulkUploading(true);
      try {
        await API.post("/suppliers/bulk", {
          suppliers: bulkRows.map(({ __row, ...row }) => row),
        });
        toast.success(`Uploaded ${bulkRows.length} supplier(s) successfully`);
        setShowBulkModal(false);
        setBulkRows([]);
        setBulkErrors([]);
        setBulkFileName("");
        fetchSuppliers();
      } catch (error) {
        console.error("Bulk upload error:", error);
        toast.error(error.response?.data?.message || "Bulk upload failed");
      } finally {
        setBulkUploading(false);
      }
    };

    const downloadBulkTemplate = () => {
      const sampleRows = [
        { name: "Acme Supplies", company: "Acme", phone: "08012345678", email: "hello@acme.com", address: "1 Market St", city: "Lagos", country: "Nigeria" },
        { name: "", company: "Global Traders", phone: "08087654321", email: "info@global.com", address: "22 High St", city: "Abuja", country: "Nigeria" },
      ];
      const worksheet = XLSX.utils.json_to_sheet(sampleRows, { header: bulkTemplateColumns });
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Suppliers");
      XLSX.writeFile(workbook, "suppliers-bulk-template.xlsx");
    };

  /* ---------- ADD PAGE ---------- */
  if (isAddPage) {
    return (
      <div className={`block lg:flex min-h-screen ${darkMode ? "bg-slate-900 text-white" : "bg-slate-50 text-slate-900"}`}>
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        <div className="flex-1 flex flex-col w-full">
          <NavBar onMenuClick={() => setIsSidebarOpen(true)} />
          <main className="p-4 md:p-6 mt-16 md:mt-0 max-w-7xl mx-auto w-full">
            <div className="flex justify-between items-center mb-6 gap-4">
              <h1 className="text-2xl font-black">Add Supplier</h1>
              <button
                onClick={() => navigate(location.pathname, { replace: true })}
                className="flex items-center gap-2 bg-rose-600 text-white px-3 md:px-4 py-2 rounded-xl shadow-lg hover:bg-rose-700 whitespace-nowrap text-sm md:text-base"
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
            <div className="flex gap-2">
              <button
                onClick={() => navigate(`${location.pathname}?mode=add`)}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-xl font-bold shadow-lg"
              >
                <Plus size={18} /> Add Supplier
              </button>
              <button
                onClick={() => setShowBulkModal(true)}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl font-bold shadow-lg"
              >
                <Upload size={16} /> Bulk Upload
              </button>
            </div>
          </div>

          <div className="mb-4 w-full sm:w-96">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search suppliers by name, company, email or phone"
              className={`w-full px-4 py-2 rounded-lg border outline-none ${darkMode ? "bg-slate-800 border-slate-700 text-slate-100" : "bg-white border-slate-300 text-slate-800"}`}
            />
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
                onClick={() => navigate(`${location.pathname}?mode=add`)}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Add your first supplier
              </button>
            </div>
          )}

          {/* TABLE */}
          {!loading && filteredSuppliers.length > 0 && (
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
                    {paginatedSuppliers.map((s) => (
                      <tr key={s.id} className={`hover:bg-opacity-50 ${darkMode ? "hover:bg-slate-700" : "hover:bg-slate-50"}`}>
                        <td className="px-4 py-3 font-bold text-blue-500 text-sm">{s.id}</td>
                        <td className="px-4 py-3 font-medium">{s.name}</td>
                        <td className="px-4 py-3">{s.phone}</td>
                        <td className="px-4 py-3 text-blue-500">{s.email || '-'}</td>
                        <td className="px-4 py-3">{s.company || '-'}</td>
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
                              onClick={() => setDeleteModal(s)}
                              className={`p-2 rounded-xl shadow-md ${
                                darkMode ? "bg-red-900 text-red-300 hover:bg-red-800" : "bg-red-50 text-red-600 hover:bg-red-100"
                              }`}
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
            </div>
          )}

          {!loading && filteredSuppliers.length > 0 && (
            <div className="flex flex-col md:flex-row justify-between items-center gap-2 mt-3 text-xs transition-colors">
              <span className="italic">{`Showing ${(currentPage - 1) * PAGE_SIZE + 1} to ${Math.min(currentPage * PAGE_SIZE, filteredSuppliers.length)} of ${filteredSuppliers.length} entries`}</span>
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
        </main>
      </div>

      {/* Bulk Upload Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`w-full max-w-4xl mx-4 rounded-2xl shadow-2xl ${darkMode ? "bg-slate-800" : "bg-white"}`}>
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-bold">Bulk Upload Suppliers</h2>
              <button onClick={() => setShowBulkModal(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex items-center gap-4">
                <button onClick={downloadBulkTemplate} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg">
                  <Download size={16} /> Download Template
                </button>
                <div className="text-sm text-gray-600">
                  <p>Template includes columns: {bulkTemplateColumns.join(", ")}</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Upload spreadsheet (.xlsx, .xls, .csv)</label>
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleBulkFileUpload}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                {bulkFileName && <p className="text-xs mt-1 opacity-70">Loaded file: {bulkFileName}</p>}
              </div>

              {bulkErrors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-red-800 mb-2">Errors Found:</h3>
                  <ul className="text-sm text-red-700 space-y-1">
                    {bulkErrors.map((error, index) => (
                      <li key={index}>• {error}</li>
                    ))}
                  </ul>
                </div>
              )}

              {bulkRows.length > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-sm font-semibold mb-2">Preview ({bulkRows.length} row(s))</p>
                  <div className="overflow-x-auto max-h-60">
                    <table className="w-full text-sm">
                      <thead className="bg-green-100">
                        <tr>
                          {bulkTemplateColumns.map((column) => (
                            <th key={column} className="px-2 py-1 text-left font-medium capitalize">{column.replace("_", " ")}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {bulkRows.slice(0, 20).map((row, index) => (
                          <tr key={index} className="border-t">
                            {bulkTemplateColumns.map((column) => (
                              <td key={column} className="px-2 py-1">{String(row[column] || "")}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {bulkRows.length > 20 && <p className="text-xs mt-1 opacity-70">Showing first 20 rows</p>}
                </div>
              )}

              <div className="flex justify-end gap-3">
                <button onClick={() => setShowBulkModal(false)} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
                <button
                  onClick={handleBulkUpload}
                  disabled={bulkUploading || !bulkRows.length || bulkErrors.length > 0}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg disabled:opacity-50 flex items-center gap-2"
                >
                  {bulkUploading && (<div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>)}
                  {bulkUploading ? "Uploading..." : "Upload Rows"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
                <div>
                  <label className="text-[11px] uppercase font-bold opacity-60 mb-1 block">Added By</label>
                  <p className="font-semibold">{viewModal.created_by_name || 'System'}</p>
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

      {/* DELETE CONFIRMATION MODAL */}
      {deleteModal && (
        <DeleteConfirmationModal
          title="Delete Supplier"
          onClose={() => setDeleteModal(null)}
          onConfirm={handleDelete}
          data={deleteModal}
          darkMode={darkMode}
          deleting={deleting}
        />
      )}
    </div>
  );
};

/* ===================== DELETE CONFIRMATION MODAL ===================== */
const DeleteConfirmationModal = ({ title, onClose, onConfirm, data, darkMode, deleting }) => {
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className={`w-full max-w-md rounded-2xl p-6 shadow-2xl relative ${darkMode ? "bg-slate-800 text-white" : "bg-white text-slate-900"}`}>
        <button
          onClick={onClose}
          className="absolute top-4 right-4 opacity-60 hover:opacity-100"
          disabled={deleting}
        >
          <X />
        </button>

        <div className="text-center mb-6">
          <div className="flex items-center justify-center mb-4">
            <div className="w-20 h-20 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
              <Trash2 size={40} className="text-red-600 dark:text-red-400" />
            </div>
          </div>
          
          <h2 className="text-2xl font-black mb-2">{title}</h2>
          
          <p className="text-slate-500 dark:text-slate-400 mb-4">
            Are you sure you want to delete this supplier?
          </p>
          
          <div className={`p-4 rounded-xl ${darkMode ? "bg-slate-700" : "bg-slate-100"} text-left mb-4`}>
            <p className="font-bold text-lg">{data.name}</p>
            <p className="text-sm opacity-70 mt-1">ID: {data.id}</p>
            {data.phone && <p className="text-sm opacity-70 mt-1">Phone: {data.phone}</p>}
            {data.email && <p className="text-sm opacity-70 mt-1">Email: {data.email}</p>}
          </div>
          
          <p className="text-sm text-red-600 dark:text-red-400 font-medium">
            This action cannot be undone.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={deleting}
            className={`flex-1 px-4 py-3 rounded-xl font-bold transition ${
              darkMode 
                ? "bg-slate-700 hover:bg-slate-600 text-white" 
                : "bg-slate-200 hover:bg-slate-300 text-slate-800"
            } ${deleting ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={deleting}
            className="flex-1 px-4 py-3 rounded-xl font-bold bg-red-600 hover:bg-red-700 text-white transition disabled:opacity-50 flex items-center justify-center gap-2"
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

export default SupplierManagement;