import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { AuthContext } from "./context/authContext.jsx";
import API from "./utils/api";

export default function ChatBot() {
  const { user } = useContext(AuthContext);
  const [searchParams, setSearchParams] = useSearchParams();
  const [chatUsers, setChatUsers] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loadingMessages, setLoadingMessages] = useState(false);
  const messagesEndRef = useRef(null);

  const selectedUser = useMemo(
    () => chatUsers.find((item) => String(item.id) === String(selectedUserId)),
    [chatUsers, selectedUserId]
  );

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const queryUser = searchParams.get("user");
    if (queryUser) {
      setSelectedUserId(queryUser);
    }
  }, [searchParams]);

  const fetchUsersAndConversations = async () => {
    try {
      const [usersRes, convRes] = await Promise.all([
        API.get("/chat/users"),
        API.get("/chat/conversations"),
      ]);

      setChatUsers(usersRes.data || []);
      setConversations(convRes.data || []);

      if (!selectedUserId && usersRes.data?.length) {
        const defaultId = String(usersRes.data[0].id);
        setSelectedUserId(defaultId);
        setSearchParams({ user: defaultId });
      }
    } catch (error) {
      setChatUsers([]);
      setConversations([]);
    }
  };

  const fetchMessages = async (targetUserId) => {
    if (!targetUserId) return;
    setLoadingMessages(true);
    try {
      const res = await API.get(`/chat/messages/${targetUserId}`);
      setMessages(res.data || []);
      await API.patch(`/chat/messages/read/${targetUserId}`);
    } catch (error) {
      setMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  };

  useEffect(() => {
    fetchUsersAndConversations();
    const timer = setInterval(fetchUsersAndConversations, 10000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    fetchMessages(selectedUserId);
    if (!selectedUserId) return;
    const timer = setInterval(() => fetchMessages(selectedUserId), 6000);
    return () => clearInterval(timer);
  }, [selectedUserId]);

  const handleSend = async () => {
    const message = input.trim();
    if (!message || !selectedUserId) return;

    setInput("");
    try {
      await API.post("/chat/messages", {
        receiver_id: Number(selectedUserId),
        message,
      });
      await fetchMessages(selectedUserId);
      await fetchUsersAndConversations();
    } catch (error) {
      setInput(message);
    }
  };

  const unreadByUser = useMemo(() => {
    const map = new Map();
    (conversations || []).forEach((item) => {
      map.set(String(item.user_id), Number(item.unread_count || 0));
    });
    return map;
  }, [conversations]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-white to-gray-200 p-4 md:p-8">
      <div className="mx-auto flex w-full max-w-6xl h-[84vh] rounded-2xl overflow-hidden shadow-xl border border-gray-200 bg-white">
        <aside className="w-80 border-r border-gray-200 bg-gray-50 overflow-y-auto">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-bold text-gray-800">Team Chat</h2>
            <p className="text-xs text-gray-500 mt-1">Signed in as {user?.username || "User"}</p>
          </div>

          <div className="p-2">
            {chatUsers.map((chatUser) => {
              const isActive = String(chatUser.id) === String(selectedUserId);
              const unread = unreadByUser.get(String(chatUser.id)) || 0;

              return (
                <button
                  key={chatUser.id}
                  onClick={() => {
                    const userId = String(chatUser.id);
                    setSelectedUserId(userId);
                    setSearchParams({ user: userId });
                  }}
                  className={`w-full text-left p-3 rounded-xl mb-2 transition ${
                    isActive ? "bg-red-600 text-white" : "bg-white hover:bg-gray-100 text-gray-800"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold">{chatUser.username}</p>
                      <p className={`text-xs ${isActive ? "text-red-100" : "text-gray-500"}`}>{chatUser.role}</p>
                    </div>
                    {unread > 0 ? (
                      <span className={`text-xs min-w-5 h-5 px-1 rounded-full flex items-center justify-center ${isActive ? "bg-white text-red-600" : "bg-blue-600 text-white"}`}>
                        {unread > 99 ? "99+" : unread}
                      </span>
                    ) : null}
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        <section className="flex-1 flex flex-col">
          <div className="px-6 py-4 border-b border-gray-200 bg-white">
            <h3 className="text-lg font-bold text-gray-800">
              {selectedUser ? selectedUser.username : "Select a user"}
            </h3>
            <p className="text-xs text-gray-500">{selectedUser?.role || ""}</p>
          </div>

          <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
            {loadingMessages ? (
              <p className="text-sm text-gray-500">Loading messages...</p>
            ) : messages.length === 0 ? (
              <p className="text-sm text-gray-500">No messages yet.</p>
            ) : (
              messages.map((msg) => {
                const mine = Number(msg.sender_id) === Number(user?.id);
                return (
                  <div key={msg.id} className={`mb-3 flex ${mine ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-md px-4 py-2 rounded-2xl ${mine ? "bg-red-600 text-white rounded-br-none" : "bg-white text-gray-800 rounded-bl-none border border-gray-200"}`}>
                      <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                      <p className={`text-[10px] mt-1 ${mine ? "text-red-100" : "text-gray-400"}`}>
                        {new Date(msg.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-4 border-t border-gray-200 bg-white flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={selectedUserId ? "Type your message..." : "Select a user to start chatting"}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              disabled={!selectedUserId}
              className="flex-1 p-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-red-300"
            />
            <button
              onClick={handleSend}
              disabled={!selectedUserId || !input.trim()}
              className="px-6 py-3 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700 disabled:opacity-50"
            >
              Send
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
