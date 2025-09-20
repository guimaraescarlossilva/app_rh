import { useState, useEffect, createContext, useContext, ReactNode, useCallback, useMemo } from 'react';
import { useLocation } from 'wouter';
import { apiRequest } from '@/lib/queryClient';

interface User {
  id: string;
  name: string;
  email: string;
  cpf: string;
  active: boolean;
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (cpf: string, password: string) => Promise<void>;
  logout: () => void;
  refreshAuth: () => Promise<boolean>;
}

const USER_STORAGE_KEY = 'user';
const AUTH_STORAGE_KEY = 'isAuthenticated';
const TOKEN_STORAGE_KEY = 'auth_token';
const AUTH_EXPIRY_KEY = 'auth_expiry';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [, setLocation] = useLocation();

  // Função para verificar se o token está expirado
  const isTokenExpired = useCallback(() => {
    const expiryTime = localStorage.getItem(AUTH_EXPIRY_KEY);
    if (!expiryTime) return true;
    
    return parseInt(expiryTime, 10) < Date.now();
  }, []);

  // Função para carregar usuário do localStorage
  const loadUserFromStorage = useCallback(() => {
    try {
      const storedUser = localStorage.getItem(USER_STORAGE_KEY);
      const isAuthenticated = localStorage.getItem(AUTH_STORAGE_KEY) === 'true';
      
      if (storedUser && isAuthenticated && !isTokenExpired()) {
        const userData = JSON.parse(storedUser);
        setUser(userData);
        return true;
      } else if (isTokenExpired()) {
        // Limpar dados expirados
        localStorage.removeItem(USER_STORAGE_KEY);
        localStorage.removeItem(AUTH_STORAGE_KEY);
        localStorage.removeItem(TOKEN_STORAGE_KEY);
        localStorage.removeItem(AUTH_EXPIRY_KEY);
      }
    } catch (error) {
      console.error('Erro ao parsear dados do usuário:', error);
      localStorage.removeItem(USER_STORAGE_KEY);
      localStorage.removeItem(AUTH_STORAGE_KEY);
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      localStorage.removeItem(AUTH_EXPIRY_KEY);
    }
    return false;
  }, [isTokenExpired]);

  // Verificar autenticação ao iniciar
  useEffect(() => {
    const initAuth = async () => {
      const userLoaded = loadUserFromStorage();
      
      if (!userLoaded) {
        // Tentar refresh apenas se houver token
        const token = localStorage.getItem(TOKEN_STORAGE_KEY);
        if (token) {
          await refreshAuth();
        }
      }
      
      setIsLoading(false);
    };
    
    initAuth();
  }, [loadUserFromStorage]);

  // Função para atualizar a autenticação com o servidor
  const refreshAuth = async (): Promise<boolean> => {
    try {
      const token = localStorage.getItem(TOKEN_STORAGE_KEY);
      if (!token) return false;
      
      const response = await apiRequest('POST', '/api/auth/refresh', { token });
      const data = await response.json();

      if (data && data.user) {
        setUser(data.user);
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(data.user));
        localStorage.setItem(AUTH_STORAGE_KEY, 'true');
        
        // Atualizar expiração (8 horas)
        const expiryTime = Date.now() + 8 * 60 * 60 * 1000;
        localStorage.setItem(AUTH_EXPIRY_KEY, expiryTime.toString());
        
        return true;
      }
      return false;
    } catch (error) {
      console.error('Erro ao atualizar autenticação:', error);
      return false;
    }
  };

  const login = async (cpf: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await apiRequest('POST', '/api/auth/login', { cpf, password });
      const data = await response.json();
      
      setUser(data.user);
      
      // Armazenar dados de autenticação
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(data.user));
      localStorage.setItem(AUTH_STORAGE_KEY, 'true');
      if (data.token) {
        localStorage.setItem(TOKEN_STORAGE_KEY, data.token);
      }
      
      // Definir expiração (8 horas)
      const expiryTime = Date.now() + 8 * 60 * 60 * 1000;
      localStorage.setItem(AUTH_EXPIRY_KEY, expiryTime.toString());
    } catch (error) {
      console.error('Erro no login:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem(USER_STORAGE_KEY);
    localStorage.removeItem(AUTH_STORAGE_KEY);
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(AUTH_EXPIRY_KEY);
    setLocation('/login');
  }, [setLocation]);

  // Verificar expiração do token periodicamente
  useEffect(() => {
    if (!user) return;
    
    const checkTokenInterval = setInterval(() => {
      if (isTokenExpired()) {
        console.log('Token expirado, fazendo logout');
        logout();
      }
    }, 60000); // Verificar a cada minuto
    
    return () => clearInterval(checkTokenInterval);
  }, [user, isTokenExpired, logout]);

  const value = useMemo(() => ({
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    refreshAuth
  }), [user, isLoading, logout]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
}

// Hook para proteger rotas
export function useRequireAuth() {
  const { isAuthenticated, isLoading, refreshAuth } = useAuth();
  const [, setLocation] = useLocation();
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      if (isLoading) return;
      
      if (!isAuthenticated) {
        // Tentar refresh antes de redirecionar
        setIsRefreshing(true);
        const refreshed = await refreshAuth();
        setIsRefreshing(false);
        
        if (!refreshed) {
          setLocation('/login');
        }
      }
    };
    
    checkAuth();
  }, [isAuthenticated, isLoading, refreshAuth, setLocation]);

  return { isAuthenticated, isLoading: isLoading || isRefreshing };
}
