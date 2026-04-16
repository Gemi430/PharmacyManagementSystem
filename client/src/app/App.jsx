import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Login from "../features/auth/Login";
import Register from "../features/auth/Register";
import Dashboard from "../features/dashboard/Dashboard";
import POSPage from "../features/sales/POSPage";
import MedicinesPage from "../features/medicines/MedicinesPage";
import SuppliersPage from "../features/suppliers/SuppliersPage";
import SalesPage from "../features/sales/SalesPage";
import ReportsPage from "../features/reports/ReportsPage";
import MainLayout from "../layout/MainLayout";

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
}

function AuthLayout() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    if (user) {
      navigate('/', { replace: true });
    }
  }, [user, navigate]);
  
  return null;
}

function AppRoutes() {
  const { user } = useAuth();
  
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={
        <>
          <AuthLayout />
          <Login />
        </>
      } />
      <Route path="/register" element={
        <>
          <AuthLayout />
          <Register />
        </>
      } />
      
      {/* Protected routes */}
      <Route path="/" element={
        <ProtectedRoute>
          <MainLayout>
            <Dashboard />
          </MainLayout>
        </ProtectedRoute>
      } />
      <Route path="/pos" element={
        <ProtectedRoute>
          <MainLayout>
            <POSPage />
          </MainLayout>
        </ProtectedRoute>
      } />
      <Route path="/medicines" element={
        <ProtectedRoute>
          <MainLayout>
            <MedicinesPage />
          </MainLayout>
        </ProtectedRoute>
      } />
      <Route path="/suppliers" element={
        <ProtectedRoute>
          <MainLayout>
            <SuppliersPage />
          </MainLayout>
        </ProtectedRoute>
      } />
      <Route path="/sales" element={
        <ProtectedRoute>
          <MainLayout>
            <SalesPage />
          </MainLayout>
        </ProtectedRoute>
      } />
      <Route path="/reports" element={
        <ProtectedRoute>
          <MainLayout>
            <ReportsPage />
          </MainLayout>
        </ProtectedRoute>
      } />
      
      {/* Catch all - redirect to home or login */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}