import React, { useState, useRef, useEffect } from "react";

export default function ChatBot() {
  const [messages, setMessages] = useState([
    { sender: "superadmin", text: "Welcome! How can I help you today?" },
  ]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;

    setMessages((prev) => [...prev, { sender: "admin", text: input }]);

    // Simulate Super Admin reply
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { sender: "superadmin", text: "Got it! Thanks for the update." },
      ]);
    }, 1000);

    setInput("");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-white to-gray-200 flex justify-center items-center p-4">
      <div className="flex flex-col w-full max-w-2xl h-[80vh] bg-white/40 backdrop-blur-lg rounded-2xl shadow-[0_12px_35px_rgba(0,0,0,0.06)] overflow-hidden">
        
        {/* Chat Header */}
        <div className="flex items-center gap-3 p-4 border-b border-white/50 bg-white/20 backdrop-blur-md">
          <img
            src="unnamed (1).jpg"
            alt="Logo"
            className="w-12 h-12 rounded-full object-contain shadow"
          />
          <h2 className="text-xl font-bold text-gray-800">Admin Chat</h2>
          <span className="ml-auto text-gray-500 text-sm">Super Admin</span>
        </div>

        {/* Chat Window */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${
                msg.sender === "admin" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-xs px-4 py-2 rounded-2xl shadow-inner ${
                  msg.sender === "admin"
                    ? "bg-red-600/80 text-white rounded-br-none"
                    : "bg-white/80 text-gray-800 rounded-bl-none"
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Box */}
        <div className="flex p-4 gap-3 border-t border-white/50 bg-white/20 backdrop-blur-md">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            className="
              flex-1
              p-3
              rounded-2xl
              bg-white/70
              placeholder:text-gray-400
              focus:outline-none
              focus:ring-2 focus:ring-red-400/40
              shadow-inner
            "
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
          />
          <button
            onClick={handleSend}
            className="bg-red-600/90 hover:bg-red-700 text-white px-6 py-3 rounded-xl font-semibold shadow-[0_6px_20px_rgba(220,38,38,0.25)] transition"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
