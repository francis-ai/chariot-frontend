import React, { useState } from "react"; 
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useTheme } from "../../context/ThemeContext";
import { Edit3, Trash2, Eye, Plus } from "lucide-react";
import Sidebar from "../../component/sidebar";
import NavBar from "../../component/navigation";
import { FaFolder } from "react-icons/fa";

const CategoryPopup = ({ category, onClose, onSave, editable }) => {
  const { darkMode } = useTheme();
  const [name, setName] = useState(category.name || "");
  const [description, setDescription] = useState(category.description || "");
  const [location, setLocation] = useState(category.location || "");
  const [notes, setNotes] = useState(category.notes || "");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return toast.error("Category name is required!");
    onSave({ ...category, name, description, location, notes });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className={`w-full max-w-md p-6 rounded-2xl ${darkMode ? "bg-slate-800 text-white" : "bg-white text-gray-900"}`}>
        <h2 className="text-xl font-bold mb-4">
          {editable ? (category.id ? "Edit Category" : "Add Category") : "View Category"}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <InputField label="Category Name" value={name} onChange={setName} disabled={!editable} />
          <InputField label="Description" value={description} onChange={setDescription} disabled={!editable} />
          <InputField label="Location" value={location} onChange={setLocation} disabled={!editable} />
          <InputField label="Notes" value={notes} onChange={setNotes} disabled={!editable} />

          <div className="flex justify-end gap-2 mt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl bg-gray-400 text-white">Close</button>
            {editable && (
              <button type="submit" className="px-4 py-2 rounded-xl bg-red-600 text-white">
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

  const [categories, setCategories] = useState([
    { id: 1, name: "Electronics", description: "Electronic items", location: "Warehouse A", notes: "" },
    { id: 2, name: "Furniture", description: "Office furniture", location: "Warehouse B", notes: "" },
  ]);

  const [popupCategory, setPopupCategory] = useState(null);
  const [editable, setEditable] = useState(false);

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

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this category?")) {
      setCategories(prev => prev.filter(c => c.id !== id));
      toast.success("Category deleted!");
    }
  };

  const handleSave = (category) => {
    if (category.id) {
      setCategories(prev => prev.map(c => (c.id === category.id ? category : c)));
      toast.success("Category updated successfully!");
    } else {
      const newCategory = { ...category, id: Date.now() };
      setCategories(prev => [newCategory, ...prev]);
      toast.success("Category added successfully!");
    }
    setPopupCategory(null);
  };

  return (
    <div className={`min-h-screen block lg:flex ${darkMode ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-900"}`}>
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <NavBar />
        <div className="p-6 flex-1">
          <ToastContainer position="top-right" autoClose={2500} hideProgressBar />

          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">Inventory Categories</h1>
            <button onClick={handleAdd} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl">
              <Plus size={18} /> Add Category
            </button>
          </div>

          {categories.length > 0 && (
            <div className={`rounded-2xl overflow-x-auto ${darkMode ? "bg-slate-800" : "bg-white"}`}>
              <table className="w-full table-auto min-w-[700px]">
                <thead>
                  <tr className={`text-left ${darkMode ? "bg-slate-700 text-slate-200" : "bg-gray-100 text-gray-800"}`}>
                    <th className="px-6 py-3">Category</th>
                    <th className="px-6 py-3">Description</th>
                    <th className="px-6 py-3">Location</th>
                    <th className="px-6 py-3">Notes</th>
                    <th className="px-6 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map(cat => (
                    <tr key={cat.id} className={`${darkMode ? "border-slate-700" : "border-gray-200"} border-t`}>
                      <td className="px-6 py-4 flex items-center gap-2 font-bold">
                        <FaFolder className="text-blue-500" /> {cat.name}
                      </td>
                      <td className="px-6 py-4">{cat.description || "-"}</td>
                      <td className="px-6 py-4">{cat.location || "-"}</td>
                      <td className="px-6 py-4">{cat.notes || "-"}</td>
                      <td className="px-6 py-4 flex gap-2">
                        <button onClick={() => handleView(cat)} className="px-3 py-1 bg-green-600 text-white rounded-lg flex items-center gap-1">
                          <Eye size={16} /> View
                        </button>
                        <button onClick={() => handleEdit(cat)} className="px-3 py-1 bg-blue-600 text-white rounded-lg flex items-center gap-1">
                          <Edit3 size={16} /> Edit
                        </button>
                        <button onClick={() => handleDelete(cat.id)} className="px-3 py-1 bg-red-600 text-white rounded-lg flex items-center gap-1">
                          <Trash2 size={16} /> Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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

const InputField = ({ label, placeholder, value, onChange, disabled = false }) => (
  <div className="flex flex-col">
    <label className="mb-1 font-semibold">{label}</label>
    <input
      type="text"
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className={`w-full p-3 rounded-xl shadow bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-400 transition ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
    />
  </div>
);
