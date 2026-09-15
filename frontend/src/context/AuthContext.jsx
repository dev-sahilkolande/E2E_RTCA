import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import { cryptoService } from '../services/cryptoService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('token') || null);
  const [isLoading, setIsLoading] = useState(true);

  const syncE2EEKeys = async (userData) => {
    if (!userData || !userData.id) return;
    try {
      const keys = await cryptoService.initUserKeys(userData.id);
      await api.post('/users/keys', keys);
    } catch (err) {
      console.warn('E2EE key sync warning:', err);
    }
  };

  // Bootstrap auth session on startup
  useEffect(() => {
    const bootstrapAuth = async () => {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        try {
          const res = await api.get('/auth/me');
          if (res.data && res.data.success) {
            const userData = res.data.data;
            await syncE2EEKeys(userData);
            setUser(userData);
            localStorage.setItem('user', JSON.stringify(userData));
          } else {
            clearSession();
          }
        } catch (err) {
          clearSession();
        }
      } else {
        clearSession();
      }
      setIsLoading(false);
    };

    bootstrapAuth();

    const handleSessionExpired = () => {
      clearSession();
    };

    window.addEventListener('auth-session-expired', handleSessionExpired);
    return () => window.removeEventListener('auth-session-expired', handleSessionExpired);
  }, []);

  const clearSession = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  const login = async (email, password) => {
    try {
      const res = await api.post('/auth/login', { email, password });
      if (res.data && res.data.success) {
        const { token: newToken, user: userData } = res.data.data;
        setToken(newToken);
        localStorage.setItem('token', newToken);
        localStorage.setItem('user', JSON.stringify(userData));
        await syncE2EEKeys(userData);
        setUser(userData);
        return { success: true };
      }
      return { success: false, message: res.data?.message || 'Login failed.' };
    } catch (err) {
      const msg = err.response?.data?.message || 'Authentication failed. Please check credentials.';
      return { success: false, message: msg };
    }
  };

  const register = async (username, email, password) => {
    try {
      const res = await api.post('/auth/register', { username, email, password });
      if (res.data && res.data.success) {
        const { token: newToken, user: userData } = res.data.data;
        setToken(newToken);
        localStorage.setItem('token', newToken);
        localStorage.setItem('user', JSON.stringify(userData));
        await syncE2EEKeys(userData);
        setUser(userData);
        return { success: true };
      }
      return { success: false, message: res.data?.message || 'Registration failed.' };
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed. Please check details.';
      return { success: false, message: msg };
    }
  };

  const logout = () => {
    clearSession();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user && !!token,
        isLoading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
