import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface User {
  id: number;
  full_name: string;
  email: string;
  role_name: string;
  tenant_id: number;
  tenant_name: string;
}

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  loading: boolean;
}

export const useAuth = () => {
  const navigate = useNavigate();
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    token: null,
    loading: true
  });

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = () => {
    try {
      const token = localStorage.getItem('authToken');
      const userData = localStorage.getItem('userData');

      if (token && userData) {
        const user = JSON.parse(userData);
        setAuthState({
          isAuthenticated: true,
          user,
          token,
          loading: false
        });
      } else {
        setAuthState({
          isAuthenticated: false,
          user: null,
          token: null,
          loading: false
        });
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
      setAuthState({
        isAuthenticated: false,
        user: null,
        token: null,
        loading: false
      });
    }
  };

  const login = (token: string, user: User) => {
    localStorage.setItem('authToken', token);
    localStorage.setItem('userData', JSON.stringify(user));
    setAuthState({
      isAuthenticated: true,
      user,
      token,
      loading: false
    });
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    setAuthState({
      isAuthenticated: false,
      user: null,
      token: null,
      loading: false
    });
    navigate('/login');
  };

  const isAdmin = () => {
    return authState.user?.role_name === 'admin' || authState.user?.role_name === 'demo';
  };

  const isManager = () => {
    return authState.user?.role_name === 'manager' || isAdmin();
  };

  const hasRole = (role: string) => {
    return authState.user?.role_name === role || isAdmin();
  };

  return {
    ...authState,
    login,
    logout,
    isAdmin,
    isManager,
    hasRole,
    checkAuthStatus
  };
}; 