import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute = ({ children, requiredRole = null }) => {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-nightBlue to-nightBlueShadow flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sandTan mx-auto mb-4"></div>
          <p className="text-textMuted">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect to landing page with return url
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  if (requiredRole && user.role !== requiredRole) {
    // Redirect to appropriate portal based on user role
    const redirectPath = user.role === 'scrumMaster' ? '/scrum-master' : 
                        user.role === 'productOwner' ? '/product-owner' : '/portal';
    return <Navigate to={redirectPath} replace />;
  }

  return children;
};

export default ProtectedRoute;






