import { useEffect, useState } from "react";

const BASE_URL = "http://localhost:5000/api";

export default function POSPage() {
  const [medicines, setMedicines] = useState([]);
  const [cart, setCart] = useState([]);
  const [search, setSearch] = useState("");
  const [receipt, setReceipt] = useState(null);

  useEffect(() => {
    fetchMedicines();
  }, []);

  const fetchMedicines = async () => {
    try {
      const res = await fetch(`${BASE_URL}/medicines`);
      const data = await res.json();
      setMedicines(data);
    } catch (err) {
      console.error(err);
    }
  };

  const filteredMedicines = medicines.filter((med) =>
    med.name.toLowerCase().includes(search.toLowerCase())
  );

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

  const removeFromCart = (id) => {
    setCart(cart.filter((item) => item.id !== id));
  };

  const updateQty = (id, qty) => {
    const value = Number(qty);
    if (value <= 0) return;

    setCart(
      cart.map((item) =>
        item.id === id ? { ...item, quantity: value } : item
      )
    );
  };

  const total = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

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

      // 🧾 SAVE RECEIPT
      setReceipt({
        items: cart,
        total: data.total,
        date: new Date().toLocaleString(),
      });

      setCart([]);
      fetchMedicines();
    } catch (err) {
      console.error(err);
      alert("Checkout failed");
    }
  };

  return (
    <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 min-h-screen">

      {/* 💊 MEDICINES */}
      <div className="col-span-2">
        <h1 className="text-2xl font-bold mb-4">
          💊 Pharmacy POS System
        </h1>

        {/* 🔍 SEARCH */}
        <input
          type="text"
          placeholder="🔍 Search medicine..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border px-3 py-2 w-full mb-4 rounded"
        />

        <div className="grid grid-cols-2 gap-3">
          {filteredMedicines.map((med) => (
            <div
              key={med.id}
              className="border rounded p-3 shadow bg-white"
            >
              <h2 className="font-bold text-lg">{med.name}</h2>
              <p>Price: ${med.price}</p>
              <p>Stock: {med.stock}</p>

              <button
                onClick={() => addToCart(med)}
                className="mt-2 bg-blue-500 text-white px-3 py-1 rounded"
              >
                Add
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* 🧾 CART + RECEIPT */}
      <div className="border rounded p-4 bg-white shadow">

        {!receipt ? (
          <>
            <h2 className="text-xl font-bold mb-4">🧾 Cart</h2>

            {cart.length === 0 ? (
              <p className="text-gray-500">Cart is empty</p>
            ) : (
              cart.map((item) => (
                <div key={item.id} className="mb-3 border-b pb-2">
                  <div className="flex justify-between">
                    <span>{item.name}</span>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="text-red-500"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="flex justify-between mt-1">
                    <input
                      type="number"
                      value={item.quantity}
                      min="1"
                      onChange={(e) =>
                        updateQty(item.id, e.target.value)
                      }
                      className="border w-16 px-1"
                    />
                    <span>
                      ${item.price * item.quantity}
                    </span>
                  </div>
                </div>
              ))
            )}

            <div className="mt-4 font-bold">
              Total: ${total}
            </div>

            <button
              onClick={checkout}
              className="mt-3 w-full bg-green-500 text-white py-2 rounded"
            >
              Checkout 💰
            </button>
          </>
        ) : (
          <>
            {/* 🧾 RECEIPT */}
            <h2 className="text-xl font-bold mb-4">🧾 Receipt</h2>

            <p className="text-sm text-gray-500 mb-2">
              {receipt.date}
            </p>

            {receipt.items.map((item) => (
              <div key={item.id} className="flex justify-between">
                <span>
                  {item.name} x{item.quantity}
                </span>
                <span>
                  ${item.price * item.quantity}
                </span>
              </div>
            ))}

            <hr className="my-2" />

            <div className="font-bold text-lg">
              Total: ${receipt.total}
            </div>

            <button
              onClick={() => setReceipt(null)}
              className="mt-3 w-full bg-blue-500 text-white py-2 rounded"
            >
              New Sale
            </button>
          </>
        )}
      </div>
    </div>
  );
}