import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  name: string;
  email: string;
  student_id?: string;
  avatar?: string;
  is_suspended: boolean;
}

interface MemberAuthStore {
  user: User | null;
  token: string | null;
  setUser: (user: User | null, token?: string) => void;
  clearUser: () => void;
  isAuthenticated: () => boolean;
}

export const useMemberAuthStore = create<MemberAuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,

      setUser: (user, token) => {
        set({ user, token: token || get().token });
        if (token) {
          localStorage.setItem('member_token', token);
          document.cookie = `member_token=${token}; path=/;`;
        }
      },

      clearUser: () => {
        set({ user: null, token: null });
        localStorage.removeItem('member_token');
        document.cookie = 'member_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;';
      },

      isAuthenticated: () => {
        const { token } = get();
        return !!token;
      },
    }),
    {
      name: 'member-auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
      }),
    }
  )
);
