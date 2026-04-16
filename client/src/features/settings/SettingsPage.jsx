import { useState, useEffect } from 'react';
import { settingService } from './setting.service';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

export default function SettingsPage() {
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    store_name: '',
    store_address: '',
    store_phone: '',
    tax_rate: '',
    currency: '',
    low_stock_threshold: '',
    expiry_warning_days: ''
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const data = await settingService.getDashboard();
      setSettings(data);
      setFormData({
        store_name: data.store_name || '',
        store_address: data.store_address || '',
        store_phone: data.store_phone || '',
        tax_rate: data.tax_rate || '',
        currency: data.currency || '',
        low_stock_threshold: data.low_stock_threshold || '',
        expiry_warning_days: data.expiry_warning_days || ''
      });
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (key, value) => {
    setFormData({ ...formData, [key]: value });
  };

  const handleSave = async (key, value) => {
    try {
      setSaving(true);
      await settingService.upsert({ key, value });
      alert(`${key} updated successfully`);
      loadSettings();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to save setting');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        </div>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-500">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Store Information */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Store Information</h2>
          <div className="space-y-4">
            <Input
              label="Store Name"
              value={formData.store_name}
              onChange={(e) => handleChange('store_name', e.target.value)}
              onBlur={() => handleSave('store_name', formData.store_name)}
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Store Address</label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows="3"
                value={formData.store_address}
                onChange={(e) => handleChange('store_address', e.target.value)}
                onBlur={() => handleSave('store_address', formData.store_address)}
              />
            </div>
            <Input
              label="Store Phone"
              value={formData.store_phone}
              onChange={(e) => handleChange('store_phone', e.target.value)}
              onBlur={() => handleSave('store_phone', formData.store_phone)}
            />
          </div>
        </div>

        {/* Business Settings */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Business Settings</h2>
          <div className="space-y-4">
            <Input
              label="Currency"
              value={formData.currency}
              onChange={(e) => handleChange('currency', e.target.value)}
              onBlur={() => handleSave('currency', formData.currency)}
              placeholder="USD"
            />
            <Input
              label="Tax Rate (%)"
              type="number"
              value={formData.tax_rate}
              onChange={(e) => handleChange('tax_rate', e.target.value)}
              onBlur={() => handleSave('tax_rate', formData.tax_rate)}
              placeholder="10"
            />
            <Input
              label="Low Stock Threshold"
              type="number"
              value={formData.low_stock_threshold}
              onChange={(e) => handleChange('low_stock_threshold', e.target.value)}
              onBlur={() => handleSave('low_stock_threshold', formData.low_stock_threshold)}
              placeholder="10"
            />
            <Input
              label="Expiry Warning (days)"
              type="number"
              value={formData.expiry_warning_days}
              onChange={(e) => handleChange('expiry_warning_days', e.target.value)}
              onBlur={() => handleSave('expiry_warning_days', formData.expiry_warning_days)}
              placeholder="90"
            />
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="mt-6 bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">System Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-blue-600 font-medium">Tax Rate</p>
            <p className="text-2xl font-bold text-blue-700">{settings.tax_rate || 0}%</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <p className="text-sm text-green-600 font-medium">Currency</p>
            <p className="text-2xl font-bold text-green-700">{settings.currency || 'USD'}</p>
          </div>
          <div className="bg-orange-50 p-4 rounded-lg">
            <p className="text-sm text-orange-600 font-medium">Low Stock Alert</p>
            <p className="text-2xl font-bold text-orange-700">{settings.low_stock_threshold || 10} units</p>
          </div>
        </div>
      </div>
    </div>
  );
}