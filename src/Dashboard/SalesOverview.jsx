import React, { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
} from "recharts";
import { useTheme } from "../context/ThemeContext";

/* ===== Full Year Sales Data ===== */
const salesData = [
  { month: "Jan", sales: 1200000 },
  { month: "Feb", sales: 1900000 },
  { month: "Mar", sales: 1500000 },
  { month: "Apr", sales: 2500000 },
  { month: "May", sales: 2200000 },
  { month: "Jun", sales: 3000000 },
  { month: "Jul", sales: 2700000 },
  { month: "Aug", sales: 3500000 },
  { month: "Sep", sales: 3200000 },
  { month: "Oct", sales: 4000000 },
  { month: "Nov", sales: 3800000 },
  { month: "Dec", sales: 4500000 },
];

export default function SalesOverview() {
  const { darkMode } = useTheme();

  /* ===== Derived Stats ===== */
  const stats = useMemo(() => {
    const totalRevenue = salesData.reduce((sum, m) => sum + m.sales, 0);
    const highestMonth = Math.max(...salesData.map((m) => m.sales));
    const averageMonthly = Math.round(totalRevenue / salesData.length);

    return {
      totalRevenue,
      highestMonth,
      averageMonthly,
      monthsTracked: salesData.length,
    };
  }, []);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 mt-10">
      {/* ===== Chart ===== */}
      <div
        className={`xl:col-span-3 rounded-xl shadow-sm p-6 transition
          ${darkMode ? "bg-slate-800" : "bg-white"}
        `}
      >
        <h2
          className={`text-lg font-semibold mb-4
            ${darkMode ? "text-slate-200" : "text-gray-700"}
          `}
        >
          Monthly Sales Overview (Jan – Dec)
        </h2>

        <div className="h-[340px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={salesData}>
              <defs>
                <linearGradient id="redGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#dc2626" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#dc2626" stopOpacity={0.05} />
                </linearGradient>
              </defs>

              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke={darkMode ? "#334155" : "#e5e7eb"}
              />

              <XAxis
                dataKey="month"
                stroke={darkMode ? "#cbd5f5" : "#64748b"}
              />

              <YAxis
                stroke={darkMode ? "#cbd5f5" : "#64748b"}
                tickFormatter={(v) => `₦${v / 1000000}M`}
              />

              <Tooltip
                formatter={(v) => `₦${v.toLocaleString()}`}
                contentStyle={{
                  backgroundColor: darkMode ? "#1e293b" : "#ffffff",
                  border: "none",
                  borderRadius: "8px",
                  color: darkMode ? "#e5e7eb" : "#111827",
                }}
              />

              <Area
                type="monotone"
                dataKey="sales"
                stroke="#dc2626"
                fill="url(#redGradient)"
              />

              <Line
                type="monotone"
                dataKey="sales"
                stroke="#dc2626"
                strokeWidth={3}
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ===== Dynamic Stats ===== */}
      <div
        className={`rounded-xl shadow-sm p-6 transition
          ${darkMode ? "bg-slate-800" : "bg-white"}
        `}
      >
        <h2
          className={`text-lg font-semibold mb-6
            ${darkMode ? "text-slate-200" : "text-gray-700"}
          `}
        >
          Sales Statistics
        </h2>

        <div className="space-y-5 text-sm">
          <div className="flex justify-between">
            <span className={darkMode ? "text-slate-400" : "text-gray-500"}>
              Total Revenue
            </span>
            <span className={darkMode ? "text-white font-semibold" : "text-gray-900 font-semibold"}>
              ₦{stats.totalRevenue.toLocaleString()}
            </span>
          </div>

          <div className="flex justify-between">
            <span className={darkMode ? "text-slate-400" : "text-gray-500"}>
              Average Monthly Sales
            </span>
            <span className={darkMode ? "text-white font-semibold" : "text-gray-900 font-semibold"}>
              ₦{stats.averageMonthly.toLocaleString()}
            </span>
          </div>

          <div className="flex justify-between">
            <span className={darkMode ? "text-slate-400" : "text-gray-500"}>
              Highest Month
            </span>
            <span className="font-semibold text-green-500">
              ₦{stats.highestMonth.toLocaleString()}
            </span>
          </div>

          <div className="flex justify-between">
            <span className={darkMode ? "text-slate-400" : "text-gray-500"}>
              Months Tracked
            </span>
            <span className={darkMode ? "text-white font-semibold" : "text-gray-900 font-semibold"}>
              {stats.monthsTracked}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
