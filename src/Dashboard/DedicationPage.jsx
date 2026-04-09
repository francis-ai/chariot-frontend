import React, { useEffect, useMemo, useState } from "react";
import Sidebar from "../component/sidebar";
import NavBar from "../component/navigation";
import API from "../utils/api";
import { useTheme } from "../context/ThemeContext";

const STATUS_SET = new Set(["paid", "unpaid"]);

export default function DedicationPage() {
  const { darkMode } = useTheme();
  const PAGE_SIZE = 10;
  const [activeTab, setActiveTab] = useState("Invoices");
  const [invoices, setInvoices] = useState([]);
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [invoicePage, setInvoicePage] = useState(1);
  const [quotationPage, setQuotationPage] = useState(1);
  const [stats, setStats] = useState([
    { label: "Total Invoices", value: "0" },
    { label: "Total Quotations", value: "0" },
    { label: "Total Paid", value: "₦0" },
    { label: "Total Unpaid", value: "₦0" },
  ]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [invoiceRes, quotationRes] = await Promise.all([
        API.get("/invoices"),
        API.get("/quoation"),
      ]);

      setInvoices(invoiceRes.data || []);
      setQuotations(quotationRes.data || []);
      calculateStats(invoiceRes.data || [], quotationRes.data || []);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (invoiceList, quotationList) => {
    const totalInvoices = invoiceList.length;
    const totalQuotations = quotationList.length;
    
    const paidInvoices = invoiceList.filter(i => String(i.status || "").toLowerCase() === "paid");
    const unpaidInvoices = invoiceList.filter(i => String(i.status || "").toLowerCase() === "unpaid");
    
    const paidQuotations = quotationList.filter(q => String(q.status || "").toLowerCase() === "paid");
    const unpaidQuotations = quotationList.filter(q => String(q.status || "").toLowerCase() === "unpaid");
    
    const totalPaid = [
      ...paidInvoices.map(i => i.total || 0),
      ...paidQuotations.map(q => q.amount || 0)
    ].reduce((sum, val) => sum + Number(val), 0);
    
    const totalUnpaid = [
      ...unpaidInvoices.map(i => i.total || 0),
      ...unpaidQuotations.map(q => q.amount || 0)
    ].reduce((sum, val) => sum + Number(val), 0);

    setStats([
      { label: "Total Invoices", value: totalInvoices.toString() },
      { label: "Total Quotations", value: totalQuotations.toString() },
      { label: "Total Paid", value: `₦${totalPaid.toLocaleString()}` },
      { label: "Total Unpaid", value: `₦${totalUnpaid.toLocaleString()}` },
    ]);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const invoiceRows = useMemo(
    () => (invoices || []).filter((item) => STATUS_SET.has(String(item.status || "").toLowerCase())),
    [invoices]
  );

  const quotationRows = useMemo(
    () => (quotations || []).filter((item) => STATUS_SET.has(String(item.status || "").toLowerCase())),
    [quotations]
  );

  useEffect(() => {
    setInvoicePage(1);
    setQuotationPage(1);
  }, [activeTab, invoices.length, quotations.length]);

  const invoiceTotalPages = Math.max(1, Math.ceil(invoiceRows.length / PAGE_SIZE));
  const quotationTotalPages = Math.max(1, Math.ceil(quotationRows.length / PAGE_SIZE));

  const paginatedInvoiceRows = invoiceRows.slice((invoicePage - 1) * PAGE_SIZE, invoicePage * PAGE_SIZE);
  const paginatedQuotationRows = quotationRows.slice((quotationPage - 1) * PAGE_SIZE, quotationPage * PAGE_SIZE);

  const renderStatus = (status) => {
    const lower = String(status || "").toLowerCase();
    const base = "px-2 py-1 rounded text-xs font-semibold uppercase";
    if (lower === "paid") return `${base} bg-green-100 text-green-700`;
    return `${base} bg-orange-100 text-orange-700`;
  };

  return (
    <div className={`min-h-screen flex overflow-x-hidden ${darkMode ? "bg-gray-900 text-gray-100" : "bg-gray-100 text-gray-800"}`}>
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <NavBar />

        <main className="p-3 sm:p-4 md:p-6 mt-20 min-w-0">
          <h1 className="text-2xl font-bold mb-4">Dedication Page</h1>
          <p className="text-sm opacity-70 mb-6">Paid and unpaid records for invoices and quotations.</p>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-6">
            {stats.map(stat => (
              <div
                key={stat.label}
                className={`p-4 rounded-xl ${
                  darkMode ? "bg-gray-800" : "bg-white"
                }`}
              >
                <p className="text-2xl font-black">{stat.value}</p>
                <p className="text-xs uppercase opacity-60">{stat.label}</p>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-2 mb-4">
            {["Invoices", "Quotations"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  activeTab === tab ? "bg-blue-600 text-white" : darkMode ? "bg-gray-800" : "bg-white"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {loading ? (
            <p>Loading...</p>
          ) : activeTab === "Invoices" ? (
            <div className={`rounded-xl overflow-x-auto w-full ${darkMode ? "bg-gray-800" : "bg-white"}`}>
              <table className="w-full min-w-[640px]">
                <thead className={darkMode ? "bg-gray-700" : "bg-gray-50"}>
                  <tr>
                    <th className="p-3 text-left text-xs uppercase">Invoice #</th>
                    <th className="p-3 text-left text-xs uppercase">Customer</th>
                    <th className="p-3 text-left text-xs uppercase">Date</th>
                    <th className="p-3 text-left text-xs uppercase">Amount</th>
                    <th className="p-3 text-left text-xs uppercase">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedInvoiceRows.map((row) => (
                    <tr key={row.id} className="border-t border-gray-200/20">
                      <td className="p-3">{row.invoice_number}</td>
                      <td className="p-3">{row.customer}</td>
                      <td className="p-3">{row.invoice_date ? String(row.invoice_date).split("T")[0] : ""}</td>
                      <td className="p-3">₦{Number(row.total || 0).toLocaleString()}</td>
                      <td className="p-3"><span className={renderStatus(row.status)}>{row.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="flex flex-col md:flex-row justify-between items-center gap-2 p-3 text-xs transition-colors">
                <span className="italic">{`Showing ${(invoicePage - 1) * PAGE_SIZE + 1} to ${Math.min(invoicePage * PAGE_SIZE, invoiceRows.length)} of ${invoiceRows.length} entries`}</span>
                <div className="flex gap-1">
                  <button onClick={() => setInvoicePage((p) => Math.max(1, p - 1))} disabled={invoicePage === 1} className="px-3 py-1.5 border rounded disabled:opacity-50">Previous</button>
                  <button onClick={() => setInvoicePage((p) => Math.min(invoiceTotalPages, p + 1))} disabled={invoicePage === invoiceTotalPages} className="px-4 py-1.5 bg-gray-800 text-white rounded disabled:opacity-50">Next</button>
                </div>
              </div>
            </div>
          ) : (
            <div className={`rounded-xl overflow-x-auto w-full ${darkMode ? "bg-gray-800" : "bg-white"}`}>
              <table className="w-full min-w-[640px]">
                <thead className={darkMode ? "bg-gray-700" : "bg-gray-50"}>
                  <tr>
                    <th className="p-3 text-left text-xs uppercase">Quotation #</th>
                    <th className="p-3 text-left text-xs uppercase">Customer</th>
                    <th className="p-3 text-left text-xs uppercase">Date</th>
                    <th className="p-3 text-left text-xs uppercase">Amount</th>
                    <th className="p-3 text-left text-xs uppercase">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedQuotationRows.map((row) => (
                    <tr key={row.id} className="border-t border-gray-200/20">
                      <td className="p-3">{row.quotation_number}</td>
                      <td className="p-3">{row.customer}</td>
                      <td className="p-3">{row.quotation_date ? String(row.quotation_date).split("T")[0] : ""}</td>
                      <td className="p-3">₦{Number(row.amount || 0).toLocaleString()}</td>
                      <td className="p-3"><span className={renderStatus(row.status)}>{row.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="flex flex-col md:flex-row justify-between items-center gap-2 p-3 text-xs transition-colors">
                <span className="italic">{`Showing ${(quotationPage - 1) * PAGE_SIZE + 1} to ${Math.min(quotationPage * PAGE_SIZE, quotationRows.length)} of ${quotationRows.length} entries`}</span>
                <div className="flex gap-1">
                  <button onClick={() => setQuotationPage((p) => Math.max(1, p - 1))} disabled={quotationPage === 1} className="px-3 py-1.5 border rounded disabled:opacity-50">Previous</button>
                  <button onClick={() => setQuotationPage((p) => Math.min(quotationTotalPages, p + 1))} disabled={quotationPage === quotationTotalPages} className="px-4 py-1.5 bg-gray-800 text-white rounded disabled:opacity-50">Next</button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
