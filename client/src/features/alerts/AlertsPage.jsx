import { useState, useEffect } from 'react';
import { alertService } from './alert.service';
import Button from '../../components/ui/Button';

export default function AlertsPage() {
  const [alerts, setAlerts] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [expiring, setExpiring] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('alerts');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [alertsData, lowStockData, expiringData] = await Promise.all([
        alertService.getAll(),
        alertService.getLowStock(),
        alertService.getExpiring()
      ]);
      setAlerts(alertsData);
      setLowStock(lowStockData);
      setExpiring(expiringData);
    } catch (error) {
      console.error('Failed to load alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkRead = async (id) => {
    try {
      await alertService.markRead(id);
      loadData();
    } catch (error) {
      console.error('Failed to mark alert as read:', error);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await alertService.markAllRead();
      loadData();
      alert('All alerts marked as read');
    } catch (error) {
      console.error('Failed to mark all alerts as read:', error);
    }
  };

  const handleGenerateAlerts = async () => {
    try {
      await alertService.generate();
      loadData();
      alert('Alerts generated successfully');
    } catch (error) {
      console.error('Failed to generate alerts:', error);
    }
  };

  const getAlertColor = (type) => {
    switch (type) {
      case 'low_stock': return 'bg-red-100 text-red-800 border-red-200';
      case 'expiring': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getAlertIcon = (type) => {
    switch (type) {
      case 'low_stock':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        );
      case 'expiring':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        );
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Stock Alerts</h1>
        <div className="flex gap-3">
          <Button variant="outline" onClick={handleGenerateAlerts}>
            Refresh Alerts
          </Button>
          <Button variant="outline" onClick={handleMarkAllRead}>
            Mark All Read
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b mb-6">
        <button
          className={`px-4 py-2 font-medium ${activeTab === 'alerts' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
          onClick={() => setActiveTab('alerts')}
        >
          All Alerts ({alerts.filter(a => !a.is_read).length})
        </button>
        <button
          className={`px-4 py-2 font-medium ${activeTab === 'low' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
          onClick={() => setActiveTab('low')}
        >
          Low Stock ({lowStock.length})
        </button>
        <button
          className={`px-4 py-2 font-medium ${activeTab === 'expiring' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
          onClick={() => setActiveTab('expiring')}
        >
          Expiring Soon ({expiring.length})
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-500">Loading alerts...</p>
        </div>
      ) : (
        <div className="space-y-4">
          {activeTab === 'alerts' && (
            <>
              {alerts.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg shadow">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No alerts</h3>
                  <p className="mt-1 text-sm text-gray-500">All systems are running smoothly.</p>
                </div>
              ) : (
                alerts.map((alert) => (
                  <div key={alert.id} className={`p-4 rounded-lg border ${getAlertColor(alert.alert_type)} ${alert.is_read ? 'opacity-60' : ''}`}>
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-0.5">{getAlertIcon(alert.alert_type)}</div>
                      <div className="flex-1">
                        <div className="flex justify-between">
                          <div>
                            <p className="font-medium">{alert.medicine_name}</p>
                            <p className="text-sm mt-1">{alert.message}</p>
                          </div>
                          {!alert.is_read && (
                            <button
                              onClick={() => handleMarkRead(alert.id)}
                              className="text-sm underline"
                            >
                              Mark as read
                            </button>
                          )}
                        </div>
                        <p className="text-xs mt-2 opacity-75">
                          {new Date(alert.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </>
          )}

          {activeTab === 'low' && (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              {lowStock.length === 0 ? (
                <div className="p-8 text-center text-gray-500">No low stock items</div>
              ) : (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Medicine</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Current Stock</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Min Stock</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Supplier</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {lowStock.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm font-medium">{item.name}</td>
                        <td className="px-6 py-4 text-sm text-red-600 font-bold">{item.stock}</td>
                        <td className="px-6 py-4 text-sm text-gray-500">{item.min_stock}</td>
                        <td className="px-6 py-4 text-sm text-gray-500">{item.supplier_name || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {activeTab === 'expiring' && (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              {expiring.length === 0 ? (
                <div className="p-8 text-center text-gray-500">No medicines expiring soon</div>
              ) : (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Medicine</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Expiry Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Days Left</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Supplier</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {expiring.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm font-medium">{item.name}</td>
                        <td className="px-6 py-4 text-sm">{item.stock}</td>
                        <td className="px-6 py-4 text-sm text-orange-600">{new Date(item.expiry_date).toLocaleDateString()}</td>
                        <td className="px-6 py-4 text-sm text-orange-600 font-bold">{item.days_until_expiry}</td>
                        <td className="px-6 py-4 text-sm text-gray-500">{item.supplier_name || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}