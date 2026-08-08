import { create } from 'zustand';
import type { UserData, UserRole } from '../types';
import { auth, db } from '../services/firebase';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { ref, get } from 'firebase/database';
import { useEffect } from 'react';

interface AuthState {
  user: (UserData & { uid: string }) | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: (UserData & { uid: string }) | null) => void;
  setLoading: (loading: boolean) => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  error: null,

  login: async (email, password) => {
    set({ error: null, loading: true });
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password,
      );
      const uid = userCredential.user.uid;
      const userSnapshot = await get(ref(db, `users/${uid}`));
      if (!userSnapshot.exists()) {
        await signOut(auth);
        set({ loading: false, error: 'User tidak ditemukan di database.' });
        return;
      }
      const userData = userSnapshot.val() as UserData;
      set({
        user: { uid, ...userData },
        loading: false,
      });
    } catch (err: any) {
      let message = 'Login gagal. Periksa email dan password Anda.';
      const code: string | undefined = err?.code;
      const msg: string | undefined = err?.message;

      if (
        code === 'auth/invalid-credential' ||
        code === 'auth/user-not-found' ||
        code === 'auth/wrong-password'
      ) {
        message = 'Email atau password salah.';
      } else if (code === 'auth/invalid-email') {
        message = 'Format email tidak valid.';
      } else if (code === 'auth/user-disabled') {
        message = 'Akun Anda dinonaktifkan. Hubungi administrator.';
      } else if (code === 'auth/operation-not-allowed') {
        message =
          'Provider Email/Password belum diaktifkan di Firebase Console → Authentication → Sign-in method.';
      } else if (
        (code &&
          (code.includes('permission_denied') ||
            code.includes('PERMISSION_DENIED'))) ||
        (msg && /permission denied/i.test(msg))
      ) {
        message =
          'Permission Denied: Realtime Database Security Rules menolak akses. Paste file `firebase-database.rules.json` ke Firebase Console → Realtime Database → Rules, lalu klik Publish.';
      }
      if (message === 'Login gagal. Periksa email dan password Anda.' && msg) {
        message = `Login gagal: ${msg}`;
      }
      set({ error: message, loading: false });
    }
  },

  logout: async () => {
    set({ loading: true });
    try {
      await signOut(auth);
      set({ user: null, loading: false });
    } catch (err) {
      set({ loading: false });
    }
  },

  setUser: (user) => set({ user }),
  setLoading: (loading) => set({ loading }),
  clearError: () => set({ error: null }),
}));

export function useAuthListener() {
  const setUser = useAuthStore((s) => s.setUser);
  const setLoading = useAuthStore((s) => s.setLoading);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const snapshot = await get(ref(db, `users/${firebaseUser.uid}`));
          if (snapshot.exists()) {
            const userData = snapshot.val() as UserData;
            setUser({ uid: firebaseUser.uid, ...userData });
          } else {
            setUser(null);
          }
        } catch {
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, [setUser, setLoading]);
}

export function hasRole(
  role: UserRole | undefined,
  allowed: UserRole[],
): boolean {
  if (!role) return false;
  return allowed.includes(role);
}
