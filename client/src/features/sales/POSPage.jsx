import { useEffect, useState } from "react";

const BASE_URL = "http://localhost:5000/api";

export default function POSPage() {
  const [medicines, setMedicines] = useState([]);
  const [cart, setCart] = useState([]);

  useEffect(() => {
    fetchMedicines();
  }, []);

  const fetchMedicines = async () => {
    const res = await fetch(`${BASE_URL}/medicines`);
    const data = await res.json();
    setMedicines(data);
  };

  // 🛒 ADD TO CART
  const addToCart = (med) => {
    const exists = cart.find((item) => item.id === med.id);

    if (exists) {
      setCart(
        cart.map((item) =>
          item.id === med.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      setCart([...cart, { ...med, quantity: 1 }]);
    }
  };

  // ❌ REMOVE
  const removeItem = (id) => {
    setCart(cart.filter((item) => item.id !== id));
  };

  // 💰 TOTAL
  const total = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  return (
    <div className="grid grid-cols-3 gap-4 p-4">

      {/* 💊 MEDICINES LIST */}
      <div className="col-span-2">
        <h2 className="text-xl font-bold mb-4">💊 Medicines</h2>

        <div className="grid grid-cols-2 gap-3">
          {medicines.map((med) => (
            <div
              key={med.id}
              className="border p-3 rounded shadow"
            >
              <h3 className="font-bold">{med.name}</h3>
              <p>Price: ${med.price}</p>
              <p>Stock: {med.stock}</p>

              <button
                onClick={() => addToCart(med)}
                className="mt-2 bg-blue-500 text-white px-3 py-1 rounded"
              >
                Add to Cart
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* 🧾 CART */}
      <div className="border p-4 rounded shadow">
        <h2 className="text-xl font-bold mb-4">🧾 Cart</h2>

        {cart.length === 0 && (
          <p className="text-gray-500">Cart is empty</p>
        )}

        {cart.map((item) => (
          <div key={item.id} className="mb-3 border-b pb-2">
            <div className="flex justify-between">
              <span>{item.name}</span>
              <button
                onClick={() => removeItem(item.id)}
                className="text-red-500"
              >
                ✕
              </button>
            </div>

            <div className="text-sm text-gray-600">
              Qty: {item.quantity} | $
              {item.price * item.quantity}
            </div>
          </div>
        ))}

        <hr className="my-2" />

        <div className="font-bold text-lg">
          Total: ${total}
        </div>

        <button className="mt-3 w-full bg-green-500 text-white py-2 rounded">
          Checkout 💰
        </button>
      </div>
    </div>
  );
}