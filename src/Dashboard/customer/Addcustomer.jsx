import React, { useState } from "react";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";

const AddCustomer = ({ onSave, onClose }) => {
  const { darkMode, toggleTheme } = useTheme();

  const [formData, setFormData] = useState({
    name: "",
    company: "",
    phone: "",
    email: "",
    status: "Active", // default status
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: "" });
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = "Customer name is required";
    if (!formData.company.trim()) newErrors.company = "Company name is required";
    if (formData.phone && !/^\+?\d{8,15}$/.test(formData.phone)) newErrors.phone = "Enter a valid phone number";
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = "Enter a valid email";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    // Pass form data back to parent for API handling
    onSave(formData);

    // Optionally reset the form
    setFormData({
      name: "",
      company: "",
      phone: "",
      email: "",
      status: "Active",
    });
  };

  const inputBg = darkMode ? "bg-gray-800 text-gray-100 placeholder-gray-400" : "bg-white text-gray-900 placeholder-gray-500";

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className={`rounded-2xl p-6 w-full max-w-md relative shadow-lg ${darkMode ? "bg-gray-800 text-gray-100" : "bg-white"}`}>
        {/* Close button */}
        <button onClick={onClose} className="absolute top-3 right-3 text-gray-400 hover:text-gray-200">
          <X size={18} />
        </button>

        <h2 className="text-lg font-bold mb-4">Add New Customer</h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          {["name","email","phone","company"].map((field) => (
            <div key={field} className="flex flex-col">
              <input
                name={field}
                placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
                value={formData[field]}
                onChange={handleChange}
                className={`px-3 py-2 rounded-lg shadow focus:outline-none focus:ring-1 focus:ring-blue-600 ${inputBg} ${errors[field] ? "border-2 border-red-600" : ""}`}
              />
              {errors[field] && <span className="text-red-600 text-xs mt-1">{errors[field]}</span>}
            </div>
          ))}

          {/* Status */}
          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
            className={`px-3 py-2 rounded-lg shadow focus:outline-none focus:ring-1 focus:ring-blue-600 ${inputBg}`}
          >
            <option>Active</option>
            <option>Inactive</option>
          </select>

          <button type="submit" className="mt-2 w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-bold">
            Save Customer
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddCustomer;