import React, { createContext, useState, useEffect } from "react";
import API from "../utils/api";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);       // Logged-in user
  const [loading, setLoading] = useState(true); // While checking token

  // Load user on app start
  useEffect(() => {
    const loadUser = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const res = await API.get("/auth/me"); // Call profile endpoint
        setUser(res.data); // { id, username, email }
      } catch (err) {
        console.error("Failed to load user", err);
        localStorage.removeItem("token");
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  // Login function
  const login = async (email, password) => {
    try {
        const res = await API.post("/auth/login", { email, password });

        // Save token & set user
        localStorage.setItem("token", res.data.token);
        setUser(res.data.user);

        // Return both user data and message
        return {
        user: res.data.user,
        message: res.data.message || "Login successful!"
        };
    } catch (err) {
        // Throw error so calling component can catch it
        throw err.response?.data || { message: "Login failed!" };
    }
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};