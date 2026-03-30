import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Session validation helper
const validateSession = () => {
  const savedUser = localStorage.getItem('scrumai_user');
  const sessionTimestamp = localStorage.getItem('scrumai_session_timestamp');
  
  if (!savedUser) return null;
  
  try {
    const user = JSON.parse(savedUser);
    
    // Check if session is still valid (24 hours max)
    if (sessionTimestamp) {
      const sessionAge = Date.now() - parseInt(sessionTimestamp, 10);
      const maxSessionAge = 24 * 60 * 60 * 1000; // 24 hours
      if (sessionAge > maxSessionAge) {
        // Session expired
        return null;
      }
    }
    
    return user;
  } catch (e) {
    return null;
  }
};

// Clear all session data
const clearAllSessionData = () => {
  // Clear all auth-related localStorage items
  localStorage.removeItem('scrumai_user');
  localStorage.removeItem('scrumai_session_timestamp');
  localStorage.removeItem('authToken');
  localStorage.removeItem('userRole');
  localStorage.removeItem('userId');
  localStorage.removeItem('userName');
  localStorage.removeItem('userEmail');
  localStorage.removeItem('workspaceId');
  localStorage.removeItem('workspaceName');
  localStorage.removeItem('companyName');
  localStorage.removeItem('adminName');
  localStorage.removeItem('adminEmail');
  
  // Clear sessionStorage as well
  sessionStorage.clear();
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sessionValid, setSessionValid] = useState(false);

  // Validate session on mount and window focus
  const checkSession = useCallback(() => {
    const validUser = validateSession();
    if (validUser) {
      setUser(validUser);
      setSessionValid(true);
    } else {
      // Invalid session - clear everything
      clearAllSessionData();
      setUser(null);
      setSessionValid(false);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    // Initial session check
    checkSession();

    // Re-validate session when window regains focus (user returns to tab)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkSession();
      }
    };

    // Re-validate on storage changes (logout from another tab)
    const handleStorageChange = (e) => {
      if (e.key === 'scrumai_user' || e.key === 'scrumai_session_timestamp') {
        checkSession();
      }
    };

    // Prevent back button access after logout by handling popstate
    const handlePopState = () => {
      const validUser = validateSession();
      if (!validUser) {
        // Force redirect to login if no valid session
        window.location.replace('/workspace/login');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('popstate', handlePopState);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [checkSession]);

  const login = async (email, password, role, backendUser = null) => {
    setLoading(true);
    
    console.log("AuthContext.login() called with backendUser:", backendUser);
    
    // Use backend user data if provided, otherwise create mock
    const userData = backendUser ? {
      id: backendUser.id,
      email: backendUser.email,
      role: backendUser.role,
      name: backendUser.name,
      type: backendUser.type, // MANAGEMENT or TEAM_MEMBER
      owner_id: backendUser.owner_id, // Include owner_id from backend
      avatar: (backendUser.name || email).split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2),
      loginTime: new Date().toISOString()
    } : {
      id: Date.now(),
      email,
      role,
      name: email.split('@')[0].replace('.', ' ').replace(/\b\w/g, l => l.toUpperCase()),
      avatar: email.split('@')[0].substring(0, 2).toUpperCase(),
      loginTime: new Date().toISOString()
    };

    console.log("userData being stored:", userData);
    
    setUser(userData);
    setSessionValid(true);
    
    // Store session data
    localStorage.setItem('scrumai_user', JSON.stringify(userData));
    localStorage.setItem('scrumai_session_timestamp', Date.now().toString());
    
    
    // Also store owner_id separately for easy access
    if (backendUser && backendUser.owner_id) {
      localStorage.setItem('ownerId', String(backendUser.owner_id));
      console.log("AuthContext saved ownerId to localStorage:", backendUser.owner_id);
    } else {
      console.log("WARNING: No owner_id in backendUser!");
    }
    
    setLoading(false);
    return userData;
  };

  const signup = async (name, email, password, role) => {
    // Simulate API call
    setLoading(true);
    
    // Mock user creation - in real app, this would be an API call
    const mockUser = {
      id: Date.now(),
      email,
      role,
      name,
      avatar: name.split(' ').map(n => n[0]).join('').toUpperCase(),
      loginTime: new Date().toISOString()
    };

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    setUser(mockUser);
    setSessionValid(true);
    localStorage.setItem('scrumai_user', JSON.stringify(mockUser));
    localStorage.setItem('scrumai_session_timestamp', Date.now().toString());
    setLoading(false);
    
    return mockUser;
  };

  const logout = useCallback(() => {
    // Clear user state
    setUser(null);
    setSessionValid(false);
    
    // Clear all session data
    clearAllSessionData();
    
    // Replace current history entry to prevent back navigation
    // This pushes a new state and then replaces, effectively clearing forward history
    window.history.pushState(null, '', '/workspace/login');
    
    // Force page reload to clear any cached state
    window.location.replace('/workspace/login');
  }, []);

  const getRedirectPath = (role) => {
    // Normalize role to uppercase for comparison
    const normalizedRole = (role || '').toUpperCase().replace(/[\s-]/g, '_');
    
    switch (normalizedRole) {
      case 'ADMIN':
        return '/admin';
      case 'SCRUM_MASTER':
      case 'SCRUMMASTER':
        return '/scrum-master';
      case 'PRODUCT_OWNER':
      case 'PRODUCTOWNER':
        return '/product-owner';
      case 'DEVELOPER':
      case 'TEAM_MEMBER':
      case 'TEAMMEMBER':
      default:
        // Team members/developers go to their focused personal portal
        return '/team-member';
    }
  };

  const value = {
    user,
    loading,
    login,
    signup,
    logout,
    getRedirectPath,
    isAuthenticated: !!user && sessionValid,
    sessionValid
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};





