import { useState, useEffect } from 'react';
import { auditService } from './audit.service';
import Button from '../../components/ui/Button';

export default function AuditPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    action: '',
    entity_type: '',
    start_date: '',
    end_date: ''
  });
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, pages: 0 });

  useEffect(() => {
    loadLogs();
  }, [pagination.page, filters]);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const data = await auditService.getLogs({
        ...filters,
        page: pagination.page,
        limit: pagination.limit
      });
      setLogs(data.logs);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Failed to load audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters({ ...filters, [key]: value });
    setPagination({ ...pagination, page: 1 });
  };

  const handleClearLogs = async () => {
    if (!confirm('Are you sure you want to clear logs older than 90 days?')) return;

    try {
      await auditService.clearOldLogs(90);
      alert('Old logs cleared successfully');
      loadLogs();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to clear logs');
    }
  };

  const getActionColor = (action) => {
    switch (action) {
      case 'create': return 'bg-green-100 text-green-800';
      case 'update': return 'bg-blue-100 text-blue-800';
      case 'delete': return 'bg-red-100 text-red-800';
      case 'login': return 'bg-purple-100 text-purple-800';
      case 'logout': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Audit Logs</h1>
        <Button variant="outline" onClick={handleClearLogs}>
          Clear Old Logs
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <select
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={filters.action}
            onChange={(e) => handleFilterChange('action', e.target.value)}
          >
            <option value="">All Actions</option>
            <option value="create">Create</option>
            <option value="update">Update</option>
            <option value="delete">Delete</option>
            <option value="login">Login</option>
            <option value="logout">Logout</option>
          </select>

          <select
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={filters.entity_type}
            onChange={(e) => handleFilterChange('entity_type', e.target.value)}
          >
            <option value="">All Entities</option>
            <option value="user">User</option>
            <option value="medicine">Medicine</option>
            <option value="sale">Sale</option>
            <option value="purchase_order">Purchase Order</option>
            <option value="customer">Customer</option>
            <option value="supplier">Supplier</option>
          </select>

          <input
            type="date"
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={filters.start_date}
            onChange={(e) => handleFilterChange('start_date', e.target.value)}
            placeholder="Start Date"
          />

          <input
            type="date"
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={filters.end_date}
            onChange={(e) => handleFilterChange('end_date', e.target.value)}
            placeholder="End Date"
          />
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Timestamp</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Entity</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Details</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr><td colSpan="5" className="px-6 py-4 text-center">Loading...</td></tr>
            ) : logs.length === 0 ? (
              <tr><td colSpan="5" className="px-6 py-4 text-center text-gray-500">No audit logs found</td></tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <div className="font-medium">{log.username || 'System'}</div>
                    {log.full_name && <div className="text-xs text-gray-500">{log.full_name}</div>}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getActionColor(log.action)}`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <div className="font-medium capitalize">{log.entity_type}</div>
                    {log.entity_id && <div className="text-xs text-gray-500">ID: {log.entity_id}</div>}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                    {log.new_values && (
                      <span className="text-green-600">+{JSON.stringify(log.new_values).substring(0, 50)}</span>
                    )}
                    {log.old_values && log.new_values && <br />}
                    {log.old_values && (
                      <span className="text-red-600">-{JSON.stringify(log.old_values).substring(0, 50)}</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          <Button
            variant="outline"
            disabled={pagination.page === 1}
            onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
          >
            Previous
          </Button>
          <span className="px-4 py-2 text-sm text-gray-600">
            Page {pagination.page} of {pagination.pages}
          </span>
          <Button
            variant="outline"
            disabled={pagination.page === pagination.pages}
            onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}