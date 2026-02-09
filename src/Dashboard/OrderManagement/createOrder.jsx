import React, { useState } from "react";
import { X, Check } from "lucide-react";

const CreateWaybill = ({ isOpen, onClose, onSubmit }) => {
  const [form, setForm] = useState({
    waybill: "",
    customer: "",
    date: "",
    driver: "",
    vehicle: "",
    status: "Pending",
  });

  const statuses = ["Pending", "In Transit", "Delivered"];

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(form); // Pass data to parent
    setForm({
      waybill: "",
      customer: "",
      date: "",
      driver: "",
      vehicle: "",
      status: "Pending",
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 relative">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-slate-800">Create Waybill</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-800">
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[12px] font-semibold text-slate-600 mb-1">
              Waybill #
            </label>
            <input
              type="text"
              name="waybill"
              value={form.waybill}
              onChange={handleChange}
              required
              placeholder="Enter Waybill #"
              className="w-full  shadow border-gray-300 rounded px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-[12px] font-semibold text-slate-600 mb-1">
              Customer
            </label>
            <input
              type="text"
              name="customer"
              value={form.customer}
              onChange={handleChange}
              required
              placeholder="Enter Customer Name"
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[12px] font-semibold text-slate-600 mb-1">
                Date
              </label>
              <input
                type="date"
                name="date"
                value={form.date}
                onChange={handleChange}
                required
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-[12px] font-semibold text-slate-600 mb-1">
                Driver
              </label>
              <input
                type="text"
                name="driver"
                value={form.driver}
                onChange={handleChange}
                required
                placeholder="Driver Name"
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-[12px] font-semibold text-slate-600 mb-1">
              Vehicle
            </label>
            <input
              type="text"
              name="vehicle"
              value={form.vehicle}
              onChange={handleChange}
              required
              placeholder="Vehicle Info"
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-[12px] font-semibold text-slate-600 mb-1">
              Status
            </label>
            <select
              name="status"
              value={form.status}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-blue-500"
            >
              {statuses.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium rounded bg-gray-100 hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium rounded bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-2"
            >
              <Check size={16} /> Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateWaybill;
