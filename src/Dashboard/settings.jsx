import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Building2,
  Globe,
  Shield,
  Database,
  FolderKanban,
  Users,
  DollarSign,
} from "lucide-react";
import NavBar from "../component/navigation";
import Sidebar from "../component/sidebar";
import { useTheme } from "../context/ThemeContext";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import API from "../utils/api";

export default function SettingsTabs() {
  const { darkMode } = useTheme();
  const [activeTab, setActiveTab] = useState("company");
  const navigate = useNavigate();

  // Toast function
  const showToast = (message) => {
    toast.success(message, {
      position: "top-right",
      autoClose: 2000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
    });
  };

  // Conditional styles
  const bgPage = darkMode ? "bg-gray-900 text-gray-100" : "bg-gray-100 text-gray-900";
  const bgCard = darkMode ? "bg-gray-800" : "bg-white";
  const inputBg = darkMode ? "bg-gray-700 text-gray-100 placeholder-gray-400" : "bg-white text-gray-900 placeholder-gray-500";

  return (
    <div className={`flex min-h-screen transition-colors ${bgPage}`}>
      <Sidebar />
      <div className="flex-1">
        <NavBar />
        <ToastContainer />

        <div className="max-w-6xl mx-auto p-6">
          {/* Tabs Header */}
          <div className={`rounded-2xl shadow-md flex flex-wrap md:flex-nowrap items-center justify-between px-4 md:px-6 py-4 gap-2 transition-colors ${darkMode ? "bg-gray-800" : "bg-white"}`}>
            <div className="flex flex-wrap gap-2 md:gap-3">
              <TabButton
                icon={<Building2 size={18} />}
                label="Company Info"
                active={activeTab === "company"}
                onClick={() => setActiveTab("company")}
                darkMode={darkMode}
              />
              <TabButton
                icon={<Globe size={18} />}
                label="Regional"
                active={activeTab === "regional"}
                onClick={() => setActiveTab("regional")}
                darkMode={darkMode}
              />
              <TabButton
                icon={<Shield size={18} />}
                label="Security"
                active={activeTab === "security"}
                onClick={() => setActiveTab("security")}
                darkMode={darkMode}
              />
              <TabButton
                icon={<FolderKanban size={18} />}
                label="Categories"
                active={activeTab === "categories"}
                onClick={() => setActiveTab("categories")}
                darkMode={darkMode}
              />
              <TabButton
                icon={<Users size={18} />}
                label="Access"
                active={activeTab === "access"}
                onClick={() => setActiveTab("access")}
                darkMode={darkMode}
              />
              <TabButton
                icon={<DollarSign size={18} />}
                label="Currencies"
                active={activeTab === "currencies"}
                onClick={() => setActiveTab("currencies")}
                darkMode={darkMode}
              />
            </div>

            {/* Backup Button */}
            <button
              onClick={() => showToast("Backup completed successfully!")}
              className="ml-auto bg-blue-600 hover:bg-blue-700 text-white px-4 md:px-6 py-2 md:py-3 rounded-xl flex items-center gap-2 font-semibold shadow-md transition-colors"
            >
              <Database size={18} />
              Backup
            </button>
          </div>

          {/* Content */}
          <div className={`mt-6 rounded-2xl shadow-md p-6 md:p-8 transition-colors ${bgCard}`}>
            {activeTab === "company" && <CompanyInfo showToast={showToast} inputBg={inputBg} darkMode={darkMode} />}
            {activeTab === "regional" && <RegionalSettings showToast={showToast} inputBg={inputBg} darkMode={darkMode} />}
            {activeTab === "security" && <SecuritySettings showToast={showToast} inputBg={inputBg} darkMode={darkMode} />}
            {activeTab === "categories" && <CategoryAccess navigate={navigate} darkMode={darkMode} />}
            {activeTab === "access" && <AccessControl showToast={showToast} darkMode={darkMode} />}
            {activeTab === "currencies" && <Currencies showToast={showToast} darkMode={darkMode} />}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------- COMPONENTS ---------------- */

const TabButton = ({ icon, label, active, onClick, darkMode }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 md:gap-3 px-3 md:px-4 py-2 rounded-xl font-medium transition text-sm md:text-base ${
      active
        ? "bg-blue-50 text-blue-600 shadow"
        : darkMode
        ? "text-gray-300 hover:text-gray-100 hover:bg-gray-700"
        : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
    }`}
  >
    {icon}
    {label}
  </button>
);

/* ---------------- COMPANY INFO ---------------- */

const CompanyInfo = ({ showToast, inputBg, darkMode }) => {
  const [formData, setFormData] = useState({
    businessEmail: "",
    phoneNumber: "",
    city: "",
    country: "",
    fullAddress: ""
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">Company Information</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Input 
          label="Business Email" 
          name="businessEmail"
          value={formData.businessEmail}
          onChange={handleInputChange}
          inputBg={inputBg} 
        />
        <Input 
          label="Phone Number" 
          name="phoneNumber"
          value={formData.phoneNumber}
          onChange={handleInputChange}
          inputBg={inputBg} 
        />
        <Input 
          label="City" 
          name="city"
          value={formData.city}
          onChange={handleInputChange}
          inputBg={inputBg} 
        />
        <Input 
          label="Country" 
          name="country"
          value={formData.country}
          onChange={handleInputChange}
          inputBg={inputBg} 
        />
        <div className="md:col-span-2">
          <Input 
            label="Full Address" 
            name="fullAddress"
            value={formData.fullAddress}
            onChange={handleInputChange}
            inputBg={inputBg} 
          />
        </div>
      </div>

      <button
        onClick={() => showToast("Company information saved!")}
        className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold shadow-md transition-colors w-full md:w-auto"
      >
        Save Changes
      </button>
    </div>
  );
};

/* ---------------- REGIONAL ---------------- */

const RegionalSettings = ({ showToast, inputBg, darkMode }) => {
  const [formData, setFormData] = useState({
    language: "English",
    dateFormat: "DD/MM/YYYY",
    currency: "NGN"
  });

  const handleSelectChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">Regional Settings</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <Select 
          label="Language" 
          name="language"
          value={formData.language}
          onChange={handleSelectChange}
          options={["English", "French", "Spanish"]} 
          inputBg={inputBg} 
        />
        <Select 
          label="Date Format" 
          name="dateFormat"
          value={formData.dateFormat}
          onChange={handleSelectChange}
          options={["DD/MM/YYYY", "MM/DD/YYYY", "YYYY-MM-DD"]} 
          inputBg={inputBg} 
        />
        <Select 
          label="Currency" 
          name="currency"
          value={formData.currency}
          onChange={handleSelectChange}
          options={["NGN", "USD", "EUR", "GBP"]} 
          inputBg={inputBg} 
        />
      </div>

      <button
        onClick={() => showToast("Regional preferences saved!")}
        className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold shadow-md transition-colors w-full md:w-auto"
      >
        Save Preferences
      </button>
    </div>
  );
};

/* ---------------- SECURITY ---------------- */

const SecuritySettings = ({ showToast, inputBg, darkMode }) => {
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
  };

  const handleUpdatePassword = () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("New passwords don't match!");
      return;
    }
    showToast("Password updated successfully!");
    setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
  };

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">Security</h2>

      <Toggle
        title="Two-Factor Authentication"
        description="Add extra protection to your account"
        darkMode={darkMode}
      />
      <Toggle
        title="Secure Checkout Protection"
        description="Protect payments against fraud"
        darkMode={darkMode}
      />
      <Toggle
        title="Suspicious Login Detection"
        description="Get alerts for unusual login activity"
        darkMode={darkMode}
      />

      {/* Update Password Section */}
      <div className={`mt-6 rounded-xl p-4 shadow-sm transition-colors ${darkMode ? "bg-gray-700 text-gray-100" : "bg-white text-gray-900"}`}>
        <h3 className="text-md font-semibold mb-4">Update Password</h3>
        <div className="space-y-4">
          <Input 
            label="Current Password" 
            name="currentPassword"
            type="password"
            value={passwordData.currentPassword}
            onChange={handlePasswordChange}
            inputBg={inputBg} 
          />
          <Input 
            label="New Password" 
            name="newPassword"
            type="password"
            value={passwordData.newPassword}
            onChange={handlePasswordChange}
            inputBg={inputBg} 
          />
          <Input 
            label="Confirm New Password" 
            name="confirmPassword"
            type="password"
            value={passwordData.confirmPassword}
            onChange={handlePasswordChange}
            inputBg={inputBg} 
          />
        </div>
        <button
          onClick={handleUpdatePassword}
          className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold shadow-md transition-colors w-full md:w-auto"
        >
          Update Password
        </button>
      </div>

      <button
        onClick={() => showToast("Security settings updated!")}
        className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold shadow-md transition-colors w-full md:w-auto"
      >
        Update Security
      </button>
    </div>
  );
};

/* ---------------- UI ELEMENTS ---------------- */

const Input = ({ label, name, value, onChange, inputBg, type = "text", required = false }) => (
  <div>
    <label className="text-sm font-medium text-gray-400">{label}</label>
    <input
      type={type}
      name={name}
      value={value || ""}
      onChange={onChange}
      required={required}
      className={`w-full mt-1 px-4 py-2 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 outline-none ${inputBg}`}
    />
  </div>
);

const Select = ({ label, name, value, onChange, options, inputBg }) => (
  <div>
    <label className="text-sm font-medium text-gray-400">{label}</label>
    <select
      name={name}
      value={value}
      onChange={onChange}
      className={`w-full mt-1 px-4 py-2 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 outline-none ${inputBg}`}
    >
      {options.map((opt) => (
        <option key={opt} value={opt}>{opt}</option>
      ))}
    </select>
  </div>
);

const Toggle = ({ title, description, darkMode }) => {
  const [isEnabled, setIsEnabled] = useState(false);
  
  return (
    <div className={`flex items-center justify-between rounded-xl p-4 shadow-sm transition-colors ${darkMode ? "bg-gray-700 text-gray-100" : "bg-white text-gray-900"}`}>
      <div>
        <p className="font-medium">{title}</p>
        <p className="text-sm text-gray-400">{description}</p>
      </div>
      <label className="relative inline-flex cursor-pointer items-center">
        <input 
          type="checkbox" 
          className="sr-only peer" 
          checked={isEnabled}
          onChange={() => setIsEnabled(!isEnabled)}
        />
        <div className="w-11 h-6 rounded-full transition-colors peer bg-gray-300 peer-checked:bg-blue-600"></div>
        <div className="absolute left-1 top-1 w-4 h-4 rounded-full bg-white transition-transform peer-checked:translate-x-5"></div>
      </label>
    </div>
  );
};

const CategoryAccess = ({ navigate, darkMode }) => (
  <div className="space-y-6">
    <h2 className="text-lg font-semibold">Inventory Categories</h2>
    <p className={darkMode ? "text-gray-300" : "text-gray-600"}>
      Manage product categories in a dedicated screen.
    </p>
    <div className={`rounded-xl p-5 border ${darkMode ? "border-gray-700 bg-gray-900" : "border-gray-200 bg-gray-50"}`}>
      <p className="font-medium mb-2">Category management</p>
      <p className="text-sm text-gray-500 mb-4">
        Use the existing category manager to add, edit, and remove inventory categories.
      </p>
      <button
        onClick={() => navigate("/Categories")}
        className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg font-semibold transition-colors"
      >
        Open Category Manager
      </button>
    </div>
  </div>
);

const AccessControl = ({ showToast, darkMode }) => {
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">Access Control</h2>
      <p className={darkMode ? "text-gray-300" : "text-gray-600"}>
        Role-based access is already active. Super-admin controls user and log access; admin users handle day-to-day operations.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <RoleCard
          title="Super Admin"
          items={["User management", "Activity logs", "Full system access"]}
          darkMode={darkMode}
        />
        <RoleCard
          title="Admin"
          items={["Invoices", "Quotations", "Inventory", "Customers", "Reports"]}
          darkMode={darkMode}
        />
      </div>

      <button
        onClick={() => showToast("Access control overview saved")}
        className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg font-semibold transition-colors"
      >
        Save Access Overview
      </button>
    </div>
  );
};

/* ---------------- CURRENCIES ---------------- */

const Currencies = ({ showToast, darkMode }) => {
  const [currencies, setCurrencies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ code: '', name: '', rate_to_ngn: '' });

  const normalizeArrayPayload = (payload) => {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.data)) return payload.data;
    if (Array.isArray(payload?.rows)) return payload.rows;
    return [];
  };

  const getApiErrorMessage = (error, fallback) => {
    return (
      error?.response?.data?.message ||
      error?.message ||
      fallback
    );
  };

  useEffect(() => {
    fetchCurrencies();
  }, []);

  const fetchCurrencies = async () => {
    try {
      const response = await API.get('/currencies');
      setCurrencies(normalizeArrayPayload(response.data));
    } catch (error) {
      console.error('Error fetching currencies:', error);
      toast.error(getApiErrorMessage(error, 'Failed to fetch currencies'));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      code: String(form.code || '').trim().toUpperCase(),
      name: String(form.name || '').trim(),
      rate_to_ngn: Number(form.rate_to_ngn),
    };

    if (!payload.code || !payload.name || !Number.isFinite(payload.rate_to_ngn) || payload.rate_to_ngn <= 0) {
      toast.error('Provide valid code, name, and a rate greater than 0');
      return;
    }

    try {
      if (editing) {
        await API.put(`/currencies/${editing.id}`, payload);
      } else {
        await API.post('/currencies', payload);
      }
      
      toast.success(editing ? 'Currency updated!' : 'Currency added!');
      setForm({ code: '', name: '', rate_to_ngn: '' });
      setEditing(null);
      await fetchCurrencies();
    } catch (error) {
      console.error('Error saving currency:', error);
      toast.error(getApiErrorMessage(error, 'Error saving currency'));
    }
  };

  const handleEdit = (currency) => {
    setEditing(currency);
    setForm({
      code: currency.code,
      name: currency.name,
      rate_to_ngn: currency.rate_to_ngn
    });
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this currency?')) return;
    try {
      await API.delete(`/currencies/${id}`);
      toast.success('Currency deleted!');
      await fetchCurrencies();
    } catch (error) {
      console.error('Error deleting currency:', error);
      toast.error(getApiErrorMessage(error, 'Error deleting currency'));
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: name === 'code' ? value.toUpperCase() : value }));
  };

  const inputBg = darkMode ? "bg-gray-700 text-gray-100 placeholder-gray-400" : "bg-white text-gray-900 placeholder-gray-500";

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">Currency Management</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            label="Currency Code"
            name="code"
            value={form.code}
            onChange={handleInputChange}
            inputBg={inputBg}
            required
          />
          <Input
            label="Currency Name"
            name="name"
            value={form.name}
            onChange={handleInputChange}
            inputBg={inputBg}
            required
          />
          <Input
            label="Rate to NGN"
            name="rate_to_ngn"
            type="number"
            step="0.000001"
            value={form.rate_to_ngn}
            onChange={handleInputChange}
            inputBg={inputBg}
            required
          />
        </div>
        <div className="flex gap-2">
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold"
          >
            {editing ? 'Update' : 'Add'} Currency
          </button>
          {editing && (
            <button
              type="button"
              onClick={() => {
                setEditing(null);
                setForm({ code: '', name: '', rate_to_ngn: '' });
              }}
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-semibold"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      <div className={`rounded-xl p-4 ${darkMode ? "bg-gray-800" : "bg-gray-50"}`}>
        <h3 className="font-semibold mb-4">Current Currencies</h3>
        {loading ? (
          <p>Loading...</p>
        ) : (
          <div className="space-y-2">
            {currencies.map((currency) => (
              <div key={currency.id} className={`flex justify-between items-center p-3 rounded ${darkMode ? "bg-gray-700" : "bg-white"}`}>
                <div>
                  <span className="font-medium">{currency.code}</span> - {currency.name} (1 {currency.code} = {currency.rate_to_ngn} NGN)
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(currency)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(currency.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const RoleCard = ({ title, items, darkMode }) => (
  <div className={`rounded-xl p-5 border ${darkMode ? "border-gray-700 bg-gray-900" : "border-gray-200 bg-gray-50"}`}>
    <h3 className="font-semibold mb-3">{title}</h3>
    <ul className="space-y-2 text-sm text-gray-500">
      {items.map((item) => (
        <li key={item} className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
          {item}
        </li>
      ))}
    </ul>
  </div>
);