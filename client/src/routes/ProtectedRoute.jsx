import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children }) {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <h1 className="text-red-500 text-xl">
          🚫 Access Denied. Please login.
        </h1>
      </div>
    );
  }

  return children;
}