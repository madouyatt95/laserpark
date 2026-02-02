import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, UserRole } from '../types';
import { useUserStore } from './userStore';

interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;

    // Actions
    login: (email: string, password: string) => Promise<boolean>;
    logout: () => void;
    clearError: () => void;
    hasPermission: (requiredRole: UserRole | UserRole[]) => boolean;
    canAccessPark: (parkId: string) => boolean;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,

            login: async (email: string, password: string) => {
                set({ isLoading: true, error: null });

                // Simulate API delay
                await new Promise(resolve => setTimeout(resolve, 800));

                // Use userStore to validate credentials
                const userStore = useUserStore.getState();
                const validatedUser = userStore.validateCredentials(email, password);

                if (validatedUser) {
                    set({
                        user: validatedUser,
                        isAuthenticated: true,
                        isLoading: false
                    });
                    return true;
                }

                set({
                    error: 'Email ou mot de passe incorrect',
                    isLoading: false
                });
                return false;
            },

            logout: () => {
                set({ user: null, isAuthenticated: false, error: null });
            },

            clearError: () => {
                set({ error: null });
            },

            hasPermission: (requiredRole: UserRole | UserRole[]) => {
                const { user } = get();
                if (!user) return false;

                const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];

                // Super admin has all permissions
                if (user.role === 'super_admin') return true;

                return roles.includes(user.role);
            },

            canAccessPark: (parkId: string) => {
                const { user } = get();
                if (!user) return false;

                // Super admin can access all parks
                if (user.role === 'super_admin') return true;

                // Manager/Staff can only access their assigned park
                return user.park_id === parkId;
            },
        }),
        {
            name: 'laserpark-auth',
            partialize: (state) => ({
                user: state.user,
                isAuthenticated: state.isAuthenticated
            }),
        }
    )
);
