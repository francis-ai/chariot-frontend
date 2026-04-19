import React, { useEffect, useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import API from '../../utils/api';

const AddPurchaseOrder = ({ onCreated }) => {
  const [suppliers, setSuppliers] = useState([]);
  const [loadingSuppliers, setLoadingSuppliers] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [lineItems, setLineItems] = useState([{ description: '', quantity: 1, rate: 0 }]);

  const today = useMemo(() => new Date().toISOString().split('T')[0], []);

  const [formData, setFormData] = useState({
    supplier_id: '',
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
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const updateLineItem = (index, field, value) => {
    setLineItems((prev) => prev.map((item, itemIndex) => {
      if (itemIndex !== index) return item;
      if (field === 'quantity') {
        return { ...item, quantity: Math.max(1, Number(value || 1)) };
      }
      if (field === 'rate') {
        return { ...item, rate: Math.max(0, Number(value || 0)) };
      }
      return { ...item, [field]: value };
    }));
  };

  const addLineItem = () => {
    setLineItems((prev) => [...prev, { description: '', quantity: 1, rate: 0 }]);
  };

  const removeLineItem = (index) => {
    setLineItems((prev) => (prev.length > 1 ? prev.filter((_, itemIndex) => itemIndex !== index) : prev));
  };

  const subtotal = lineItems.reduce(
    (sum, item) => sum + Number(item.quantity || 0) * Number(item.rate || 0),
    0
  );
  const totalQuantity = lineItems.reduce((sum, item) => sum + Number(item.quantity || 0), 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.supplier_id) {
      setError('Please select a supplier');
      return;
    }

    if (!formData.address.trim()) {
      setError('Please enter delivery address');
      return;
    }

    const normalizedItems = lineItems
      .map((item) => ({
        description: String(item.description || '').trim(),
        quantity: Math.max(1, Number(item.quantity || 1)),
        rate: Math.max(0, Number(item.rate || 0)),
      }))
      .filter((item) => item.description);

    if (!normalizedItems.length) {
      setError('Please add at least one item description');
      return;
    }

    if (subtotal <= 0) {
      setError('Please enter valid item rates');
      return;
    }

    const combinedItemDescription = normalizedItems
      .map((item) => `${item.description} (x${item.quantity})`)
      .join(', ');

    const payload = {
      supplier_id: Number(formData.supplier_id),
      item: combinedItemDescription,
      items: normalizedItems,
      quantity: Math.max(1, totalQuantity),
      total_amount: Number(subtotal.toFixed(2)),
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
        order_date: today,
        delivery_date: '',
        address: '',
        status: 'Pending',
      });
      setLineItems([{ description: '', quantity: 1, rate: 0 }]);
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

        <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold text-slate-700">Items *</h3>
            <button
              type="button"
              onClick={addLineItem}
              className="text-xs inline-flex items-center gap-1 px-2 py-1 rounded bg-blue-600 text-white hover:bg-blue-700"
            >
              <Plus size={12} /> Add Item
            </button>
          </div>

          {lineItems.map((item, index) => (
            <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
              <div className="md:col-span-6 flex flex-col">
                <label className="text-sm font-semibold text-slate-700">Description</label>
                <input
                  type="text"
                  value={item.description}
                  onChange={(e) => updateLineItem(index, 'description', e.target.value)}
                  placeholder="Type item to purchase"
                  className="px-3 py-2 rounded bg-white text-slate-900 outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="md:col-span-2 flex flex-col">
                <label className="text-sm font-semibold text-slate-700">Qty</label>
                <input
                  type="number"
                  min="1"
                  value={item.quantity}
                  onChange={(e) => updateLineItem(index, 'quantity', e.target.value)}
                  className="px-3 py-2 rounded bg-white text-slate-900 outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="md:col-span-3 flex flex-col">
                <label className="text-sm font-semibold text-slate-700">Rate (N)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={item.rate}
                  onChange={(e) => updateLineItem(index, 'rate', e.target.value)}
                  className="px-3 py-2 rounded bg-white text-slate-900 outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="md:col-span-1 flex justify-end">
                <button
                  type="button"
                  onClick={() => removeLineItem(index)}
                  disabled={lineItems.length === 1}
                  className="px-3 py-2 rounded bg-rose-600 text-white text-sm font-semibold hover:bg-rose-700 disabled:opacity-50"
                >
                  X
                </button>
              </div>
            </div>
          ))}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
            <div className="flex flex-col">
              <label className="text-sm font-semibold text-slate-700">Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="px-3 py-2 rounded bg-white text-slate-900 outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="Pending">Pending</option>
                <option value="Approved">Approved</option>
                <option value="Received">Received</option>
                <option value="REJECTED">REJECTED</option>
              </select>
            </div>

            <div className="flex flex-col">
              <label className="text-sm font-semibold text-slate-700">Total Amount (N)</label>
              <input
                type="number"
                value={subtotal.toFixed(2)}
                readOnly
                className="px-3 py-2 rounded bg-slate-100 text-slate-900 outline-none"
              />
            </div>
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
