import { useState, useEffect } from 'react';
import { inventoryService } from './inventory.service';
import { medicineService } from '../medicines/medicine.service';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';

export default function InventoryAdjustmentsPage() {
  const { user } = useAuth();
  const [adjustments, setAdjustments] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [typeFilter, setTypeFilter] = useState('');
  const [formData, setFormData] = useState({
    medicine_id: '',
    type: 'damaged',
    quantity: 1,
    reason: ''
  });

  useEffect(() => {
    loadAdjustments();
    loadMedicines();
  }, [typeFilter]);

  const loadAdjustments = async () => {
    try {
      setLoading(true);
      const data = await inventoryService.getAdjustments({ type: typeFilter });
      setAdjustments(data);
    } catch (error) {
      console.error('Failed to load adjustments:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMedicines = async () => {
    try {
      const data = await medicineService.getAll();
      setMedicines(data);
    } catch (error) {
      console.error('Failed to load medicines:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.medicine_id || formData.quantity < 1) {
      alert('Please select a medicine and enter a valid quantity');
      return;
    }

    try {
      await inventoryService.createAdjustment({
        user_id: user.id,
        medicine_id: parseInt(formData.medicine_id),
        type: formData.type,
        quantity: parseInt(formData.quantity),
        reason: formData.reason
      });
      
      setShowModal(false);
      resetForm();
      loadAdjustments();
      alert('Inventory adjusted successfully');
    } catch (error) {
      console.error('Failed to adjust inventory:', error);
      alert(error.response?.data?.message || 'Failed to adjust inventory');
    }
  };

  const resetForm = () => {
    setFormData({
      medicine_id: '',
      type: 'damaged',
      quantity: 1,
      reason: ''
    });
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'damaged': return 'bg-red-100 text-red-800';
      case 'lost': return 'bg-orange-100 text-orange-800';
      case 'found': return 'bg-green-100 text-green-800';
      case 'returned': return 'bg-blue-100 text-blue-800';
      case 'count': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case 'damaged': return 'Damaged';
      case 'lost': return 'Lost';
      case 'found': return 'Found';
      case 'returned': return 'Returned';
      case 'count': return 'Stock Count';
      default: return type;
    }
  };

  const getTypeEffect = (type) => {
    switch (type) {
      case 'damaged':
      case 'lost':
        return 'Decreases stock';
      case 'found':
      case 'returned':
        return 'Increases stock';
      case 'count':
        return 'Sets new stock level';
      default:
        return '';
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Inventory Adjustments</h1>
        <Button onClick={() => { resetForm(); setShowModal(true); }}>
          + New Adjustment
        </Button>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-red-50 p-4 rounded-lg">
          <p className="text-sm text-red-600 font-medium">Damaged</p>
          <p className="text-2xl font-bold text-red-700">Items removed</p>
        </div>
        <div className="bg-orange-50 p-4 rounded-lg">
          <p className="text-sm text-orange-600 font-medium">Lost</p>
          <p className="text-2xl font-bold text-orange-700">Items missing</p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <p className="text-sm text-green-600 font-medium">Found</p>
          <p className="text-2xl font-bold text-green-700">Items added</p>
        </div>
        <div className="bg-blue-50 p-4 rounded-lg">
          <p className="text-sm text-blue-600 font-medium">Returned</p>
          <p className="text-2xl font-bold text-blue-700">Customer returns</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <select
          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
        >
          <option value="">All Types</option>
          <option value="damaged">Damaged</option>
          <option value="lost">Lost</option>
          <option value="found">Found</option>
          <option value="returned">Returned</option>
          <option value="count">Stock Count</option>
        </select>
      </div>

      {/* Adjustments Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Medicine</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Previous</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">New Stock</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">By</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reason</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr><td colSpan="8" className="px-6 py-4 text-center">Loading...</td></tr>
            ) : adjustments.length === 0 ? (
              <tr><td colSpan="8" className="px-6 py-4 text-center text-gray-500">No adjustments found</td></tr>
            ) : (
              adjustments.map((adj) => (
                <tr key={adj.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(adj.created_at).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium">{adj.medicine_name}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getTypeColor(adj.type)}`}>
                      {getTypeLabel(adj.type)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium">
                    {adj.type === 'count' ? '→ ' : (adj.type === 'damaged' || adj.type === 'lost' ? '-' : '+')}
                    {adj.quantity}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{adj.previous_stock}</td>
                  <td className="px-6 py-4 text-sm font-medium">{adj.new_stock}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{adj.adjusted_by}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{adj.reason || '-'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Create Adjustment Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Inventory Adjustment" size="md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Medicine *</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.medicine_id}
              onChange={(e) => setFormData({ ...formData, medicine_id: e.target.value })}
              required
            >
              <option value="">Select Medicine</option>
              {medicines.map(m => (
                <option key={m.id} value={m.id}>
                  {m.name} (Stock: {m.stock})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Adjustment Type *</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            >
              <option value="damaged">Damaged - Items are unusable</option>
              <option value="lost">Lost - Items are missing</option>
              <option value="found">Found - Items were found</option>
              <option value="returned">Returned - Customer returned</option>
              <option value="count">Stock Count - Correct stock level</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">{getTypeEffect(formData.type)}</p>
          </div>

          <Input
            label={formData.type === 'count' ? 'New Stock Count *' : 'Quantity *'}
            type="number"
            min="1"
            value={formData.quantity}
            onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
            required
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows="2"
              placeholder="Explain the reason for this adjustment..."
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button type="submit">Apply Adjustment</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}