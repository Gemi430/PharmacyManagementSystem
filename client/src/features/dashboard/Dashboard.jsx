import { useState, useEffect } from 'react';
import { reportService } from '../reports/report.service';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import Button from '../../components/ui/Button';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('today');

  useEffect(() => {
    loadStats();
  }, [period]);

  const loadStats = async () => {
    try {
      setLoading(true);
      const data = await reportService.getDashboard();
      setStats(data);
    } catch (error) {
      console.error('Failed to load dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !stats) {
    return (
      <div className="p-6 flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <div className="flex gap-2">
          {['today', 'week', 'month'].map((p) => (
            <Button
              key={p}
              variant={period === p ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setPeriod(p)}
            >
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-full">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-500">Today's Sales</p>
              <p className="text-2xl font-bold">${parseFloat(stats.todaySales.total).toFixed(2)}</p>
              <p className="text-sm text-gray-500">{stats.todaySales.transactions} transactions</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-full">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-500">This Month</p>
              <p className="text-2xl font-bold">${parseFloat(stats.monthSales.total).toFixed(2)}</p>
              <p className="text-sm text-gray-500">{stats.monthSales.transactions} transactions</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-100 rounded-full">
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-500">Low Stock Items</p>
              <p className="text-2xl font-bold">{stats.lowStock}</p>
              <p className="text-sm text-gray-500">Need restocking</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-red-100 rounded-full">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-500">Expiring Soon</p>
              <p className="text-2xl font-bold">{stats.expiringSoon}</p>
              <p className="text-sm text-gray-500">Within 30 days</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Sales */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Recent Sales</h2>
          <div className="space-y-3">
            {stats.recentSales.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No sales today</p>
            ) : (
              stats.recentSales.map((sale) => (
                <div key={sale.id} className="flex justify-between items-center py-3 border-b last:border-0">
                  <div>
                    <p className="font-medium">#{sale.id}</p>
                    <p className="text-sm text-gray-500">{sale.cashier_name || 'Unknown'}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">${parseFloat(sale.total_amount).toFixed(2)}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(sale.created_at).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Top Selling */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Top Selling Today</h2>
          <div className="space-y-3">
            {stats.topSelling.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No sales data</p>
            ) : (
              stats.topSelling.map((item, index) => (
                <div key={index} className="flex justify-between items-center py-3 border-b last:border-0">
                  <div className="flex items-center">
                    <span className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-medium mr-3">
                      {index + 1}
                    </span>
                    <span>{item.name}</span>
                  </div>
                  <span className="font-medium">{item.total_qty} units</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="mt-6 bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Quick Overview</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-3xl font-bold text-blue-600">{stats.totalMedicines}</p>
            <p className="text-gray-600">Total Medicines</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-3xl font-bold text-green-600">{stats.todaySales.transactions}</p>
            <p className="text-gray-600">Today's Transactions</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-3xl font-bold text-yellow-600">{stats.lowStock}</p>
            <p className="text-gray-600">Low Stock Alerts</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-3xl font-bold text-red-600">{stats.expiringSoon}</p>
            <p className="text-gray-600">Expiring Soon</p>
          </div>
        </div>
      </div>
    </div>
  );
}