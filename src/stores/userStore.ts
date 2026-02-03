import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, UserRole } from '../types';

// Users store - for local user management
interface UserWithPassword extends User {
    password: string;
}

interface UserState {
    users: UserWithPassword[];

    // Getters
    getAllUsers: () => User[];
    getUsersByPark: (parkId: string) => User[];
    getUserById: (userId: string) => User | undefined;

    // Actions
    addUser: (userData: {
        email: string;
        password: string;
        full_name: string;
        role: UserRole;
        park_id: string | null;
    }) => User;
    updateUser: (userId: string, updates: Partial<User>) => void;
    toggleUserStatus: (userId: string) => void;
    deleteUser: (userId: string) => void;
    validateCredentials: (email: string, password: string) => User | null;
}

export const useUserStore = create<UserState>()(
    persist(
        (set, get) => ({
            users: [], // No demo users - all users come from Supabase

            getAllUsers: () => {
                return get().users.map(({ password, ...user }) => user);
            },

            getUsersByPark: (parkId: string) => {
                return get().users
                    .filter(u => u.park_id === parkId || u.role === 'super_admin')
                    .map(({ password, ...user }) => user);
            },

            getUserById: (userId: string) => {
                const user = get().users.find(u => u.id === userId);
                if (user) {
                    const { password, ...userWithoutPassword } = user;
                    return userWithoutPassword;
                }
                return undefined;
            },

            addUser: (userData) => {
                const now = new Date().toISOString();
                const newUser: UserWithPassword = {
                    id: `usr_${Date.now()}`,
                    email: userData.email.toLowerCase(),
                    password: userData.password,
                    full_name: userData.full_name,
                    role: userData.role,
                    park_id: userData.park_id,
                    is_active: true,
                    created_at: now,
                    updated_at: now,
                };
                set(state => ({ users: [...state.users, newUser] }));
                const { password, ...userWithoutPassword } = newUser;
                return userWithoutPassword;
            },

            updateUser: (userId, updates) => {
                set(state => ({
                    users: state.users.map(u =>
                        u.id === userId
                            ? { ...u, ...updates, updated_at: new Date().toISOString() }
                            : u
                    ),
                }));
            },

            toggleUserStatus: (userId) => {
                set(state => ({
                    users: state.users.map(u =>
                        u.id === userId
                            ? { ...u, is_active: !u.is_active, updated_at: new Date().toISOString() }
                            : u
                    ),
                }));
            },

            deleteUser: (userId) => {
                set(state => ({
                    users: state.users.filter(u => u.id !== userId),
                }));
            },

            validateCredentials: (_email, _password) => {
                // Demo credentials no longer supported
                // All authentication goes through Supabase
                return null;
            },
        }),
        {
            name: 'laserpark-users',
        }
    )
);
