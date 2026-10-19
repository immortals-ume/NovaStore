import { createContext, use, useCallback, useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { api, setAuthToken, setUnauthorizedHandler } from '../api/client.js';
import { storage } from '../lib.js';

const KEY = 'novastore.user';
const AuthContext = createContext(null);

const initialUser = storage.get(KEY, null);
setAuthToken(initialUser?.token ?? null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(initialUser);
  const queryClient = useQueryClient();

  const saveUser = useCallback((next) => {
    setAuthToken(next?.token ?? null);
    storage.set(KEY, next);
    setUser(next);
  }, []);

  const signOut = useCallback(() => {
    saveUser(null);
    queryClient.removeQueries({ queryKey: ['orders'] });
    queryClient.removeQueries({ queryKey: ['order'] });
  }, [queryClient, saveUser]);

  // An expired or revoked token signs the user out instead of failing silently.
  useEffect(() => {
    setUnauthorizedHandler(signOut);
  }, [signOut]);

  const value = useMemo(
    () => ({
      user,
      signIn: async (email, password) => saveUser(await api.post('/api/users/signin', { email, password })),
      register: async (name, email, password) => saveUser(await api.post('/api/users/register', { name, email, password })),
      updateProfile: async (changes) => saveUser(await api.put(`/api/users/${user._id}`, changes)),
      signOut,
    }),
    [user, saveUser, signOut],
  );

  return <AuthContext value={value}>{children}</AuthContext>;
}

export const useAuth = () => use(AuthContext);
