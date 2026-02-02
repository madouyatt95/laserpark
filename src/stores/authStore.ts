import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, UserRole } from '../types';
import { useUserStore } from './userStore';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;

    // Actions
    login: (email: string, password: string) => Promise<boolean>;
    logout: () => Promise<void>;
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

                // Option A: Supabase Auth
                if (isSupabaseConfigured()) {
                    try {
                        const { data, error } = await supabase!.auth.signInWithPassword({
                            email,
                            password,
                        });

                        if (error) throw error;

                        if (data.user) {
                            // Get profile from profiles table
                            const { data: profile, error: profileError } = await supabase!
                                .from('profiles')
                                .select('*')
                                .eq('id', data.user.id)
                                .single();

                            if (profileError) throw profileError;

                            set({
                                user: profile as User,
                                isAuthenticated: true,
                                isLoading: false
                            });
                            return true;
                        }
                    } catch (err: any) {
                        set({
                            error: err.message || 'Erreur lors de la connexion',
                            isLoading: false
                        });
                        return false;
                    }
                }

                // Option B: Fallback Local Demo Mode
                await new Promise(resolve => setTimeout(resolve, 800));
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
                    error: 'Email ou mot de passe incorrect (Demo Mode)',
                    isLoading: false
                });
                return false;
            },

            logout: async () => {
                if (isSupabaseConfigured()) {
                    await supabase!.auth.signOut();
                }
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
