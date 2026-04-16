import { useState, useEffect } from 'react';
import { reportService } from './report.service';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState('sales');
  const [inventory, setInventory] = useState(null);
  const [sales, setSales] = useState(null);
  const [expiry, setExpiry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    loadReports();
  }, [filters]);

  const loadReports = async () => {
    try {
      setLoading(true);
      const [inv, sal, exp] = await Promise.all([
        reportService.getInventory(),
        reportService.getSales(filters),
        reportService.getExpiry({ days: 180 })
      ]);
      setInventory(inv);
      setSales(sal);
      setExpiry(exp);
    } catch (error) {
      console.error('Failed to load reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

  const salesChartData = sales?.dailySales?.map(item => ({
    date: new Date(item.date).toLocaleDateString(),
    revenue: parseFloat(item.revenue),
    transactions: item.transactions
  })) || [];

  const categoryData = sales?.categorySales?.map(item => ({
    name: item.category || 'Uncategorized',
    value: parseFloat(item.total_revenue)
  })) || [];

  if (loading) {
    return (
      <div className="p-6 flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Reports & Analytics</h1>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {['sales', 'inventory', 'expiry'].map((tab) => (
          <Button
            key={tab}
            variant={activeTab === tab ? 'primary' : 'outline'}
            onClick={() => setActiveTab(tab)}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)} Report
          </Button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <Input
          type="date"
          label="Start Date"
          value={filters.start_date}
          onChange={(e) => setFilters({...filters, start_date: e.target.value})}
        />
        <Input
          type="date"
          label="End Date"
          value={filters.end_date}
          onChange={(e) => setFilters({...filters, end_date: e.target.value})}
        />
        <Button variant="outline" onClick={loadReports}>Refresh</Button>
        <Button variant="outline" onClick={() => window.print()}>Print Report</Button>
      </div>

      {/* Sales Report */}
      {activeTab === 'sales' && sales && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-600">Total Revenue</p>
              <p className="text-2xl font-bold">${parseFloat(sales.summary.total_revenue).toFixed(2)}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-sm text-green-600">Transactions</p>
              <p className="text-2xl font-bold">{sales.summary.total_transactions}</p>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <p className="text-sm text-yellow-600">Avg. Transaction</p>
              <p className="text-2xl font-bold">${parseFloat(sales.summary.avg_transaction).toFixed(2)}</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <p className="text-sm text-purple-600">Total Discounts</p>
              <p className="text-2xl font-bold">${parseFloat(sales.summary.total_discounts).toFixed(2)}</p>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Revenue Trend</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={salesChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
                  <Line type="monotone" dataKey="revenue" stroke="#3B82F6" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Sales by Category</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Top Medicines */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Top Selling Medicines</h3>
            <table className="min-w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Medicine</th>
                  <th className="text-left py-2">Category</th>
                  <th className="text-right py-2">Quantity Sold</th>
                  <th className="text-right py-2">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {sales.topMedicines.map((med, index) => (
                  <tr key={index} className="border-b">
                    <td className="py-2">{med.name}</td>
                    <td className="py-2 text-gray-500">{med.category || '-'}</td>
                    <td className="py-2 text-right">{med.total_qty}</td>
                    <td className="py-2 text-right font-medium">${parseFloat(med.total_revenue).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Inventory Report */}
      {activeTab === 'inventory' && inventory && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-600">Total Medicines</p>
              <p className="text-2xl font-bold">{inventory.summary.totalMedicines}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-sm text-green-600">Total Value</p>
              <p className="text-2xl font-bold">${inventory.summary.totalValue.toFixed(2)}</p>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <p className="text-sm text-yellow-600">Low Stock</p>
              <p className="text-2xl font-bold">{inventory.summary.lowStockCount}</p>
            </div>
            <div className="bg-red-50 p-4 rounded-lg">
              <p className="text-sm text-red-600">Expiring Soon</p>
              <p className="text-2xl font-bold">{inventory.summary.expiringCount}</p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left">Medicine</th>
                  <th className="px-4 py-2 text-left">Category</th>
                  <th className="px-4 py-2 text-right">Stock</th>
                  <th className="px-4 py-2 text-right">Price</th>
                  <th className="px-4 py-2 text-left">Supplier</th>
                  <th className="px-4 py-2 text-left">Expiry</th>
                </tr>
              </thead>
              <tbody>
                {inventory.medicines.map((med) => (
                  <tr key={med.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-2">
                      <div className="font-medium">{med.name}</div>
                      {med.generic_name && <div className="text-sm text-gray-500">{med.generic_name}</div>}
                    </td>
                    <td className="px-4 py-2">{med.category || '-'}</td>
                    <td className="px-4 py-2 text-right">
                      <span className={`px-2 py-1 rounded text-sm ${
                        med.stock <= med.min_stock ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {med.stock}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-right">${parseFloat(med.price).toFixed(2)}</td>
                    <td className="px-4 py-2">{med.supplier_name || '-'}</td>
                    <td className="px-4 py-2">
                      {med.expiry_date ? new Date(med.expiry_date).toLocaleDateString() : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Expiry Report */}
      {activeTab === 'expiry' && expiry && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-red-50 p-4 rounded-lg">
              <p className="text-sm text-red-600">Total Expiring</p>
              <p className="text-2xl font-bold">{expiry.summary.totalExpiring}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Already Expired</p>
              <p className="text-2xl font-bold">{expiry.summary.expired}</p>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg">
              <p className="text-sm text-orange-600">This Month</p>
              <p className="text-2xl font-bold">{expiry.summary.thisMonth}</p>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <p className="text-sm text-yellow-600">Value at Risk</p>
              <p className="text-2xl font-bold">${expiry.summary.totalValueAtRisk.toFixed(2)}</p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left">Medicine</th>
                  <th className="px-4 py-2 text-left">Category</th>
                  <th className="px-4 py-2 text-right">Stock</th>
                  <th className="px-4 py-2 text-right">Value</th>
                  <th className="px-4 py-2 text-left">Expiry Date</th>
                  <th className="px-4 py-2 text-left">Days Left</th>
                </tr>
              </thead>
              <tbody>
                {expiry.medicines.map((med) => {
                  const daysLeft = Math.ceil((new Date(med.expiry_date) - new Date()) / (1000 * 60 * 60 * 24));
                  return (
                    <tr key={med.id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-2 font-medium">{med.name}</td>
                      <td className="px-4 py-2">{med.category || '-'}</td>
                      <td className="px-4 py-2 text-right">{med.stock}</td>
                      <td className="px-4 py-2 text-right">${(med.price * med.stock).toFixed(2)}</td>
                      <td className="px-4 py-2">{new Date(med.expiry_date).toLocaleDateString()}</td>
                      <td className="px-4 py-2">
                        <span className={`px-2 py-1 rounded text-sm ${
                          daysLeft < 0 ? 'bg-red-100 text-red-800' :
                          daysLeft < 30 ? 'bg-orange-100 text-orange-800' :
                          daysLeft < 90 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {daysLeft < 0 ? 'Expired' : `${daysLeft} days`}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}