import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session on app load
    const savedUser = localStorage.getItem('scrumai_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email, password, role, backendUser = null) => {
    setLoading(true);
    
    // Use backend user data if provided, otherwise create mock
    const userData = backendUser ? {
      id: backendUser.id,
      email: backendUser.email,
      role: backendUser.role,
      name: backendUser.name,
      type: backendUser.type, // MANAGEMENT or TEAM_MEMBER
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

    setUser(userData);
    localStorage.setItem('scrumai_user', JSON.stringify(userData));
    
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
    localStorage.setItem('scrumai_user', JSON.stringify(mockUser));
    setLoading(false);
    
    return mockUser;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('scrumai_user');
  };

  const getRedirectPath = (role) => {
    // Normalize role to uppercase for comparison
    const normalizedRole = (role || '').toUpperCase().replace(/[\s-]/g, '_');
    
    switch (normalizedRole) {
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
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};







