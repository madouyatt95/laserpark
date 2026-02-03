import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, UserRole } from '../types';
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
    canManagePlanning: () => boolean;
    canAccessClosure: () => boolean;
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

                // Only Supabase authentication - no demo mode
                if (!isSupabaseConfigured()) {
                    set({
                        error: 'Supabase non configuré. Contactez l\'administrateur.',
                        isLoading: false
                    });
                    return false;
                }

                try {
                    const { data, error } = await supabase!.auth.signInWithPassword({
                        email,
                        password,
                    });

                    if (error) {
                        console.error('Supabase auth error:', error.message);
                        set({
                            error: error.message === 'Invalid login credentials'
                                ? 'Email ou mot de passe incorrect'
                                : error.message,
                            isLoading: false
                        });
                        return false;
                    }

                    if (data.user) {
                        // Try to get existing profile
                        let { data: profile, error: profileError } = await supabase!
                            .from('profiles')
                            .select('*')
                            .eq('id', data.user.id)
                            .maybeSingle();

                        // If no profile exists, create one
                        if (!profile && !profileError) {
                            const { data: newProfile, error: createError } = await supabase!
                                .from('profiles')
                                .insert({
                                    id: data.user.id,
                                    email: data.user.email,
                                    full_name: data.user.user_metadata?.full_name || email.split('@')[0],
                                    role: 'staff',
                                    is_active: true,
                                })
                                .select()
                                .single();

                            if (createError) {
                                console.error('Error creating profile:', createError);
                            } else {
                                profile = newProfile;
                            }
                        }

                        if (profile) {
                            // Check if user is approved (active AND has a role)
                            if (!profile.is_active) {
                                set({
                                    error: 'Votre compte n\'est pas encore activé. Contactez un administrateur.',
                                    isLoading: false
                                });
                                await supabase!.auth.signOut();
                                return false;
                            }
                            if (!profile.role) {
                                set({
                                    error: 'Aucun rôle attribué à votre compte. Contactez un administrateur.',
                                    isLoading: false
                                });
                                await supabase!.auth.signOut();
                                return false;
                            }

                            set({
                                user: profile as User,
                                isAuthenticated: true,
                                isLoading: false
                            });
                            return true;
                        } else {
                            console.error('Profile error:', profileError);
                        }
                    }
                } catch (err: any) {
                    console.error('Supabase login failed:', err.message);
                }

                // No valid user found
                set({
                    error: 'Email ou mot de passe incorrect',
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

            // Staff can view planning but not edit
            canManagePlanning: () => {
                const { user } = get();
                if (!user) return false;
                return user.role === 'super_admin' || user.role === 'manager';
            },

            // Only managers and super_admin can access closure
            canAccessClosure: () => {
                const { user } = get();
                if (!user) return false;
                return user.role === 'super_admin' || user.role === 'manager';
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
