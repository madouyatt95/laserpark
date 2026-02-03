import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Activity, PaymentMethod, ActivityFormData, ActivityStatus } from '../types';
import { useStockStore } from './stockStore';
import { useCategoryStore } from './categoryStore';
import { isToday, parseISO, startOfDay, endOfDay } from 'date-fns';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useAuthStore } from './authStore';

interface ActivityState {
    activities: Activity[];
    isLoading: boolean;

    // Getters
    getActivitiesByPark: (parkId: string) => Activity[];
    getActivitiesByDate: (parkId: string, date: Date) => Activity[];
    getTodayActivities: (parkId: string) => Activity[];
    getTodayRevenue: (parkId: string) => number;
    getRevenueByPayment: (parkId: string, date?: Date) => Record<PaymentMethod, number>;
    getRevenueByCategory: (parkId: string, date?: Date) => { categoryId: string; name: string; amount: number; color?: string }[];

    // Actions
    fetchActivities: (parkId: string, date?: Date) => Promise<void>;
    addActivity: (parkId: string, userId: string, data: ActivityFormData) => Promise<Activity>;
    cancelActivity: (activityId: string, reason: string, userId: string) => Promise<void>;
    deleteActivity: (activityId: string) => Promise<void>;
    updateActivity: (activityId: string, updates: Partial<Activity>) => Promise<void>;
}

export const useActivityStore = create<ActivityState>()(
    persist(
        (set, get) => ({
            activities: [],
            isLoading: false,

            getActivitiesByPark: (parkId: string) => {
                return get().activities
                    .filter(a => a.park_id === parkId)
                    .sort((a, b) => new Date(b.activity_date).getTime() - new Date(a.activity_date).getTime());
            },

            getActivitiesByDate: (parkId: string, date: Date) => {
                const start = startOfDay(date);
                const end = endOfDay(date);

                return get().activities.filter(a => {
                    const activityDate = parseISO(a.activity_date);
                    return a.park_id === parkId && activityDate >= start && activityDate <= end;
                }).sort((a, b) => new Date(b.activity_date).getTime() - new Date(a.activity_date).getTime());
            },

            getTodayActivities: (parkId: string) => {
                return get().activities.filter(a => {
                    return a.park_id === parkId && isToday(parseISO(a.activity_date));
                }).sort((a, b) => new Date(b.activity_date).getTime() - new Date(a.activity_date).getTime());
            },

            getTodayRevenue: (parkId: string) => {
                return get().getTodayActivities(parkId).reduce((sum, a) => sum + a.amount, 0);
            },

            getRevenueByPayment: (parkId: string, date?: Date) => {
                const activities = date
                    ? get().getActivitiesByDate(parkId, date)
                    : get().getTodayActivities(parkId);

                return activities.reduce((acc, activity) => {
                    acc[activity.payment_method] = (acc[activity.payment_method] || 0) + activity.amount;
                    return acc;
                }, { cash: 0, wave: 0, orange_money: 0 } as Record<PaymentMethod, number>);
            },

            getRevenueByCategory: (parkId: string, date?: Date) => {
                const activities = date
                    ? get().getActivitiesByDate(parkId, date)
                    : get().getTodayActivities(parkId);

                const categoryStore = useCategoryStore.getState();
                const categoryTotals: Record<string, { name: string; amount: number; color?: string }> = {};

                activities.forEach(activity => {
                    const category = categoryStore.getCategory(activity.category_id);
                    if (category) {
                        if (!categoryTotals[activity.category_id]) {
                            categoryTotals[activity.category_id] = {
                                name: category.name,
                                amount: 0,
                                color: category.color,
                            };
                        }
                        categoryTotals[activity.category_id].amount += activity.amount;
                    }
                });

                return Object.entries(categoryTotals).map(([categoryId, data]) => ({
                    categoryId,
                    ...data,
                })).sort((a, b) => b.amount - a.amount);
            },

            fetchActivities: async (parkId, date) => {
                if (!isSupabaseConfigured()) return;

                set({ isLoading: true });
                let query = supabase!.from('activities').select('*').eq('park_id', parkId);

                if (date) {
                    const start = startOfDay(date).toISOString();
                    const end = endOfDay(date).toISOString();
                    query = query.gte('activity_date', start).lte('activity_date', end);
                }

                const { data, error } = await query.order('activity_date', { ascending: false });

                if (error) {
                    console.error('Error fetching activities:', error);
                    set({ isLoading: false });
                    return;
                }

                set({ activities: data as Activity[], isLoading: false });
            },

            addActivity: async (parkId, userId, data) => {
                if (isSupabaseConfigured()) {
                    const newActivityData = {
                        park_id: parkId,
                        category_id: data.category_id,
                        amount: data.amount,
                        quantity: data.quantity,
                        payment_method: data.payment_method,
                        comment: data.comment,
                        created_by: userId,
                        status: 'active',
                    };

                    const { data: newActivity, error } = await supabase!
                        .from('activities')
                        .insert([newActivityData])
                        .select()
                        .single();

                    if (error) throw error;

                    set(state => ({ activities: [newActivity as Activity, ...state.activities] }));

                    // Check impacts stock
                    const categoryStore = useCategoryStore.getState();
                    const category = categoryStore.getCategory(data.category_id);
                    if (category?.impacts_stock && category.stock_item_id) {
                        const stockStore = useStockStore.getState();
                        stockStore.decrementStock(category.stock_item_id, data.quantity, newActivity.id, userId);
                    }

                    return newActivity as Activity;
                }

                // Fallback Local (should rarely happen with real auth)
                const now = new Date();
                const newActivity: Activity = {
                    id: `act_${Date.now()}`,
                    park_id: parkId,
                    category_id: data.category_id,
                    amount: data.amount,
                    quantity: data.quantity,
                    payment_method: data.payment_method,
                    comment: data.comment,
                    created_by: userId,
                    activity_date: now.toISOString(),
                    created_at: now.toISOString(),
                    status: 'active',
                };

                set(state => ({ activities: [newActivity, ...state.activities] }));
                return newActivity;
            },

            cancelActivity: async (activityId, reason, userId) => {
                const now = new Date();
                if (isSupabaseConfigured()) {
                    const { error } = await supabase!
                        .from('activities')
                        .update({
                            status: 'cancelled',
                            cancelled_reason: reason,
                            cancelled_by: userId,
                            cancelled_at: now.toISOString(),
                        })
                        .eq('id', activityId);

                    if (error) throw error;
                }

                set(state => ({
                    activities: state.activities.map(a =>
                        a.id === activityId
                            ? {
                                ...a,
                                status: 'cancelled' as ActivityStatus,
                                cancelled_reason: reason,
                                cancelled_by: userId,
                                cancelled_at: now.toISOString(),
                            }
                            : a
                    ),
                }));
            },

            deleteActivity: async (activityId) => {
                if (isSupabaseConfigured()) {
                    const { error } = await supabase!
                        .from('activities')
                        .delete()
                        .eq('id', activityId);

                    if (error) throw error;
                }
                set(state => ({
                    activities: state.activities.filter(a => a.id !== activityId),
                }));
            },

            updateActivity: async (activityId, updates) => {
                if (isSupabaseConfigured()) {
                    const { error } = await supabase!
                        .from('activities')
                        .update(updates)
                        .eq('id', activityId);

                    if (error) throw error;
                }
                set(state => ({
                    activities: state.activities.map(activity =>
                        activity.id === activityId
                            ? { ...activity, ...updates }
                            : activity
                    ),
                }));
            },
        }),
        {
            name: 'laserpark-activities',
        }
    )
);
