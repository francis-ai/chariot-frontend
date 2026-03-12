import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import API from "../utils/api";

export default function Registration() {
  const navigate = useNavigate();
  const [data, setData] = useState({
    username: "",
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState({});

  // Handle input changes
  const handleData = (e) => {
    setData({ ...data, [e.target.name]: e.target.value });
  };

  // Handle form submission
  const handleForm = async (e) => {
    e.preventDefault();

    const newError = {};

    if (!data.username) newError.username = "Please enter your username!";
    if (!data.email) newError.email = "Please enter your email!";
    if (!data.password) newError.password = "Please enter your password!";

    setError(newError);

    if (Object.keys(newError).length > 0) return;

    try {
      setLoading(true);

      const res = await API.post("/auth/register", data);

      toast.success(res.data.message || "Registration successful!");

      setData({
        username: "",
        email: "",
        password: "",
      });

      setTimeout(() => {
        navigate("/login");
      }, 1500);

    } catch (err) {
      const message =
        err.response?.data?.message || "Registration failed";

      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <ToastContainer position="top-right" autoClose={2500} hideProgressBar />
      
      <div className="min-h-screen flex flex-col justify-center items-center px-4 bg-gradient-to-br from-gray-100 via-white to-gray-200">
        
        {/* Top Inventory Heading with Image */}
        <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6 mb-8">
          <img
            src="/logo.jpg"
            alt="Inventory"
            className="w-20 h-20 md:w-28 md:h-28 object-contain rounded-lg shadow-lg"
          />
          <h1 className="text-xl md:text-4xl font-extrabold text-gray-800 text-center md:text-left">
            Inventory Management System
          </h1>
        </div>

        {/* Registration Form */}
        <form
          onSubmit={handleForm}
          className="
            relative
            w-full max-w-md
            bg-white/35
            backdrop-blur-lg
            rounded-2xl
            p-6
            space-y-5
            border border-white/40
            shadow-[0_12px_35px_rgba(0,0,0,0.06)]
          "
        >
          {/* Glass shine overlay */}
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/50 via-white/10 to-transparent pointer-events-none" />

          {/* Form Heading */}
          <h2 className="relative text-2xl font-semibold tracking-wide text-center text-gray-700">
            Register
          </h2>

          {/* Username */}
          <div className="relative">
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Username
            </label>
            <input
              type="text"
              name="username"
              value={data.username}
              onChange={handleData}
              placeholder="Enter your username"
              className="
                w-full p-3 rounded-lg
                bg-white/70
                shadow-inner
                placeholder:text-gray-400
                focus:outline-none
                focus:ring-2 focus:ring-red-400/40
                transition
              "
            />
            {error.username && (
              <p className="text-red-500 text-sm mt-1">{error.username}</p>
            )}
          </div>

          {/* Email */}
          <div className="relative">
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={data.email}
              onChange={handleData}
              placeholder="Enter your email"
              className="
                w-full p-3 rounded-lg
                bg-white/70
                shadow-inner
                placeholder:text-gray-400
                focus:outline-none
                focus:ring-2 focus:ring-red-400/40
                transition
              "
            />
            {error.email && (
              <p className="text-red-500 text-sm mt-1">{error.email}</p>
            )}
          </div>

          {/* Password */}
          <div className="relative">
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              name="password"
              value={data.password}
              onChange={handleData}
              placeholder="Enter your password"
              className="
                w-full p-3 rounded-lg
                bg-white/70
                shadow-inner
                placeholder:text-gray-400
                focus:outline-none
                focus:ring-2 focus:ring-red-400/40
                transition
              "
            />
            {error.password && (
              <p className="text-red-500 text-sm mt-1">{error.password}</p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="
              relative
              w-full bg-red-600/90
              text-white py-3
              rounded-xl
              font-semibold
              tracking-wide
              hover:bg-red-700 transition
              shadow-[0_6px_20px_rgba(220,38,38,0.25)]
            "
            disabled={loading}
          >
            {loading ? "Registering..." : "Register"}
          </button>

          {/* Login link */}
          <p className="text-center text-sm mt-3 text-gray-700">
            Already have an account?{" "}
            <button
              type="button"
              onClick={() => navigate("/login")}
              className="text-red-600 font-semibold hover:underline"
            >
              Login
            </button>
          </p>
        </form>
      </div>
    </>
  );
}
