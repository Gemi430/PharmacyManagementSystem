import { useState } from "react";
import POSPage from "../features/sales/POSPage";
import Dashboard from "../features/dashboard/Dashboard";

export default function App() {
  const [page, setPage] = useState("pos");

  return (
    <div>
      {/* 🔀 SIMPLE NAV */}
      <div className="flex gap-4 p-4 bg-white shadow">
        <button
          onClick={() => setPage("pos")}
          className="px-3 py-1 bg-blue-500 text-white rounded"
        >
          POS
        </button>

        <button
          onClick={() => setPage("dashboard")}
          className="px-3 py-1 bg-green-500 text-white rounded"
        >
          Dashboard
        </button>
      </div>

      {/* 📄 PAGE SWITCH */}
      {page === "pos" ? <POSPage /> : <Dashboard />}
    </div>
  );
}