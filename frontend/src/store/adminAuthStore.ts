import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Admin {
  id: string;
  name: string;
  email: string;
  role: 'super_admin' | 'admin';
}

interface AdminAuthStore {
  admin: Admin | null;
  token: string | null;
  setAdmin: (admin: Admin | null, token?: string) => void;
  clearAdmin: () => void;
  isAuthenticated: () => boolean;
}

export const useAdminAuthStore = create<AdminAuthStore>()(
  persist(
    (set, get) => ({
      admin: null,
      token: null,

      setAdmin: (admin, token) => {
        set({ admin, token: token || get().token });
        if (token) {
          localStorage.setItem('admin_token', token);
          document.cookie = `admin_token=${token}; path=/;`;
        }
      },

      clearAdmin: () => {
        set({ admin: null, token: null });
        localStorage.removeItem('admin_token');
        document.cookie = 'admin_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;';
      },

      isAuthenticated: () => {
        const { token } = get();
        return !!token;
      },
    }),
    {
      name: 'admin-auth-storage',
      partialize: (state) => ({
        admin: state.admin,
        token: state.token,
      }),
    }
  )
);
