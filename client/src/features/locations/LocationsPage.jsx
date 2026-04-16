import { useState, useEffect } from 'react';
import { locationService } from './location.service';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';

export default function LocationsPage() {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingLocation, setEditingLocation] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    is_active: true
  });

  useEffect(() => {
    loadLocations();
  }, []);

  const loadLocations = async () => {
    try {
      setLoading(true);
      const data = await locationService.getAll();
      setLocations(data);
    } catch (error) {
      console.error('Failed to load locations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      alert('Location name is required');
      return;
    }

    try {
      if (editingLocation) {
        await locationService.update(editingLocation.id, formData);
        alert('Location updated successfully');
      } else {
        await locationService.create(formData);
        alert('Location created successfully');
      }

      setShowModal(false);
      resetForm();
      loadLocations();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to save location');
    }
  };

  const handleEdit = (location) => {
    setEditingLocation(location);
    setFormData({
      name: location.name,
      address: location.address || '',
      phone: location.phone || '',
      email: location.email || '',
      is_active: location.is_active
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this location?')) return;

    try {
      await locationService.delete(id);
      alert('Location deleted successfully');
      loadLocations();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to delete location');
    }
  };

  const handleToggleActive = async (location) => {
    try {
      await locationService.update(location.id, { is_active: !location.is_active });
      loadLocations();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to update location');
    }
  };

  const resetForm = () => {
    setEditingLocation(null);
    setFormData({ name: '', address: '', phone: '', email: '', is_active: true });
  };

  const openCreateModal = () => {
    resetForm();
    setShowModal(true);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Locations</h1>
        <Button onClick={openCreateModal}>
          + New Location
        </Button>
      </div>

      {/* Locations Grid */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-500">Loading locations...</p>
        </div>
      ) : locations.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No locations</h3>
          <p className="mt-1 text-sm text-gray-500">Get started by adding a new location.</p>
          <div className="mt-6">
            <Button onClick={openCreateModal}>Add Location</Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {locations.map((location) => (
            <div key={location.id} className={`bg-white rounded-lg shadow p-6 ${!location.is_active ? 'opacity-60' : ''}`}>
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">{location.name}</h3>
                  {location.address && (
                    <p className="mt-1 text-sm text-gray-500">{location.address}</p>
                  )}
                  <div className="mt-2 space-y-1 text-sm">
                    {location.phone && (
                      <p className="text-gray-600">📞 {location.phone}</p>
                    )}
                    {location.email && (
                      <p className="text-gray-600">✉️ {location.email}</p>
                    )}
                  </div>
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${location.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                  {location.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <button
                  onClick={() => handleToggleActive(location)}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  {location.is_active ? 'Deactivate' : 'Activate'}
                </button>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(location)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDelete(location.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingLocation ? 'Edit Location' : 'New Location'} size="md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Location Name *"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Enter location name"
            required
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows="3"
              placeholder="Enter address (optional)"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
          </div>

          <Input
            label="Phone"
            type="text"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="Phone number"
          />

          <Input
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="Email address"
          />

          <div className="flex items-center">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
              Active
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button type="submit">{editingLocation ? 'Update' : 'Create'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}