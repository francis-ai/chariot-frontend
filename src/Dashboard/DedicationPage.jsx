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

  const fetchData = async () => {
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
    <div className={`min-h-screen flex ${darkMode ? "bg-gray-900 text-gray-100" : "bg-gray-100 text-gray-800"}`}>
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <NavBar />

        <main className="p-6 mt-20">
          <h1 className="text-2xl font-bold mb-4">Dedication Page</h1>
          <p className="text-sm opacity-70 mb-6">Paid and unpaid records for invoices and quotations.</p>

          <div className="flex gap-2 mb-4">
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
            <div className={`rounded-xl overflow-x-auto ${darkMode ? "bg-gray-800" : "bg-white"}`}>
              <table className="w-full min-w-[700px]">
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
            <div className={`rounded-xl overflow-x-auto ${darkMode ? "bg-gray-800" : "bg-white"}`}>
              <table className="w-full min-w-[700px]">
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
