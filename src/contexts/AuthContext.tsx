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
  login: (email: string, password: string, rememberMe?: boolean) => Promise<any>;
  signup: (email: string, password: string, phone?: string, referralCode?: string) => Promise<any>;
  logout: () => Promise<void>;
  verifyOtp: (userId: string, otp: string) => Promise<any>;
  setAuthData: (data: { user: User; token: string; refreshToken: string }, rememberMe?: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const readStorageValue = (key: string) => sessionStorage.getItem(key) || localStorage.getItem(key);
  const clearStorageValue = (key: string) => {
    sessionStorage.removeItem(key);
    localStorage.removeItem(key);
  };

  useEffect(() => {
    const storedToken = readStorageValue('token');
    const storedRefreshToken = readStorageValue('refreshToken');
    const storedUser = readStorageValue('user');

    if (storedToken && storedUser) {
      setToken(storedToken);
      setRefreshToken(storedRefreshToken);
      setUser(JSON.parse(storedUser));
      
      apiService.getMe(storedToken).then((profile: any) => {
        setUser(profile?.user || profile);
        sessionStorage.setItem('user', JSON.stringify(profile?.user || profile));
      }).catch(async () => {
        if (storedRefreshToken) {
          try {
            const refreshed = await apiService.refreshAuth(storedRefreshToken);
            const nextToken = refreshed.token;
            const nextRefresh = refreshed.refreshToken;
            if (nextToken && nextRefresh) {
              const profile = await apiService.getMe(nextToken);
              setAuthData({
                user: profile?.user || profile,
                token: nextToken,
                refreshToken: nextRefresh,
              }, localStorage.getItem('userSessionPersistent') === 'true');
              return;
            }
          } catch {
            // fallback to clear below
          }
        }
        clearStorageValue('token');
        clearStorageValue('refreshToken');
        clearStorageValue('user');
        localStorage.removeItem('userSessionPersistent');
        setToken(null);
        setRefreshToken(null);
        setUser(null);
      });
    }

    const syncSessionState = () => {
      const nextToken = readStorageValue('token');
      const nextRefresh = readStorageValue('refreshToken');
      const nextUser = readStorageValue('user');
      setToken(nextToken);
      setRefreshToken(nextRefresh);
      setUser(nextUser ? JSON.parse(nextUser) : null);
    };
    window.addEventListener('auth:session-updated', syncSessionState);
    
    setIsLoading(false);
    return () => window.removeEventListener('auth:session-updated', syncSessionState);
  }, []);

  const setAuthData = (data: { user: User; token: string; refreshToken: string }, rememberMe = false) => {
    setUser(data.user);
    setToken(data.token);
    setRefreshToken(data.refreshToken);
    sessionStorage.setItem('token', data.token);
    sessionStorage.setItem('refreshToken', data.refreshToken);
    sessionStorage.setItem('user', JSON.stringify(data.user));
    if (rememberMe) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('refreshToken', data.refreshToken);
      localStorage.setItem('user', JSON.stringify(data.user));
      localStorage.setItem('userSessionPersistent', 'true');
    } else {
      clearStorageValue('token');
      clearStorageValue('refreshToken');
      clearStorageValue('user');
      sessionStorage.setItem('token', data.token);
      sessionStorage.setItem('refreshToken', data.refreshToken);
      sessionStorage.setItem('user', JSON.stringify(data.user));
      localStorage.removeItem('userSessionPersistent');
    }
  };

  const login = async (email: string, password: string, rememberMe = false) => {
    const response = await apiService.login({ email, password });
    if (response.token) {
      const profile = await apiService.getMe(response.token);
      setAuthData({
        user: profile?.user || profile,
        token: response.token,
        refreshToken: response.refreshToken,
      }, rememberMe);
    }
    return response;
  };

  const signup = async (email: string, password: string, phone?: string, referralCode?: string) => {
    const response = await apiService.signup({ email, password, phone, referralCode });
    return response;
  };

  const verifyOtp = async (userId: string, otp: string) => {
    const response = await apiService.verifyOtp({ userId, otp });
    if (response.token) {
      const profile = await apiService.getMe(response.token);
      setAuthData({
        user: profile?.user || profile,
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
    clearStorageValue('token');
    clearStorageValue('refreshToken');
    clearStorageValue('user');
    localStorage.removeItem('userSessionPersistent');
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
