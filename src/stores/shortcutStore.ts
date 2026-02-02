import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { PaymentMethod } from '../types';

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
    addShortcut: (data: Omit<QuickShortcut, 'id' | 'created_at' | 'sort_order'>) => void;
    updateShortcut: (shortcutId: string, updates: Partial<QuickShortcut>) => void;
    deleteShortcut: (shortcutId: string) => void;
    toggleShortcut: (shortcutId: string) => void;
    reorderShortcuts: (parkId: string, shortcutIds: string[]) => void;
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

            addShortcut: (data) => {
                const parkShortcuts = get().shortcuts.filter(s => s.park_id === data.park_id);
                const maxOrder = Math.max(...parkShortcuts.map(s => s.sort_order), 0);

                const newShortcut: QuickShortcut = {
                    ...data,
                    id: `shortcut_${Date.now()}`,
                    sort_order: maxOrder + 1,
                    created_at: new Date().toISOString(),
                };
                set(state => ({ shortcuts: [...state.shortcuts, newShortcut] }));
            },

            updateShortcut: (shortcutId, updates) => {
                set(state => ({
                    shortcuts: state.shortcuts.map(s =>
                        s.id === shortcutId ? { ...s, ...updates } : s
                    ),
                }));
            },

            deleteShortcut: (shortcutId) => {
                set(state => ({
                    shortcuts: state.shortcuts.filter(s => s.id !== shortcutId),
                }));
            },

            toggleShortcut: (shortcutId) => {
                set(state => ({
                    shortcuts: state.shortcuts.map(s =>
                        s.id === shortcutId ? { ...s, is_active: !s.is_active } : s
                    ),
                }));
            },

            reorderShortcuts: (parkId, shortcutIds) => {
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
