import React, { useContext, useEffect, useMemo, useState } from "react";
import Sidebar from "../component/sidebar";
import NavBar from "../component/navigation";
import API from "../utils/api";
import { useTheme } from "../context/ThemeContext";
import { AuthContext } from "../context/authContext.jsx";

export default function StaffDashboard() {
  const { darkMode } = useTheme();
  const { user } = useContext(AuthContext);
  const [invoices, setInvoices] = useState([]);
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [invoiceRes, quotationRes] = await Promise.all([
          API.get("/invoices"),
          API.get("/quoation"),
        ]);
        setInvoices(invoiceRes.data || []);
        setQuotations(quotationRes.data || []);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const stats = useMemo(() => {
    const paidInvoices = invoices.filter((item) => String(item.status || "").toLowerCase() === "paid").length;
    const unpaidInvoices = invoices.filter((item) => String(item.status || "").toLowerCase() === "unpaid").length;
    const paidQuotations = quotations.filter((item) => String(item.status || "").toLowerCase() === "paid").length;
    const unpaidQuotations = quotations.filter((item) => String(item.status || "").toLowerCase() === "unpaid").length;

    return {
      totalInvoices: invoices.length,
      totalQuotations: quotations.length,
      paidInvoices,
      unpaidInvoices,
      paidQuotations,
      unpaidQuotations,
    };
  }, [invoices, quotations]);

  return (
    <div className={`min-h-screen flex ${darkMode ? "bg-gray-900 text-gray-100" : "bg-gray-100 text-gray-800"}`}>
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <NavBar />

        <main className="p-6 mt-20">
          <h1 className="text-2xl font-bold mb-2">WELCOME TO CHARIOT LINK TECH. & IND. PRODUCTS LTD</h1>
          <p className="text-sm opacity-70 mb-6">This dashboard is scoped to your account records.</p>

          {loading ? (
            <p>Loading dashboard...</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className={`rounded-xl p-5 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
                <p className="text-sm opacity-70">Invoices</p>
                <h2 className="text-3xl font-bold mt-2">{stats.totalInvoices}</h2>
                <p className="text-xs mt-2">Paid: {stats.paidInvoices} | Unpaid: {stats.unpaidInvoices}</p>
              </div>

              <div className={`rounded-xl p-5 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
                <p className="text-sm opacity-70">Quotations</p>
                <h2 className="text-3xl font-bold mt-2">{stats.totalQuotations}</h2>
                <p className="text-xs mt-2">Paid: {stats.paidQuotations} | Unpaid: {stats.unpaidQuotations}</p>
              </div>

              <div className={`rounded-xl p-5 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
                <p className="text-sm opacity-70">Outstanding</p>
                <h2 className="text-3xl font-bold mt-2">{stats.unpaidInvoices + stats.unpaidQuotations}</h2>
                <p className="text-xs mt-2">Total unpaid invoices and quotations</p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
