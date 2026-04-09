import React, { useEffect, useMemo, useState } from "react";
import Sidebar from "../../component/sidebar";
import NavBar from "../../component/navigation";
import { useTheme } from "../../context/ThemeContext";
import API from "../../utils/api";
import { ToastContainer, toast } from "react-toastify";
import jsPDF from "jspdf";
import "jspdf-autotable";
import "react-toastify/dist/ReactToastify.css";

const currency = (value) => `₦${Number(value || 0).toLocaleString()}`;

export default function TaxVatManagement() {
  const { darkMode } = useTheme();
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({ daily: 0, weekly: 0, monthly: 0, yearly: 0, breakdown: [] });
  const [reportRows, setReportRows] = useState([]);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [downloading, setDownloading] = useState({ csv: false, pdf: false });

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
        `₦${Number(row.amount || 0).toLocaleString()}`,
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
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <NavBar />

        <main className="p-4 md:p-6 mt-20 space-y-6 max-w-full">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold">Tax / VAT Management</h1>
              <p className="text-sm opacity-70">Monitor tax generated from invoices and quotations by period.</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className={`px-3 py-2 rounded-lg border ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-300"}`}
              />
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className={`px-3 py-2 rounded-lg border ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-300"}`}
              />
              <button
                onClick={fetchTaxSummary}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
              >
                Refresh
              </button>
              <button
                onClick={downloadCsv}
                disabled={downloading.csv}
                className="px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60"
              >
                {downloading.csv ? "Downloading CSV..." : "Download CSV"}
              </button>
              <button
                onClick={downloadPdf}
                disabled={downloading.pdf}
                className="px-4 py-2 rounded-lg bg-slate-700 text-white hover:bg-slate-800 disabled:opacity-60"
              >
                {downloading.pdf ? "Downloading PDF..." : "Download PDF"}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard darkMode={darkMode} label="Tax Daily" value={currency(summary.daily)} />
            <StatCard darkMode={darkMode} label="Tax Weekly" value={currency(summary.weekly)} />
            <StatCard darkMode={darkMode} label="Tax Monthly" value={currency(summary.monthly)} />
            <StatCard darkMode={darkMode} label="Tax Yearly" value={currency(summary.yearly)} />
          </div>

          <section className={`rounded-xl border ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
            <h2 className="px-4 py-3 font-semibold border-b border-gray-200/20">Breakdown by Source</h2>
            {loading ? (
              <p className="px-4 py-6">Loading breakdown...</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[700px] text-sm">
                  <thead className={darkMode ? "bg-gray-700" : "bg-gray-50"}>
                    <tr>
                      <th className="px-3 py-2 text-left uppercase text-xs font-bold">Period</th>
                      <th className="px-3 py-2 text-left uppercase text-xs font-bold">Invoice Tax</th>
                      <th className="px-3 py-2 text-left uppercase text-xs font-bold">Quotation VAT</th>
                      <th className="px-3 py-2 text-left uppercase text-xs font-bold">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(groupedBreakdown).map(([period, values]) => {
                      const total = Number(values.invoice || 0) + Number(values.quotation || 0);
                      return (
                        <tr key={period} className="border-t border-gray-200/20">
                          <td className="px-3 py-2 font-semibold capitalize">{period}</td>
                          <td className="px-3 py-2">{currency(values.invoice)}</td>
                          <td className="px-3 py-2">{currency(values.quotation)}</td>
                          <td className="px-3 py-2 font-semibold">{currency(total)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className={`rounded-xl border ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
            <h2 className="px-4 py-3 font-semibold border-b border-gray-200/20">Government Report Dataset</h2>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px] text-sm">
                <thead className={darkMode ? "bg-gray-700" : "bg-gray-50"}>
                  <tr>
                    <th className="px-3 py-2 text-left uppercase text-xs font-bold">Period</th>
                    <th className="px-3 py-2 text-left uppercase text-xs font-bold">Source</th>
                    <th className="px-3 py-2 text-left uppercase text-xs font-bold">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {reportRows.map((row, index) => (
                    <tr key={`${row.period}-${row.source}-${index}`} className="border-t border-gray-200/20">
                      <td className="px-3 py-2">{row.period ? new Date(row.period).toISOString().split("T")[0] : "-"}</td>
                      <td className="px-3 py-2 capitalize">{row.source || "-"}</td>
                      <td className="px-3 py-2">{currency(row.amount)}</td>
                    </tr>
                  ))}
                  {!reportRows.length && (
                    <tr>
                      <td className="px-3 py-4 opacity-70" colSpan={3}>No report rows for selected date range.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

function StatCard({ darkMode, label, value }) {
  return (
    <div className={`rounded-xl p-4 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
      <p className="text-xs uppercase opacity-60 mb-1">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}
