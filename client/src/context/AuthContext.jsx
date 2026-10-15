import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import * as authService from '../services/authService';
import { TOKEN_KEY } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const clearSession = () => {
      localStorage.removeItem(TOKEN_KEY);
      setUser(null);
      setToken(null);
      setLoading(false);
    };

    window.addEventListener('campusconnect:unauthorized', clearSession);

    const storedToken = localStorage.getItem(TOKEN_KEY);
    if (!storedToken) {
      setLoading(false);
      return () => window.removeEventListener('campusconnect:unauthorized', clearSession);
    }

    authService.getMe()
      .then(({ user: currentUser }) => setUser(currentUser))
      .catch((error) => {
        if (error.response?.status === 401) {
          clearSession();
          return;
        }
        setLoading(false);
        toast.error('Could not restore your session. Please sign in again.');
      })
      .finally(() => setLoading(false));

    return () => window.removeEventListener('campusconnect:unauthorized', clearSession);
  }, []);

  function saveSession(session) {
    localStorage.setItem(TOKEN_KEY, session.token);
    setToken(session.token);
    setUser(session.user);
  }

  async function login(credentials) {
    const session = await authService.login(credentials);
    saveSession(session);
    return session.user;
  }

  async function register(details) {
    const session = await authService.register(details);
    saveSession(session);
    return session.user;
  }

  function logout() {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
  }

  const value = useMemo(
    () => ({ user, token, loading, login, register, logout }),
    [user, token, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider.');
  }
  return context;
}
