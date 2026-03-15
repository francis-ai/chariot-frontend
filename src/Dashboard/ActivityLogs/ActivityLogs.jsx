import React, { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import Sidebar from "../../component/sidebar";
import NavBar from "../../component/navigation";
import API from "../../utils/api";
import { useTheme } from "../../context/ThemeContext";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const PAGE_SIZE = 50;

const ActivityLogs = () => {
  const { darkMode } = useTheme();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const totalPages = Math.max(Math.ceil(total / PAGE_SIZE), 1);

  const fetchLogs = async (targetPage = page) => {
    try {
      setLoading(true);
      const res = await API.get("/activity-logs", {
        params: { page: targetPage, limit: PAGE_SIZE },
      });

      setLogs(res.data?.data || []);
      setTotal(res.data?.pagination?.total || 0);
      setPage(targetPage);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch activity logs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(1);
  }, []);

  const formatDateTime = (value) => {
    if (!value) return "-";
    return new Date(value).toLocaleString();
  };

  return (
    <div className={`flex min-h-screen ${darkMode ? "bg-slate-900 text-slate-200" : "bg-gray-50 text-slate-800"}`}>
      <ToastContainer position="top-right" autoClose={2500} hideProgressBar />
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0">
        <NavBar onMenuClick={() => setIsSidebarOpen(true)} />

        <main className="flex-1 p-4 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold">Activity Logs</h1>
              <p className={`text-sm ${darkMode ? "text-slate-400" : "text-gray-500"}`}>
                Track actions performed across the system
              </p>
            </div>

            <button
              onClick={() => fetchLogs(page)}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-60"
            >
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
              Refresh
            </button>
          </div>

          <div className={`rounded-lg border overflow-hidden ${darkMode ? "bg-slate-800 border-slate-700" : "bg-white border-gray-200"}`}>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px] text-sm">
                <thead className={darkMode ? "bg-slate-700" : "bg-gray-50"}>
                  <tr>
                    <th className="px-3 py-2 text-left text-xs uppercase font-bold opacity-70">Time</th>
                    <th className="px-3 py-2 text-left text-xs uppercase font-bold opacity-70">User</th>
                    <th className="px-3 py-2 text-left text-xs uppercase font-bold opacity-70">Action</th>
                    <th className="px-3 py-2 text-left text-xs uppercase font-bold opacity-70">Module</th>
                    <th className="px-3 py-2 text-left text-xs uppercase font-bold opacity-70">Description</th>
                    <th className="px-3 py-2 text-left text-xs uppercase font-bold opacity-70">Endpoint</th>
                    <th className="px-3 py-2 text-left text-xs uppercase font-bold opacity-70">IP</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="px-3 py-8 text-center opacity-70">Loading activity logs...</td>
                    </tr>
                  ) : logs.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-3 py-8 text-center opacity-70">No activity logs found</td>
                    </tr>
                  ) : (
                    logs.map((log) => (
                      <tr key={log.id} className={darkMode ? "border-t border-slate-700" : "border-t border-gray-100"}>
                        <td className="px-3 py-2 whitespace-nowrap">{formatDateTime(log.created_at)}</td>
                        <td className="px-3 py-2">
                          <div className="font-medium">{log.actor_username || "System"}</div>
                          <div className="text-xs opacity-70">{log.actor_email || "-"}</div>
                        </td>
                        <td className="px-3 py-2 uppercase font-semibold text-xs">{log.action || "-"}</td>
                        <td className="px-3 py-2">{log.module_name || "-"}</td>
                        <td className="px-3 py-2 max-w-[280px] truncate" title={log.description || ""}>
                          {log.description || "-"}
                        </td>
                        <td className="px-3 py-2 max-w-[260px] truncate" title={log.endpoint || ""}>
                          {log.method ? `${log.method} ` : ""}{log.endpoint || "-"}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">{log.ip_address || "-"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className={`px-4 py-3 border-t flex items-center justify-between ${darkMode ? "border-slate-700" : "border-gray-200"}`}>
              <p className="text-sm opacity-70">
                Showing page {page} of {totalPages} ({total} total logs)
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => fetchLogs(page - 1)}
                  disabled={page <= 1 || loading}
                  className={`px-3 py-1.5 rounded border text-sm disabled:opacity-50 ${darkMode ? "border-slate-600" : "border-gray-300"}`}
                >
                  Previous
                </button>
                <button
                  onClick={() => fetchLogs(page + 1)}
                  disabled={page >= totalPages || loading}
                  className={`px-3 py-1.5 rounded border text-sm disabled:opacity-50 ${darkMode ? "border-slate-600" : "border-gray-300"}`}
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default ActivityLogs;
