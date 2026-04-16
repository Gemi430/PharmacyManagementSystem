import { useState, useEffect } from 'react';
import { medicineService } from './medicine.service';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';

export default function MedicinesPage() {
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [categories, setCategories] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingMedicine, setEditingMedicine] = useState(null);
  const [formData, setFormData] = useState({
    name: '', generic_name: '', category: '', description: '',
    dosage_form: '', strength: '', price: '', cost_price: '',
    stock: '', min_stock: '', expiry_date: '', supplier_id: '', barcode: ''
  });

  useEffect(() => {
    loadMedicines();
    loadCategories();
  }, [search, category]);

  const loadMedicines = async () => {
    try {
      setLoading(true);
      const data = await medicineService.getAll({ search, category });
      setMedicines(data);
    } catch (error) {
      console.error('Failed to load medicines:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const data = await medicineService.getCategories();
      setCategories(data);
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingMedicine) {
        await medicineService.update(editingMedicine.id, formData);
      } else {
        await medicineService.create(formData);
      }
      setShowModal(false);
      resetForm();
      loadMedicines();
    } catch (error) {
      console.error('Failed to save medicine:', error);
      alert(error.response?.data?.message || 'Failed to save medicine');
    }
  };

  const handleEdit = (medicine) => {
    setEditingMedicine(medicine);
    setFormData({
      name: medicine.name || '',
      generic_name: medicine.generic_name || '',
      category: medicine.category || '',
      description: medicine.description || '',
      dosage_form: medicine.dosage_form || '',
      strength: medicine.strength || '',
      price: medicine.price || '',
      cost_price: medicine.cost_price || '',
      stock: medicine.stock || '',
      min_stock: medicine.min_stock || '',
      expiry_date: medicine.expiry_date || '',
      supplier_id: medicine.supplier_id || '',
      barcode: medicine.barcode || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this medicine?')) return;
    try {
      await medicineService.delete(id);
      loadMedicines();
    } catch (error) {
      console.error('Failed to delete medicine:', error);
      alert(error.response?.data?.message || 'Failed to delete medicine');
    }
  };

  const resetForm = () => {
    setEditingMedicine(null);
    setFormData({
      name: '', generic_name: '', category: '', description: '',
      dosage_form: '', strength: '', price: '', cost_price: '',
      stock: '', min_stock: '', expiry_date: '', supplier_id: '', barcode: ''
    });
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Medicines Inventory</h1>
        <Button onClick={() => { resetForm(); setShowModal(true); }}>
          + Add Medicine
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <div className="flex-1">
          <Input
            placeholder="Search medicines..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="">All Categories</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Expiry</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr><td colSpan="6" className="px-6 py-4 text-center">Loading...</td></tr>
            ) : medicines.length === 0 ? (
              <tr><td colSpan="6" className="px-6 py-4 text-center text-gray-500">No medicines found</td></tr>
            ) : (
              medicines.map((medicine) => (
                <tr key={medicine.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{medicine.name}</div>
                    {medicine.generic_name && (
                      <div className="text-sm text-gray-500">{medicine.generic_name}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{medicine.category || '-'}</td>
                  <td className="px-6 py-4 text-sm font-medium">${parseFloat(medicine.price).toFixed(2)}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      medicine.stock <= medicine.min_stock ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                    }`}>
                      {medicine.stock} units
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {medicine.expiry_date ? new Date(medicine.expiry_date).toLocaleDateString() : '-'}
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(medicine)}>Edit</Button>
                    <Button variant="danger" size="sm" onClick={() => handleDelete(medicine.id)}>Delete</Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingMedicine ? 'Edit Medicine' : 'Add Medicine'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Name *" placeholder="Medicine name" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required />
            <Input label="Generic Name" placeholder="Generic name" value={formData.generic_name} onChange={(e) => setFormData({...formData, generic_name: e.target.value})} />
            <Input label="Category" placeholder="Category" value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})} />
            <Input label="Dosage Form" placeholder="e.g., Tablet, Syrup" value={formData.dosage_form} onChange={(e) => setFormData({...formData, dosage_form: e.target.value})} />
            <Input label="Strength" placeholder="e.g., 500mg" value={formData.strength} onChange={(e) => setFormData({...formData, strength: e.target.value})} />
            <Input label="Barcode" placeholder="Barcode" value={formData.barcode} onChange={(e) => setFormData({...formData, barcode: e.target.value})} />
            <Input label="Price *" type="number" step="0.01" placeholder="0.00" value={formData.price} onChange={(e) => setFormData({...formData, price: e.target.value})} required />
            <Input label="Cost Price" type="number" step="0.01" placeholder="0.00" value={formData.cost_price} onChange={(e) => setFormData({...formData, cost_price: e.target.value})} />
            <Input label="Stock" type="number" placeholder="0" value={formData.stock} onChange={(e) => setFormData({...formData, stock: e.target.value})} />
            <Input label="Min Stock" type="number" placeholder="10" value={formData.min_stock} onChange={(e) => setFormData({...formData, min_stock: e.target.value})} />
            <Input label="Expiry Date" type="date" value={formData.expiry_date} onChange={(e) => setFormData({...formData, expiry_date: e.target.value})} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" rows="3" placeholder="Description" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" type="button" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button type="submit">{editingMedicine ? 'Update' : 'Add'} Medicine</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}