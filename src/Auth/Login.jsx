import React, { useState, useContext } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useLocation, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/authContext.jsx";
import { FaEye, FaEyeSlash } from "react-icons/fa";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useContext(AuthContext); // Use context login
  const isAdminLogin = location.pathname.toLowerCase().startsWith("/admin");

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [error, setError] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    let newError = {};

    if (!formData.email) newError.email = "Please enter your email address";
    if (!formData.password) newError.password = "Please enter your password";

    setError(newError);
    if (Object.keys(newError).length > 0) return;

    setLoading(true);
    try {
      const res = await login(formData.email, formData.password); // <-- context login

      if (isAdminLogin && res.user?.role !== "super-admin") {
        toast.error("Only super admin can use admin login");
        return;
      }

      toast.success(res.message || `Welcome back, ${res.user.username}!`);

      setFormData({
        email: "",
        password: "",
      });

      if (res.user?.role === "super-admin") {
        navigate("/admin/HomeDashboard");
      } else {
        navigate("/staff/dashboard");
      }
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Login failed!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <ToastContainer />
      <div className="min-h-screen flex flex-col justify-center items-center px-4 bg-gradient-to-br from-gray-100 via-white to-gray-200">
        <div className="flex items-center gap-4 mb-8">
          <img
            src="/logo.jpg"
            alt="Inventory"
            className="w-20 h-20 object-contain rounded-lg shadow-lg"
          />
          <h1 className="text-1xl lg:text-4xl font-extrabold text-gray-800">
            Inventory Management System
          </h1>
        </div>

        <form
          onSubmit={handleSubmit}
          className="relative w-full max-w-md bg-white/35 backdrop-blur-lg rounded-2xl p-6 space-y-5 shadow-lg"
        >
          {/* Overlay */}
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/50 via-white/10 to-transparent pointer-events-none" />

          {/* Email */}
          <div className="relative">
            <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
            <input
              type="email"
              name="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={handleChange}
              className="w-full p-3 rounded-lg bg-white/70 shadow-inner placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500/40"
            />
            {error.email && <p className="text-red-600 text-sm mt-1">{error.email}</p>}
          </div>

          {/* Password */}
          <div className="relative">
            <label className="block text-sm font-semibold text-gray-700 mb-1">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
                className="w-full p-3 pr-12 rounded-lg bg-white/70 shadow-inner placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500/40"
              />
              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-700"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
            {error.password && <p className="text-red-600 text-sm mt-1">{error.password}</p>}
          </div>

          {/* Forgot password */}
          <div className="text-right">
            <button
              type="button"
              onClick={() => navigate(isAdminLogin ? "/admin/forgot-password" : "/forgot-password")}
              className="text-sm text-green-700 hover:underline"
            >
              Forgot password?
            </button>
          </div>

          {/* Login Button */}
          <button
            type="submit"
            disabled={loading}
            className="relative w-full bg-green-700 text-white py-3 rounded-xl font-semibold tracking-wide hover:bg-green-800 transition shadow-[0_6px_20px_rgba(21,128,61,0.30)]"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
      </div>
    </>
  );
}