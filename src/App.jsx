import React from "react";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";

// Auth
import Login from "./Auth/Login";
import Registration from "./Auth/Register";
import ForgotPassword from "./Auth/forgetpassword";
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
import NewInvoice from "./Dashboard/newinvoice";
import Categories from "./Dashboard/InventoryManagement/inventoryCategory";
import Receipt from "./Dashboard/receipt";
import Settings from "./Dashboard/settings";

// Footer
import Footer from "./Footer";

// Context
import { SearchProvider } from "./context/searchcontex";
import { ThemeProvider } from "./context/ThemeContext";

// Wrapper to conditionally show Footer
const AppWrapper = () => {
  const location = useLocation();

  // Paths where footer should NOT show
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

          {/* Dashboard */}
          <Route path="/HomeDashboard" element={<HomeDashboard />} />
          <Route path="/invoiceManagement" element={<InvoiceManagement />} />
          <Route path="/QuotationPage" element={<QuotationPage />} />
          <Route path="/Waybill" element={<Waybill />} />
          <Route path="/ordermanagement" element={<Ordermanagement />} />
          <Route path="/purchase" element={<Supplierhome />} />
          <Route path="/Inventory" element={<Inventory />} />
          <Route path="/Suppliershome" element={<Suppliershome />} />
          <Route path="/Customer" element={<Customer />} />
          <Route path="/Report" element={<Report />} />
          <Route path="/user" element={<User />} />
          <Route path="/chat" element={<ChatBot />} />
          <Route path="/Categories" element={<Categories />} />
          <Route path="/new-invoice" element={<NewInvoice />} />
          <Route path="/receipt" element={<Receipt />} />
          <Route path="/Settings" element={<Settings />} />

          {/* Catch-all */}
          <Route path="*" element={<HomeDashboard />} />
        </Routes>
      </div>

      {/* Footer only on allowed pages */}
      {showFooter && <Footer />}
    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <SearchProvider>
        <Router>
          <AppWrapper />
        </Router>
      </SearchProvider>
    </ThemeProvider>
  );
}
