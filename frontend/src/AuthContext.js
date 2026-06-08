import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const API = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(() => localStorage.getItem('reamped_token'));
    const [loading, setLoading] = useState(!!localStorage.getItem('reamped_token'));

  const fetchMe = useCallback(async (t) => {
        if (!t) { setLoading(false); return; }
        try {
                const res = await fetch(`${API}/api/auth/me`, {
                          headers: { Authorization: `Bearer ${t}` },
                });
                if (res.ok) {
                          const data = await res.json();
                          setUser(data.user);
                } else {
                          localStorage.removeItem('reamped_token');
                          setToken(null);
                          setUser(null);
                }
        } catch {
                // network error — keep token but clear user
        } finally {
                setLoading(false);
        }
  }, []);

  useEffect(() => { fetchMe(token); }, [token, fetchMe]);

  const login = (userData, jwt) => {
        localStorage.setItem('reamped_token', jwt);
        setToken(jwt);
        setUser(userData);
  };

  const logout = () => {
        localStorage.removeItem('reamped_token');
        setToken(null);
        setUser(null);
  };

  const isPro = user?.tier === 'pro';

  return (
        <AuthContext.Provider value={{ user, token, loading, login, logout, isPro }}>
{children}
</AuthContext.Provider>
  );
}

export function useAuth() {
    return useContext(AuthContext);
}
