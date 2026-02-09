import { useState } from "react";
import {
  Building2,
  Globe,
  Shield,
  Database,
} from "lucide-react";
import NavBar from "../component/navigation";
import { useTheme } from "../context/ThemeContext";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function SettingsTabs() {
  const { darkMode } = useTheme();
  const [activeTab, setActiveTab] = useState("company");

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
    <div className={`min-h-screen transition-colors ${bgPage}`}>
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
          {activeTab === "company" && <CompanyInfo showToast={showToast} inputBg={inputBg} />}
          {activeTab === "regional" && <RegionalSettings showToast={showToast} inputBg={inputBg} />}
          {activeTab === "security" && <SecuritySettings showToast={showToast} inputBg={inputBg} darkMode={darkMode} />}
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
        ? "text-blue-600 bg-blue-50 shadow"
        : darkMode
        ? "text-gray-300 hover:text-gray-100"
        : "text-gray-500 hover:text-gray-700"
    }`}
  >
    {icon}
    {label}
  </button>
);

/* ---------------- COMPANY INFO ---------------- */

const CompanyInfo = ({ showToast, inputBg }) => (
  <div className="space-y-6">
    <h2 className="text-lg font-semibold">Company Information</h2>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      <Input label="Business Email" inputBg={inputBg} />
      <Input label="Phone Number" inputBg={inputBg} />
      <Input label="City" inputBg={inputBg} />
      <Input label="Country" inputBg={inputBg} />
      <div className="md:col-span-2">
        <Input label="Full Address" inputBg={inputBg} />
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

/* ---------------- REGIONAL ---------------- */

const RegionalSettings = ({ showToast, inputBg }) => (
  <div className="space-y-6">
    <h2 className="text-lg font-semibold">Regional Settings</h2>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
      <Select label="Language" options={["English", "French", "Spanish"]} inputBg={inputBg} />
      <Select label="Date Format" options={["DD/MM/YYYY", "MM/DD/YYYY"]} inputBg={inputBg} />
      <Select label="Currency" options={["NGN", "USD", "EUR"]} inputBg={inputBg} />
    </div>

    <button
      onClick={() => showToast("Regional preferences saved!")}
      className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold shadow-md transition-colors w-full md:w-auto"
    >
      Save Preferences
    </button>
  </div>
);

/* ---------------- SECURITY ---------------- */

const SecuritySettings = ({ showToast, inputBg, darkMode }) => (
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

    {/* ---------- Update Password Section ---------- */}
    <div className={`mt-6 rounded-xl p-4 shadow-sm transition-colors ${darkMode ? "bg-gray-700 text-gray-100" : "bg-white text-gray-900"}`}>
      <h3 className="text-md font-semibold mb-4">Update Password</h3>
      <div className="space-y-4">
        <Input label="Current Password" inputBg={inputBg} type="password" />
        <Input label="New Password" inputBg={inputBg} type="password" />
        <Input label="Confirm New Password" inputBg={inputBg} type="password" />
      </div>
      <button
        onClick={() => showToast("Password updated successfully!")}
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

/* ---------------- UI ELEMENTS ---------------- */

const Input = ({ label, inputBg, type = "text" }) => (
  <div>
    <label className="text-sm font-medium text-gray-400">{label}</label>
    <input
      type={type}
      className={`w-full mt-1 px-4 py-2 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 outline-none ${inputBg}`}
    />
  </div>
);

const Select = ({ label, options, inputBg }) => (
  <div>
    <label className="text-sm font-medium text-gray-400">{label}</label>
    <select
      className={`w-full mt-1 px-4 py-2 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 outline-none ${inputBg}`}
    >
      {options.map((opt) => (
        <option key={opt}>{opt}</option>
      ))}
    </select>
  </div>
);

const Toggle = ({ title, description, darkMode }) => (
  <div className={`flex items-center justify-between rounded-xl p-4 shadow-sm transition-colors ${darkMode ? "bg-gray-700 text-gray-100" : "bg-white text-gray-900"}`}>
    <div>
      <p className="font-medium">{title}</p>
      <p className="text-sm text-gray-400">{description}</p>
    </div>
    <label className="relative inline-flex cursor-pointer items-center">
      <input type="checkbox" className="sr-only peer" />
      <div className="w-11 h-6 rounded-full transition-colors peer bg-gray-300 peer-checked:bg-blue-600"></div>
      <div className="absolute left-1 top-1 w-4 h-4 rounded-full bg-white transition-transform peer-checked:translate-x-5"></div>
    </label>
  </div>
);
