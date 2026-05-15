import React, { useMemo, useState, useEffect } from "react";
import { useContext } from "react";
import Navigation from "../../component/navigation";
import Sidebar from "../../component/sidebar";
import { useSearch } from "../../context/searchcontex";
import { Eye, X, Plus, Edit, Trash2, Upload, Download } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import { AuthContext } from "../../context/authContext";
import API from "../../utils/api";
import { toast, ToastContainer } from "react-toastify";
import * as XLSX from "xlsx";
import "react-toastify/dist/ReactToastify.css";

export default function CustomersDashboard() {
  const { searchQuery, setSearchQuery } = useSearch();
  const { darkMode } = useTheme();
  const PAGE_SIZE = 10;

  const [customers, setCustomers] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editCustomer, setEditCustomer] = useState(null);
  const [viewCustomer, setViewCustomer] = useState(null);
  const [deleteModal, setDeleteModal] = useState(null); // For delete confirmation
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const { user } = useContext(AuthContext);
  const canDeleteCustomer = ["super-admin", "admin"].includes(String(user?.role || "").toLowerCase());

  // Bulk upload states
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkRows, setBulkRows] = useState([]);
  const [bulkErrors, setBulkErrors] = useState([]);
  const [bulkUploading, setBulkUploading] = useState(false);
  const [bulkFileName, setBulkFileName] = useState("");

  const bulkTemplateColumns = ["name", "company", "phone", "email", "address", "status"];

  // Fetch customers
  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const res = await API.get("/customers");
      setCustomers(res.data);
    } catch (err) {
      toast.error("Failed to fetch customers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  // Bulk upload functions
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

        // Validate rows
        const errors = [];
        const validRows = rows.filter((row, index) => {
          const rowNum = row.__row;
          const name = String(row.name || "").trim();
          const company = String(row.company || "").trim();
          const email = String(row.email || "").trim();
          const status = String(row.status || "Active").trim();

          if (!name && !company) {
            errors.push(`Row ${rowNum}: At least name or company is required`);
            return false;
          }
          if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            errors.push(`Row ${rowNum}: Invalid email format`);
            return false;
          }
          if (status && !["Active", "Inactive"].includes(status)) {
            errors.push(`Row ${rowNum}: Status must be 'Active' or 'Inactive'`);
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
      await API.post("/customers/bulk", {
        customers: bulkRows.map(({ __row, ...row }) => row),
      });
      toast.success(`Uploaded ${bulkRows.length} customer(s) successfully`);
      setShowBulkModal(false);
      setBulkRows([]);
      setBulkErrors([]);
      setBulkFileName("");
      fetchCustomers();
    } catch (error) {
      console.error("Bulk upload error:", error);
      toast.error(error.response?.data?.message || "Bulk upload failed");
    } finally {
      setBulkUploading(false);
    }
  };

  const downloadBulkTemplate = () => {
    const sampleRows = [
      { name: "John Doe", company: "ABC Corp", phone: "1234567890", email: "john@abc.com", address: "123 Main St", status: "Active" },
      { name: "", company: "XYZ Ltd", phone: "0987654321", email: "info@xyz.com", address: "456 Oak Ave", status: "Active" },
    ];
    const worksheet = XLSX.utils.json_to_sheet(sampleRows, { header: bulkTemplateColumns });
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Customers");
    XLSX.writeFile(workbook, "customers-bulk-template.xlsx");
  };

  // Filtered customers
  const filteredCustomers = useMemo(() => {
    if (!searchQuery.trim()) return customers;
    const lower = searchQuery.toLowerCase();
    return customers.filter(
      (c) =>
        c.name?.toLowerCase().includes(lower) ||
        c.email?.toLowerCase().includes(lower) ||
        c.phone?.includes(lower) ||
        c.company?.toLowerCase().includes(lower) ||
        c.address?.toLowerCase().includes(lower) ||
        c.status?.toLowerCase().includes(lower)
    );
  }, [searchQuery, customers]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, customers.length]);

  const totalPages = Math.max(1, Math.ceil(filteredCustomers.length / PAGE_SIZE));
  const paginatedCustomers = useMemo(() => {
    return filteredCustomers.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  }, [filteredCustomers, currentPage]);

  // Add or edit customer
  const handleSaveCustomer = async (customerData) => {
    try {
      if (editCustomer) {
        const res = await API.put(`/customers/${editCustomer.id}`, customerData);
        setCustomers(prev =>
          prev.map(c => (c.id === editCustomer.id ? { ...c, ...customerData } : c))
        );
        toast.success(res.data.message || "Customer updated successfully");
        setEditCustomer(null);
      } else {
        const res = await API.post("/customers", customerData);
        const addedCustomer = { id: res.data.customerId || res.data.id, ...customerData };
        setCustomers(prev => [addedCustomer, ...prev]);
        toast.success(res.data.message || "Customer added successfully");
      }
      setShowAddModal(false);
    } catch (err) {
      toast.error(err.response?.data?.message || "Operation failed");
    }
  };

  // Delete customer
  const handleDeleteCustomer = async () => {
    if (!deleteModal) return;
    
    setDeleting(true);
    try {
      await API.delete(`/customers/${deleteModal.id}`);
      setCustomers(prev => prev.filter(c => c.id !== deleteModal.id));
      setDeleteModal(null);
      toast.success("Customer deleted successfully");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete customer");
    } finally {
      setDeleting(false);
    }
  };

  const bgClass = darkMode ? "bg-gray-900 text-gray-100" : "bg-gray-100 text-gray-900";
  const inputBg = darkMode ? "bg-gray-800 text-gray-100 placeholder-gray-400" : "bg-white text-gray-900 placeholder-gray-500";

  return (
    <div className={`min-h-screen flex ${bgClass}`}>
      <ToastContainer position="top-right" autoClose={2500} hideProgressBar />
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Navigation />
        <main className="p-4 md:p-6 mt-20 space-y-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <h1 className="text-2xl md:text-3xl font-bold">Customer Management</h1>
            <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search customers..."
                className={`w-full sm:w-64 px-3 py-2 rounded-lg shadow focus:outline-none focus:ring-1 focus:ring-blue-600 ${inputBg}`}
              />
              <button
                onClick={() => { setShowAddModal(true); setEditCustomer(null); }}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold"
              >
                <Plus size={16} /> New Customer
              </button>
              <button
                onClick={() => setShowBulkModal(true)}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-bold"
              >
                <Upload size={16} /> Bulk Upload
              </button>
            </div>
          </div>

          {/* Customer Table - Desktop */}
          <div className={`hidden md:block rounded-2xl shadow overflow-x-auto ${darkMode ? "bg-gray-800" : "bg-white"}`}>
            <table className="w-full text-left min-w-[800px]">
              <thead className={darkMode ? "bg-gray-700" : "bg-gray-50"}>
                <tr>
                  {["ID", "Name", "Email", "Phone", "Company", "Added By", "Status", "Action"].map((h) => (
                    <th key={h} className="px-4 py-2 text-xs font-bold uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className={darkMode ? "divide-gray-700" : "divide-gray-100"}>
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-6 text-center">Loading...</td>
                  </tr>
                ) : filteredCustomers.length > 0 ? (
                  paginatedCustomers.map(c => (
                    <tr key={c.id} className={`hover:bg-blue-50/30 transition-colors ${darkMode ? "hover:bg-gray-700" : ""}`}>
                      <td className="px-4 py-2 font-mono text-sm text-blue-600">{c.id}</td>
                      <td className="px-4 py-2 font-medium">{c.name}</td>
                      <td className="px-4 py-2 text-sm">{c.email}</td>
                      <td className="px-4 py-2 text-sm">{c.phone}</td>
                      <td className="px-4 py-2">{c.company}</td>
                      <td className="px-4 py-2 text-sm">{c.created_by_name || "System"}</td>
                      <td className="px-4 py-2">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                          c.status === "Active"
                            ? "bg-green-100 text-green-600"
                            : "bg-red-100 text-red-600"
                        }`}>{c.status}</span>
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex gap-2">
                          <button
                            onClick={() => setViewCustomer(c)}
                            className="bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded flex items-center gap-1 text-xs"
                          >
                            <Eye size={14} /> View
                          </button>
                          <button
                            onClick={() => { setEditCustomer(c); setShowAddModal(true); }}
                            className="bg-yellow-400 hover:bg-yellow-500 text-white px-2 py-1 rounded flex items-center gap-1 text-xs"
                          >
                            <Edit size={14} /> Edit
                          </button>
                          {canDeleteCustomer && (
                            <button
                              onClick={() => setDeleteModal(c)}
                              className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded flex items-center gap-1 text-xs"
                            >
                              <Trash2 size={14} /> Delete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="px-4 py-6 text-center text-gray-400">
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
              paginatedCustomers.map(c => (
                <div key={c.id} className={`rounded-2xl shadow p-4 flex flex-col gap-2 ${darkMode ? "bg-gray-800 text-gray-100" : "bg-white"}`}>
                  <div className="flex justify-between items-center">
                    <p className="font-bold text-blue-600">{c.id}</p>
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                      c.status === "Active"
                        ? "bg-green-100 text-green-600"
                        : "bg-red-100 text-red-600"
                    }`}>{c.status}</span>
                  </div>
                  <p className="font-medium">{c.name}</p>
                  <p className="text-sm">{c.email}</p>
                  <p className="text-sm">{c.phone}</p>
                  <p className="text-sm">{c.company}</p>
                  <p className="text-xs opacity-70">Added by: {c.created_by_name || "System"}</p>
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => setViewCustomer(c)}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded flex items-center gap-1 text-xs"
                    >
                      <Eye size={14} /> View
                    </button>
                    <button
                      onClick={() => { setEditCustomer(c); setShowAddModal(true); }}
                      className="bg-yellow-400 hover:bg-yellow-500 text-white px-2 py-1 rounded flex items-center gap-1 text-xs"
                    >
                      <Edit size={14} /> Edit
                    </button>
                    {canDeleteCustomer && (
                      <button
                        onClick={() => setDeleteModal(c)}
                        className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded flex items-center gap-1 text-xs"
                      >
                        <Trash2 size={14} /> Delete
                      </button>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center">No customers found for "{searchQuery}"</p>
            )}
          </div>

          {/* Add/Edit Customer Modal */}
          {!loading && filteredCustomers.length > 0 && (
            <div className="flex flex-col md:flex-row justify-between items-center gap-2 mt-3 text-xs transition-colors">
              <span className="italic">{`Showing ${(currentPage - 1) * PAGE_SIZE + 1} to ${Math.min(currentPage * PAGE_SIZE, filteredCustomers.length)} of ${filteredCustomers.length} entries`}</span>
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

          {/* Add/Edit Customer Modal */}
          {showAddModal && (
            <AddCustomerModal
              onClose={() => { setShowAddModal(false); setEditCustomer(null); }}
              onSave={handleSaveCustomer}
              darkMode={darkMode}
              editCustomer={editCustomer}
            />
          )}

          {/* View Customer Modal */}
          {viewCustomer && (
            <ViewCustomerModal
              customer={viewCustomer}
              onClose={() => setViewCustomer(null)}
              darkMode={darkMode}
            />
          )}

          {/* Bulk Upload Modal */}
          {showBulkModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className={`w-full max-w-4xl mx-4 rounded-2xl shadow-2xl ${darkMode ? "bg-gray-800" : "bg-white"}`}>
                <div className="flex items-center justify-between p-6 border-b">
                  <h2 className="text-xl font-bold">Bulk Upload Customers</h2>
                  <button
                    onClick={() => setShowBulkModal(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="p-6 space-y-4">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={downloadBulkTemplate}
                      className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
                    >
                      <Download size={16} /> Download Template
                    </button>
                    <div className="text-sm text-gray-600">
                      <p>Template includes columns: {bulkTemplateColumns.join(", ")}</p>
                      <p>Status should be 'Active' or 'Inactive'</p>
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
                                <th key={column} className="px-2 py-1 text-left font-medium capitalize">
                                  {column.replace("_", " ")}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {bulkRows.slice(0, 20).map((row, index) => (
                              <tr key={index} className="border-t">
                                {bulkTemplateColumns.map((column) => (
                                  <td key={column} className="px-2 py-1">
                                    {String(row[column] || "")}
                                  </td>
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
                    <button
                      onClick={() => setShowBulkModal(false)}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleBulkUpload}
                      disabled={bulkUploading || !bulkRows.length || bulkErrors.length > 0}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg disabled:opacity-50 flex items-center gap-2"
                    >
                      {bulkUploading && (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      )}
                      {bulkUploading ? "Uploading..." : "Upload Rows"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Delete Confirmation Modal */}
          {deleteModal && canDeleteCustomer && (
            <DeleteConfirmationModal
              onClose={() => setDeleteModal(null)}
              onConfirm={handleDeleteCustomer}
              customer={deleteModal}
              darkMode={darkMode}
              deleting={deleting}
            />
          )}
        </main>
      </div>
    </div>
  );
}

/* ================== ADD CUSTOMER MODAL ================== */
const AddCustomerModal = ({ onClose, onSave, darkMode, editCustomer }) => {
  const [form, setForm] = useState({ name: "", email: "", phone: "", company: "", address: "", status: "Active" });
  const [errors, setErrors] = useState({});

  React.useEffect(() => {
    if (editCustomer) setForm(editCustomer); // pre-fill for editing
  }, [editCustomer]);

  const validate = () => {
    const errs = {};
    if (!form.name?.trim()) errs.name = "Name is required";
    if (form.email?.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = "Enter a valid email";
    if (form.phone?.trim() && !/^\+?\d{8,15}$/.test(form.phone)) errs.phone = "Enter a valid phone number";
    if (!form.company?.trim()) errs.company = "Company is required";
    if (!form.address?.trim()) errs.address = "Address is required";
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
        <button onClick={onClose} className="absolute top-3 right-3 text-gray-400 hover:text-gray-200">
          <X size={18} />
        </button>
        <h2 className="text-lg font-bold mb-4">{editCustomer ? "Edit Customer" : "Add New Customer"}</h2>
        <div className="flex flex-col gap-3">
          {["name","email","phone","company", "address"].map(field => (
            <div key={field} className="flex flex-col">
              <input
                className={`px-3 py-2 rounded-lg shadow focus:outline-none focus:ring-1 focus:ring-blue-600 ${inputBg}`}
                placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
                value={form[field] || ''}
                onChange={e => setForm({ ...form, [field]: e.target.value })}
              />
              {errors[field] && <span className="text-red-600 text-xs mt-1">{errors[field]}</span>}
            </div>
          ))}

          <select
            className={`px-3 py-2 rounded-lg shadow focus:outline-none focus:ring-1 focus:ring-blue-600 ${inputBg}`}
            value={form.status}
            onChange={e => setForm({ ...form, status: e.target.value })}
          >
            <option>Active</option>
            <option>Inactive</option>
          </select>

          <button 
            onClick={handleSave} 
            className="mt-2 w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-bold"
          >
            {editCustomer ? "Update Customer" : "Save Customer"}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ================== VIEW CUSTOMER MODAL ================== */
const ViewCustomerModal = ({ customer, onClose, darkMode }) => {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className={`rounded-2xl p-6 w-full max-w-md relative shadow-lg ${darkMode ? "bg-gray-800 text-gray-100" : "bg-white"}`}>
        <button onClick={onClose} className="absolute top-3 right-3 text-gray-400 hover:text-gray-200">
          <X size={18} />
        </button>

        <h2 className="text-lg font-bold mb-4">Customer Details</h2>

        <div className="space-y-2 text-sm">
          <p><strong>ID:</strong> {customer.id}</p>
          <p><strong>Name:</strong> {customer.name || "-"}</p>
          <p><strong>Email:</strong> {customer.email || "-"}</p>
          <p><strong>Phone:</strong> {customer.phone || "-"}</p>
          <p><strong>Company:</strong> {customer.company || "-"}</p>
          <p><strong>Address:</strong> {customer.address || "-"}</p>
          <p><strong>Status:</strong> {customer.status || "-"}</p>
          <p><strong>Added By:</strong> {customer.created_by_name || "System"}</p>
        </div>
      </div>
    </div>
  );
};

/* ================== DELETE CONFIRMATION MODAL ================== */
const DeleteConfirmationModal = ({ onClose, onConfirm, customer, darkMode, deleting }) => {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className={`rounded-2xl p-6 w-full max-w-md relative shadow-lg ${darkMode ? "bg-gray-800 text-gray-100" : "bg-white"}`}>
        <button 
          onClick={onClose} 
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-200"
          disabled={deleting}
        >
          <X size={18} />
        </button>

        <div className="text-center mb-6">
          <div className="flex items-center justify-center mb-4">
            <div className={`w-20 h-20 rounded-full flex items-center justify-center ${
              darkMode ? "bg-red-900/20" : "bg-red-100"
            }`}>
              <Trash2 size={40} className="text-red-600" />
            </div>
          </div>
          
          <h2 className="text-xl font-bold mb-2">Delete Customer</h2>
          
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            Are you sure you want to delete this customer?
          </p>
          
          <div className={`p-4 rounded-lg text-left mb-4 ${darkMode ? "bg-gray-700" : "bg-gray-50"}`}>
            <p className="font-bold text-lg">{customer.name}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">ID: {customer.id}</p>
            {customer.email && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Email: {customer.email}</p>
            )}
            {customer.phone && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Phone: {customer.phone}</p>
            )}
            {customer.company && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Company: {customer.company}</p>
            )}
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Status: <span className={customer.status === "Active" ? "text-green-600" : "text-red-600"}>
                {customer.status}
              </span>
            </p>
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
                ? "bg-gray-700 hover:bg-gray-600 text-white" 
                : "bg-gray-200 hover:bg-gray-300 text-gray-800"
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