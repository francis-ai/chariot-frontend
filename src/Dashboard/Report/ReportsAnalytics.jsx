import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { FileText, Calendar, Menu } from 'lucide-react';
import Sidebar from '../../../src/component/sidebar';
import NavBar from '../../../src/component/navigation';
import { useTheme } from '../../../src/context/ThemeContext';

const ReportsAnalytics = () => {
  const { darkMode } = useTheme();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const data = [
    { month: 'Jan', sales: 1200000 },
    { month: 'Feb', sales: 1900000 },
    { month: 'Mar', sales: 1500000 },
    { month: 'Apr', sales: 2500000 },
    { month: 'May', sales: 2200000 },
    { month: 'Jun', sales: 3000000 },
    { month: 'Jul', sales: 2800000 },
    { month: 'Aug', sales: 3500000 },
    { month: 'Sep', sales: 3200000 },
    { month: 'Oct', sales: 4000000 },
  ];

  const formatCurrency = (value) => `₦${(value / 1000000).toFixed(1)}M`;

  return (
    <div
      className={`flex min-h-screen font-sans transition-colors ${
        darkMode ? 'bg-slate-900 text-slate-200' : 'bg-[#f8fafc] text-slate-800'
      }`}
    >
      {/* Sidebar */}
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <NavBar onMenuClick={() => setIsSidebarOpen(true)} />

        <main className="flex-1 p-4 sm:p-8">
          <h1 className={`text-xl md:text-2xl font-bold mb-6 ${darkMode ? 'text-slate-100' : ''}`}>
            Reports & Analytics
          </h1>

          {/* Report Filters */}
          <div
            className={`mb-6 rounded-lg shadow-sm transition-colors ${
              darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border border-gray-200'
            }`}
          >
            <div
              className={`px-4 py-2 border-b transition-colors ${
                darkMode ? 'border-slate-700 bg-slate-700' : 'border-gray-100 bg-gray-50'
              }`}
            >
              <h2 className={`text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-slate-300' : 'text-gray-600'}`}>
                Report Filters
              </h2>
            </div>
            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-end">
              {/* Report Type */}
              <div className="space-y-1">
                <label className={`text-[11px] font-semibold uppercase ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                  Report Type
                </label>
                <select
                  className={`w-full rounded px-3 py-1.5 text-sm outline-none focus:ring-1 focus:ring-blue-500 transition-colors ${
                    darkMode
                      ? 'bg-slate-700 border-slate-600 text-slate-200'
                      : 'bg-white border border-gray-300 text-slate-800'
                  }`}
                >
                  <option>Sales Report</option>
                </select>
              </div>

              {/* Date From */}
              <div className="space-y-1">
                <label className={`text-[11px] font-semibold uppercase ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                  Date From
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value="01/10/2023"
                    readOnly
                    className={`w-full rounded px-3 py-1.5 text-sm outline-none transition-colors ${
                      darkMode ? 'bg-slate-700 border-slate-600 text-slate-200' : 'bg-white border border-gray-300 text-slate-800'
                    }`}
                  />
                  <Calendar className={`absolute right-2 top-2 ${darkMode ? 'text-slate-300' : 'text-gray-400'}`} size={16} />
                </div>
              </div>

              {/* Date To */}
              <div className="space-y-1">
                <label className={`text-[11px] font-semibold uppercase ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                  Date To
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value="31/10/2023"
                    readOnly
                    className={`w-full rounded px-3 py-1.5 text-sm outline-none transition-colors ${
                      darkMode ? 'bg-slate-700 border-slate-600 text-slate-200' : 'bg-white border border-gray-300 text-slate-800'
                    }`}
                  />
                  <Calendar className={`absolute right-2 top-2 ${darkMode ? 'text-slate-300' : 'text-gray-400'}`} size={16} />
                </div>
              </div>

              {/* Generate Report Button */}
              <button
                className="flex items-center justify-center transition-colors bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded text-sm font-medium w-full sm:w-auto"
              >
                <FileText size={16} className="mr-2" /> Generate Report
              </button>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Monthly Sales */}
            <div
              className={`rounded-lg shadow-sm transition-colors ${
                darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border border-gray-200'
              }`}
            >
              <div
                className={`px-4 py-3 border-b transition-colors ${
                  darkMode ? 'border-slate-700' : 'border-gray-100'
                }`}
              >
                <h2 className={`text-sm font-bold ${darkMode ? 'text-slate-100' : 'text-gray-700'}`}>
                  Monthly Sales Report
                </h2>
              </div>
              <div className="p-4 h-[350px]">
                <div className="flex justify-center mb-2">
                  <div className="flex items-center text-[10px] text-gray-500">
                    <span className="w-3 h-3 bg-blue-500 mr-1 rounded-sm"></span> Sales
                  </div>
                </div>
                <ResponsiveContainer width="100%" height="90%">
                  <BarChart data={data}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke={darkMode ? '#334155' : '#f0f0f0'}
                    />
                    <XAxis
                      dataKey="month"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 10, fill: darkMode ? '#cbd5f5' : '#94a3b8' }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={formatCurrency}
                      tick={{ fontSize: 10, fill: darkMode ? '#cbd5f5' : '#94a3b8' }}
                      domain={[0, 4500000]}
                    />
                    <Tooltip
                      cursor={{ fill: darkMode ? '#1e293b' : '#f8fafc' }}
                      formatter={(value) => formatCurrency(value)}
                      contentStyle={{
                        backgroundColor: darkMode ? '#1e293b' : '#ffffff',
                        border: 'none',
                        borderRadius: '8px',
                        color: darkMode ? '#e5e7eb' : '#111827',
                      }}
                    />
                    <Bar dataKey="sales" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Top Selling Products */}
            <div
              className={`rounded-lg shadow-sm transition-colors ${
                darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border border-gray-200'
              }`}
            >
              <div className={`px-4 py-3 border-b transition-colors ${darkMode ? 'border-slate-700' : 'border-gray-100'}`}>
                <h2 className={`text-sm font-bold ${darkMode ? 'text-slate-100' : 'text-gray-700'}`}>
                  Top Selling Products
                </h2>
              </div>
              <div className="p-4 h-[350px] flex items-center justify-center text-gray-400 italic text-sm">
                No data available
              </div>
            </div>
          </div>

          {/* Detailed Report Table */}
          <div
            className={`rounded-lg shadow-sm mb-6 transition-colors ${
              darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border border-gray-200'
            }`}
          >
            <div className={`px-4 py-3 border-b transition-colors ${darkMode ? 'border-slate-700' : 'border-gray-100'}`}>
              <h2 className={`text-sm font-bold ${darkMode ? 'text-slate-100' : 'text-gray-700'}`}>
                Detailed Report Data
              </h2>
            </div>
            <div className={`p-4 text-sm italic flex items-center justify-center ${darkMode ? 'text-slate-300' : 'text-gray-500'} h-16`}>
              Table placeholder for detailed data
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default ReportsAnalytics;
