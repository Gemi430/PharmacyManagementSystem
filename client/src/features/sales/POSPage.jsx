import { useEffect, useState } from "react";

const BASE_URL = "http://localhost:5000/api";

export default function POSPage() {
  const [medicines, setMedicines] = useState([]);
  const [cart, setCart] = useState([]);

  // 📦 Load medicines from backend
  useEffect(() => {
    fetchMedicines();
  }, []);

  const fetchMedicines = async () => {
    try {
      const res = await fetch(`${BASE_URL}/medicines`);
      const data = await res.json();
      setMedicines(data);
    } catch (err) {
      console.error("Failed to fetch medicines:", err);
    }
  };

  // 🛒 Add to cart (no duplicates, increase qty)
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

  // ❌ Remove item
  const removeFromCart = (id) => {
    setCart(cart.filter((item) => item.id !== id));
  };

  // ✏️ Update quantity
  const updateQty = (id, qty) => {
    if (qty <= 0) return;
    setCart(
      cart.map((item) =>
        item.id === id ? { ...item, quantity: Number(qty) } : item
      )
    );
  };

  // 💰 Total price
  const total = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  // 💳 Checkout (REAL backend call)
  const checkout = async () => {
    try {
      const items = cart.map((item) => ({
        medicine_id: item.id,
        quantity: item.quantity,
      }));

      const res = await fetch(`${BASE_URL}/sales`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: 1,
          items,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Sale failed");
        return;
      }

      alert(`Sale completed 💰 Total: $${data.total}`);

      setCart([]);
      fetchMedicines(); // refresh stock
    } catch (err) {
      console.error(err);
      alert("Checkout failed");
    }
  };

  return (
    <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 min-h-screen">

      {/* 💊 MEDICINES SECTION */}
      <div className="col-span-2">
        <h1 className="text-2xl font-bold mb-4">
          💊 Pharmacy Medicines
        </h1>

        <div className="grid grid-cols-2 gap-3">
          {medicines.map((med) => (
            <div
              key={med.id}
              className="border rounded p-3 shadow bg-white"
            >
              <h2 className="font-bold text-lg">{med.name}</h2>
              <p className="text-gray-600">Price: ${med.price}</p>
              <p className="text-gray-600">Stock: {med.stock}</p>

              <button
                onClick={() => addToCart(med)}
                className="mt-2 bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
              >
                Add to Cart
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* 🧾 CART SECTION */}
      <div className="border rounded p-4 bg-white shadow">
        <h2 className="text-xl font-bold mb-4">🧾 Cart</h2>

        {cart.length === 0 ? (
          <p className="text-gray-500">Cart is empty</p>
        ) : (
          cart.map((item) => (
            <div key={item.id} className="mb-3 border-b pb-2">
              
              <div className="flex justify-between items-center">
                <span className="font-semibold">
                  {item.name}
                </span>

                <button
                  onClick={() => removeFromCart(item.id)}
                  className="text-red-500"
                >
                  ✕
                </button>
              </div>

              <div className="flex justify-between items-center mt-1">
                <input
                  type="number"
                  value={item.quantity}
                  min="1"
                  onChange={(e) =>
                    updateQty(item.id, e.target.value)
                  }
                  className="border w-16 px-1"
                />

                <span className="font-semibold">
                  ${item.price * item.quantity}
                </span>
              </div>
            </div>
          ))
        )}

        {/* 💰 TOTAL */}
        <div className="mt-4 text-lg font-bold">
          Total: ${total}
        </div>

        {/* 💳 CHECKOUT */}
        <button
          onClick={checkout}
          className="mt-3 w-full bg-green-500 text-white py-2 rounded hover:bg-green-600"
        >
          Checkout 💰
        </button>
      </div>
    </div>
  );
}