import React, { useState, useEffect } from "react";
import { FaCommentDots, FaTimes } from "react-icons/fa";
import API from "./utils/api";

export default function Footer() {
  const [showGreeting, setShowGreeting] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Auto-show greeting after 3 seconds
  useEffect(() => {
    const timer = setTimeout(() => setShowGreeting(true), 3000);
    return () => clearTimeout(timer);
  }, []);

  const closeGreeting = () => {
    setShowGreeting(false);
  };

  const goToChat = () => {
    window.open("/chat", "_blank", "noopener,noreferrer");
  };

  useEffect(() => {
    let isMounted = true;

    const fetchUnread = async () => {
      try {
        const res = await API.get("/chat/conversations");
        if (!isMounted) return;
        const total = (res.data || []).reduce((sum, item) => sum + Number(item.unread_count || 0), 0);
        setUnreadCount(total);
      } catch (error) {
        if (isMounted) setUnreadCount(0);
      }
    };

    fetchUnread();
    const timer = setInterval(fetchUnread, 12000);

    return () => {
      isMounted = false;
      clearInterval(timer);
    };
  }, []);

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
            bg-green-700 hover:bg-green-800
            text-white text-2xl
            shadow-lg
            flex items-center justify-center
            transition transform hover:scale-110
          "
          title="Chat with us"
        >
          <FaCommentDots />
        </button>
        {unreadCount > 0 ? (
          <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        ) : null}
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
