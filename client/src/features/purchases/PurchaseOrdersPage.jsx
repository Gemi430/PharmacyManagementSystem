import { useState, useEffect } from 'react';
import { purchaseService } from './purchase.service';
import { medicineService } from '../medicines/medicine.service';
import { supplierService } from '../suppliers/supplier.service';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';

export default function PurchaseOrdersPage() {
  const { user } = useAuth();
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedPO, setSelectedPO] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [formData, setFormData] = useState({
    supplier_id: '',
    expected_date: '',
    notes: '',
    items: []
  });

  useEffect(() => {
    loadPurchaseOrders();
    loadMedicines();
    loadSuppliers();
  }, [statusFilter]);

  const loadPurchaseOrders = async () => {
    try {
      setLoading(true);
      const data = await purchaseService.getAll({ status: statusFilter });
      setPurchaseOrders(data);
    } catch (error) {
      console.error('Failed to load purchase orders:', error);
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

  const loadSuppliers = async () => {
    try {
      const data = await supplierService.getAll();
      setSuppliers(data);
    } catch (error) {
      console.error('Failed to load suppliers:', error);
    }
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { medicine_id: '', quantity: 1, unit_cost: 0 }]
    });
  };

  const updateItem = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index][field] = value;
    
    // Auto-fill cost when medicine is selected
    if (field === 'medicine_id') {
      const medicine = medicines.find(m => m.id === parseInt(value));
      if (medicine) {
        newItems[index].unit_cost = medicine.cost_price || medicine.price * 0.7;
      }
    }
    
    setFormData({ ...formData, items: newItems });
  };

  const removeItem = (index) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index)
    });
  };

  const calculateTotal = () => {
    return formData.items.reduce((sum, item) => sum + (item.quantity * item.unit_cost), 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.supplier_id || formData.items.length === 0) {
      alert('Please select a supplier and add at least one item');
      return;
    }

    try {
      await purchaseService.create({
        user_id: user.id,
        supplier_id: parseInt(formData.supplier_id),
        expected_date: formData.expected_date,
        notes: formData.notes,
        items: formData.items.map(item => ({
          medicine_id: parseInt(item.medicine_id),
          quantity: parseInt(item.quantity),
          unit_cost: parseFloat(item.unit_cost)
        }))
      });
      
      setShowModal(false);
      resetForm();
      loadPurchaseOrders();
      alert('Purchase order created successfully');
    } catch (error) {
      console.error('Failed to create purchase order:', error);
      alert(error.response?.data?.message || 'Failed to create purchase order');
    }
  };

  const handleStatusUpdate = async (id, newStatus) => {
    try {
      await purchaseService.updateStatus(id, newStatus);
      loadPurchaseOrders();
      alert(`Purchase order ${newStatus} successfully`);
    } catch (error) {
      console.error('Failed to update status:', error);
      alert(error.response?.data?.message || 'Failed to update status');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this purchase order?')) return;
    
    try {
      await purchaseService.delete(id);
      loadPurchaseOrders();
      alert('Purchase order deleted successfully');
    } catch (error) {
      console.error('Failed to delete:', error);
      alert(error.response?.data?.message || 'Failed to delete');
    }
  };

  const resetForm = () => {
    setFormData({
      supplier_id: '',
      expected_date: '',
      notes: '',
      items: []
    });
  };

  const viewDetails = async (po) => {
    try {
      const data = await purchaseService.getById(po.id);
      setSelectedPO(data);
    } catch (error) {
      console.error('Failed to load details:', error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-blue-100 text-blue-800';
      case 'received': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Purchase Orders</h1>
        <Button onClick={() => { resetForm(); setShowModal(true); }}>
          + New Purchase Order
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <select
          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="received">Received</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Purchase Orders Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Supplier</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Items</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr><td colSpan="7" className="px-6 py-4 text-center">Loading...</td></tr>
            ) : purchaseOrders.length === 0 ? (
              <tr><td colSpan="7" className="px-6 py-4 text-center text-gray-500">No purchase orders found</td></tr>
            ) : (
              purchaseOrders.map((po) => (
                <tr key={po.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium">#{po.id}</td>
                  <td className="px-6 py-4 text-sm">{po.supplier_name || '-'}</td>
                  <td className="px-6 py-4 text-sm">{po.total_amount ? 'Multiple items' : '-'}</td>
                  <td className="px-6 py-4 text-sm font-medium">${parseFloat(po.total_amount || 0).toFixed(2)}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(po.status)}`}>
                      {po.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(po.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <Button variant="outline" size="sm" onClick={() => viewDetails(po)}>View</Button>
                    {po.status === 'pending' && (
                      <>
                        <Button variant="success" size="sm" onClick={() => handleStatusUpdate(po.id, 'approved')}>Approve</Button>
                        <Button variant="danger" size="sm" onClick={() => handleStatusUpdate(po.id, 'cancelled')}>Cancel</Button>
                      </>
                    )}
                    {po.status === 'approved' && (
                      <Button variant="primary" size="sm" onClick={() => handleStatusUpdate(po.id, 'received')}>Receive</Button>
                    )}
                    {po.status === 'pending' && (
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(po.id)}>Delete</Button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Create Purchase Order Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Create Purchase Order" size="xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Supplier *</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.supplier_id}
                onChange={(e) => setFormData({ ...formData, supplier_id: e.target.value })}
                required
              >
                <option value="">Select Supplier</option>
                {suppliers.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <Input
              label="Expected Date"
              type="date"
              value={formData.expected_date}
              onChange={(e) => setFormData({ ...formData, expected_date: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows="2"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>

          {/* Items */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700">Items</label>
              <Button type="button" variant="outline" size="sm" onClick={addItem}>+ Add Item</Button>
            </div>

            {formData.items.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-4">No items added yet</p>
            ) : (
              <div className="space-y-2">
                {formData.items.map((item, index) => (
                  <div key={index} className="flex gap-2 items-end p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <label className="text-xs text-gray-500">Medicine</label>
                      <select
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        value={item.medicine_id}
                        onChange={(e) => updateItem(index, 'medicine_id', e.target.value)}
                        required
                      >
                        <option value="">Select</option>
                        {medicines.map(m => (
                          <option key={m.id} value={m.id}>{m.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="w-24">
                      <label className="text-xs text-gray-500">Quantity</label>
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                      />
                    </div>
                    <div className="w-28">
                      <label className="text-xs text-gray-500">Unit Cost</label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={item.unit_cost}
                        onChange={(e) => updateItem(index, 'unit_cost', e.target.value)}
                      />
                    </div>
                    <Button type="button" variant="ghost" onClick={() => removeItem(index)}>✕</Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Total */}
          <div className="flex justify-end pt-4 border-t">
            <div className="text-right">
              <p className="text-sm text-gray-500">Total Amount</p>
              <p className="text-2xl font-bold">${calculateTotal().toFixed(2)}</p>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button type="submit">Create Purchase Order</Button>
          </div>
        </form>
      </Modal>

      {/* View Details Modal */}
      <Modal isOpen={!!selectedPO} onClose={() => setSelectedPO(null)} title={`Purchase Order #${selectedPO?.id}`} size="lg">
        {selectedPO && (
          <div>
            <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
              <div>
                <p className="text-gray-500">Supplier</p>
                <p className="font-medium">{selectedPO.supplier_name}</p>
              </div>
              <div>
                <p className="text-gray-500">Status</p>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  selectedPO.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  selectedPO.status === 'received' ? 'bg-green-100 text-green-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {selectedPO.status}
                </span>
              </div>
              <div>
                <p className="text-gray-500">Created By</p>
                <p className="font-medium">{selectedPO.created_by}</p>
              </div>
              <div>
                <p className="text-gray-500">Expected Date</p>
                <p className="font-medium">{selectedPO.expected_date ? new Date(selectedPO.expected_date).toLocaleDateString() : '-'}</p>
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-medium mb-2">Items</h4>
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="text-left py-2">Medicine</th>
                    <th className="text-right py-2">Qty</th>
                    <th className="text-right py-2">Unit Cost</th>
                    <th className="text-right py-2">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedPO.items?.map((item, index) => (
                    <tr key={index} className="border-b">
                      <td className="py-2">{item.medicine_name}</td>
                      <td className="py-2 text-right">{item.quantity}</td>
                      <td className="py-2 text-right">${parseFloat(item.unit_cost).toFixed(2)}</td>
                      <td className="py-2 text-right font-medium">${(item.quantity * item.unit_cost).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan="3" className="text-right py-2 font-medium">Total</td>
                    <td className="text-right py-2 font-bold">${parseFloat(selectedPO.total_amount).toFixed(2)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}