import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import POSPage from "../features/sales/POSPage";
import Dashboard from "../features/dashboard/Dashboard";
import Login from "../features/auth/Login";
import ProtectedRoute from "../routes/ProtectedRoute";

export default function App() {
  const { user, logout } = useAuth();
  const [page, setPage] = useState("pos");

  if (!user) {
    return <Login />;
  }

  const isAdmin = user.role === "admin";

  return (
    <div>
      {/* NAVBAR */}
      <div className="flex justify-between items-center p-4 bg-white shadow">

        <div className="flex gap-4">
          <button
            onClick={() => setPage("pos")}
            className="bg-blue-500 text-white px-3 py-1 rounded"
          >
            POS
          </button>

          {isAdmin && (
            <button
              onClick={() => setPage("dashboard")}
              className="bg-green-500 text-white px-3 py-1 rounded"
            >
              Dashboard
            </button>
          )}
        </div>

        <div className="flex items-center gap-3">
          <span>
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

      {/* PROTECTED PAGES */}
      {page === "pos" && (
        <ProtectedRoute>
          <POSPage />
        </ProtectedRoute>
      )}

      {page === "dashboard" && isAdmin && (
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      )}
    </div>
  );
}