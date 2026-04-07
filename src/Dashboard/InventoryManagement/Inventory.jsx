import React, { useState, useEffect } from "react";
import {
  Eye,
  Edit3,
  Plus,
  Package,
  AlertTriangle,
  X,
  Trash2,
  TrendingUp,
} from "lucide-react";
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

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

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

      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={() => setIsSidebarOpen(false)} />
      )}

      <div className="flex-1">
        <NavBar onMenuClick={() => setIsSidebarOpen(true)} />

        <main className="p-4 mt-20 md:p-8 max-w-7xl mx-auto">
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
            <div className={`rounded-2xl border overflow-hidden ${darkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200"}`}>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px]">
                  <thead>
                    <tr className="text-xs uppercase text-slate-400 border-b">
                      {["SKU", "Product", "Category", "Stock", "Min", "Price", "Total", "Status", "Actions"].map((h) => (
                        <th key={h} className="px-6 py-4 text-left">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedInventory.map((item) => (
                      <tr key={item.id || item.sku} className="border-t hover:bg-blue-500/5">
                        <td className="px-6 py-4 text-blue-500 font-bold">{item.sku}</td>
                        <td className="px-6 py-4 font-bold">{item.name}</td>
                        <td className="px-6 py-4">{item.category}</td>
                        <td className="px-6 py-4">{item.stock}</td>
                        <td className="px-6 py-4">{item.min}</td>
                        <td className="px-6 py-4">{`₦${(item.price || 0).toLocaleString()}`}</td>
                        <td className="px-6 py-4 font-bold">{`₦${((item.stock || 0) * (item.price || 0)).toLocaleString()}`}</td>
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
  <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
    <div className={`w-full max-w-md rounded-2xl p-6 relative ${darkMode ? "bg-slate-800 text-white" : "bg-white text-slate-900"}`}>
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