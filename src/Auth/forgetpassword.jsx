import React, { useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useNavigate } from "react-router-dom";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    if (!email) {
      setError("Please enter your email address");
      return;
    }

    setLoading(true);

    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      toast.success(
        `Password reset link sent to ${email}! Check your inbox.`
      );
      setEmail("");
    }, 1500);
  };

  return (
    <>
      <ToastContainer position="top-right" autoClose={2500} hideProgressBar />
      <div className="min-h-screen flex justify-center items-center px-4 bg-gradient-to-br from-gray-100 via-white to-gray-200">
        <form
          onSubmit={handleSubmit}
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
          {/* Glass overlay */}
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/50 via-white/10 to-transparent pointer-events-none" />

          <h2 className="relative text-2xl font-semibold tracking-wide text-center text-gray-700">
            Forgot Password
          </h2>
          <p className="text-center text-sm text-gray-600">
            Enter your email address to reset your password
          </p>

          {/* Email */}
          <div className="relative">
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="
                w-full p-3 rounded-lg
                bg-white/70
                border border-white/60
                shadow-inner
                placeholder:text-gray-400
                focus:outline-none
                focus:ring-2 focus:ring-red-400/40
                transition
              "
            />
            {error && <p className="text-red-600 text-sm mt-1">{error}</p>}
          </div>

          {/* Logo */}
          

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
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
          >
            {loading ? "Sending..." : "Send Reset Link"}
          </button>

          {/* Back to login */}
          <p className="text-center text-sm mt-3 text-gray-700">
            Remembered your password?{" "}
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
