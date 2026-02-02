import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { PaymentMethod } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useAuthStore } from './authStore';

export interface QuickShortcut {
    id: string;
    park_id: string;
    name: string;
    amount: number;
    quantity: number;
    category_id: string;
    payment_method: PaymentMethod;
    icon?: string;
    color?: string;
    sort_order: number;
    is_active: boolean;
    created_at: string;
}

// Default shortcuts per park
const createDefaultShortcuts = (parkId: string, categoryPrefix: string): QuickShortcut[] => [
    {
        id: `shortcut_${parkId}_1`,
        park_id: parkId,
        name: 'Laser 20min',
        amount: 5000,
        quantity: 1,
        category_id: `cat_laser20_${parkId}`,
        payment_method: 'cash',
        icon: '🎯',
        sort_order: 1,
        is_active: true,
        created_at: new Date().toISOString(),
    },
    {
        id: `shortcut_${parkId}_2`,
        park_id: parkId,
        name: 'Laser 40min',
        amount: 8000,
        quantity: 1,
        category_id: `cat_laser40_${parkId}`,
        payment_method: 'cash',
        icon: '🎯',
        sort_order: 2,
        is_active: true,
        created_at: new Date().toISOString(),
    },
    {
        id: `shortcut_${parkId}_3`,
        park_id: parkId,
        name: 'Boisson',
        amount: 1000,
        quantity: 1,
        category_id: `cat_drink_${parkId}`,
        payment_method: 'cash',
        icon: '🥤',
        sort_order: 3,
        is_active: true,
        created_at: new Date().toISOString(),
    },
    {
        id: `shortcut_${parkId}_4`,
        park_id: parkId,
        name: 'Snack',
        amount: 500,
        quantity: 1,
        category_id: `cat_snack_${parkId}`,
        payment_method: 'cash',
        icon: '🍿',
        sort_order: 4,
        is_active: true,
        created_at: new Date().toISOString(),
    },
];

const INITIAL_SHORTCUTS: QuickShortcut[] = [
    ...createDefaultShortcuts('park_angre', 'cat'),
    ...createDefaultShortcuts('park_zone4', 'cat'),
];

interface ShortcutState {
    shortcuts: QuickShortcut[];

    // Getters
    getShortcutsByPark: (parkId: string) => QuickShortcut[];
    getShortcut: (shortcutId: string) => QuickShortcut | undefined;

    // Actions
    fetchShortcuts: (parkId?: string) => Promise<void>;
    addShortcut: (data: Omit<QuickShortcut, 'id' | 'created_at' | 'sort_order'>) => Promise<void>;
    updateShortcut: (shortcutId: string, updates: Partial<QuickShortcut>) => Promise<void>;
    deleteShortcut: (shortcutId: string) => Promise<void>;
    toggleShortcut: (shortcutId: string) => Promise<void>;
    reorderShortcuts: (parkId: string, shortcutIds: string[]) => Promise<void>;
}

export const useShortcutStore = create<ShortcutState>()(
    persist(
        (set, get) => ({
            shortcuts: INITIAL_SHORTCUTS,

            getShortcutsByPark: (parkId) => {
                return get().shortcuts
                    .filter(s => s.park_id === parkId && s.is_active)
                    .sort((a, b) => a.sort_order - b.sort_order);
            },

            getShortcut: (shortcutId) => {
                return get().shortcuts.find(s => s.id === shortcutId);
            },

            fetchShortcuts: async (parkId) => {
                const isDemo = useAuthStore.getState().user?.is_demo;
                if (!isSupabaseConfigured() || isDemo) return;

                let query = supabase!.from('shortcuts').select('*');
                if (parkId) query = query.eq('park_id', parkId);
                const { data, error } = await query.order('sort_order');
                if (error) console.error('Error fetching shortcuts:', error);
                else set({ shortcuts: data as QuickShortcut[] });
            },

            addShortcut: async (data) => {
                const isDemo = useAuthStore.getState().user?.is_demo;
                const parkShortcuts = get().shortcuts.filter(s => s.park_id === data.park_id);
                const maxOrder = Math.max(...parkShortcuts.map(s => s.sort_order), 0);

                if (isSupabaseConfigured() && !isDemo) {
                    const { data: newShortcut, error } = await supabase!
                        .from('shortcuts')
                        .insert([{ ...data, sort_order: maxOrder + 1 }])
                        .select()
                        .single();
                    if (error) throw error;
                    if (newShortcut) set(state => ({ shortcuts: [...state.shortcuts, newShortcut as QuickShortcut] }));
                    return;
                }

                const newShortcut: QuickShortcut = {
                    ...data,
                    id: `shortcut_${Date.now()}`,
                    sort_order: maxOrder + 1,
                    created_at: new Date().toISOString(),
                };
                set(state => ({ shortcuts: [...state.shortcuts, newShortcut] }));
            },

            updateShortcut: async (shortcutId, updates) => {
                const isDemo = useAuthStore.getState().user?.is_demo;
                if (isSupabaseConfigured() && !isDemo) {
                    const { error } = await supabase!
                        .from('shortcuts')
                        .update(updates)
                        .eq('id', shortcutId);
                    if (error) throw error;
                }
                set(state => ({
                    shortcuts: state.shortcuts.map(s =>
                        s.id === shortcutId ? { ...s, ...updates } : s
                    ),
                }));
            },

            deleteShortcut: async (shortcutId) => {
                const isDemo = useAuthStore.getState().user?.is_demo;
                if (isSupabaseConfigured() && !isDemo) {
                    const { error } = await supabase!.from('shortcuts').delete().eq('id', shortcutId);
                    if (error) throw error;
                }
                set(state => ({
                    shortcuts: state.shortcuts.filter(s => s.id !== shortcutId),
                }));
            },

            toggleShortcut: async (shortcutId) => {
                const isDemo = useAuthStore.getState().user?.is_demo;
                const shortcut = get().shortcuts.find(s => s.id === shortcutId);
                if (!shortcut) return;
                const newStatus = !shortcut.is_active;

                if (isSupabaseConfigured() && !isDemo) {
                    const { error } = await supabase!
                        .from('shortcuts')
                        .update({ is_active: newStatus })
                        .eq('id', shortcutId);
                    if (error) throw error;
                }
                set(state => ({
                    shortcuts: state.shortcuts.map(s =>
                        s.id === shortcutId ? { ...s, is_active: newStatus } : s
                    ),
                }));
            },

            reorderShortcuts: async (parkId, shortcutIds) => {
                const isDemo = useAuthStore.getState().user?.is_demo;
                if (isSupabaseConfigured() && !isDemo) {
                    // Update each shortcut order in Supabase
                    const updates = shortcutIds.map((id, index) =>
                        supabase!.from('shortcuts').update({ sort_order: index }).eq('id', id)
                    );
                    await Promise.all(updates);
                }

                set(state => ({
                    shortcuts: state.shortcuts.map(s => {
                        if (s.park_id !== parkId) return s;
                        const newOrder = shortcutIds.indexOf(s.id);
                        return newOrder >= 0 ? { ...s, sort_order: newOrder } : s;
                    }),
                }));
            },
        }),
        {
            name: 'laserpark-shortcuts',
        }
    )
);
