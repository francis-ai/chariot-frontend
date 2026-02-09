import React, { useState } from 'react';
import { Plus } from 'lucide-react';

const AddUserForm = ({ onClose }) => {
  const [formData, setFormData] = useState({
    fullName: '',
    username: '',
    email: '',
    role: 'admin',
    status: 'Active',
  });

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('New User:', formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6 space-y-4">
        <h2 className="text-lg font-bold text-slate-800 flex items-center">
          <Plus size={18} className="mr-2"/> Add New User
        </h2>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="flex flex-col">
            <label className="text-xs font-semibold text-gray-500 mb-1">Full Name</label>
            <input 
              type="text" 
              name="fullName" 
              value={formData.fullName} 
              onChange={handleChange} 
              placeholder="John Doe" 
              className="border border-gray-300 rounded px-3 py-2 text-sm focus:ring-1 focus:ring-blue-500 outline-none"
              required
            />
          </div>

          <div className="flex flex-col">
            <label className="text-xs font-semibold text-gray-500 mb-1">Username</label>
            <input 
              type="text" 
              name="username" 
              value={formData.username} 
              onChange={handleChange} 
              placeholder="john.doe" 
              className="border border-gray-300 rounded px-3 py-2 text-sm focus:ring-1 focus:ring-blue-500 outline-none"
              required
            />
          </div>

          <div className="flex flex-col">
            <label className="text-xs font-semibold text-gray-500 mb-1">Email</label>
            <input 
              type="email" 
              name="email" 
              value={formData.email} 
              onChange={handleChange} 
              placeholder="john@company.com" 
              className="border border-gray-300 rounded px-3 py-2 text-sm focus:ring-1 focus:ring-blue-500 outline-none"
              required
            />
          </div>

          <div className="flex justify-between space-x-3">
            <div className="flex flex-col w-1/2">
              <label className="text-xs font-semibold text-gray-500 mb-1">Role</label>
              <select 
                name="role" 
                value={formData.role} 
                onChange={handleChange} 
                className="border border-gray-300 rounded px-3 py-2 text-sm focus:ring-1 focus:ring-blue-500 outline-none"
              >
                <option value="admin">Admin</option>
                <option value="manager">Manager</option>
                <option value="sales">Sales</option>
                <option value="warehouse">Warehouse</option>
              </select>
            </div>

            <div className="flex flex-col w-1/2">
              <label className="text-xs font-semibold text-gray-500 mb-1">Status</label>
              <select 
                name="status" 
                value={formData.status} 
                onChange={handleChange} 
                className="border border-gray-300 rounded px-3 py-2 text-sm focus:ring-1 focus:ring-blue-500 outline-none"
              >
                <option>Active</option>
                <option>Inactive</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <button 
              type="button" 
              onClick={onClose} 
              className="px-4 py-2 text-sm rounded border border-gray-300 hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition flex items-center"
            >
              <Plus size={14} className="mr-1"/> Add User
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddUserForm;
