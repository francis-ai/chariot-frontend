import React, { useState, useEffect } from "react";

const AddNewInventory = ({ categories, onSave, onClose, initialData, isEdit = false }) => {
  const [form, setForm] = useState({
    product_name: "",
    sku: `SKU-${Date.now()}`,
    item_code: "",
    category: "",
    current_stock: 0,
    min_stock: 10,
    purchase_price: 0,
    selling_price: 0,
  });

  const [errors, setErrors] = useState({});
  const [showPreview, setShowPreview] = useState(false);

  // Load initial data if in edit mode
  useEffect(() => {
    if (initialData && isEdit) {
      setForm({
        product_name: initialData.name || initialData.product_name || "",
        sku: initialData.sku || `SKU-${Date.now()}`,
        item_code: initialData.item_code || "",
        category: initialData.category || "",
        current_stock: initialData.current_stock || initialData.stock || 0,
        min_stock: initialData.min_stock || initialData.min || 10,
        purchase_price: initialData.purchase_price || 0,
        selling_price: initialData.selling_price || initialData.price || 0,
      });
    }
  }, [initialData, isEdit]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors({ ...errors, [name]: null });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!form.product_name?.trim()) {
      newErrors.product_name = "Product name is required";
    }
    if (!form.category) {
      newErrors.category = "Category is required";
    }
    if (!form.purchase_price || form.purchase_price <= 0) {
      newErrors.purchase_price = "Valid purchase price is required";
    }
    if (!form.selling_price || form.selling_price <= 0) {
      newErrors.selling_price = "Valid selling price is required";
    }
    if (form.selling_price < form.purchase_price) {
      newErrors.selling_price = "Selling price should be greater than purchase price";
    }
    if (form.current_stock < 0) {
      newErrors.current_stock = "Stock cannot be negative";
    }
    if (form.min_stock < 0) {
      newErrors.min_stock = "Minimum stock cannot be negative";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePreview = () => {
    if (validateForm()) {
      setShowPreview(true);
    }
  };

  const handleSubmit = () => {
    // Prepare data for saving
    const submitData = {
      ...form,
      // Include ID if editing
      ...(isEdit && initialData?.id && { id: initialData.id }),
    };
    onSave(submitData);
    setShowPreview(false);
  };

  const handleBack = () => {
    setShowPreview(false);
  };

  // Preview Mode
  if (showPreview) {
    return (
      <div className="flex flex-col gap-4">
        <h3 className="text-lg font-bold mb-2">Preview {isEdit ? 'Changes' : 'Item'}</h3>
        
        <div className="bg-gray-50 dark:bg-slate-700 p-4 rounded-lg space-y-2">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <span className="font-medium">Product Name:</span>
            <span>{form.product_name}</span>
            
            <span className="font-medium">Item Code:</span>
            <span>{form.item_code || 'N/A'}</span>
            
            <span className="font-medium">SKU:</span>
            <span className="text-blue-600 font-mono">{form.sku}</span>
            
            <span className="font-medium">Category:</span>
            <span>{form.category}</span>
            
            <span className="font-medium">Current Stock:</span>
            <span>{form.current_stock} units</span>
            
            <span className="font-medium">Minimum Stock:</span>
            <span>{form.min_stock} units</span>
            
            <span className="font-medium">Purchase Price:</span>
            <span>₦{Number(form.purchase_price).toLocaleString()}</span>
            
            <span className="font-medium">Selling Price:</span>
            <span>₦{Number(form.selling_price).toLocaleString()}</span>
            
            <span className="font-medium">Profit Margin:</span>
            <span className={form.selling_price > form.purchase_price ? 'text-green-600' : 'text-red-600'}>
              ₦{(form.selling_price - form.purchase_price).toLocaleString()} 
              ({((form.selling_price - form.purchase_price) / form.purchase_price * 100 || 0).toFixed(1)}%)
            </span>
            
            <span className="font-medium">Total Value:</span>
            <span className="font-bold">₦{(form.current_stock * form.selling_price).toLocaleString()}</span>
            
            <span className="font-medium">Status:</span>
            <span>
              {form.current_stock === 0 ? (
                <span className="text-red-600 font-medium">Out of Stock</span>
              ) : form.current_stock <= form.min_stock ? (
                <span className="text-amber-600 font-medium">Low Stock</span>
              ) : (
                <span className="text-emerald-600 font-medium">In Stock</span>
              )}
            </span>
          </div>
        </div>

        <div className="flex gap-2 justify-end mt-2">
          <button 
            onClick={handleBack} 
            className="px-4 py-2 border rounded hover:bg-gray-50 dark:hover:bg-slate-700"
          >
            Back to Edit
          </button>
          <button 
            onClick={handleSubmit} 
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Confirm {isEdit ? 'Update' : 'Save'}
          </button>
        </div>
      </div>
    );
  }

  // Edit/Create Mode
  return (
    <div className="flex flex-col gap-3">
      {/* Product Name */}
      <div>
        <label className="block text-sm font-medium mb-1">
          Product Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          name="product_name"
          value={form.product_name}
          onChange={handleChange}
          placeholder="Enter product name"
          className={`w-full p-2 border rounded ${
            errors.product_name ? 'border-red-500' : ''
          }`}
        />
        {errors.product_name && (
          <p className="text-red-500 text-xs mt-1">{errors.product_name}</p>
        )}
      </div>

      {/* SKU - Read Only */}
      <div>
        <label className="block text-sm font-medium mb-1">SKU (Auto-generated)</label>
        <input
          type="text"
          name="sku"
          value={form.sku}
          readOnly
          className="w-full p-2 border rounded bg-gray-50 dark:bg-slate-700"
        />
      </div>

      {/* Category */}
      <div className="grid grid-cols-1 gap-2">
        <div>
          <label className="block text-sm font-medium mb-1">Item Code</label>
          <input
            type="text"
            name="item_code"
            value={form.item_code}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            placeholder="Optional item code"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">
            Category <span className="text-red-500">*</span>
          </label>
          <select
            name="category"
            value={form.category}
            onChange={handleChange}
            className={`w-full p-2 border rounded ${
              errors.category ? 'border-red-500' : ''
            }`}
          >
            <option value="">Select Category</option>
            {categories.map((c) => (
              <option key={c.id} value={c.name}>{c.name}</option>
            ))}
          </select>
          {errors.category && (
            <p className="text-red-500 text-xs mt-1">{errors.category}</p>
          )}
        </div>
      </div>

      {/* Stock Information */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-sm font-medium mb-1">Current Stock</label>
          <input
            type="number"
            name="current_stock"
            value={form.current_stock}
            onChange={handleChange}
            min="0"
            className={`w-full p-2 border rounded ${
              errors.current_stock ? 'border-red-500' : ''
            }`}
          />
          {errors.current_stock && (
            <p className="text-red-500 text-xs mt-1">{errors.current_stock}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Minimum Stock</label>
          <input
            type="number"
            name="min_stock"
            value={form.min_stock}
            onChange={handleChange}
            min="0"
            className={`w-full p-2 border rounded ${
              errors.min_stock ? 'border-red-500' : ''
            }`}
          />
          {errors.min_stock && (
            <p className="text-red-500 text-xs mt-1">{errors.min_stock}</p>
          )}
        </div>
      </div>

      {/* Price Information */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-sm font-medium mb-1">
            Purchase Price (₦) <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            name="purchase_price"
            value={form.purchase_price}
            onChange={handleChange}
            min="0"
            step="0.01"
            className={`w-full p-2 border rounded ${
              errors.purchase_price ? 'border-red-500' : ''
            }`}
          />
          {errors.purchase_price && (
            <p className="text-red-500 text-xs mt-1">{errors.purchase_price}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Selling Price (₦) <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            name="selling_price"
            value={form.selling_price}
            onChange={handleChange}
            min="0"
            step="0.01"
            className={`w-full p-2 border rounded ${
              errors.selling_price ? 'border-red-500' : ''
            }`}
          />
          {errors.selling_price && (
            <p className="text-red-500 text-xs mt-1">{errors.selling_price}</p>
          )}
        </div>
      </div>

      {/* Summary Information */}
      {form.purchase_price > 0 && form.selling_price > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg text-sm">
          <p className="font-medium mb-1">Summary:</p>
          <div className="flex justify-between">
            <span>Profit per unit:</span>
            <span className={form.selling_price > form.purchase_price ? 'text-green-600' : 'text-red-600'}>
              ₦{(form.selling_price - form.purchase_price).toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Margin:</span>
            <span className={form.selling_price > form.purchase_price ? 'text-green-600' : 'text-red-600'}>
              {((form.selling_price - form.purchase_price) / form.purchase_price * 100 || 0).toFixed(1)}%
            </span>
          </div>
          <div className="flex justify-between">
            <span>Total value:</span>
            <span className="font-bold">₦{(form.current_stock * form.selling_price).toLocaleString()}</span>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2 justify-end mt-4">
        <button 
          onClick={onClose} 
          className="px-4 py-2 border rounded hover:bg-gray-50 dark:hover:bg-slate-700"
        >
          Cancel
        </button>
        <button 
          onClick={handlePreview} 
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Preview {isEdit ? 'Changes' : 'Item'}
        </button>
      </div>
    </div>
  );
};

export default AddNewInventory;