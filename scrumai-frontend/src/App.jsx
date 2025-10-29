import React from "react";
import { Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import LandingPage from "./pages/LandingPage";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import FAQ from "./pages/FAQ";
import Pricing from "./pages/Pricing";
import Portal from "./pages/Portal";
import ScrumMasterPortal from "./pages/ScrumMasterPortal";
import ProductOwnerPortal from "./pages/ProductOwnerPortal";

export default function App() {
  return (
    <AuthProvider>
      <div className="font-sans bg-background min-h-screen text-textPrimary">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route
            path="/portal"
            element={
              <ProtectedRoute>
                <Portal />
              </ProtectedRoute>
            }
          />
          <Route
            path="/scrum-master"
            element={
              <ProtectedRoute requiredRole="scrumMaster">
                <ScrumMasterPortal />
              </ProtectedRoute>
            }
          />
          <Route
            path="/product-owner"
            element={
              <ProtectedRoute requiredRole="productOwner">
                <ProductOwnerPortal />
              </ProtectedRoute>
            }
          />
        </Routes>
      </div>
    </AuthProvider>
  );
}
