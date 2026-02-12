import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiService } from '../services/api';

interface User {
  id: string;
  email: string;
  phone?: string;
  [key: string]: any;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<any>;
  signup: (email: string, password: string, phone?: string, referralCode?: string) => Promise<any>;
  logout: () => Promise<void>;
  verifyOtp: (userId: string, otp: string) => Promise<any>;
  setAuthData: (data: { user: User; token: string; refreshToken: string }) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load auth data from localStorage
    const storedToken = localStorage.getItem('token');
    const storedRefreshToken = localStorage.getItem('refreshToken');
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedUser) {
      setToken(storedToken);
      setRefreshToken(storedRefreshToken);
      setUser(JSON.parse(storedUser));
      
      // Verify token is still valid
      apiService.getMe(storedToken).catch(() => {
        // Token invalid, clear auth
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        setToken(null);
        setRefreshToken(null);
        setUser(null);
      });
    }
    
    setIsLoading(false);
  }, []);

  const setAuthData = (data: { user: User; token: string; refreshToken: string }) => {
    setUser(data.user);
    setToken(data.token);
    setRefreshToken(data.refreshToken);
    localStorage.setItem('token', data.token);
    localStorage.setItem('refreshToken', data.refreshToken);
    localStorage.setItem('user', JSON.stringify(data.user));
  };

  const login = async (email: string, password: string) => {
    const response = await apiService.login({ email, password });
    if (response.token && response.user) {
      setAuthData({
        user: response.user,
        token: response.token,
        refreshToken: response.refreshToken,
      });
    }
    return response;
  };

  const signup = async (email: string, password: string, phone?: string, referralCode?: string) => {
    const response = await apiService.signup({ email, password, phone, referralCode });
    return response;
  };

  const verifyOtp = async (userId: string, otp: string) => {
    const response = await apiService.verifyOtp({ userId, otp });
    if (response.token && response.user) {
      setAuthData({
        user: response.user,
        token: response.token,
        refreshToken: response.refreshToken,
      });
    }
    return response;
  };

  const logout = async () => {
    if (token && refreshToken) {
      try {
        await apiService.logout(token, refreshToken);
      } catch (error) {
        console.error('Logout error:', error);
      }
    }
    
    setUser(null);
    setToken(null);
    setRefreshToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{ user, token, refreshToken, isLoading, login, signup, logout, verifyOtp, setAuthData }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
