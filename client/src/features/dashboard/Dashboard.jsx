import { useEffect, useState } from "react";

const BASE_URL = "http://localhost:5000/api";

export default function Dashboard() {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSales();
  }, []);

  const fetchSales = async () => {
    try {
      const res = await fetch(`${BASE_URL}/sales`);
      const data = await res.json();
      setSales(data);
    } catch (err) {
      console.error("Failed to fetch sales:", err);
    } finally {
      setLoading(false);
    }
  };

  // 📊 CALCULATIONS
  const totalRevenue = sales.reduce(
    (sum, sale) => sum + Number(sale.total_amount || 0),
    0
  );

  const totalOrders = sales.length;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">

      <h1 className="text-2xl font-bold mb-6">
        📊 Pharmacy Dashboard
      </h1>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <>
          {/* 📊 STATS */}
          <div className="grid grid-cols-3 gap-4 mb-6">

            <div className="bg-white p-4 rounded shadow">
              <h2 className="text-gray-500">Total Revenue</h2>
              <p className="text-2xl font-bold text-green-600">
                ${totalRevenue}
              </p>
            </div>

            <div className="bg-white p-4 rounded shadow">
              <h2 className="text-gray-500">Total Orders</h2>
              <p className="text-2xl font-bold">
                {totalOrders}
              </p>
            </div>

            <div className="bg-white p-4 rounded shadow">
              <h2 className="text-gray-500">Total Sales Records</h2>
              <p className="text-2xl font-bold">
                {sales.length}
              </p>
            </div>

          </div>

          {/* 📋 SALES TABLE */}
          <div className="bg-white p-4 rounded shadow">
            <h2 className="text-lg font-bold mb-4">
              Recent Sales
            </h2>

            <table className="w-full border">
              <thead>
                <tr className="bg-gray-100">
                  <th className="p-2 border">ID</th>
                  <th className="p-2 border">User</th>
                  <th className="p-2 border">Total</th>
                  <th className="p-2 border">Date</th>
                </tr>
              </thead>

              <tbody>
                {sales.map((sale) => (
                  <tr key={sale.id}>
                    <td className="p-2 border">{sale.id}</td>
                    <td className="p-2 border">
                      {sale.user_id}
                    </td>
                    <td className="p-2 border">
                      ${sale.total_amount}
                    </td>
                    <td className="p-2 border">
                      {new Date(sale.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}