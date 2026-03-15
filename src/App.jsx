import React from "react";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import ProtectedRoute from "./routes/ProtectedRoute.jsx";

// Auth
import Login from "./Auth/Login";
import Registration from "./Auth/Register";
import ForgotPassword from "./Auth/forgetpassword";
import ResetPassword from "./Auth/ResetPassword.jsx"
import ChatBot from "./chat";

// Dashboard Pages
import HomeDashboard from "./Dashboard/homedashboard";
import InvoiceManagement from "./Dashboard/InvoiceManagement";
import QuotationPage from "./Dashboard/Quotation/QuotationPage";
import Waybill from "./Dashboard/Waybills/Waybillshome";
import Ordermanagement from "./Dashboard/OrderManagement/ordermanagement";
import Supplierhome from "./Dashboard/purchaseManagement/purchasehome";
import Inventory from "./Dashboard/InventoryManagement/Inventory";
import Suppliershome from "./Dashboard/suppliers/suppliershome";
import Customer from "./Dashboard/customer/customer";
import Report from "./Dashboard/Report/ReportsAnalytics";
import User from "./Dashboard/User/userhome";
import ActivityLogs from "./Dashboard/ActivityLogs/ActivityLogs";
import NewInvoice from "./Dashboard/newinvoice";
import Categories from "./Dashboard/InventoryManagement/inventoryCategory";
import Receipt from "./Dashboard/receipt";
import Settings from "./Dashboard/settings";

// Footer
import Footer from "./Footer";

// Context
import { SearchProvider } from "./context/searchcontex";
import { ThemeProvider } from "./context/ThemeContext";
import { AuthProvider } from "./context/authContext.jsx"; 

// Wrapper to conditionally show Footer
const AppWrapper = () => {
  const location = useLocation();

  const noFooterPaths = [
    "/login",
    "/register",
    "/forgot-password",
    "/new-invoice",
    "/receipt"
  ];

  const showFooter = !noFooterPaths.includes(location.pathname.toLowerCase());

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex-1">
        <Routes>
          {/* Auth */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Registration />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />

          {/* Dashboard / Protected Routes */}
          <Route path="/HomeDashboard" element={
            <ProtectedRoute>
              <HomeDashboard />
            </ProtectedRoute>
          }/>
          <Route path="/invoiceManagement" element={
            <ProtectedRoute>
              <InvoiceManagement />
            </ProtectedRoute>
          }/>
          <Route path="/QuotationPage" element={
            <ProtectedRoute>
              <QuotationPage />
            </ProtectedRoute>
          }/>
          <Route path="/Waybill" element={
            <ProtectedRoute>
              <Waybill />
            </ProtectedRoute>
          }/>
          <Route path="/ordermanagement" element={
            <ProtectedRoute>
              <Ordermanagement />
            </ProtectedRoute>
          }/>
          <Route path="/purchase" element={
            <ProtectedRoute>
              <Supplierhome />
            </ProtectedRoute>
          }/>
          <Route path="/Inventory" element={
            <ProtectedRoute>
              <Inventory />
            </ProtectedRoute>
          }/>
          <Route path="/Suppliershome" element={
            <ProtectedRoute>
              <Suppliershome />
            </ProtectedRoute>
          }/>
          <Route path="/Customer" element={
            <ProtectedRoute>
              <Customer />
            </ProtectedRoute>
          }/>
          <Route path="/Report" element={
            <ProtectedRoute>
              <Report />
            </ProtectedRoute>
          }/>
          <Route path="/user" element={
            <ProtectedRoute allowedRoles={["super-admin"]}>
              <User />
            </ProtectedRoute>
          }/>
          <Route path="/activity-logs" element={
            <ProtectedRoute allowedRoles={["super-admin"]}>
              <ActivityLogs />
            </ProtectedRoute>
          }/>
          <Route path="/chat" element={
            <ProtectedRoute>
              <ChatBot />
            </ProtectedRoute>
          }/>
          <Route path="/Categories" element={
            <ProtectedRoute>
              <Categories />
            </ProtectedRoute>
          }/>
          <Route path="/new-invoice" element={
            <ProtectedRoute>
              <NewInvoice />
            </ProtectedRoute>
          }/>
          <Route path="/receipt" element={
            <ProtectedRoute>
              <Receipt />
            </ProtectedRoute>
          }/>
          <Route path="/Settings" element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          }/>

          {/* Catch-all */}
          <Route path="*" element={
            <ProtectedRoute>
              <HomeDashboard />
            </ProtectedRoute>
          }/>
        </Routes>
      </div>

      {showFooter && <Footer />}
    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <SearchProvider>
        <AuthProvider> {/* Wrap with AuthProvider */}
          <Router>
            <AppWrapper />
          </Router>
        </AuthProvider>
      </SearchProvider>
    </ThemeProvider>
  );
}