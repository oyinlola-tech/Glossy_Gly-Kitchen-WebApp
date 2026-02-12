import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiService } from '../services/api';

interface Admin {
  id: string;
  email: string;
  fullName: string;
  role: string;
  [key: string]: any;
}

interface AdminAuthContextType {
  admin: Admin | null;
  token: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  login: (email: string, password: string, otp?: string) => Promise<any>;
  logout: () => Promise<void>;
  setAuthData: (data: { admin: Admin; token: string; refreshToken: string }) => void;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export const AdminAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load auth data from localStorage
    const storedToken = localStorage.getItem('adminToken');
    const storedRefreshToken = localStorage.getItem('adminRefreshToken');
    const storedAdmin = localStorage.getItem('admin');

    if (storedToken && storedAdmin) {
      setToken(storedToken);
      setRefreshToken(storedRefreshToken);
      setAdmin(JSON.parse(storedAdmin));
      
      // Verify token is still valid
      apiService.getAdminMe(storedToken).catch(() => {
        // Token invalid, clear auth
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminRefreshToken');
        localStorage.removeItem('admin');
        setToken(null);
        setRefreshToken(null);
        setAdmin(null);
      });
    }
    
    setIsLoading(false);
  }, []);

  const setAuthData = (data: { admin: Admin; token: string; refreshToken: string }) => {
    setAdmin(data.admin);
    setToken(data.token);
    setRefreshToken(data.refreshToken);
    localStorage.setItem('adminToken', data.token);
    localStorage.setItem('adminRefreshToken', data.refreshToken);
    localStorage.setItem('admin', JSON.stringify(data.admin));
  };

  const login = async (email: string, password: string, otp?: string) => {
    const response = await apiService.adminLogin({ email, password, otp });
    if (response.token && response.admin) {
      setAuthData({
        admin: response.admin,
        token: response.token,
        refreshToken: response.refreshToken,
      });
    }
    return response;
  };

  const logout = async () => {
    if (token && refreshToken) {
      try {
        await apiService.adminLogout(token, refreshToken);
      } catch (error) {
        console.error('Logout error:', error);
      }
    }
    
    setAdmin(null);
    setToken(null);
    setRefreshToken(null);
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminRefreshToken');
    localStorage.removeItem('admin');
  };

  return (
    <AdminAuthContext.Provider value={{ admin, token, refreshToken, isLoading, login, logout, setAuthData }}>
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (context === undefined) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
};
