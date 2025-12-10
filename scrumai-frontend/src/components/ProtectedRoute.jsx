import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute = ({ children, requiredRole = null }) => {
  const { user, isAuthenticated, loading, sessionValid } = useAuth();
  const location = useLocation();

  // Prevent browser caching of protected pages
  useEffect(() => {
    // Set cache control headers via meta tags
    const setCacheControl = () => {
      // Remove existing cache meta tags
      const existingCacheMeta = document.querySelectorAll('meta[http-equiv="Cache-Control"], meta[http-equiv="Pragma"], meta[http-equiv="Expires"]');
      existingCacheMeta.forEach(meta => meta.remove());
      
      // Add no-cache meta tags
      const cacheControl = document.createElement('meta');
      cacheControl.setAttribute('http-equiv', 'Cache-Control');
      cacheControl.setAttribute('content', 'no-cache, no-store, must-revalidate');
      document.head.appendChild(cacheControl);
      
      const pragma = document.createElement('meta');
      pragma.setAttribute('http-equiv', 'Pragma');
      pragma.setAttribute('content', 'no-cache');
      document.head.appendChild(pragma);
      
      const expires = document.createElement('meta');
      expires.setAttribute('http-equiv', 'Expires');
      expires.setAttribute('content', '0');
      document.head.appendChild(expires);
    };
    
    setCacheControl();
    
    // Push current state to history to help prevent back navigation after logout
    window.history.pushState(null, '', location.pathname);
    
    return () => {
      // Cleanup meta tags when leaving protected route
      const cacheMetas = document.querySelectorAll('meta[http-equiv="Cache-Control"], meta[http-equiv="Pragma"], meta[http-equiv="Expires"]');
      cacheMetas.forEach(meta => meta.remove());
    };
  }, [location.pathname]);

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

  // Check both isAuthenticated AND sessionValid for extra security
  if (!isAuthenticated || !sessionValid) {
    console.log('[ProtectedRoute] User not authenticated or session invalid. Redirecting to login.');
    // Clear any stale session data
    localStorage.removeItem('scrumai_user');
    localStorage.removeItem('scrumai_session_timestamp');
    // Redirect to workspace login with return url
    return <Navigate to="/workspace/login" state={{ from: location }} replace />;
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
      console.log(`[ProtectedRoute] Role mismatch. User: ${userRoleNormalized}, Required: ${requiredRoleNormalized}`);
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