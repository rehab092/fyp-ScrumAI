import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

/**
 * PublicRoute - A component that redirects authenticated users away from public pages
 * like login and registration pages to their appropriate dashboard.
 * 
 * This prevents logged-in users from accessing login pages again.
 */
const PublicRoute = ({ children }) => {
  const { isAuthenticated, user, loading, getRedirectPath } = useAuth();
  const location = useLocation();

  // Show loading while checking authentication status
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white/70 text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  // If user is authenticated, redirect to their dashboard
  if (isAuthenticated && user) {
    // Get the appropriate redirect path based on user's role
    const redirectPath = getRedirectPath(user.role);
    
    // Use the from location if available (for after logout scenarios)
    // But don't redirect back to the current page
    const from = location.state?.from?.pathname;
    const targetPath = from && from !== location.pathname ? from : redirectPath;
    
    console.log(`[PublicRoute] User already authenticated. Redirecting to ${targetPath}`);
    
    return <Navigate to={targetPath} replace />;
  }

  // If not authenticated, render the public page (login, register, etc.)
  return children;
};

export default PublicRoute;
