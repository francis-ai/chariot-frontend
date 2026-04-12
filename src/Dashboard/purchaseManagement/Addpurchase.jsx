import React, { useEffect, useMemo, useState } from 'react';
import API from '../../utils/api';

const AddPurchaseOrder = ({ onCreated }) => {
  const [suppliers, setSuppliers] = useState([]);
  const [loadingSuppliers, setLoadingSuppliers] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const today = useMemo(() => new Date().toISOString().split('T')[0], []);

  const [formData, setFormData] = useState({
    supplier_id: '',
    item: '',
    quantity: 1,
    total_amount: '',
    order_date: today,
    delivery_date: '',
    address: '',
    status: 'Pending',
  });

  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        setLoadingSuppliers(true);
        const res = await API.get('/suppliers/catalog');
        setSuppliers(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load suppliers');
        setSuppliers([]);
      } finally {
        setLoadingSuppliers(false);
      }
    };

    fetchSuppliers();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'quantity') {
      setFormData((prev) => ({ ...prev, quantity: Math.max(1, Number(value || 1)) }));
      return;
    }
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.supplier_id) {
      setError('Please select a supplier');
      return;
    }

    if (!formData.item.trim()) {
      setError('Please enter an item name');
      return;
    }

    if (!formData.total_amount || Number(formData.total_amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    if (!formData.address.trim()) {
      setError('Please enter delivery address');
      return;
    }

    const payload = {
      supplier_id: Number(formData.supplier_id),
      item: formData.item.trim(),
      quantity: Number(formData.quantity || 1),
      total_amount: Number(formData.total_amount),
      order_date: formData.order_date,
      delivery_date: formData.delivery_date || null,
      address: formData.address.trim(),
      status: formData.status,
    };

    try {
      setSubmitting(true);
      const res = await API.post('/purchase-orders', payload);
      if (onCreated) {
        onCreated(res?.data);
      }
      setFormData({
        supplier_id: '',
        item: '',
        quantity: 1,
        total_amount: '',
        order_date: today,
        delivery_date: '',
        address: '',
        status: 'Pending',
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create purchase order');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit} className="space-y-3">
        {error ? (
          <div className="text-sm rounded-lg bg-rose-50 text-rose-600 px-3 py-2">{error}</div>
        ) : null}

        <div className="flex flex-col">
          <label className="text-sm font-semibold text-slate-700">Supplier *</label>
          <select
            name="supplier_id"
            value={formData.supplier_id}
            onChange={handleChange}
            required
            disabled={loadingSuppliers}
            className="px-3 py-2 rounded bg-slate-100 text-slate-900 outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">{loadingSuppliers ? 'Loading suppliers...' : 'Select supplier'}</option>
            {suppliers.map((supplier) => (
              <option key={supplier.id || supplier._id} value={supplier.id || supplier._id}>
                {supplier.name}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="flex flex-col">
            <label className="text-sm font-semibold text-slate-700">Item *</label>
            <input
              type="text"
              name="item"
              value={formData.item}
              onChange={handleChange}
              required
              placeholder="Type item to purchase"
              className="px-3 py-2 rounded bg-slate-100 text-slate-900 outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="flex flex-col">
            <label className="text-sm font-semibold text-slate-700">Amount (N) *</label>
            <input
              type="number"
              min="0"
              step="0.01"
              name="total_amount"
              value={formData.total_amount}
              onChange={handleChange}
              required
              placeholder="Enter amount"
              className="px-3 py-2 rounded bg-slate-100 text-slate-900 outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="flex flex-col">
            <label className="text-sm font-semibold text-slate-700">Quantity *</label>
            <input
              type="number"
              min="1"
              name="quantity"
              value={formData.quantity}
              onChange={handleChange}
              required
              className="px-3 py-2 rounded bg-slate-100 text-slate-900 outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="flex flex-col">
            <label className="text-sm font-semibold text-slate-700">Status</label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="px-3 py-2 rounded bg-slate-100 text-slate-900 outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Received">Received</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="flex flex-col">
            <label className="text-sm font-semibold text-slate-700">Order Date *</label>
            <input
              type="date"
              name="order_date"
              value={formData.order_date}
              onChange={handleChange}
              required
              className="px-3 py-2 rounded bg-slate-100 text-slate-900 outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="flex flex-col">
            <label className="text-sm font-semibold text-slate-700">Delivery Date</label>
            <input
              type="date"
              name="delivery_date"
              value={formData.delivery_date}
              onChange={handleChange}
              className="px-3 py-2 rounded bg-slate-100 text-slate-900 outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="flex flex-col">
          <label className="text-sm font-semibold text-slate-700">Delivery Address *</label>
          <textarea
            name="address"
            value={formData.address}
            onChange={handleChange}
            rows={2}
            required
            placeholder="Where should this order be delivered?"
            className="px-3 py-2 rounded bg-slate-100 text-slate-900 outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <button
          type="submit"
          disabled={submitting || loadingSuppliers}
          className="w-full bg-blue-600 text-white py-2 rounded font-bold hover:bg-blue-700 transition-colors disabled:opacity-60"
        >
          {submitting ? 'Creating...' : 'Create Purchase Order'}
        </button>
      </form>
    </div>
  );
};

export default AddPurchaseOrder;
