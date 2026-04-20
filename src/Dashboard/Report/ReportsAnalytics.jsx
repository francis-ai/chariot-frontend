import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { FileText, Calendar, Menu, Download, Loader, FileSpreadsheet, File as FilePdf } from 'lucide-react';
import Sidebar from '../../../src/component/sidebar';
import NavBar from '../../../src/component/navigation';
import { useTheme } from '../../../src/context/ThemeContext';
import { AuthContext } from '../../context/authContext.jsx';
import API from "../../utils/api";
import { toast, ToastContainer } from "react-toastify";
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import "react-toastify/dist/ReactToastify.css";

const ReportsAnalytics = () => {
  const { user } = React.useContext(AuthContext);
  const { darkMode } = useTheme();
  const PAGE_SIZE = 10;
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState({ excel: false, pdf: false });
  const [reportType, setReportType] = useState('invoice');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [reportData, setReportData] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [chartType, setChartType] = useState('bar');
  const [currentPage, setCurrentPage] = useState(1);

  const isSuperAdmin = user?.role === "super-admin";

  const reportTypes = [
    { value: 'invoice', label: 'Sales Report'},
    { value: 'purchase_orders', label: 'Purchase Orders Report'},
    { value: 'inventory', label: 'Inventory Report'},
    { value: 'waybill', label: 'Waybill Report'},
    { value: 'customers', label: 'Customers Report'},
    { value: 'suppliers', label: 'Suppliers Report'},
    { value: 'quotations', label: 'Quotations Report'},
    ...(isSuperAdmin ? [{ value: 'tax_summary', label: 'Tax / VAT Report'}] : []),
  ];

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  // Set default dates (last 30 days)
  useEffect(() => {
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);
    
    setDateTo(today.toISOString().split('T')[0]);
    setDateFrom(thirtyDaysAgo.toISOString().split('T')[0]);
  }, []);

  // Process data for chart based on report type
  useEffect(() => {
    if (reportData.length > 0) {
      processChartData();
    }
  }, [reportData, reportType]);

  useEffect(() => {
    setCurrentPage(1);
  }, [reportData.length, reportType]);

  const processChartData = () => {
    let processed = [];

    switch (reportType) {
      case 'invoice':
        // For invoice, show sales by month
        const monthlySales = {};
        reportData.forEach(item => {
          if (item.invoice_date) {
            const date = new Date(item.invoice_date);
            const monthYear = `${date.toLocaleString('default', { month: 'short' })} ${date.getFullYear()}`;
            monthlySales[monthYear] = (monthlySales[monthYear] || 0) + Number(item.total || 0);
          }
        });
        processed = Object.entries(monthlySales).map(([name, value]) => ({ 
          name, 
          value: Math.round(value / 1000) // Convert to thousands for display
        }));
        setChartType('bar');
        break;

      case 'purchase_orders':
        // Group by status
        const poStatus = reportData.reduce((acc, item) => {
          acc[item.status] = (acc[item.status] || 0) + 1;
          return acc;
        }, {});
        processed = Object.entries(poStatus).map(([name, value]) => ({ name, value }));
        setChartType('pie');
        break;

      case 'inventory':
        // Group by category
        const categoryCount = reportData.reduce((acc, item) => {
          acc[item.category] = (acc[item.category] || 0) + 1;
          return acc;
        }, {});
        processed = Object.entries(categoryCount).map(([name, value]) => ({ name, value }));
        setChartType('pie');
        break;

      case 'waybill':
        // Group by status
        const waybillStatus = reportData.reduce((acc, item) => {
          acc[item.status] = (acc[item.status] || 0) + 1;
          return acc;
        }, {});
        processed = Object.entries(waybillStatus).map(([name, value]) => ({ name, value }));
        setChartType('pie');
        break;

      case 'customers':
        // Show top 10 customers by order count
        const customerOrders = {};
        reportData.forEach(item => {
          customerOrders[item.name] = (customerOrders[item.name] || 0) + 1;
        });
        processed = Object.entries(customerOrders)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10)
          .map(([name, value]) => ({ name, value }));
        setChartType('bar');
        break;

      case 'suppliers':
        // Show suppliers by company
        const supplierCount = {};
        reportData.forEach(item => {
          const name = item.company || item.name;
          supplierCount[name] = (supplierCount[name] || 0) + 1;
        });
        processed = Object.entries(supplierCount)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10)
          .map(([name, value]) => ({ name, value }));
        setChartType('bar');
        break;

      case 'quotations':
        // Group by status
        const quoteStatus = reportData.reduce((acc, item) => {
          acc[item.status] = (acc[item.status] || 0) + 1;
          return acc;
        }, {});
        processed = Object.entries(quoteStatus).map(([name, value]) => ({ name, value }));
        setChartType('pie');
        break;

      case 'tax_summary':
        const taxByPeriod = reportData.reduce((acc, item) => {
          const key = item.period ? new Date(item.period).toLocaleDateString() : 'Unknown';
          acc[key] = (acc[key] || 0) + Number(item.amount || 0);
          return acc;
        }, {});
        processed = Object.entries(taxByPeriod)
          .slice(0, 14)
          .map(([name, value]) => ({ name, value: Math.round(value) }));
        setChartType('bar');
        break;

      default:
        processed = [];
    }

    setChartData(processed);
  };

  const fetchReport = async () => {
    if (!dateFrom || !dateTo) {
      toast.error("Please select date range");
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams({
        type: reportType,
        dateFrom,
        dateTo
      });

      const res = await API.get(`/reports?${params}`);
      console.log("Report data:", res.data);
      setReportData(res.data);
      
      if (res.data.length === 0) {
        toast.info("No data found for the selected period");
      } else {
        toast.success(`Report generated with ${res.data.length} records`);
      }
    } catch (err) {
      console.error("Fetch report error:", err);
      toast.error(err.response?.data?.message || "Failed to generate report");
    } finally {
      setLoading(false);
    }
  };

  const downloadExcel = () => {
    if (reportData.length === 0) {
      toast.warning("No data to download");
      return;
    }

    setDownloading(prev => ({ ...prev, excel: true }));

    try {
      // Normalize rows so SheetJS receives plain serializable values.
      const amountLikeKeys = ['amount', 'total', 'price', 'subtotal', 'tax', 'vat', 'quantity'];
      const excludedExportKeys = new Set(['signature_image', 'items_json']);
      const headers = Array.from(
        reportData.reduce((acc, row) => {
          Object.keys(row || {}).forEach((key) => {
            if (!excludedExportKeys.has(key)) acc.add(key);
          });
          return acc;
        }, new Set())
      );

      const normalizedRows = reportData.map((row) => {
        const normalized = {};

        headers.forEach((key) => {
          const rawValue = row?.[key];

          if (rawValue === null || rawValue === undefined) {
            normalized[key] = '';
            return;
          }

          if (rawValue instanceof Date) {
            normalized[key] = rawValue.toLocaleDateString();
            return;
          }

          if (typeof rawValue === 'object') {
            normalized[key] = JSON.stringify(rawValue);
            return;
          }

          const keyLower = key.toLowerCase();
          const looksNumeric = amountLikeKeys.some((token) => keyLower.includes(token));
          if (looksNumeric) {
            const numericValue = Number(rawValue);
            normalized[key] = Number.isFinite(numericValue) ? numericValue : rawValue;
            return;
          }

          if (typeof rawValue === 'string' && rawValue.length > 32767) {
            normalized[key] = `${rawValue.slice(0, 32764)}...`;
            return;
          }

          normalized[key] = rawValue;
        });

        return normalized;
      });

      // Create worksheet
      const ws = XLSX.utils.json_to_sheet(normalizedRows, { header: headers });
      
      // Create workbook
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Report");
      
      // Generate filename
      const filename = `${reportType}_report_${dateFrom.replace(/\//g, '-')}_to_${dateTo.replace(/\//g, '-')}.xlsx`;
      
      // Save file through blob URL for better browser compatibility.
      const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const excelBlob = new Blob([excelBuffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      const blobUrl = URL.createObjectURL(excelBlob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
      
      toast.success("Excel file downloaded successfully!");
    } catch (err) {
      console.error("Excel download error:", err);
      toast.error("Failed to download Excel file");
    } finally {
      setDownloading(prev => ({ ...prev, excel: false }));
    }
  };

  const downloadPDF = () => {
    if (reportData.length === 0) {
      toast.warning("No data to download");
      return;
    }

    setDownloading(prev => ({ ...prev, pdf: true }));

    try {
      // Create PDF document
      const doc = new jsPDF();
      
      // Add title
      const reportLabel = reportTypes.find(t => t.value === reportType)?.label || reportType;
      doc.setFontSize(18);
      doc.text(`${reportLabel}`, 14, 22);
      
      // Add date range
      doc.setFontSize(11);
      doc.text(`Period: ${new Date(dateFrom).toLocaleDateString()} to ${new Date(dateTo).toLocaleDateString()}`, 14, 32);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 38);
      
      // Prepare table data
      const headers = Object.keys(reportData[0]).map(key => ({
        header: key.replace(/_/g, ' ').toUpperCase(),
        dataKey: key
      }));
      
      const rows = reportData.map(item => 
        headers.map(header => {
          const value = item[header.dataKey];
          if (header.dataKey.includes('date') && value) {
            return new Date(value).toLocaleDateString();
          }
          if ((header.dataKey.includes('amount') || header.dataKey.includes('total') || header.dataKey.includes('price')) && value) {
            return `₦${Number(value).toLocaleString()}`;
          }
          return value || '-';
        })
      );
      
      // Add table
      doc.autoTable({
        head: [headers.map(h => h.header)],
        body: rows,
        startY: 45,
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [59, 130, 246], textColor: 255 }
      });
      
      // Add summary for invoice report
      if (reportType === 'invoice' && reportData.length > 0) {
        const totalAmount = reportData.reduce((sum, item) => sum + Number(item.total || 0), 0);
        const finalY = doc.lastAutoTable.finalY + 10;
        doc.setFontSize(10);
        doc.text(`Total Sales Amount: ₦${totalAmount.toLocaleString()}`, 14, finalY);
        doc.text(`Number of Invoices: ${reportData.length}`, 14, finalY + 6);
        
        // Calculate average invoice value
        const avgAmount = totalAmount / reportData.length;
        doc.text(`Average Invoice Value: ₦${Math.round(avgAmount).toLocaleString()}`, 14, finalY + 12);
      }
      
      // Save PDF
      const filename = `${reportType}_report_${dateFrom}_to_${dateTo}.pdf`;
      doc.save(filename);
      
      toast.success("PDF file downloaded successfully!");
    } catch (err) {
      console.error("PDF download error:", err);
      toast.error("Failed to download PDF file");
    } finally {
      setDownloading(prev => ({ ...prev, pdf: false }));
    }
  };

  const formatCurrency = (value) => `₦${(value / 1000000).toFixed(1)}M`;

  const getTableHeaders = () => {
    if (reportData.length === 0) return [];
    return Object.keys(reportData[0]);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString();
  };

  const formatValue = (key, value) => {
    if (key.includes('date') || key.includes('_date')) {
      return formatDate(value);
    }
    if (key.includes('amount') || key.includes('total') || key.includes('price') || key.includes('subtotal')) {
      return `₦${Number(value || 0).toLocaleString()}`;
    }
    return value || '-';
  };

  const renderChart = () => {
    if (chartData.length === 0) {
      return (
        <div className="flex items-center justify-center h-full text-gray-400 italic text-sm">
          Generate a report to see chart
        </div>
      );
    }

    switch (chartType) {
      case 'pie':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value) => [`${value} records`, 'Count']}
                contentStyle={{
                  backgroundColor: darkMode ? '#1e293b' : '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  color: darkMode ? '#e5e7eb' : '#111827',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        );

      case 'bar':
      default:
        return (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke={darkMode ? '#334155' : '#f0f0f0'}
              />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: darkMode ? '#cbd5f5' : '#94a3b8' }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: darkMode ? '#cbd5f5' : '#94a3b8' }}
              />
              <Tooltip
                cursor={{ fill: darkMode ? '#1e293b' : '#f8fafc' }}
                formatter={(value) => {
                  if (reportType === 'invoice') {
                    return [`₦${(value * 1000).toLocaleString()}`, 'Sales'];
                  }
                  if (reportType === 'tax_summary') {
                    return [`₦${Number(value || 0).toLocaleString()}`, 'Tax'];
                  }
                  return [`${value} records`, 'Count'];
                }}
                contentStyle={{
                  backgroundColor: darkMode ? '#1e293b' : '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  color: darkMode ? '#e5e7eb' : '#111827',
                }}
              />
              <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
            </BarChart>
          </ResponsiveContainer>
        );
    }
  };

  const totalPages = Math.max(1, Math.ceil(reportData.length / PAGE_SIZE));
  const paginatedReportData = reportData.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const calculateSummary = () => {
    if (reportData.length === 0) return null;

    if (reportType === 'invoice') {
      const totalAmount = reportData.reduce((sum, item) => sum + Number(item.total || 0), 0);
      const totalQuantity = reportData.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
      const avgAmount = totalAmount / reportData.length;
      
      // Group by month for trend
      const monthlyData = {};
      reportData.forEach(item => {
        if (item.invoice_date) {
          const date = new Date(item.invoice_date);
          const month = date.toLocaleString('default', { month: 'long' });
          monthlyData[month] = (monthlyData[month] || 0) + (item.total || 0);
        }
      });

      return {
        totalAmount,
        totalQuantity,
        avgAmount,
        invoiceCount: reportData.length,
        monthlyData
      };
    }

    if (reportType === 'inventory') {
      const totalValue = reportData.reduce((sum, item) => 
        sum + (Number(item.selling_price || 0) * Number(item.current_stock || 0)), 0
      );
      return { totalItems: reportData.length, totalValue };
    }

    return null;
  };

  const summary = calculateSummary();

  return (
    <div
      className={`flex min-h-screen font-sans transition-colors ${
        darkMode ? 'bg-slate-900 text-slate-200' : 'bg-[#f8fafc] text-slate-800'
      }`}
    >
      <ToastContainer position="top-right" autoClose={2500} hideProgressBar />
      
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
            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-4 items-end">
              {/* Report Type */}
              <div className="space-y-1 md:col-span-2">
                <label className={`text-[11px] font-semibold uppercase ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                  Report Type
                </label>
                <select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                  className={`w-full rounded px-3 py-1.5 text-sm outline-none focus:ring-1 focus:ring-blue-500 transition-colors ${
                    darkMode
                      ? 'bg-slate-700 border-slate-600 text-slate-200'
                      : 'bg-white border border-gray-300 text-slate-800'
                  }`}
                >
                  {reportTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date From */}
              <div className="space-y-1">
                <label className={`text-[11px] font-semibold uppercase ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                  Date From
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className={`w-full rounded px-3 py-1.5 text-sm outline-none transition-colors ${
                      darkMode ? 'bg-slate-700 border-slate-600 text-slate-200' : 'bg-white border border-gray-300 text-slate-800'
                    }`}
                  />
                </div>
              </div>

              {/* Date To */}
              <div className="space-y-1">
                <label className={`text-[11px] font-semibold uppercase ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                  Date To
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className={`w-full rounded px-3 py-1.5 text-sm outline-none transition-colors ${
                      darkMode ? 'bg-slate-700 border-slate-600 text-slate-200' : 'bg-white border border-gray-300 text-slate-800'
                    }`}
                  />
                </div>
              </div>

              {/* Generate Report Button */}
              <div>
                <button
                  onClick={fetchReport}
                  disabled={loading}
                  className="w-full flex items-center justify-center transition-colors bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded text-sm font-medium disabled:opacity-50"
                >
                  {loading ? (
                    <Loader size={16} className="mr-2 animate-spin" />
                  ) : (
                    <FileText size={16} className="mr-2" />
                  )}
                  {loading ? 'Generating...' : 'Generate'}
                </button>
              </div>

              {/* Excel Download Button */}
              <div>
                <button
                  onClick={downloadExcel}
                  disabled={reportData.length === 0 || downloading.excel}
                  className="w-full flex items-center justify-center transition-colors bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded text-sm font-medium disabled:opacity-50"
                >
                  {downloading.excel ? (
                    <Loader size={16} className="mr-2 animate-spin" />
                  ) : (
                    <FileSpreadsheet size={16} className="mr-2" />
                  )}
                  Excel
                </button>
              </div>

              {/* PDF Download Button */}
              {/* <div>
                <button
                  onClick={downloadPDF}
                  disabled={reportData.length === 0 || downloading.pdf}
                  className="w-full flex items-center justify-center transition-colors bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded text-sm font-medium disabled:opacity-50"
                >
                  {downloading.pdf ? (
                    <Loader size={16} className="mr-2 animate-spin" />
                  ) : (
                    <FilePdf size={16} className="mr-2" />
                  )}
                  PDF
                </button>
              </div> */}
            </div>
          </div>

          {/* Summary Cards (only show for invoice and inventory reports) */}
          {summary && reportData.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {reportType === 'invoice' && (
                <>
                  <div className={`p-4 rounded-lg ${darkMode ? 'bg-slate-700' : 'bg-blue-50'}`}>
                    <p className="text-xs uppercase opacity-60">Total Sales</p>
                    <p className="text-xl font-bold">₦{summary.totalAmount.toLocaleString()}</p>
                  </div>
                  <div className={`p-4 rounded-lg ${darkMode ? 'bg-slate-700' : 'bg-green-50'}`}>
                    <p className="text-xs uppercase opacity-60">Number of Invoices</p>
                    <p className="text-xl font-bold">{summary.invoiceCount}</p>
                  </div>
                  <div className={`p-4 rounded-lg ${darkMode ? 'bg-slate-700' : 'bg-yellow-50'}`}>
                    <p className="text-xs uppercase opacity-60">Total Quantity</p>
                    <p className="text-xl font-bold">{summary.totalQuantity}</p>
                  </div>
                  <div className={`p-4 rounded-lg ${darkMode ? 'bg-slate-700' : 'bg-purple-50'}`}>
                    <p className="text-xs uppercase opacity-60">Average Invoice</p>
                    <p className="text-xl font-bold">₦{Math.round(summary.avgAmount).toLocaleString()}</p>
                  </div>
                </>
              )}

              {reportType === 'inventory' && (
                <>
                  <div className={`p-4 rounded-lg ${darkMode ? 'bg-slate-700' : 'bg-blue-50'}`}>
                    <p className="text-xs uppercase opacity-60">Total Items</p>
                    <p className="text-xl font-bold">{summary.totalItems}</p>
                  </div>
                  <div className={`p-4 rounded-lg ${darkMode ? 'bg-slate-700' : 'bg-green-50'}`}>
                    <p className="text-xs uppercase opacity-60">Total Value</p>
                    <p className="text-xl font-bold">₦{summary.totalValue.toLocaleString()}</p>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Dynamic Chart based on report type */}
            <div
              className={`rounded-lg shadow-sm transition-colors ${
                darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border border-gray-200'
              }`}
            >
              <div
                className={`px-4 py-3 border-b transition-colors flex justify-between items-center ${
                  darkMode ? 'border-slate-700' : 'border-gray-100'
                }`}
              >
                <h2 className={`text-sm font-bold ${darkMode ? 'text-slate-100' : 'text-gray-700'}`}>
                  {reportTypes.find(t => t.value === reportType)?.label} - {reportType === 'invoice' ? 'Monthly Sales' : 'Distribution'}
                </h2>
                <span className="text-xs opacity-60">
                  {chartType === 'pie' ? 'Pie Chart' : 'Bar Chart'}
                </span>
              </div>
              <div className="p-4 h-[350px]">
                <div className="flex justify-center mb-2">
                  <div className="flex items-center text-[10px] text-gray-500">
                    <span className="w-3 h-3 bg-blue-500 mr-1 rounded-sm"></span> 
                    {reportType === 'invoice' ? 'Sales (₦ thousands)' : 'Records by Category'}
                  </div>
                </div>
                {renderChart()}
              </div>
            </div>

            {/* Summary Stats */}
            <div
              className={`rounded-lg shadow-sm transition-colors ${
                darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border border-gray-200'
              }`}
            >
              <div className={`px-4 py-3 border-b transition-colors ${darkMode ? 'border-slate-700' : 'border-gray-100'}`}>
                <h2 className={`text-sm font-bold ${darkMode ? 'text-slate-100' : 'text-gray-700'}`}>
                  Report Summary
                </h2>
              </div>
              <div className="p-4 h-[350px] overflow-y-auto">
                {reportData.length > 0 ? (
                  <div className="space-y-4">
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                      <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                        Total Records: <span className="text-2xl ml-2">{reportData.length}</span>
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      {Object.entries(reportData[0]).slice(0, 8).map(([key, value]) => (
                        <div key={key} className="bg-slate-100 dark:bg-slate-700 p-3 rounded-lg">
                          <span className="text-xs opacity-60 block mb-1 uppercase">{key.replace(/_/g, ' ')}</span>
                          <span className="font-medium text-sm truncate block">
                            {formatValue(key, value)}
                          </span>
                        </div>
                      ))}
                    </div>

                    {chartData.length > 0 && chartType === 'pie' && (
                      <div className="mt-4">
                        <h3 className="text-xs font-bold uppercase mb-2 opacity-60">Distribution</h3>
                        <div className="space-y-2">
                          {chartData.map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between">
                              <div className="flex items-center">
                                <span className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></span>
                                <span className="text-sm">{item.name}</span>
                              </div>
                              <span className="text-sm font-semibold">{item.value}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400 italic text-sm">
                    Generate a report to see summary
                  </div>
                )}
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
                Detailed Report Data - {reportTypes.find(t => t.value === reportType)?.label}
              </h2>
            </div>
            <div className="p-4 overflow-x-auto">
              {reportData.length > 0 ? (
                <table className="w-full text-sm">
                  <thead>
                    <tr className={`border-b ${darkMode ? 'border-slate-700' : 'border-gray-200'}`}>
                      {getTableHeaders().map(header => (
                        <th key={header} className="px-3 py-2 text-left text-xs font-bold uppercase opacity-60">
                          {header.replace(/_/g, ' ')}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedReportData.map((row, idx) => (
                      <tr key={idx} className={`hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors`}>
                        {Object.entries(row).map(([key, value], cellIdx) => (
                          <td key={cellIdx} className="px-3 py-2 border-b border-slate-100 dark:border-slate-700">
                            {formatValue(key, value)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className={`text-sm italic flex items-center justify-center ${darkMode ? 'text-slate-300' : 'text-gray-500'} h-16`}>
                  {loading ? 'Loading...' : 'No data available. Generate a report to see results.'}
                </div>
              )}
            </div>
            {reportData.length > 0 && (
              <div className="flex flex-col md:flex-row justify-between items-center gap-2 px-4 pb-4 text-xs transition-colors">
                <span className="italic">{`Showing ${(currentPage - 1) * PAGE_SIZE + 1} to ${Math.min(currentPage * PAGE_SIZE, reportData.length)} of ${reportData.length} entries`}</span>
                <div className="flex gap-1">
                  <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-3 py-1.5 border rounded disabled:opacity-50">Previous</button>
                  <button onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-4 py-1.5 bg-gray-800 text-white rounded disabled:opacity-50">Next</button>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default ReportsAnalytics;