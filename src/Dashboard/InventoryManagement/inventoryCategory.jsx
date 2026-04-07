import React, { useState, useEffect } from "react"; 
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useTheme } from "../../context/ThemeContext";
import { Edit3, Trash2, Eye, Plus } from "lucide-react";
import Sidebar from "../../component/sidebar";
import NavBar from "../../component/navigation";
import { FaFolder } from "react-icons/fa";
import API from "../../utils/api";

const CategoryPopup = ({ category, onClose, onSave, editable }) => {
  const { darkMode } = useTheme();
  const [name, setName] = useState(category.name || "");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return toast.error("Category name is required!");
    
    setLoading(true);
    try {
      await onSave({ ...category, name: name.trim() });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-black/50 overflow-y-auto p-4">
      <div className={`w-full max-w-md p-6 rounded-2xl max-h-[90vh] overflow-y-auto ${darkMode ? "bg-slate-800 text-white" : "bg-white text-gray-900"}`}>
        <h2 className="text-xl font-bold mb-4">
          {editable ? (category.id ? "Edit Category" : "Add Category") : "View Category"}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <InputField 
            label="Category Name" 
            value={name} 
            onChange={setName} 
            disabled={!editable || loading} 
            required
          />

          <div className="flex justify-end gap-2 mt-2">
            <button 
              type="button" 
              onClick={onClose} 
              className="px-4 py-2 rounded-xl bg-gray-400 text-white hover:bg-gray-500 transition"
              disabled={loading}
            >
              Close
            </button>
            {editable && (
              <button 
                type="submit" 
                className="px-4 py-2 rounded-xl bg-red-600 text-white hover:bg-red-700 transition flex items-center gap-2"
                disabled={loading}
              >
                {loading && (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                )}
                {category.id ? "Update" : "Add"}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default function InventoryCategories() {
  const { darkMode } = useTheme();
  const PAGE_SIZE = 10;

  const [categories, setCategories] = useState([]);
  const [popupCategory, setPopupCategory] = useState(null);
  const [editable, setEditable] = useState(false);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch categories on component mount
  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [categories.length]);

  const totalPages = Math.max(1, Math.ceil(categories.length / PAGE_SIZE));
  const paginatedCategories = categories.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await API.get("/inventory/category");
      console.log("Fetched categories:", res.data);
      
      // Map the API response - only need id and name
      const mappedCategories = res.data.map(cat => ({
        id: cat.id || cat.category_id || cat._id,
        name: cat.name || "",
      }));
      
      setCategories(mappedCategories);
    } catch (err) {
      console.error("Fetch categories error:", err);
      toast.error(err.response?.data?.message || "Failed to fetch categories");
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  const handleView = (cat) => {
    setPopupCategory(cat);
    setEditable(false);
  };

  const handleEdit = (cat) => {
    setPopupCategory(cat);
    setEditable(true);
  };

  const handleAdd = () => {
    setPopupCategory({});
    setEditable(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this category?")) return;
    
    try {
      setDeletingId(id);
      await API.delete(`/inventory/category/${id}`);
      
      setCategories(prev => prev.filter(c => c.id !== id));
      toast.success("Category deleted successfully!");
    } catch (err) {
      console.error("Delete category error:", err);
      toast.error(err.response?.data?.message || "Failed to delete category");
    } finally {
      setDeletingId(null);
    }
  };

  const handleSave = async (category) => {
    try {
      const payload = {
        name: category.name
      };

      if (category.id) {
        // Update existing category
        await API.put(`/inventory/category/${category.id}`, payload);
        
        setCategories(prev => prev.map(c => 
          c.id === category.id 
            ? { ...c, name: category.name }
            : c
        ));
        toast.success("Category updated successfully!");
      } else {
        // Add new category
        const res = await API.post("/inventory/category", payload);
        
        const newCategory = {
          id: res.data.id || res.data._id || res.data.categoryId || Date.now(),
          name: category.name
        };
        
        setCategories(prev => [newCategory, ...prev]);
        toast.success("Category added successfully!");
      }
      
      setPopupCategory(null);
    } catch (err) {
      console.error("Save category error:", err);
      toast.error(err.response?.data?.message || "Failed to save category");
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className={`min-h-screen block lg:flex ${darkMode ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-900"}`}>
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <NavBar />
          <div className="p-6 flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
              <p>Loading categories...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen block lg:flex ${darkMode ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-900"}`}>
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <NavBar />
        <div className="p-6 flex-1">
          <ToastContainer position="top-right" autoClose={2500} hideProgressBar />

          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold">Inventory Categories</h1>
              <p className="text-sm text-slate-400 mt-1">Manage your inventory categories</p>
            </div>
            <button 
              onClick={handleAdd} 
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition"
            >
              <Plus size={18} /> Add Category
            </button>
          </div>

          {categories.length === 0 ? (
            <div className={`text-center py-12 rounded-2xl ${darkMode ? "bg-slate-800" : "bg-white"}`}>
              <FaFolder size={48} className="mx-auto mb-4 text-slate-400" />
              <p className="text-slate-400">No categories found</p>
              <button 
                onClick={handleAdd}
                className="mt-4 text-red-600 hover:text-red-700 font-medium"
              >
                Add your first category
              </button>
            </div>
          ) : (
            <div className={`rounded-2xl overflow-hidden ${darkMode ? "bg-slate-800" : "bg-white"}`}>
              <table className="w-full">
                <thead>
                  <tr className={`text-left ${darkMode ? "bg-slate-700 text-slate-200" : "bg-gray-100 text-gray-800"}`}>
                    <th className="px-6 py-3">Category Name</th>
                    <th className="px-6 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedCategories.map(cat => (
                    <tr key={cat.id} className={`${darkMode ? "border-slate-700" : "border-gray-200"} border-t hover:bg-red-500/5`}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 font-bold">
                          <FaFolder className="text-red-500" /> 
                          {cat.name}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button 
                            onClick={() => handleView(cat)} 
                            className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                            title="View"
                          >
                            <Eye size={16} />
                          </button>
                          <button 
                            onClick={() => handleEdit(cat)} 
                            className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                            title="Edit"
                          >
                            <Edit3 size={16} />
                          </button>
                          <button 
                            onClick={() => handleDelete(cat.id)} 
                            className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition relative"
                            title="Delete"
                            disabled={deletingId === cat.id}
                          >
                            {deletingId === cat.id ? (
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                              <Trash2 size={16} />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {categories.length > 0 && (
            <div className="flex flex-col md:flex-row justify-between items-center gap-2 mt-3 text-xs transition-colors">
              <span className="italic">{`Showing ${(currentPage - 1) * PAGE_SIZE + 1} to ${Math.min(currentPage * PAGE_SIZE, categories.length)} of ${categories.length} entries`}</span>
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

          {popupCategory && (
            <CategoryPopup
              category={popupCategory}
              onClose={() => setPopupCategory(null)}
              onSave={handleSave}
              editable={editable}
            />
          )}
        </div>
      </div>
    </div>
  );
}

const InputField = ({ label, value, onChange, disabled = false, required = false }) => (
  <div className="flex flex-col">
    <label className="mb-1 font-semibold">
      {label}
      {required && <span className="text-red-500 ml-1">*</span>}
    </label>
    <input
      type="text"
      placeholder={`Enter ${label.toLowerCase()}`}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      required={required}
      className={`w-full p-3 rounded-xl shadow bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-400 transition ${
        disabled ? "opacity-50 cursor-not-allowed" : ""
      }`}
    />
  </div>
);