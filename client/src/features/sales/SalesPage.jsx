import { useState, useEffect } from 'react';
import { salesService } from './sales.service';
import { reportService } from '../reports/report.service';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';

export default function SalesPage() {
  const [sales, setSales] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedSale, setSelectedSale] = useState(null);
  const [filters, setFilters] = useState({
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    loadSales();
    loadStats();
  }, [filters]);

  const loadSales = async () => {
    try {
      setLoading(true);
      const data = await salesService.getAll(filters);
      setSales(data);
    } catch (error) {
      console.error('Failed to load sales:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const data = await reportService.getSales(filters);
      setStats(data);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const viewSaleDetails = async (sale) => {
    try {
      const data = await salesService.getById(sale.id);
      setSelectedSale(data);
    } catch (error) {
      console.error('Failed to load sale details:', error);
    }
  };

  const handleCancel = async (id) => {
    if (!confirm('Are you sure you want to cancel this sale? Stock will be restored.')) return;
    try {
      await salesService.cancel(id, 'Cancelled by user');
      loadSales();
      loadStats();
    } catch (error) {
      console.error('Failed to cancel sale:', error);
      alert(error.response?.data?.message || 'Failed to cancel sale');
    }
  };

  const chartData = stats?.dailySales?.map(item => ({
    date: new Date(item.date).toLocaleDateString(),
    revenue: parseFloat(item.revenue),
    transactions: item.transactions
  })) || [];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Sales History</h1>

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
      </div>

      {/* Stats Summary */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-blue-600">Total Revenue</p>
            <p className="text-2xl font-bold">${parseFloat(stats.summary.total_revenue).toFixed(2)}</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <p className="text-sm text-green-600">Transactions</p>
            <p className="text-2xl font-bold">{stats.summary.total_transactions}</p>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg">
            <p className="text-sm text-yellow-600">Avg. Transaction</p>
            <p className="text-2xl font-bold">${parseFloat(stats.summary.avg_transaction).toFixed(2)}</p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <p className="text-sm text-purple-600">Total Discounts</p>
            <p className="text-2xl font-bold">${parseFloat(stats.summary.total_discounts).toFixed(2)}</p>
          </div>
        </div>
      )}

      {/* Chart */}
      {chartData.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Sales Trend</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
              <Line type="monotone" dataKey="revenue" stroke="#3B82F6" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Sales Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cashier</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Items</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr><td colSpan="8" className="px-6 py-4 text-center">Loading...</td></tr>
            ) : sales.length === 0 ? (
              <tr><td colSpan="8" className="px-6 py-4 text-center text-gray-500">No sales found</td></tr>
            ) : (
              sales.map((sale) => (
                <tr key={sale.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium">#{sale.id}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(sale.created_at).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-sm">{sale.cashier_name || 'Unknown'}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {sale.customer_name || '-'}
                  </td>
                  <td className="px-6 py-4 text-sm">{sale.item_count}</td>
                  <td className="px-6 py-4 text-sm font-medium">
                    ${parseFloat(sale.total_amount).toFixed(2)}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      sale.status === 'completed' ? 'bg-green-100 text-green-800' :
                      sale.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {sale.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <Button variant="outline" size="sm" onClick={() => viewSaleDetails(sale)}>View</Button>
                    {sale.status === 'completed' && (
                      <Button variant="danger" size="sm" onClick={() => handleCancel(sale.id)}>Cancel</Button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Sale Details Modal */}
      <Modal isOpen={!!selectedSale} onClose={() => setSelectedSale(null)} title={`Sale #${selectedSale?.id}`} size="lg">
        {selectedSale && (
          <div>
            <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
              <div>
                <p className="text-gray-500">Date</p>
                <p>{new Date(selectedSale.created_at).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-gray-500">Cashier</p>
                <p>{selectedSale.cashier_name || 'Unknown'}</p>
              </div>
              <div>
                <p className="text-gray-500">Customer</p>
                <p>{selectedSale.customer_name || 'Walk-in'}</p>
              </div>
              <div>
                <p className="text-gray-500">Payment</p>
                <p className="capitalize">{selectedSale.payment_method}</p>
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-medium mb-2">Items</h4>
              <div className="space-y-2">
                {selectedSale.items?.map((item, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span>{item.medicine_name} x {item.quantity}</span>
                    <span>${parseFloat(item.subtotal).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t mt-4 pt-4 space-y-2">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>${(parseFloat(selectedSale.total_amount) + parseFloat(selectedSale.discount || 0) - parseFloat(selectedSale.tax || 0)).toFixed(2)}</span>
              </div>
              {selectedSale.discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount</span>
                  <span>-${parseFloat(selectedSale.discount).toFixed(2)}</span>
                </div>
              )}
              {selectedSale.tax > 0 && (
                <div className="flex justify-between">
                  <span>Tax</span>
                  <span>${parseFloat(selectedSale.tax).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-lg">
                <span>Total</span>
                <span>${parseFloat(selectedSale.total_amount).toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}