import React, { useState, useEffect } from "react";
import { FaCommentDots, FaTimes } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

export default function Footer() {
  const [showGreeting, setShowGreeting] = useState(false);
  const navigate = useNavigate();

  // Auto-show greeting after 3 seconds
  useEffect(() => {
    const timer = setTimeout(() => setShowGreeting(true), 3000);
    return () => clearTimeout(timer);
  }, []);

  const closeGreeting = () => {
    setShowGreeting(false);
  };

  const goToChat = () => {
    navigate("/chat");
  };

  return (
    <>
      {/* Floating Chat Button */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end space-y-2">
        {/* Greeting Card */}
        {showGreeting && (
          <div className="mb-2 max-w-xs bg-white/90 backdrop-blur-lg rounded-xl shadow-lg p-3 text-gray-800 border border-white/30 animate-slide-up relative">
            {/* Cancel Icon */}
            <button
              onClick={closeGreeting}
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
              title="Close"
            >
              <FaTimes />
            </button>

            {/* Greeting Text */}
            <p className="text-sm font-medium">Hi there! 👋</p>
            <p className="text-sm mt-1">Hello, I can help you.</p>
          </div>
        )}

        {/* Chat Button */}
        <button
          onClick={goToChat}
          className="
            w-14 h-14 rounded-full
            bg-red-600 hover:bg-red-700
            text-white text-2xl
            shadow-lg
            flex items-center justify-center
            transition transform hover:scale-110
          "
          title="Chat with us"
        >
          <FaCommentDots />
        </button>
      </div>

      {/* Slide-up animation */}
      <style>
        {`
          @keyframes slide-up {
            0% { transform: translateY(20px); opacity: 0; }
            100% { transform: translateY(0); opacity: 1; }
          }
          .animate-slide-up {
            animation: slide-up 0.3s ease-out;
          }
        `}
      </style>
    </>
  );
}
