import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Download,
  Eye,
  Edit3,
  Plus,
  Package,
  AlertTriangle,
  Upload,
  X,
  Trash2,
  TrendingUp,
} from "lucide-react";
import * as XLSX from "xlsx";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import AddnewInventory from "./AddnewInventory";
import API from "../../utils/api";
import NavBar from "../../component/navigation";
import Sidebar from "../../component/sidebar";
import { useTheme } from "../../context/ThemeContext";

const InventoryDashboard = () => {
  const { darkMode } = useTheme();
  const PAGE_SIZE = 10;

  // ----------------- State -----------------
  const [inventoryData, setInventoryData] = useState([]);
  const [categories, setCategories] = useState([]);
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [viewItem, setViewItem] = useState(null);
  const [deleteItem, setDeleteItem] = useState(null);
  const [editItem, setEditItem] = useState(null);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [bulkRows, setBulkRows] = useState([]);
  const [bulkErrors, setBulkErrors] = useState([]);
  const [bulkUploading, setBulkUploading] = useState(false);
  const [bulkFileName, setBulkFileName] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const [searchParams] = useSearchParams();
  const focusInventoryId = searchParams.get("view");

  const bulkTemplateColumns = [
    "product_name",
    "sku",
    "category",
    "current_stock",
    "min_stock",
    "purchase_price",
    "selling_price",
    "description",
  ];

  // ----------------- Fetch Data -----------------
  const fetchInventory = async () => {
    try {
      setLoading(true);
      const res = await API.get("/inventory");
      console.log("Fetched inventory:", res.data);
      
      // Map the API response to match your component's expected structure
      const mappedData = res.data.map(item => ({
        id: item.id || item._id, // Store the ID for updates/deletes
        sku: item.sku || `SKU-${Date.now()}`,
        name: item.product_name || item.name || "",
        category: item.category || "",
        stock: item.current_stock || 0,
        min: item.min_stock || 10,
        price: item.selling_price || 0,
        purchase_price: item.purchase_price || 0,
        status: getStatus(item.current_stock || 0, item.min_stock || 10),
        created_by_name: item.created_by_name || "",
        updated_by_name: item.updated_by_name || "",
        last_moved_by_name: item.last_moved_by_name || "",
        // Keep original data if needed
        ...item
      }));
      
      setInventoryData(mappedData);
      calculateStats(mappedData);
    } catch (err) {
      console.error("Fetch inventory error:", err);
      toast.error("Failed to fetch inventory items");
      setInventoryData([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await API.get("/inventory/category");
      setCategories(res.data || []);
    } catch (err) {
      console.error("Fetch categories error:", err);
      toast.error("Failed to fetch categories");
      setCategories([]);
    }
  };

  useEffect(() => {
    fetchInventory();
    fetchCategories();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [inventoryData.length]);

  // Helper function to determine status
  const getStatus = (stock, min) => {
    if (stock === 0) return "Out of Stock";
    if (stock <= min) return "Low Stock";
    return "In Stock";
  };

  const calculateStats = (items) => {
    const totalItems = items.length;
    const totalValue = items.reduce((sum, i) => sum + (parseFloat(i.price) || 0) * (i.stock || 0), 0);
    const lowStock = items.filter((i) => i.stock > 0 && i.stock <= i.min).length;
    const outOfStock = items.filter((i) => i.stock === 0).length;
    
    setStats([
      { label: "Total Items", value: totalItems, icon: <Package /> },
      { label: "Total Value", value: `₦${totalValue.toLocaleString()}`, icon: <TrendingUp /> },
      { label: "Low Stock Items", value: lowStock, icon: <AlertTriangle /> },
      { label: "Out of Stock", value: outOfStock, icon: <X /> },
    ]);
  };

  // ----------------- Handlers -----------------
  const handleAddItem = async (item) => {
    try {
      const payload = {
        product_name: item.name || item.product_name,
        sku: item.sku || `SKU-${Date.now()}`,
        category: item.category,
        current_stock: Number(item.current_stock || item.stock || 0),
        min_stock: Number(item.min_stock || item.min || 10),
        purchase_price: Number(item.purchase_price || 0),
        selling_price: Number(item.selling_price || item.price || 0),
      };
      
      const res = await API.post("/inventory", payload);

      // Add the new item to the list with proper mapping
      const newItem = {
        id: res.data.id || res.data._id || res.data.itemId, // Store the ID from response
        sku: payload.sku,
        name: payload.product_name,
        category: payload.category,
        stock: payload.current_stock,
        min: payload.min_stock,
        price: payload.selling_price,
        purchase_price: payload.purchase_price,
        status: getStatus(payload.current_stock, payload.min_stock),
      };
      
      setInventoryData(prev => [newItem, ...prev]);
      setIsAddModalOpen(false);
      toast.success("Item added successfully");
    } catch (err) {
      console.error("Add item error:", err);
      toast.error(err.response?.data?.message || "Failed to add item");
    }
  };

  const handleUpdateItem = async (item) => {
    try {
      const payload = {
        product_name: item.name || item.product_name,
        sku: item.sku,
        category: item.category,
        current_stock: Number(item.current_stock || item.stock || 0),
        min_stock: Number(item.min_stock || item.min || 10),
        purchase_price: Number(item.purchase_price || 0),
        selling_price: Number(item.selling_price || item.price || 0),
      };
      
      // Use ID for the update URL
      await API.put(`/inventory/${item.id}`, payload);

      // Update the item in the local state
      setInventoryData(prev => 
        prev.map(i => i.id === item.id ? {
          ...i,
          name: payload.product_name,
          category: payload.category,
          stock: payload.current_stock,
          min: payload.min_stock,
          price: payload.selling_price,
          purchase_price: payload.purchase_price,
          status: getStatus(payload.current_stock, payload.min_stock),
        } : i)
      );
      
      setIsEditModalOpen(false);
      setEditItem(null);
      toast.success("Item updated successfully");
    } catch (err) {
      console.error("Update item error:", err);
      toast.error(err.response?.data?.message || "Failed to update item");
    }
  };

  const handleDeleteItem = async (item) => {
    try {
      // Use ID for the delete URL
      await API.delete(`/inventory/${item.id}`);
      
      setInventoryData((prev) => prev.filter((i) => i.id !== item.id));
      setDeleteItem(null);
      toast.success("Item deleted successfully");
    } catch (err) {
      console.error("Delete item error:", err);
      toast.error(err.response?.data?.message || "Failed to delete item");
    }
  };

  const handleAddCategory = async (name) => {
    try {
      const res = await API.post("/inventory/category", { name });
      setCategories(prev => [...prev, { id: res.data.categoryId || Date.now(), name }]);
      setIsCategoryModalOpen(false);
      toast.success("Category added successfully");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add category");
    }
  };

  const handleEditClick = (item) => {
    setEditItem(item);
    setIsEditModalOpen(true);
  };

  const normalizeBulkHeader = (header) => String(header || "").trim().toLowerCase().replace(/\s+/g, "_");

  const parseBulkFile = async (file) => {
    if (!file) return;

    try {
      const fileBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(fileBuffer, { type: "array" });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];

      const rawRows = XLSX.utils.sheet_to_json(firstSheet, {
        defval: "",
        raw: false,
      });

      const mappedRows = rawRows.map((row, index) => {
        const normalized = Object.keys(row).reduce((acc, key) => {
          acc[normalizeBulkHeader(key)] = row[key];
          return acc;
        }, {});

        const productName = String(normalized.product_name || normalized.product || normalized.name || "").trim();
        const category = String(normalized.category || "General").trim() || "General";
        const sku = String(normalized.sku || `SKU-${Date.now()}-${index + 1}`).trim();

        return {
          product_name: productName,
          sku,
          category,
          current_stock: Number(normalized.current_stock || normalized.stock || 0),
          min_stock: Number(normalized.min_stock || normalized.min || 10),
          purchase_price: Number(normalized.purchase_price || normalized.cost_price || 0),
          selling_price: Number(normalized.selling_price || normalized.price || 0),
          description: String(normalized.description || "").trim(),
          __row: index + 2,
        };
      });

      const cleanedRows = mappedRows.filter((row) => row.product_name || row.category || row.sku);

      const errors = cleanedRows
        .filter((row) => !row.product_name || !row.category || row.purchase_price < 0 || row.selling_price < 0)
        .map((row) => `Row ${row.__row}: product_name, category and non-negative prices are required`);

      setBulkRows(cleanedRows);
      setBulkErrors(errors);
      setBulkFileName(file.name);

      if (!cleanedRows.length) {
        toast.error("No valid rows found in spreadsheet");
        return;
      }

      if (errors.length) {
        toast.warn(`Found ${errors.length} row issue(s). Please fix and re-upload.`);
      } else {
        toast.success(`Loaded ${cleanedRows.length} row(s) from spreadsheet`);
      }
    } catch (error) {
      console.error("Bulk parse error:", error);
      toast.error("Failed to read spreadsheet. Upload .xlsx, .xls, or .csv file.");
      setBulkRows([]);
      setBulkErrors([]);
      setBulkFileName("");
    }
  };

  const handleBulkUpload = async () => {
    if (!bulkRows.length) {
      toast.error("Upload and preview a spreadsheet first");
      return;
    }

    if (bulkErrors.length) {
      toast.error("Fix spreadsheet errors before uploading");
      return;
    }

    setBulkUploading(true);
    try {
      await API.post("/inventory/bulk", {
        items: bulkRows.map(({ __row, ...row }) => row),
      });

      toast.success(`Uploaded ${bulkRows.length} inventory item(s) successfully`);
      setBulkRows([]);
      setBulkErrors([]);
      setBulkFileName("");
      setIsBulkModalOpen(false);
      await fetchInventory();
    } catch (error) {
      console.error("Bulk upload error:", error);
      toast.error(error.response?.data?.message || "Bulk upload failed");
    } finally {
      setBulkUploading(false);
    }
  };

  const downloadBulkTemplate = () => {
    const sampleRows = [
      {
        product_name: "Cable",
        sku: "SKU-EXAMPLE-1001",
        category: "Electronics",
        current_stock: 120,
        min_stock: 20,
        purchase_price: 800,
        selling_price: 1200,
        description: "2m HDMI cable",
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(sampleRows, { header: bulkTemplateColumns });
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "InventoryTemplate");
    XLSX.writeFile(workbook, "inventory-bulk-template.xlsx");
  };

  const getStatusStyle = (status) => {
    const base = "px-3 py-1 rounded-full text-[10px] font-bold uppercase";
    if (status === "In Stock") return `${base} bg-emerald-100 text-emerald-700`;
    if (status === "Low Stock") return `${base} bg-amber-100 text-amber-700`;
    return `${base} bg-rose-100 text-rose-700`;
  };

  const totalPages = Math.max(1, Math.ceil(inventoryData.length / PAGE_SIZE));
  const paginatedInventory = inventoryData.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const scopedInventory = focusInventoryId
    ? inventoryData.filter((item) => String(item.id) === String(focusInventoryId))
    : paginatedInventory;

  useEffect(() => {
    if (!focusInventoryId || !inventoryData.length) return;
    const matched = inventoryData.find((item) => String(item.id) === String(focusInventoryId));
    if (matched) {
      setViewItem(matched);
      setCurrentPage(1);
    }
  }, [focusInventoryId, inventoryData]);

  // Show loading state
  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${darkMode ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-900"}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading inventory...</p>
        </div>
      </div>
    );
  }

  // ----------------- Render -----------------
  return (
    <div className={`min-h-screen lg:flex ${darkMode ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-900"}`}>
      <ToastContainer position="top-right" autoClose={2500} hideProgressBar />
      <Sidebar />

      <div className="flex-1 min-w-0">
        <NavBar />

        <main className="p-4 mt-20 md:p-8 max-w-7xl mx-auto min-w-0">
          {/* HEADER */}
          <div className="flex flex-col md:flex-row justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl font-black">Inventory Management</h1>
              <p className="text-sm text-slate-400">Monitor and control your warehouse stock</p>
            </div>

            <div className="flex gap-2 flex-wrap">
              <button onClick={() => setIsAddModalOpen(true)} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold">
                <Plus size={18} /> Add Item
              </button>

              <button
                onClick={() => setIsBulkModalOpen(true)}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-bold"
              >
                <Upload size={18} /> Bulk Upload
              </button>

              <button onClick={() => setIsCategoryModalOpen(true)} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold border ${darkMode ? "bg-slate-800 border-slate-700 hover:bg-slate-700" : "bg-white border-slate-200 hover:bg-slate-50"}`}>
                <Plus size={18} /> Add Category
              </button>
            </div>
          </div>

          {/* STATS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {stats.map((s, i) => (
              <div key={i} className={`p-5 rounded-2xl border ${darkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200"}`}>
                <p className="text-2xl font-black">{s.value}</p>
                <p className="text-xs uppercase text-slate-400 mt-1">{s.label}</p>
              </div>
            ))}
          </div>

          {/* INVENTORY TABLE */}
          {inventoryData.length === 0 ? (
            <div className={`text-center py-12 rounded-2xl border ${darkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200"}`}>
              <Package size={48} className="mx-auto mb-4 text-slate-400" />
              <p className="text-slate-400">No inventory items found</p>
              <button 
                onClick={() => setIsAddModalOpen(true)} 
                className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
              >
                Add your first item
              </button>
            </div>
          ) : (
            <div className={`rounded-2xl border overflow-hidden max-w-full ${darkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200"}`}>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px]">
                  <thead>
                    <tr className="text-xs uppercase text-slate-400 border-b">
                      {["SKU", "Product", "Category", "Stock", "Min", "Price", "Total", "Stock Movement By", "Status", "Actions"].map((h) => (
                        <th key={h} className="px-6 py-4 text-left">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {scopedInventory.map((item) => (
                      <tr key={item.id || item.sku} className="border-t hover:bg-blue-500/5">
                        <td className="px-6 py-4 text-blue-500 font-bold">{item.sku}</td>
                        <td className="px-6 py-4 font-bold">{item.name}</td>
                        <td className="px-6 py-4">{item.category}</td>
                        <td className="px-6 py-4">{item.stock}</td>
                        <td className="px-6 py-4">{item.min}</td>
                        <td className="px-6 py-4">{`₦${(item.price || 0).toLocaleString()}`}</td>
                        <td className="px-6 py-4 font-bold">{`₦${((item.stock || 0) * (item.price || 0)).toLocaleString()}`}</td>
                        <td className="px-6 py-4">{item.last_movement_type ? `${item.last_movement_type} by ${item.last_moved_by_name || item.updated_by_name || item.created_by_name || "System"}` : `By ${item.last_moved_by_name || item.updated_by_name || item.created_by_name || "System"}`}</td>
                        <td className="px-6 py-4">
                          <span className={getStatusStyle(item.status)}>{item.status}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <Eye 
                              size={16} 
                              onClick={() => setViewItem(item)} 
                              className="cursor-pointer hover:text-blue-600" 
                            />
                            <Edit3 
                              size={16} 
                              onClick={() => handleEditClick(item)} 
                              className="cursor-pointer hover:text-blue-600" 
                            />
                            <Trash2 
                              size={16} 
                              onClick={() => setDeleteItem(item)} 
                              className="cursor-pointer text-red-600 hover:text-red-700" 
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {inventoryData.length > 0 && (
            <div className="flex flex-col md:flex-row justify-between items-center gap-2 mt-3 text-xs transition-colors">
              <span className="italic">{`Showing ${(currentPage - 1) * PAGE_SIZE + 1} to ${Math.min(currentPage * PAGE_SIZE, inventoryData.length)} of ${inventoryData.length} entries`}</span>
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

        {/* ---------------- MODALS ---------------- */}
        {isAddModalOpen && (
          <Modal title="Add Inventory Item" onClose={() => setIsAddModalOpen(false)} darkMode={darkMode}>
            <AddnewInventory
              categories={categories}
              onSave={handleAddItem}
              onClose={() => setIsAddModalOpen(false)}
              initialData={{
                name: "",
                sku: `SKU-${Date.now()}`,
                category: "",
                current_stock: 0,
                min_stock: 10,
                purchase_price: 0,
                selling_price: 0,
              }}
            />
          </Modal>
        )}

        {isEditModalOpen && editItem && (
          <Modal title="Edit Inventory Item" onClose={() => {
            setIsEditModalOpen(false);
            setEditItem(null);
          }} darkMode={darkMode}>
            <AddnewInventory
              categories={categories}
              onSave={handleUpdateItem}
              onClose={() => {
                setIsEditModalOpen(false);
                setEditItem(null);
              }}
              initialData={editItem}
              isEdit={true}
            />
          </Modal>
        )}

        {isCategoryModalOpen && (
          <Modal title="Add Category" onClose={() => setIsCategoryModalOpen(false)} darkMode={darkMode}>
            <AddCategoryForm onSave={handleAddCategory} />
          </Modal>
        )}

        {isBulkModalOpen && (
          <Modal title="Bulk Inventory Upload" onClose={() => setIsBulkModalOpen(false)} darkMode={darkMode}>
            <div className="space-y-4">
              <div className={`rounded-lg border p-3 ${darkMode ? "border-slate-700 bg-slate-900" : "border-slate-200 bg-slate-50"}`}>
                <p className="text-sm font-semibold mb-2">Spreadsheet columns required</p>
                <p className="text-xs opacity-70 mb-2">Use these exact headers on row 1:</p>
                <div className="flex flex-wrap gap-2">
                  {bulkTemplateColumns.map((column) => (
                    <span key={column} className={`text-xs px-2 py-1 rounded ${darkMode ? "bg-slate-800" : "bg-white border"}`}>
                      {column}
                    </span>
                  ))}
                </div>
              </div>

              <div className={`rounded-lg border p-3 ${darkMode ? "border-slate-700" : "border-slate-200"}`}>
                <p className="text-sm font-semibold mb-2">Sample Layout</p>
                <img
                  src="/inventory-bulk-template.svg"
                  alt="Inventory spreadsheet sample columns"
                  className="w-full rounded border"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={downloadBulkTemplate}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
                >
                  <Download size={16} /> Download Template
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Upload spreadsheet (.xlsx, .xls, .csv)</label>
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={(e) => parseBulkFile(e.target.files?.[0])}
                  className={`w-full p-2 border rounded ${darkMode ? "bg-slate-700 border-slate-600" : "bg-white border-slate-300"}`}
                />
                {bulkFileName && <p className="text-xs mt-1 opacity-70">Loaded file: {bulkFileName}</p>}
              </div>

              {bulkErrors.length > 0 && (
                <div className="rounded-lg border border-red-300 bg-red-50 text-red-700 p-3 text-xs max-h-28 overflow-auto">
                  {bulkErrors.map((error) => (
                    <p key={error}>{error}</p>
                  ))}
                </div>
              )}

              {bulkRows.length > 0 && (
                <div>
                  <p className="text-sm font-semibold mb-2">Preview ({bulkRows.length} row(s))</p>
                  <div className="max-h-52 overflow-auto border rounded">
                    <table className="w-full text-xs">
                      <thead className={darkMode ? "bg-slate-700" : "bg-slate-100"}>
                        <tr>
                          <th className="px-2 py-2 text-left">Product</th>
                          <th className="px-2 py-2 text-left">SKU</th>
                          <th className="px-2 py-2 text-left">Category</th>
                          <th className="px-2 py-2 text-left">Stock</th>
                          <th className="px-2 py-2 text-left">Price</th>
                        </tr>
                      </thead>
                      <tbody>
                        {bulkRows.slice(0, 20).map((row) => (
                          <tr key={`${row.sku}-${row.__row}`} className="border-t">
                            <td className="px-2 py-2">{row.product_name}</td>
                            <td className="px-2 py-2">{row.sku}</td>
                            <td className="px-2 py-2">{row.category}</td>
                            <td className="px-2 py-2">{row.current_stock}</td>
                            <td className="px-2 py-2">₦{Number(row.selling_price || 0).toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {bulkRows.length > 20 && <p className="text-xs mt-1 opacity-70">Showing first 20 rows</p>}
                </div>
              )}

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsBulkModalOpen(false)}
                  className="px-4 py-2 rounded border hover:bg-slate-100 dark:hover:bg-slate-700"
                  disabled={bulkUploading}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleBulkUpload}
                  disabled={bulkUploading || !bulkRows.length || bulkErrors.length > 0}
                  className="px-4 py-2 rounded bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  {bulkUploading ? "Uploading..." : "Upload Rows"}
                </button>
              </div>
            </div>
          </Modal>
        )}

        {deleteItem && (
          <Modal title="Confirm Delete" onClose={() => setDeleteItem(null)} darkMode={darkMode}>
            <p>Are you sure you want to delete <strong>{deleteItem.name}</strong>?</p>
            <p className="text-sm text-slate-400 mt-1">SKU: {deleteItem.sku}</p>
            <div className="flex justify-end gap-2 mt-4">
              <button 
                onClick={() => setDeleteItem(null)} 
                className="px-4 py-2 rounded border hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                Cancel
              </button>
              <button 
                onClick={() => handleDeleteItem(deleteItem)} 
                className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </Modal>
        )}

        {viewItem && (
          <Modal title="Item Details" onClose={() => setViewItem(null)} darkMode={darkMode}>
            <div className="space-y-2">
              <p><strong>ID:</strong> {viewItem.id}</p>
              <p><strong>SKU:</strong> {viewItem.sku}</p>
              <p><strong>Product Name:</strong> {viewItem.name}</p>
              <p><strong>Category:</strong> {viewItem.category}</p>
              <p><strong>Current Stock:</strong> {viewItem.stock}</p>
              <p><strong>Min Stock:</strong> {viewItem.min}</p>
              <p><strong>Selling Price:</strong> ₦{(viewItem.price || 0).toLocaleString()}</p>
              <p><strong>Purchase Price:</strong> ₦{(viewItem.purchase_price || 0).toLocaleString()}</p>
              <p><strong>Status:</strong> {viewItem.status}</p>
              <p><strong>Last Movement By:</strong> {viewItem.last_movement_type ? `${viewItem.last_movement_type} by ${viewItem.last_moved_by_name || viewItem.updated_by_name || viewItem.created_by_name || "System"}` : `By ${viewItem.last_moved_by_name || viewItem.updated_by_name || viewItem.created_by_name || "System"}`}</p>
              <p><strong>Total Value:</strong> ₦{((viewItem.stock || 0) * (viewItem.price || 0)).toLocaleString()}</p>
            </div>
          </Modal>
        )}
      </div>
    </div>
  );
};

/* ---------- GENERIC MODAL ---------- */
const Modal = ({ title, children, onClose, darkMode }) => (
  <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-3 sm:p-4">
    <div className={`w-full max-w-md sm:max-w-lg rounded-2xl p-5 sm:p-6 relative max-h-[88vh] overflow-y-auto ${darkMode ? "bg-slate-800 text-white" : "bg-white text-slate-900"}`}>
      <button 
        onClick={onClose} 
        className="absolute top-4 right-4 p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full"
      >
        <X />
      </button>
      <h2 className="text-xl font-black mb-4">{title}</h2>
      {children}
    </div>
  </div>
);

/* ---------- ADD CATEGORY FORM ---------- */
const AddCategoryForm = ({ onSave }) => {
  const [name, setName] = useState("");

  const handleSubmit = () => {
    if (!name.trim()) {
      alert("Category name is required");
      return;
    }
    onSave(name.trim());
    setName("");
  };

  return (
    <div className="flex flex-col gap-3">
      <input 
        type="text" 
        value={name} 
        onChange={(e) => setName(e.target.value)} 
        placeholder="Category Name" 
        className="p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:border-slate-600"
        autoFocus
      />
      <div className="flex justify-end gap-2">
        <button 
          onClick={handleSubmit} 
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Save Category
        </button>
      </div>
    </div>
  );
};

export default InventoryDashboard;