import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useTheme } from '../context/ThemeContext';

const SalesOverview = ({ monthlySales = [], loading = false }) => {
  const { darkMode } = useTheme();

  // Format months
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  // Process monthly sales data
  const chartData = monthlySales.map(item => ({
    month: monthNames[item.month - 1] || `Month ${item.month}`,
    sales: item.sales || 0
  }));

  const formatCurrency = (value) => `₦${(value / 1000000).toFixed(1)}M`;

  return (
    <div className={`mt-8 p-6 rounded-xl shadow-sm transition-colors ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
      <h2 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>
        Monthly Sales Overview
      </h2>
      
      {loading ? (
        <div className="h-[300px] flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : chartData.length > 0 ? (
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke={darkMode ? '#334155' : '#f0f0f0'}
              />
              <XAxis
                dataKey="month"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: darkMode ? '#cbd5f5' : '#94a3b8' }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tickFormatter={formatCurrency}
                tick={{ fontSize: 12, fill: darkMode ? '#cbd5f5' : '#94a3b8' }}
              />
              <Tooltip
                cursor={{ fill: darkMode ? '#1e293b' : '#f8fafc' }}
                formatter={(value) => [`₦${value.toLocaleString()}`, 'Sales']}
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
      ) : (
        <div className={`h-[300px] flex items-center justify-center ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          No sales data available
        </div>
      )}
    </div>
  );
};

export default SalesOverview;