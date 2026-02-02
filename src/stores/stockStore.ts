import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { StockItem, StockMovement, StockMovementType } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useAuthStore } from './authStore';

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
    fetchStock: (parkId?: string) => Promise<void>;
    addStockItem: (item: Omit<StockItem, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
    updateStockItem: (itemId: string, updates: Partial<StockItem>) => Promise<void>;
    deleteStockItem: (itemId: string) => Promise<void>;

    // Stock movements
    fetchMovements: (stockItemId: string) => Promise<void>;
    addStockEntry: (itemId: string, quantity: number, reason: string, userId: string) => Promise<void>;
    decrementStock: (itemId: string, quantity: number, activityId: string | undefined, userId: string) => Promise<void>;
    adjustStock: (itemId: string, newQuantity: number, reason: string, userId: string) => Promise<void>;
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

            fetchStock: async (parkId) => {
                const isDemo = useAuthStore.getState().user?.is_demo;
                if (!isSupabaseConfigured() || isDemo) return;
                set({ isLoading: true });
                let query = supabase!.from('stock_items').select('*');
                if (parkId) query = query.eq('park_id', parkId);
                const { data, error } = await query.order('name');
                if (error) {
                    console.error('Error fetching stock:', error);
                    set({ isLoading: false });
                    return;
                }
                set({ stockItems: data as StockItem[], isLoading: false });
            },

            addStockItem: async (itemData) => {
                const isDemo = useAuthStore.getState().user?.is_demo;
                if (isSupabaseConfigured() && !isDemo) {
                    const { data, error } = await supabase!
                        .from('stock_items')
                        .insert([itemData])
                        .select()
                        .single();
                    if (error) throw error;
                    if (data) set(state => ({ stockItems: [...state.stockItems, data as StockItem] }));
                    return;
                }
                const newItem: StockItem = {
                    ...itemData,
                    id: `stock_${Date.now()}`,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                };
                set(state => ({ stockItems: [...state.stockItems, newItem] }));
            },

            updateStockItem: async (itemId, updates) => {
                const isDemo = useAuthStore.getState().user?.is_demo;
                if (isSupabaseConfigured() && !isDemo) {
                    const { error } = await supabase!
                        .from('stock_items')
                        .update(updates)
                        .eq('id', itemId);
                    if (error) throw error;
                }
                set(state => ({
                    stockItems: state.stockItems.map(item =>
                        item.id === itemId
                            ? { ...item, ...updates, updated_at: new Date().toISOString() }
                            : item
                    ),
                }));
            },

            deleteStockItem: async (itemId) => {
                const isDemo = useAuthStore.getState().user?.is_demo;
                if (isSupabaseConfigured() && !isDemo) {
                    const { error } = await supabase!.from('stock_items').delete().eq('id', itemId);
                    if (error) throw error;
                }
                set(state => ({
                    stockItems: state.stockItems.filter(s => s.id !== itemId),
                }));
            },

            fetchMovements: async (stockItemId) => {
                const isDemo = useAuthStore.getState().user?.is_demo;
                if (!isSupabaseConfigured() || isDemo) return;
                const { data, error } = await supabase!
                    .from('stock_movements')
                    .select('*')
                    .eq('stock_item_id', stockItemId)
                    .order('created_at', { ascending: false });
                if (error) console.error('Error fetching movements:', error);
                else set({ stockMovements: data as StockMovement[] });
            },

            addStockEntry: async (itemId, quantity, reason, userId) => {
                const item = get().getStockItem(itemId);
                if (!item) return;

                const movementData = {
                    stock_item_id: itemId,
                    park_id: item.park_id,
                    type: 'entry' as StockMovementType,
                    quantity,
                    reason,
                    created_by: userId,
                };

                const isDemo = useAuthStore.getState().user?.is_demo;
                if (isSupabaseConfigured() && !isDemo) {
                    const { data: movement, error } = await supabase!
                        .from('stock_movements')
                        .insert([movementData])
                        .select()
                        .single();
                    if (error) throw error;

                    // Update stock item quantity
                    const { error: updateError } = await supabase!
                        .from('stock_items')
                        .update({ quantity: item.quantity + quantity })
                        .eq('id', itemId);
                    if (updateError) throw updateError;

                    set(state => ({
                        stockItems: state.stockItems.map(s =>
                            s.id === itemId ? { ...s, quantity: s.quantity + quantity } : s
                        ),
                        stockMovements: [movement as StockMovement, ...state.stockMovements],
                    }));
                    return;
                }

                const movement: StockMovement = {
                    id: `mov_${Date.now()}`,
                    ...movementData,
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

            decrementStock: async (itemId, quantity, activityId, userId) => {
                const item = get().getStockItem(itemId);
                if (!item) return;

                const movementData = {
                    stock_item_id: itemId,
                    park_id: item.park_id,
                    type: 'exit' as StockMovementType,
                    quantity,
                    activity_id: activityId,
                    reason: 'Vente',
                    created_by: userId,
                };

                const isDemo = useAuthStore.getState().user?.is_demo;
                if (isSupabaseConfigured() && !isDemo) {
                    const { data: movement, error } = await supabase!
                        .from('stock_movements')
                        .insert([movementData])
                        .select()
                        .single();
                    if (error) throw error;

                    const newQty = Math.max(0, item.quantity - quantity);
                    const { error: updateError } = await supabase!
                        .from('stock_items')
                        .update({ quantity: newQty })
                        .eq('id', itemId);
                    if (updateError) throw updateError;

                    set(state => ({
                        stockItems: state.stockItems.map(s =>
                            s.id === itemId ? { ...s, quantity: newQty } : s
                        ),
                        stockMovements: [movement as StockMovement, ...state.stockMovements],
                    }));
                    return;
                }

                const movement: StockMovement = {
                    id: `mov_${Date.now()}`,
                    ...movementData,
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

            adjustStock: async (itemId, newQuantity, reason, userId) => {
                const item = get().getStockItem(itemId);
                if (!item) return;

                const difference = newQuantity - item.quantity;
                const movementData = {
                    stock_item_id: itemId,
                    park_id: item.park_id,
                    type: 'adjustment' as StockMovementType,
                    quantity: Math.abs(difference),
                    reason: `${reason} (${difference >= 0 ? '+' : ''}${difference})`,
                    created_by: userId,
                };

                const isDemo = useAuthStore.getState().user?.is_demo;
                if (isSupabaseConfigured() && !isDemo) {
                    const { data: movement, error } = await supabase!
                        .from('stock_movements')
                        .insert([movementData])
                        .select()
                        .single();
                    if (error) throw error;

                    const { error: updateError } = await supabase!
                        .from('stock_items')
                        .update({ quantity: newQuantity })
                        .eq('id', itemId);
                    if (updateError) throw updateError;

                    set(state => ({
                        stockItems: state.stockItems.map(s =>
                            s.id === itemId ? { ...s, quantity: newQuantity } : s
                        ),
                        stockMovements: [movement as StockMovement, ...state.stockMovements],
                    }));
                    return;
                }

                const movement: StockMovement = {
                    id: `mov_${Date.now()}`,
                    ...movementData,
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
