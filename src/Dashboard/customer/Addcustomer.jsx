import React, { useState } from "react";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";

const AddCustomer = () => {
  const { darkMode, toggleTheme } = useTheme();

  const [formData, setFormData] = useState({
    name: "",
    contact: "",
    phone: "",
    email: "",
    address: "",
  });

  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: "" });
    setSuccess(false);
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.name.trim())
      newErrors.name = "Customer name is required";

    if (!formData.contact.trim())
      newErrors.contact = "Contact person is required";

    if (!/^\+?\d{8,15}$/.test(formData.phone))
      newErrors.phone = "Enter a valid phone number";

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
      newErrors.email = "Enter a valid email address";

    return newErrors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const validationErrors = validate();

    if (Object.keys(validationErrors).length) {
      setErrors(validationErrors);
      return;
    }

    console.log("Customer submitted:", formData);
    setSuccess(true);

    setFormData({
      name: "",
      contact: "",
      phone: "",
      email: "",
      address: "",
    });
  };

  return (
    <div
      className={`max-w-3xl mx-auto p-6 rounded-2xl shadow-xl transition
        ${darkMode ? "bg-slate-800 text-white" : "bg-white text-slate-900"}
      `}
    >
      {/* Header + Theme Switch */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-black">Add New Customer</h2>

        <button
          onClick={toggleTheme}
          className={`w-10 h-10 flex items-center justify-center rounded-xl shadow-md transition
            ${darkMode ? "bg-slate-700 hover:bg-slate-600" : "bg-slate-100 hover:bg-slate-200"}
          `}
        >
          {darkMode ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>

      {success && (
        <div className="mb-4 text-sm bg-green-100 text-green-700 px-4 py-2 rounded-lg">
          Customer added successfully
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Customer Name */}
          <div>
            <label className="text-sm font-bold opacity-80">
              Customer Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={`input ${errors.name && "input-error"} ${darkMode && "input-dark"}`}
              placeholder="Company or individual"
            />
            {errors.name && <p className="error">{errors.name}</p>}
          </div>

          {/* Contact Person */}
          <div>
            <label className="text-sm font-bold opacity-80">
              Contact Person *
            </label>
            <input
              type="text"
              name="contact"
              value={formData.contact}
              onChange={handleChange}
              className={`input ${errors.contact && "input-error"} ${darkMode && "input-dark"}`}
              placeholder="Contact name"
            />
            {errors.contact && <p className="error">{errors.contact}</p>}
          </div>

          {/* Phone */}
          <div>
            <label className="text-sm font-bold opacity-80">
              Phone *
            </label>
            <input
              type="text"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className={`input ${errors.phone && "input-error"} ${darkMode && "input-dark"}`}
              placeholder="+234..."
            />
            {errors.phone && <p className="error">{errors.phone}</p>}
          </div>

          {/* Email */}
          <div>
            <label className="text-sm font-bold opacity-80">
              Email *
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={`input ${errors.email && "input-error"} ${darkMode && "input-dark"}`}
              placeholder="example@mail.com"
            />
            {errors.email && <p className="error">{errors.email}</p>}
          </div>
        </div>

        {/* Address */}
        <div>
          <label className="text-sm font-bold opacity-80">
            Address (optional)
          </label>
          <textarea
            name="address"
            rows="2"
            value={formData.address}
            onChange={handleChange}
            className={`input resize-none ${darkMode && "input-dark"}`}
            placeholder="Street, city, state"
          />
        </div>

        {/* Submit */}
        <div className="flex justify-end pt-3">
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl text-sm font-black shadow-lg active:scale-95 transition"
          >
            Save Customer
          </button>
        </div>
      </form>

      {/* Local Styles */}
      <style>{`
        .input {
          width: 100%;
          padding: 0.6rem 0.75rem;
          border-radius: 0.75rem;
          border: none;
          background: #f1f5f9;
          font-size: 0.875rem;
          outline: none;
        }
        .input:focus {
          box-shadow: 0 0 0 2px #2563eb;
        }
        .input-dark {
          background: #1e293b;
          color: white;
        }
        .input-error {
          box-shadow: 0 0 0 2px #ef4444;
        }
        .error {
          font-size: 0.75rem;
          color: #ef4444;
          margin-top: 0.25rem;
        }
      `}</style>
    </div>
  );
};

export default AddCustomer;
