import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { StockItem, StockMovement, StockMovementType } from '../types';

// Initial stock items
const createInitialStock = (parkId: string): StockItem[] => [
    {
        id: `stock_drinks_${parkId}`,
        park_id: parkId,
        name: 'Boissons',
        category: 'Boissons',
        quantity: 50,
        min_threshold: 10,
        unit: 'unités',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    },
    {
        id: `stock_snacks_${parkId}`,
        park_id: parkId,
        name: 'Snacks',
        category: 'Alimentation',
        quantity: 30,
        min_threshold: 5,
        unit: 'unités',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    },
    {
        id: `stock_batteries_${parkId}`,
        park_id: parkId,
        name: 'Batteries laser',
        category: 'Équipement',
        quantity: 20,
        min_threshold: 5,
        unit: 'unités',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    },
];

const INITIAL_STOCK: StockItem[] = [
    ...createInitialStock('park_angre'),
    ...createInitialStock('park_zone4'),
];

interface StockState {
    stockItems: StockItem[];
    stockMovements: StockMovement[];
    isLoading: boolean;

    // Getters
    getStockByPark: (parkId: string) => StockItem[];
    getStockItem: (stockItemId: string) => StockItem | undefined;
    getLowStockItems: (parkId: string) => StockItem[];
    getStockMovements: (stockItemId: string) => StockMovement[];

    // Actions
    addStockItem: (item: Omit<StockItem, 'id' | 'created_at' | 'updated_at'>) => void;
    updateStockItem: (itemId: string, updates: Partial<StockItem>) => void;
    deleteStockItem: (itemId: string) => void;

    // Stock movements
    addStockEntry: (itemId: string, quantity: number, reason: string, userId: string) => void;
    decrementStock: (itemId: string, quantity: number, activityId: string | undefined, userId: string) => void;
    adjustStock: (itemId: string, newQuantity: number, reason: string, userId: string) => void;
}

export const useStockStore = create<StockState>()(
    persist(
        (set, get) => ({
            stockItems: INITIAL_STOCK,
            stockMovements: [],
            isLoading: false,

            getStockByPark: (parkId: string) => {
                return get().stockItems.filter(s => s.park_id === parkId && s.is_active);
            },

            getStockItem: (stockItemId: string) => {
                return get().stockItems.find(s => s.id === stockItemId);
            },

            getLowStockItems: (parkId: string) => {
                return get().stockItems.filter(
                    s => s.park_id === parkId && s.is_active && s.quantity <= s.min_threshold
                );
            },

            getStockMovements: (stockItemId: string) => {
                return get().stockMovements
                    .filter(m => m.stock_item_id === stockItemId)
                    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
            },

            addStockItem: (itemData) => {
                const newItem: StockItem = {
                    ...itemData,
                    id: `stock_${Date.now()}`,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                };
                set(state => ({ stockItems: [...state.stockItems, newItem] }));
            },

            updateStockItem: (itemId, updates) => {
                set(state => ({
                    stockItems: state.stockItems.map(item =>
                        item.id === itemId
                            ? { ...item, ...updates, updated_at: new Date().toISOString() }
                            : item
                    ),
                }));
            },

            deleteStockItem: (itemId) => {
                set(state => ({
                    stockItems: state.stockItems.filter(s => s.id !== itemId),
                }));
            },

            addStockEntry: (itemId, quantity, reason, userId) => {
                const item = get().getStockItem(itemId);
                if (!item) return;

                const movement: StockMovement = {
                    id: `mov_${Date.now()}`,
                    stock_item_id: itemId,
                    park_id: item.park_id,
                    type: 'entry',
                    quantity,
                    reason,
                    created_by: userId,
                    created_at: new Date().toISOString(),
                };

                set(state => ({
                    stockItems: state.stockItems.map(s =>
                        s.id === itemId
                            ? { ...s, quantity: s.quantity + quantity, updated_at: new Date().toISOString() }
                            : s
                    ),
                    stockMovements: [movement, ...state.stockMovements],
                }));
            },

            decrementStock: (itemId, quantity, activityId, userId) => {
                const item = get().getStockItem(itemId);
                if (!item) return;

                const movement: StockMovement = {
                    id: `mov_${Date.now()}`,
                    stock_item_id: itemId,
                    park_id: item.park_id,
                    type: 'exit',
                    quantity,
                    activity_id: activityId,
                    reason: 'Vente',
                    created_by: userId,
                    created_at: new Date().toISOString(),
                };

                set(state => ({
                    stockItems: state.stockItems.map(s =>
                        s.id === itemId
                            ? { ...s, quantity: Math.max(0, s.quantity - quantity), updated_at: new Date().toISOString() }
                            : s
                    ),
                    stockMovements: [movement, ...state.stockMovements],
                }));
            },

            adjustStock: (itemId, newQuantity, reason, userId) => {
                const item = get().getStockItem(itemId);
                if (!item) return;

                const difference = newQuantity - item.quantity;

                const movement: StockMovement = {
                    id: `mov_${Date.now()}`,
                    stock_item_id: itemId,
                    park_id: item.park_id,
                    type: 'adjustment',
                    quantity: Math.abs(difference),
                    reason: `${reason} (${difference >= 0 ? '+' : ''}${difference})`,
                    created_by: userId,
                    created_at: new Date().toISOString(),
                };

                set(state => ({
                    stockItems: state.stockItems.map(s =>
                        s.id === itemId
                            ? { ...s, quantity: newQuantity, updated_at: new Date().toISOString() }
                            : s
                    ),
                    stockMovements: [movement, ...state.stockMovements],
                }));
            },
        }),
        {
            name: 'laserpark-stock',
        }
    )
);
