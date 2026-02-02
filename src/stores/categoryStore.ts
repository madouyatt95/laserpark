import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Category, CategoryType } from '../types';

// Initial demo categories
const createInitialCategories = (parkId: string): Category[] => [
    // Revenue categories
    {
        id: `cat_laser20_${parkId}`,
        park_id: parkId,
        name: 'Partie Laser 20 min',
        type: 'revenue',
        icon: '🎯',
        color: '#8b5cf6',
        impacts_stock: false,
        is_active: true,
        sort_order: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    },
    {
        id: `cat_laser40_${parkId}`,
        park_id: parkId,
        name: 'Partie Laser 40 min',
        type: 'revenue',
        icon: '🎯',
        color: '#7c3aed',
        impacts_stock: false,
        is_active: true,
        sort_order: 2,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    },
    {
        id: `cat_birthday_${parkId}`,
        park_id: parkId,
        name: 'Anniversaire',
        type: 'revenue',
        icon: '🎂',
        color: '#ec4899',
        impacts_stock: false,
        is_active: true,
        sort_order: 3,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    },
    {
        id: `cat_vip_${parkId}`,
        park_id: parkId,
        name: 'VIP',
        type: 'revenue',
        icon: '👑',
        color: '#f59e0b',
        impacts_stock: false,
        is_active: true,
        sort_order: 4,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    },
    {
        id: `cat_privatisation_${parkId}`,
        park_id: parkId,
        name: 'Privatisation',
        type: 'revenue',
        icon: '🎉',
        color: '#10b981',
        impacts_stock: false,
        is_active: true,
        sort_order: 5,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    },
    {
        id: `cat_drink_${parkId}`,
        park_id: parkId,
        name: 'Boisson',
        type: 'revenue',
        icon: '🥤',
        color: '#06b6d4',
        impacts_stock: true,
        stock_item_id: `stock_drinks_${parkId}`,
        is_active: true,
        sort_order: 6,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    },
    {
        id: `cat_snack_${parkId}`,
        park_id: parkId,
        name: 'Snack',
        type: 'revenue',
        icon: '🍿',
        color: '#f97316',
        impacts_stock: true,
        stock_item_id: `stock_snacks_${parkId}`,
        is_active: true,
        sort_order: 7,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    },
    // Expense categories
    {
        id: `cat_maintenance_${parkId}`,
        park_id: parkId,
        name: 'Maintenance matériel',
        type: 'expense',
        icon: '🔧',
        color: '#ef4444',
        impacts_stock: false,
        is_active: true,
        sort_order: 10,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    },
    {
        id: `cat_supplies_${parkId}`,
        park_id: parkId,
        name: 'Achat consommables',
        type: 'expense',
        icon: '🛒',
        color: '#f59e0b',
        impacts_stock: false,
        is_active: true,
        sort_order: 11,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    },
    {
        id: `cat_electricity_${parkId}`,
        park_id: parkId,
        name: 'Électricité',
        type: 'expense',
        icon: '💡',
        color: '#eab308',
        impacts_stock: false,
        is_active: true,
        sort_order: 12,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    },
    {
        id: `cat_cleaning_${parkId}`,
        park_id: parkId,
        name: 'Nettoyage',
        type: 'expense',
        icon: '🧹',
        color: '#22c55e',
        impacts_stock: false,
        is_active: true,
        sort_order: 13,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    },
    {
        id: `cat_other_${parkId}`,
        park_id: parkId,
        name: 'Divers',
        type: 'expense',
        icon: '📦',
        color: '#64748b',
        impacts_stock: false,
        is_active: true,
        sort_order: 14,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    },
];

const INITIAL_CATEGORIES: Category[] = [
    ...createInitialCategories('park_angre'),
    ...createInitialCategories('park_zone4'),
];

interface CategoryState {
    categories: Category[];
    isLoading: boolean;

    // Getters
    getCategoriesByPark: (parkId: string) => Category[];
    getCategoriesByType: (parkId: string, type: CategoryType) => Category[];
    getCategory: (categoryId: string) => Category | undefined;
    getRevenueCategories: (parkId: string) => Category[];
    getExpenseCategories: (parkId: string) => Category[];

    // Actions
    addCategory: (category: Omit<Category, 'id' | 'created_at' | 'updated_at'>) => void;
    updateCategory: (categoryId: string, updates: Partial<Category>) => void;
    toggleCategoryStatus: (categoryId: string) => void;
    deleteCategory: (categoryId: string) => void;
}

export const useCategoryStore = create<CategoryState>()(
    persist(
        (set, get) => ({
            categories: INITIAL_CATEGORIES,
            isLoading: false,

            getCategoriesByPark: (parkId: string) => {
                return get().categories
                    .filter(c => c.park_id === parkId && c.is_active)
                    .sort((a, b) => a.sort_order - b.sort_order);
            },

            getCategoriesByType: (parkId: string, type: CategoryType) => {
                return get().categories
                    .filter(c => c.park_id === parkId && c.type === type && c.is_active)
                    .sort((a, b) => a.sort_order - b.sort_order);
            },

            getCategory: (categoryId: string) => {
                return get().categories.find(c => c.id === categoryId);
            },

            getRevenueCategories: (parkId: string) => {
                return get().getCategoriesByType(parkId, 'revenue');
            },

            getExpenseCategories: (parkId: string) => {
                return get().getCategoriesByType(parkId, 'expense');
            },

            addCategory: (categoryData) => {
                const maxOrder = Math.max(
                    ...get().categories
                        .filter(c => c.park_id === categoryData.park_id && c.type === categoryData.type)
                        .map(c => c.sort_order),
                    0
                );

                const newCategory: Category = {
                    ...categoryData,
                    id: `cat_${Date.now()}`,
                    sort_order: maxOrder + 1,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                };
                set(state => ({ categories: [...state.categories, newCategory] }));
            },

            updateCategory: (categoryId, updates) => {
                set(state => ({
                    categories: state.categories.map(category =>
                        category.id === categoryId
                            ? { ...category, ...updates, updated_at: new Date().toISOString() }
                            : category
                    ),
                }));
            },

            toggleCategoryStatus: (categoryId) => {
                set(state => ({
                    categories: state.categories.map(category =>
                        category.id === categoryId
                            ? { ...category, is_active: !category.is_active, updated_at: new Date().toISOString() }
                            : category
                    ),
                }));
            },

            deleteCategory: (categoryId) => {
                set(state => ({
                    categories: state.categories.filter(c => c.id !== categoryId),
                }));
            },
        }),
        {
            name: 'laserpark-categories',
        }
    )
);
