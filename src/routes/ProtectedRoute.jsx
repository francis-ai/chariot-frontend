import React, { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../context/authContext.jsx";

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useContext(AuthContext);

  // While checking if user is logged in, show a loading screen
  if (loading) return <div className="text-center mt-10">Loading...</div>;

  // If no user, redirect to login
  if (!user) return <Navigate to="/login" replace />;

  // Otherwise, show the page
  return children;
};

export default ProtectedRoute;