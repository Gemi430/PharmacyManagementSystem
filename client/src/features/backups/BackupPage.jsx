import { useState, useEffect } from 'react';
import { backupService } from './backup.service';
import Button from '../../components/ui/Button';

export default function BackupPage() {
  const [backups, setBackups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadBackups();
  }, []);

  const loadBackups = async () => {
    try {
      setLoading(true);
      const data = await backupService.getAll();
      setBackups(data);
    } catch (error) {
      console.error('Failed to load backups:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBackup = async () => {
    if (!confirm('Are you sure you want to create a new backup?')) return;

    try {
      setCreating(true);
      await backupService.create({ backup_type: 'full' });
      alert('Backup created successfully');
      loadBackups();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to create backup');
    } finally {
      setCreating(false);
    }
  };

  const handleRestore = async (id) => {
    if (!confirm('Are you sure you want to restore this backup? All current data will be replaced.')) return;

    try {
      await backupService.restore(id);
      alert('Backup restored successfully');
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to restore backup');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this backup?')) return;

    try {
      await backupService.delete(id);
      alert('Backup deleted successfully');
      loadBackups();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to delete backup');
    }
  };

  const handleDownload = async (backup) => {
    try {
      await backupService.download(backup.id);
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to download backup');
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '-';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Backup & Restore</h1>
        <Button onClick={handleCreateBackup} disabled={creating}>
          {creating ? 'Creating...' : '+ Create Backup'}
        </Button>
      </div>

      {/* Info Card */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-start">
          <svg className="w-5 h-5 text-blue-600 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h3 className="font-medium text-blue-800">Backup Information</h3>
            <p className="text-sm text-blue-600 mt-1">
              Backups are stored on the server. Use the download button to save copies locally.
              Old backups (older than 30 days) are automatically cleaned up.
            </p>
          </div>
        </div>
      </div>

      {/* Backups Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Filename</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Size</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr><td colSpan="6" className="px-6 py-4 text-center">Loading...</td></tr>
            ) : backups.length === 0 ? (
              <tr><td colSpan="6" className="px-6 py-4 text-center text-gray-500">No backups found</td></tr>
            ) : (
              backups.map((backup) => (
                <tr key={backup.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium">{backup.filename}</td>
                  <td className="px-6 py-4 text-sm text-gray-500 capitalize">{backup.backup_type}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{formatFileSize(backup.file_size)}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(backup.status)}`}>
                      {backup.status}
                    </span>
                    {backup.error_message && (
                      <p className="text-xs text-red-600 mt-1 max-w-xs truncate">{backup.error_message}</p>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(backup.created_at).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <button
                      onClick={() => handleDownload(backup)}
                      className="text-blue-600 hover:text-blue-800 mr-3"
                      disabled={backup.status !== 'completed'}
                    >
                      Download
                    </button>
                    <button
                      onClick={() => handleRestore(backup.id)}
                      className="text-green-600 hover:text-green-800 mr-3"
                      disabled={backup.status !== 'completed'}
                    >
                      Restore
                    </button>
                    <button
                      onClick={() => handleDelete(backup.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}