import React, { useState } from 'react';

const AddSupplier = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    address: '',
    city: '',
    country: '',
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Supplier Data:', formData);
    // Here you can integrate API call to backend
    alert('Supplier added successfully!');
    setFormData({
      name: '',
      email: '',
      phone: '',
      company: '',
      address: '',
      city: '',
      country: '',
    });
  };

  return (
    <div className="w-full bg-red-600">
      <h2 className="text-xl font-bold text-slate-900 mb-4">Add Supplier</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex flex-col">
          <label className="text-sm font-semibold text-slate-700">Supplier Name *</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            placeholder="Enter supplier name"
            className="px-3 py-2 rounded bg-slate-100 text-slate-900 outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="flex flex-col">
          <label className="text-sm font-semibold text-slate-700">Email</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Enter supplier email"
            className="px-3 py-2 rounded bg-slate-100 text-slate-900 outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="flex flex-col">
          <label className="text-sm font-semibold text-slate-700">Phone Number *</label>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            required
            placeholder="Enter phone number"
            className="px-3 py-2 rounded bg-slate-100 text-slate-900 outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="flex flex-col">
          <label className="text-sm font-semibold text-slate-700">Company Name</label>
          <input
            type="text"
            name="company"
            value={formData.company}
            onChange={handleChange}
            placeholder="Enter company name"
            className="px-3 py-2 rounded bg-slate-100 text-slate-900 outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="flex flex-col">
          <label className="text-sm font-semibold text-slate-700">Address</label>
          <input
            type="text"
            name="address"
            value={formData.address}
            onChange={handleChange}
            placeholder="Enter address"
            className="px-3 py-2 rounded bg-slate-100 text-slate-900 outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col">
            <label className="text-sm font-semibold text-slate-700">City</label>
            <input
              type="text"
              name="city"
              value={formData.city}
              onChange={handleChange}
              placeholder="City"
              className="px-3 py-2 rounded bg-slate-100 text-slate-900 outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div className="flex flex-col">
            <label className="text-sm font-semibold text-slate-700">Country</label>
            <input
              type="text"
              name="country"
              value={formData.country}
              onChange={handleChange}
              placeholder="Country"
              className="px-3 py-2 rounded bg-slate-100 text-slate-900 outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded font-bold hover:bg-blue-700 transition-colors"
        >
          Add Supplier
        </button>
      </form>
    </div>
  );
};

export default AddSupplier;
