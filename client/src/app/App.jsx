import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Login from "../features/auth/Login";
import Register from "../features/auth/Register";
import AdminDashboard from "../features/dashboard/AdminDashboard";
import ManagerDashboard from "../features/dashboard/ManagerDashboard";
import PharmacistDashboard from "../features/dashboard/PharmacistDashboard";
import POSPage from "../features/sales/POSPage";
import MedicinesPage from "../features/medicines/MedicinesPage";
import SuppliersPage from "../features/suppliers/SuppliersPage";
import SalesPage from "../features/sales/SalesPage";
import ReportsPage from "../features/reports/ReportsPage";
import PurchaseOrdersPage from "../features/purchases/PurchaseOrdersPage";
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

function DashboardRouter() {
  const { user } = useAuth();
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  switch (user.role) {
    case 'admin':
      return <AdminDashboard />;
    case 'manager':
      return <ManagerDashboard />;
    case 'pharmacist':
    default:
      return <PharmacistDashboard />;
  }
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
      
      {/* Dashboard - role-based */}
      <Route path="/" element={
        <ProtectedRoute>
          <MainLayout>
            <DashboardRouter />
          </MainLayout>
        </ProtectedRoute>
      } />
      
      {/* POS */}
      <Route path="/pos" element={
        <ProtectedRoute>
          <MainLayout>
            <POSPage />
          </MainLayout>
        </ProtectedRoute>
      } />
      
      {/* Medicines */}
      <Route path="/medicines" element={
        <ProtectedRoute>
          <MainLayout>
            <MedicinesPage />
          </MainLayout>
        </ProtectedRoute>
      } />
      
      {/* Suppliers */}
      <Route path="/suppliers" element={
        <ProtectedRoute>
          <MainLayout>
            <SuppliersPage />
          </MainLayout>
        </ProtectedRoute>
      } />
      
      {/* Sales History */}
      <Route path="/sales" element={
        <ProtectedRoute>
          <MainLayout>
            <SalesPage />
          </MainLayout>
        </ProtectedRoute>
      } />
      
      {/* Reports */}
      <Route path="/reports" element={
        <ProtectedRoute>
          <MainLayout>
            <ReportsPage />
          </MainLayout>
        </ProtectedRoute>
      } />
      
      {/* Purchase Orders - admin and manager only */}
      <Route path="/purchases" element={
        <ProtectedRoute>
          <MainLayout>
            <PurchaseOrdersPage />
          </MainLayout>
        </ProtectedRoute>
      } />
      
      {/* Catch all */}
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