import { useState, useEffect } from 'react';
import { medicineService } from '../medicines/medicine.service';
import { salesService } from './sales.service';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

export default function POSPage() {
  const { user } = useAuth();
  const [medicines, setMedicines] = useState([]);
  const [cart, setCart] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [customerInfo, setCustomerInfo] = useState({ name: '', phone: '' });
  const [discount, setDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('cash');

  useEffect(() => {
    loadMedicines();
  }, []);

  const loadMedicines = async () => {
    try {
      setLoading(true);
      const data = await medicineService.getAll();
      setMedicines(data);
    } catch (error) {
      console.error('Failed to load medicines:', error);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (medicine) => {
    if (medicine.stock <= 0) {
      alert('This medicine is out of stock');
      return;
    }

    const existing = cart.find(item => item.id === medicine.id);
    if (existing) {
      if (existing.quantity >= medicine.stock) {
        alert('Not enough stock available');
        return;
      }
      setCart(cart.map(item =>
        item.id === medicine.id ? { ...item, quantity: item.quantity + 1 } : item
      ));
    } else {
      setCart([...cart, { ...medicine, quantity: 1 }]);
    }
  };

  const updateQuantity = (id, quantity) => {
    const item = cart.find(i => i.id === id);
    if (quantity <= 0) {
      setCart(cart.filter(i => i.id !== id));
    } else if (item && quantity <= item.stock) {
      setCart(cart.map(i => i.id === id ? { ...i, quantity } : i));
    }
  };

  const removeFromCart = (id) => {
    setCart(cart.filter(item => item.id !== id));
  };

  const calculateTotal = () => {
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    return subtotal - discount;
  };

  const handleCheckout = async () => {
    if (cart.length === 0) {
      alert('Cart is empty');
      return;
    }

    setProcessing(true);
    try {
      const items = cart.map(item => ({
        medicine_id: item.id,
        quantity: item.quantity
      }));

      await salesService.create({
        user_id: user.id,
        items,
        customer_name: customerInfo.name,
        customer_phone: customerInfo.phone,
        discount: parseFloat(discount) || 0,
        payment_method: paymentMethod
      });

      alert('Sale completed successfully!');
      setCart([]);
      setCustomerInfo({ name: '', phone: '' });
      setDiscount(0);
      loadMedicines();
    } catch (error) {
      console.error('Checkout failed:', error);
      alert(error.response?.data?.message || 'Checkout failed');
    } finally {
      setProcessing(false);
    }
  };

  const filteredMedicines = medicines.filter(m =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.generic_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex h-full">
      {/* Medicine List */}
      <div className="flex-1 p-4 overflow-auto">
        <div className="mb-4">
          <Input
            placeholder="Search medicines..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {loading ? (
            <div className="col-span-full text-center py-8">Loading medicines...</div>
          ) : filteredMedicines.length === 0 ? (
            <div className="col-span-full text-center py-8 text-gray-500">No medicines found</div>
          ) : (
            filteredMedicines.map((medicine) => (
              <div
                key={medicine.id}
                className={`p-4 rounded-lg border cursor-pointer transition-all ${
                  medicine.stock <= 0
                    ? 'bg-gray-100 border-gray-200 opacity-60'
                    : 'bg-white border-gray-200 hover:border-blue-500 hover:shadow-md'
                }`}
                onClick={() => addToCart(medicine)}
              >
                <h3 className="font-medium text-gray-900 truncate">{medicine.name}</h3>
                {medicine.generic_name && (
                  <p className="text-sm text-gray-500 truncate">{medicine.generic_name}</p>
                )}
                <div className="mt-2 flex justify-between items-center">
                  <span className="text-lg font-bold text-blue-600">${parseFloat(medicine.price).toFixed(2)}</span>
                  <span className={`text-sm ${medicine.stock <= medicine.min_stock ? 'text-red-600' : 'text-green-600'}`}>
                    {medicine.stock} in stock
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Cart */}
      <div className="w-96 bg-gray-50 border-l flex flex-col">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">Current Sale</h2>
        </div>

        <div className="flex-1 overflow-auto p-4">
          {cart.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <p className="mt-2">Cart is empty</p>
              <p className="text-sm">Click on medicines to add them</p>
            </div>
          ) : (
            <div className="space-y-3">
              {cart.map((item) => (
                <div key={item.id} className="bg-white p-3 rounded-lg shadow-sm">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium">{item.name}</h4>
                      <p className="text-sm text-gray-500">${parseFloat(item.price).toFixed(2)} each</p>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300"
                    >
                      -
                    </button>
                    <span className="w-12 text-center font-medium">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300"
                    >
                      +
                    </button>
                    <span className="ml-auto font-medium">${(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Checkout */}
        {cart.length > 0 && (
          <div className="p-4 border-t bg-white">
            <div className="space-y-3 mb-4">
              <Input
                placeholder="Customer Name (optional)"
                value={customerInfo.name}
                onChange={(e) => setCustomerInfo({...customerInfo, name: e.target.value})}
              />
              <Input
                placeholder="Customer Phone (optional)"
                value={customerInfo.phone}
                onChange={(e) => setCustomerInfo({...customerInfo, phone: e.target.value})}
              />
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="Discount"
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                  min="0"
                  step="0.01"
                />
                <select
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                >
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                  <option value="insurance">Insurance</option>
                </select>
              </div>
            </div>

            <div className="border-t pt-3 space-y-2">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>${cart.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount</span>
                  <span>-${parseFloat(discount).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-xl font-bold">
                <span>Total</span>
                <span>${calculateTotal().toFixed(2)}</span>
              </div>
            </div>

            <Button
              className="w-full mt-4"
              size="lg"
              loading={processing}
              onClick={handleCheckout}
            >
              Complete Sale
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}