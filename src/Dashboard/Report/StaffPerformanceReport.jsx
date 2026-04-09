import React, { useEffect, useMemo, useState } from "react";
import Sidebar from "../../component/sidebar";
import NavBar from "../../component/navigation";
import { useTheme } from "../../context/ThemeContext";
import API from "../../utils/api";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const StaffPerformanceReport = () => {
  const { darkMode } = useTheme();
  const PAGE_SIZE = 10;
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState([]);
  const [activities, setActivities] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStaffId, setSelectedStaffId] = useState("all");
  const [summaryPage, setSummaryPage] = useState(1);
  const [activityPage, setActivityPage] = useState(1);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const res = await API.get("/dashboard/staff-report");
      setSummary(Array.isArray(res.data?.summary) ? res.data.summary : []);
      setActivities(Array.isArray(res.data?.activities) ? res.data.activities : []);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch staff performance report");
      setSummary([]);
      setActivities([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  const filteredSummary = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return summary.filter((staff) => {
      if (selectedStaffId !== "all" && String(staff.id) !== selectedStaffId) return false;
      if (!query) return true;
      return [staff.username, staff.email, staff.role]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query));
    });
  }, [summary, searchTerm, selectedStaffId]);

  const filteredActivities = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return activities.filter((row) => {
      if (selectedStaffId !== "all" && String(row.user_id) !== selectedStaffId) return false;
      if (!query) return true;
      return [row.actor_username, row.actor_role, row.module_name, row.description, row.action]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query));
    });
  }, [activities, searchTerm, selectedStaffId]);

  useEffect(() => {
    setSummaryPage(1);
    setActivityPage(1);
  }, [searchTerm, selectedStaffId]);

  const summaryTotalPages = Math.max(1, Math.ceil(filteredSummary.length / PAGE_SIZE));
  const activityTotalPages = Math.max(1, Math.ceil(filteredActivities.length / PAGE_SIZE));

  const summaryRows = useMemo(() => {
    const start = (summaryPage - 1) * PAGE_SIZE;
    return filteredSummary.slice(start, start + PAGE_SIZE);
  }, [filteredSummary, summaryPage]);

  const activityRows = useMemo(() => {
    const start = (activityPage - 1) * PAGE_SIZE;
    return filteredActivities.slice(start, start + PAGE_SIZE);
  }, [filteredActivities, activityPage]);

  const totals = useMemo(() => {
    return filteredSummary.reduce(
      (acc, row) => {
        acc.staff += 1;
        acc.invoices += Number(row.invoice_count || 0);
        acc.quotations += Number(row.quotation_count || 0);
        acc.purchaseOrders += Number(row.purchase_order_count || 0);
        acc.activities += Number(row.activity_count || 0);
        return acc;
      },
      { staff: 0, invoices: 0, quotations: 0, purchaseOrders: 0, activities: 0 }
    );
  }, [filteredSummary]);

  return (
    <div className={`min-h-screen flex overflow-x-hidden ${darkMode ? "bg-gray-900 text-gray-100" : "bg-gray-100 text-gray-800"}`}>
      <ToastContainer position="top-right" autoClose={2500} hideProgressBar />
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <NavBar />

        <main className="p-4 md:p-6 mt-20 space-y-6 max-w-full min-w-0">
          <div>
            <h1 className="text-2xl font-bold">Staff Performance Report</h1>
            <p className="text-sm opacity-70">Track each staff member by records created and activity details.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <StatCard darkMode={darkMode} label="Staff" value={totals.staff} />
            <StatCard darkMode={darkMode} label="Invoices" value={totals.invoices} />
            <StatCard darkMode={darkMode} label="Quotations" value={totals.quotations} />
            <StatCard darkMode={darkMode} label="Purchase Orders" value={totals.purchaseOrders} />
            <StatCard darkMode={darkMode} label="Activities" value={totals.activities} />
          </div>

          <div className="flex flex-col md:flex-row gap-3 min-w-0">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search staff, role, module, action"
              className={`w-full md:w-96 px-4 py-2 rounded-lg border outline-none ${darkMode ? "bg-gray-800 border-gray-700 text-gray-100" : "bg-white border-gray-300 text-gray-800"}`}
            />
            <select
              value={selectedStaffId}
              onChange={(e) => setSelectedStaffId(e.target.value)}
              className={`w-full md:w-72 px-4 py-2 rounded-lg border outline-none ${darkMode ? "bg-gray-800 border-gray-700 text-gray-100" : "bg-white border-gray-300 text-gray-800"}`}
            >
              <option value="all">All Staff</option>
              {summary.map((staff) => (
                <option key={staff.id} value={String(staff.id)}>
                  {staff.username} ({staff.role})
                </option>
              ))}
            </select>
            <button
              onClick={fetchReport}
              className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
            >
              Refresh
            </button>
          </div>

          <section className={`rounded-xl border overflow-hidden ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
            <h2 className="px-4 py-3 font-semibold border-b border-gray-200/20">Staff Summary</h2>
            {loading ? (
              <p className="px-4 py-6">Loading summary...</p>
            ) : (
              <>
                <div className="hidden md:block overflow-x-auto max-w-full">
                  <table className="w-full min-w-[1200px] text-sm">
                    <thead className={darkMode ? "bg-gray-700" : "bg-gray-50"}>
                      <tr>
                        {[
                          "Staff",
                          "Role",
                          "Invoices",
                          "Invoice Amount",
                          "Quotations",
                          "Quotation Amount",
                          "Purchase Orders",
                          "PO Amount",
                          "Stock Moves",
                          "Stock Out Qty",
                          "Stock In Qty",
                          "Invoice Tax",
                          "Quotation Tax",
                          "Waybills",
                          "Customers",
                          "Suppliers",
                          "Activities",
                        ].map((h) => (
                          <th key={h} className="px-3 py-2 text-left uppercase text-xs font-bold">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {summaryRows.map((row) => (
                        <tr key={row.id} className="border-t border-gray-200/20">
                          <td className="px-3 py-2 font-semibold">{row.username}</td>
                          <td className="px-3 py-2">{row.role}</td>
                          <td className="px-3 py-2">{row.invoice_count}</td>
                          <td className="px-3 py-2">N{Number(row.invoice_total_amount || 0).toLocaleString()}</td>
                          <td className="px-3 py-2">{row.quotation_count}</td>
                          <td className="px-3 py-2">N{Number(row.quotation_total_amount || 0).toLocaleString()}</td>
                          <td className="px-3 py-2">{row.purchase_order_count}</td>
                          <td className="px-3 py-2">N{Number(row.purchase_order_total_amount || 0).toLocaleString()}</td>
                          <td className="px-3 py-2">{row.stock_movement_count}</td>
                          <td className="px-3 py-2">{Number(row.stock_out_quantity || 0).toLocaleString()}</td>
                          <td className="px-3 py-2">{Number(row.stock_in_quantity || 0).toLocaleString()}</td>
                          <td className="px-3 py-2">N{Number(row.invoice_tax_total || 0).toLocaleString()}</td>
                          <td className="px-3 py-2">N{Number(row.quotation_tax_total || 0).toLocaleString()}</td>
                          <td className="px-3 py-2">{row.waybill_count}</td>
                          <td className="px-3 py-2">{row.customer_count}</td>
                          <td className="px-3 py-2">{row.supplier_count}</td>
                          <td className="px-3 py-2">{row.activity_count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="md:hidden divide-y divide-gray-200/20">
                  {summaryRows.map((row) => (
                    <div key={row.id} className="p-4 space-y-2">
                      <p className="font-semibold text-base">{row.username}</p>
                      <p className="text-xs opacity-70 uppercase">{row.role}</p>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <p>Invoices: {row.invoice_count}</p>
                        <p>Quotations: {row.quotation_count}</p>
                        <p>POs: {row.purchase_order_count}</p>
                        <p>Stock Moves: {row.stock_movement_count}</p>
                        <p>Waybills: {row.waybill_count}</p>
                        <p>Customers: {row.customer_count}</p>
                        <p>Suppliers: {row.supplier_count}</p>
                      </div>
                      <div className="text-sm">
                        <p>Invoice Amount: N{Number(row.invoice_total_amount || 0).toLocaleString()}</p>
                        <p>Quotation Amount: N{Number(row.quotation_total_amount || 0).toLocaleString()}</p>
                        <p>PO Amount: N{Number(row.purchase_order_total_amount || 0).toLocaleString()}</p>
                        <p>Invoice Tax: N{Number(row.invoice_tax_total || 0).toLocaleString()}</p>
                        <p>Quotation Tax: N{Number(row.quotation_tax_total || 0).toLocaleString()}</p>
                        <p className="font-medium">Activities: {row.activity_count}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
            {!loading && filteredSummary.length > 0 && (
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 px-4 py-3 text-sm border-t border-gray-200/20">
                <span>
                  Showing {(summaryPage - 1) * PAGE_SIZE + 1} to {Math.min(summaryPage * PAGE_SIZE, filteredSummary.length)} of {filteredSummary.length}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setSummaryPage((p) => Math.max(1, p - 1))}
                    disabled={summaryPage === 1}
                    className="px-3 py-1 rounded border disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setSummaryPage((p) => Math.min(summaryTotalPages, p + 1))}
                    disabled={summaryPage === summaryTotalPages}
                    className="px-3 py-1 rounded border disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </section>

          <section className={`rounded-xl border overflow-hidden ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
            <h2 className="px-4 py-3 font-semibold border-b border-gray-200/20">Recent Staff Activity Details</h2>
            {loading ? (
              <p className="px-4 py-6">Loading activities...</p>
            ) : (
              <>
                <div className="hidden md:block overflow-x-auto max-w-full">
                  <table className="w-full min-w-[1000px] text-sm">
                    <thead className={darkMode ? "bg-gray-700" : "bg-gray-50"}>
                      <tr>
                        {["Date", "Staff", "Role", "Module", "Action", "Record", "Description"].map((h) => (
                          <th key={h} className="px-3 py-2 text-left uppercase text-xs font-bold">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {activityRows.map((row) => (
                        <tr key={row.id} className="border-t border-gray-200/20">
                          <td className="px-3 py-2">{row.created_at ? String(row.created_at).replace("T", " ").slice(0, 19) : "-"}</td>
                          <td className="px-3 py-2 font-semibold">{row.actor_username || "Unknown"}</td>
                          <td className="px-3 py-2">{row.actor_role || "-"}</td>
                          <td className="px-3 py-2">{row.module_name || "-"}</td>
                          <td className="px-3 py-2">{row.action || "-"}</td>
                          <td className="px-3 py-2">{row.record_id || "-"}</td>
                          <td className="px-3 py-2">{row.description || "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="md:hidden divide-y divide-gray-200/20">
                  {activityRows.map((row) => (
                    <div key={row.id} className="p-4 space-y-1 text-sm">
                      <p className="font-semibold">{row.actor_username || "Unknown"}</p>
                      <p className="text-xs opacity-70 uppercase">{row.actor_role || "-"}</p>
                      <p><span className="opacity-70">Module:</span> {row.module_name || "-"}</p>
                      <p><span className="opacity-70">Action:</span> {row.action || "-"}</p>
                      <p><span className="opacity-70">Record:</span> {row.record_id || "-"}</p>
                      <p><span className="opacity-70">Date:</span> {row.created_at ? String(row.created_at).replace("T", " ").slice(0, 19) : "-"}</p>
                      <p className="pt-1"><span className="opacity-70">Detail:</span> {row.description || "-"}</p>
                    </div>
                  ))}
                </div>
              </>
            )}
            {!loading && filteredActivities.length > 0 && (
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 px-4 py-3 text-sm border-t border-gray-200/20">
                <span>
                  Showing {(activityPage - 1) * PAGE_SIZE + 1} to {Math.min(activityPage * PAGE_SIZE, filteredActivities.length)} of {filteredActivities.length}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setActivityPage((p) => Math.max(1, p - 1))}
                    disabled={activityPage === 1}
                    className="px-3 py-1 rounded border disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setActivityPage((p) => Math.min(activityTotalPages, p + 1))}
                    disabled={activityPage === activityTotalPages}
                    className="px-3 py-1 rounded border disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
};

const StatCard = ({ darkMode, label, value }) => {
  const isNumeric = typeof value === "number";
  return (
    <div className={`rounded-xl p-4 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
      <p className="text-xs uppercase opacity-60 mb-1">{label}</p>
      <p className="text-2xl font-bold">{isNumeric ? Number(value || 0).toLocaleString() : String(value || "-")}</p>
    </div>
  );
};

export default StaffPerformanceReport;
