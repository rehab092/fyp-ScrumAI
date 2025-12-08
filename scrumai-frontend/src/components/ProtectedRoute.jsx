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

  if (requiredRole) {
    // Normalize both roles for comparison (handle camelCase, UPPER_CASE, etc.)
    const userRoleNormalized = (user.role || "").toUpperCase().replace(/[\s-]/g, "_");
    const requiredRoleNormalized = (requiredRole || "").toUpperCase().replace(/[\s-]/g, "_");
    
    // Check if user has the required role (handle multiple naming conventions)
    const roleMatches = 
      userRoleNormalized === requiredRoleNormalized ||
      // Scrum Master variations
      ((requiredRoleNormalized === "SCRUM_MASTER" || requiredRoleNormalized === "SCRUMMASTER") && 
       (userRoleNormalized === "SCRUMMASTER" || userRoleNormalized === "SCRUM_MASTER")) ||
      // Product Owner variations
      ((requiredRoleNormalized === "PRODUCT_OWNER" || requiredRoleNormalized === "PRODUCTOWNER") && 
       (userRoleNormalized === "PRODUCTOWNER" || userRoleNormalized === "PRODUCT_OWNER")) ||
      // Developer/Team Member variations
      ((requiredRoleNormalized === "DEVELOPER" || requiredRoleNormalized === "TEAM_MEMBER" || requiredRoleNormalized === "TEAMMEMBER") && 
       (userRoleNormalized === "DEVELOPER" || userRoleNormalized === "TEAM_MEMBER" || userRoleNormalized === "TEAMMEMBER")) ||
      // Admin
      (requiredRoleNormalized === "ADMIN" && userRoleNormalized === "ADMIN");
    
    if (!roleMatches) {
      // Redirect to appropriate portal based on user role
      let redirectPath;
      if (userRoleNormalized === "ADMIN") {
        redirectPath = "/admin";
      } else if (userRoleNormalized === "SCRUM_MASTER" || userRoleNormalized === "SCRUMMASTER") {
        redirectPath = "/scrum-master";
      } else if (userRoleNormalized === "PRODUCT_OWNER" || userRoleNormalized === "PRODUCTOWNER") {
        redirectPath = "/product-owner";
      } else {
        redirectPath = "/team-member";
      }
      return <Navigate to={redirectPath} replace />;
    }
  }

  return children;
};

export default ProtectedRoute;







