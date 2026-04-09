import React, { useEffect, useMemo, useState } from "react";
import Sidebar from "../../component/sidebar";
import NavBar from "../../component/navigation";
import { useTheme } from "../../context/ThemeContext";
import API from "../../utils/api";
import { ToastContainer, toast } from "react-toastify";
import jsPDF from "jspdf";
import "jspdf-autotable";
import "react-toastify/dist/ReactToastify.css";

const NAIRA = "\u20A6";

const currency = (value) => {
  const numericValue = Number(value || 0);
  const safeValue = Number.isFinite(numericValue) ? numericValue : 0;
  const fixed = safeValue.toFixed(2);
  const [integerPart, decimalPart] = fixed.split(".");
  const groupedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${NAIRA}${decimalPart === "00" ? groupedInteger : `${groupedInteger}.${decimalPart}`}`;
};

export default function TaxVatManagement() {
  const { darkMode } = useTheme();
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({ daily: 0, weekly: 0, monthly: 0, yearly: 0, breakdown: [] });
  const [reportRows, setReportRows] = useState([]);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [downloading, setDownloading] = useState({ csv: false, pdf: false });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);
    setDateTo(today.toISOString().split("T")[0]);
    setDateFrom(thirtyDaysAgo.toISOString().split("T")[0]);
  }, []);

  const fetchTaxSummary = async () => {
    try {
      setLoading(true);
      const res = await API.get("/dashboard/tax-summary");
      setSummary({
        daily: Number(res.data?.daily || 0),
        weekly: Number(res.data?.weekly || 0),
        monthly: Number(res.data?.monthly || 0),
        yearly: Number(res.data?.yearly || 0),
        breakdown: Array.isArray(res.data?.breakdown) ? res.data.breakdown : [],
      });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch Tax/VAT summary");
      setSummary({ daily: 0, weekly: 0, monthly: 0, yearly: 0, breakdown: [] });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTaxSummary();
  }, []);

  const fetchTaxReport = async () => {
    if (!dateFrom || !dateTo) {
      toast.error("Please select a valid date range");
      return;
    }

    try {
      const params = new URLSearchParams({ type: "tax_summary", dateFrom, dateTo });
      const res = await API.get(`/reports?${params.toString()}`);
      setReportRows(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch Tax/VAT report data");
      setReportRows([]);
    }
  };

  useEffect(() => {
    if (!dateFrom || !dateTo) return;
    fetchTaxReport();
  }, [dateFrom, dateTo]);

  const downloadCsv = () => {
    if (!reportRows.length) {
      toast.warning("No Tax/VAT report data available for download");
      return;
    }

    try {
      setDownloading((prev) => ({ ...prev, csv: true }));
      const headers = ["Period", "Source", "Amount"];
      const lines = reportRows.map((row) => {
        const period = row.period ? new Date(row.period).toISOString().split("T")[0] : "-";
        const source = String(row.source || "-");
        const amount = Number(row.amount || 0);
        return `${period},${source},${amount}`;
      });
      const csvContent = [headers.join(","), ...lines].join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `tax_vat_report_${dateFrom}_to_${dateTo}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success("Tax/VAT CSV downloaded");
    } finally {
      setDownloading((prev) => ({ ...prev, csv: false }));
    }
  };

  const downloadPdf = () => {
    if (!reportRows.length) {
      toast.warning("No Tax/VAT report data available for download");
      return;
    }

    try {
      setDownloading((prev) => ({ ...prev, pdf: true }));
      const doc = new jsPDF();
      doc.setFontSize(16);
      doc.text("Tax / VAT Government Report", 14, 18);
      doc.setFontSize(10);
      doc.text(`Date range: ${dateFrom} to ${dateTo}`, 14, 26);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 32);

      const body = reportRows.map((row) => [
        row.period ? new Date(row.period).toISOString().split("T")[0] : "-",
        String(row.source || "-").toUpperCase(),
        currency(row.amount),
      ]);

      doc.autoTable({
        startY: 38,
        head: [["Period", "Source", "Amount"]],
        body,
        styles: { fontSize: 9, cellPadding: 2.5 },
        headStyles: { fillColor: [37, 99, 235], textColor: 255 },
      });

      doc.save(`tax_vat_report_${dateFrom}_to_${dateTo}.pdf`);
      toast.success("Tax/VAT PDF downloaded");
    } finally {
      setDownloading((prev) => ({ ...prev, pdf: false }));
    }
  };

  const groupedBreakdown = useMemo(() => {
    const groups = {
      daily: { invoice: 0, quotation: 0 },
      weekly: { invoice: 0, quotation: 0 },
      monthly: { invoice: 0, quotation: 0 },
      yearly: { invoice: 0, quotation: 0 },
    };

    summary.breakdown.forEach((row) => {
      const period = String(row.period || "").toLowerCase();
      const source = String(row.source || "").toLowerCase();
      if (!groups[period] || (source !== "invoice" && source !== "quotation")) return;
      groups[period][source] += Number(row.amount || 0);
    });

    return groups;
  }, [summary.breakdown]);

  return (
    <div className={`min-h-screen flex overflow-x-hidden ${darkMode ? "bg-gray-900 text-gray-100" : "bg-gray-100 text-gray-800"}`}>
      <ToastContainer position="top-right" autoClose={2500} hideProgressBar />
      <Sidebar mobileOpen={mobileMenuOpen} setMobileOpen={setMobileMenuOpen} />
      <div className="flex-1 flex flex-col min-w-0">
        <NavBar onMenuClick={() => setMobileMenuOpen(!mobileMenuOpen)} />
        
        <main className="flex-1 p-3 sm:p-4 md:p-6 mt-16 sm:mt-20 space-y-4 sm:space-y-6 max-w-full overflow-x-hidden">
          {/* Header Section */}
          <div className="flex flex-col space-y-3">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold break-words">Tax / VAT Management</h1>
              <p className="text-xs sm:text-sm opacity-70 mt-1">Monitor tax generated from invoices and quotations by period.</p>
            </div>
            
            {/* Mobile-friendly Controls */}
            <div className="flex flex-col space-y-3">
              {/* Date Range - Stacked on mobile */}
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="flex-1">
                  <label className="text-xs opacity-70 mb-1 block sm:hidden">From Date</label>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg border text-sm ${
                      darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-300"
                    }`}
                  />
                </div>
                <div className="flex-1">
                  <label className="text-xs opacity-70 mb-1 block sm:hidden">To Date</label>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg border text-sm ${
                      darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-300"
                    }`}
                  />
                </div>
              </div>
              
              {/* Action Buttons - Responsive grid */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={fetchTaxSummary}
                  className="px-3 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 text-sm font-medium transition-colors"
                >
                  Refresh
                </button>
                <button
                  onClick={downloadCsv}
                  disabled={downloading.csv}
                  className="px-3 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60 text-sm font-medium transition-colors"
                >
                  {downloading.csv ? "CSV..." : "CSV"}
                </button>
                <button
                  onClick={downloadPdf}
                  disabled={downloading.pdf}
                  className="px-3 py-2 rounded-lg bg-slate-700 text-white hover:bg-slate-800 disabled:opacity-60 text-sm font-medium transition-colors"
                >
                  {downloading.pdf ? "PDF..." : "PDF"}
                </button>
              </div>
            </div>
          </div>

          {/* Stats Cards - Responsive grid */}
          <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <StatCard darkMode={darkMode} label="Tax Daily" value={currency(summary.daily)} />
            <StatCard darkMode={darkMode} label="Tax Weekly" value={currency(summary.weekly)} />
            <StatCard darkMode={darkMode} label="Tax Monthly" value={currency(summary.monthly)} />
            <StatCard darkMode={darkMode} label="Tax Yearly" value={currency(summary.yearly)} />
          </div>

          {/* Breakdown Section - Mobile optimized */}
          <section className={`rounded-xl border overflow-hidden ${
            darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
          }`}>
            <h2 className="px-3 sm:px-4 py-3 font-semibold text-sm sm:text-base border-b border-gray-200/20">
              Breakdown by Source
            </h2>
            {loading ? (
              <div className="px-3 sm:px-4 py-6 text-center text-sm">Loading breakdown...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs sm:text-sm">
                  <thead className={darkMode ? "bg-gray-700" : "bg-gray-50"}>
                    <tr>
                      <th className="px-2 sm:px-3 py-2 text-left uppercase text-xs font-bold">Period</th>
                      <th className="px-2 sm:px-3 py-2 text-left uppercase text-xs font-bold">Invoice</th>
                      <th className="px-2 sm:px-3 py-2 text-left uppercase text-xs font-bold">Quotation</th>
                      <th className="px-2 sm:px-3 py-2 text-left uppercase text-xs font-bold">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(groupedBreakdown).map(([period, values]) => {
                      const total = Number(values.invoice || 0) + Number(values.quotation || 0);
                      return (
                        <tr key={period} className="border-t border-gray-200/20">
                          <td className="px-2 sm:px-3 py-2 font-semibold capitalize text-xs sm:text-sm">{period}</td>
                          <td className="px-2 sm:px-3 py-2 text-xs sm:text-sm break-words">{currency(values.invoice)}</td>
                          <td className="px-2 sm:px-3 py-2 text-xs sm:text-sm break-words">{currency(values.quotation)}</td>
                          <td className="px-2 sm:px-3 py-2 font-semibold text-xs sm:text-sm break-words">{currency(total)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* Report Section - Mobile optimized with horizontal scroll hint */}
          <section className={`rounded-xl border overflow-hidden ${
            darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
          }`}>
            <h2 className="px-3 sm:px-4 py-3 font-semibold text-sm sm:text-base border-b border-gray-200/20">
              Government Report Dataset
            </h2>
            <div className="relative">
              {/* Scroll hint for mobile */}
              <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-gray-800/20 to-transparent pointer-events-none sm:hidden"></div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[500px] text-xs sm:text-sm">
                  <thead className={darkMode ? "bg-gray-700" : "bg-gray-50"}>
                    <tr>
                      <th className="px-2 sm:px-3 py-2 text-left uppercase text-xs font-bold">Period</th>
                      <th className="px-2 sm:px-3 py-2 text-left uppercase text-xs font-bold">Source</th>
                      <th className="px-2 sm:px-3 py-2 text-left uppercase text-xs font-bold">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportRows.map((row, index) => (
                      <tr key={`${row.period}-${row.source}-${index}`} className="border-t border-gray-200/20">
                        <td className="px-2 sm:px-3 py-2 whitespace-nowrap text-xs sm:text-sm">
                          {row.period ? new Date(row.period).toISOString().split("T")[0] : "-"}
                        </td>
                        <td className="px-2 sm:px-3 py-2 capitalize text-xs sm:text-sm">{row.source || "-"}</td>
                        <td className="px-2 sm:px-3 py-2 text-xs sm:text-sm break-words">{currency(row.amount)}</td>
                      </tr>
                    ))}
                    {!reportRows.length && (
                      <tr>
                        <td className="px-2 sm:px-3 py-4 text-center opacity-70 text-sm" colSpan={3}>
                          No report rows for selected date range.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              {reportRows.length > 0 && (
                <div className="sm:hidden text-center text-xs opacity-60 py-2 border-t border-gray-200/20">
                  ← Scroll horizontally →
                </div>
              )}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

function StatCard({ darkMode, label, value }) {
  return (
    <div className={`rounded-xl p-3 sm:p-4 transition-all ${
      darkMode ? "bg-gray-800 hover:bg-gray-750" : "bg-white hover:shadow-md"
    }`}>
      <p className="text-[10px] sm:text-xs uppercase opacity-60 mb-1 tracking-wider">{label}</p>
      <p className="text-lg sm:text-xl md:text-2xl font-bold break-words">{value}</p>
    </div>
  );
}