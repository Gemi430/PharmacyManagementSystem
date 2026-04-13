import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import POSPage from "../features/sales/POSPage";
import Dashboard from "../features/dashboard/Dashboard";
import Login from "../features/auth/Login";

export default function App() {
  const { user, logout } = useAuth();
  const [page, setPage] = useState("pos");

  // 🔐 Not logged in
  if (!user) {
    return <Login />;
  }

  // 🚫 Restrict dashboard access
  const canAccessDashboard = user.role === "admin";

  return (
    <div>
      {/* 🔝 NAVBAR */}
      <div className="flex justify-between items-center p-4 bg-white shadow">

        {/* LEFT NAV */}
        <div className="flex gap-4">
          <button
            onClick={() => setPage("pos")}
            className="px-3 py-1 bg-blue-500 text-white rounded"
          >
            POS
          </button>

          {/* 🔐 ONLY ADMIN CAN SEE DASHBOARD */}
          {canAccessDashboard && (
            <button
              onClick={() => setPage("dashboard")}
              className="px-3 py-1 bg-green-500 text-white rounded"
            >
              Dashboard
            </button>
          )}
        </div>

        {/* RIGHT SIDE */}
        <div className="flex items-center gap-3">
          <span className="text-sm">
            👤 {user.username} ({user.role})
          </span>

          <button
            onClick={logout}
            className="bg-red-500 text-white px-3 py-1 rounded"
          >
            Logout
          </button>
        </div>
      </div>

      {/* 🚫 BLOCK ACCESS IF NOT ADMIN */}
      {page === "dashboard" && !canAccessDashboard ? (
        <div className="p-6 text-red-500 font-bold">
          🚫 Access Denied (Admin only)
        </div>
      ) : (
        <>
          {page === "pos" && <POSPage />}
          {page === "dashboard" && <Dashboard />}
        </>
      )}
    </div>
  );
}