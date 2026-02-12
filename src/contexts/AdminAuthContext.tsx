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

  const readStorageValue = (key: string) => sessionStorage.getItem(key) || localStorage.getItem(key);
  const clearStorageValue = (key: string) => {
    sessionStorage.removeItem(key);
    localStorage.removeItem(key);
  };

  useEffect(() => {
    const storedToken = readStorageValue('adminToken');
    const storedRefreshToken = readStorageValue('adminRefreshToken');
    const storedAdmin = readStorageValue('admin');

    if (storedToken && storedAdmin) {
      setToken(storedToken);
      setRefreshToken(storedRefreshToken);
      setAdmin(JSON.parse(storedAdmin));
      
      apiService.getAdminMe(storedToken).catch(async () => {
        if (storedRefreshToken) {
          try {
            const refreshed = await apiService.adminRefreshAuth(storedRefreshToken);
            if (refreshed?.token && refreshed?.refreshToken) {
              const me = await apiService.getAdminMe(refreshed.token);
              setAuthData({
                admin: me?.admin || me,
                token: refreshed.token,
                refreshToken: refreshed.refreshToken,
              });
              return;
            }
          } catch {
            // fallback to clear below
          }
        }
        clearStorageValue('adminToken');
        clearStorageValue('adminRefreshToken');
        clearStorageValue('admin');
        setToken(null);
        setRefreshToken(null);
        setAdmin(null);
      });
    }

    const syncSessionState = () => {
      const nextToken = readStorageValue('adminToken');
      const nextRefresh = readStorageValue('adminRefreshToken');
      const nextAdmin = readStorageValue('admin');
      setToken(nextToken);
      setRefreshToken(nextRefresh);
      setAdmin(nextAdmin ? JSON.parse(nextAdmin) : null);
    };
    window.addEventListener('auth:session-updated', syncSessionState);
    
    setIsLoading(false);
    return () => window.removeEventListener('auth:session-updated', syncSessionState);
  }, []);

  const setAuthData = (data: { admin: Admin; token: string; refreshToken: string }) => {
    setAdmin(data.admin);
    setToken(data.token);
    setRefreshToken(data.refreshToken);
    clearStorageValue('adminToken');
    clearStorageValue('adminRefreshToken');
    clearStorageValue('admin');
    sessionStorage.setItem('adminToken', data.token);
    sessionStorage.setItem('adminRefreshToken', data.refreshToken);
    sessionStorage.setItem('admin', JSON.stringify(data.admin));
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
    clearStorageValue('adminToken');
    clearStorageValue('adminRefreshToken');
    clearStorageValue('admin');
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
