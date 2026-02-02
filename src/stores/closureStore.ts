import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DailyClosure, ClosureStatus, PaymentMethod } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface ClosureState {
    closures: DailyClosure[];

    // Getters
    getClosureByDate: (parkId: string, date: string) => DailyClosure | undefined;
    getClosuresByPark: (parkId: string) => DailyClosure[];
    getPendingClosure: (parkId: string) => DailyClosure | undefined;

    // Actions
    fetchClosures: (parkId: string) => Promise<void>;
    createClosure: (closure: Omit<DailyClosure, 'id' | 'created_at' | 'updated_at'>) => Promise<DailyClosure>;
    validateClosure: (closureId: string, userId: string) => Promise<void>;
    lockClosure: (closureId: string) => Promise<void>;
    updateClosureNotes: (closureId: string, notes: string) => Promise<void>;
}

export const useClosureStore = create<ClosureState>()(
    persist(
        (set, get) => ({
            closures: [],

            getClosureByDate: (parkId, date) => {
                return get().closures.find(
                    c => c.park_id === parkId && c.closure_date === date
                );
            },

            getClosuresByPark: (parkId) => {
                return get().closures
                    .filter(c => c.park_id === parkId)
                    .sort((a, b) => new Date(b.closure_date).getTime() - new Date(a.closure_date).getTime());
            },

            getPendingClosure: (parkId) => {
                return get().closures.find(
                    c => c.park_id === parkId && c.status === 'pending'
                );
            },

            fetchClosures: async (parkId) => {
                if (!isSupabaseConfigured()) return;
                const { data, error } = await supabase!
                    .from('daily_closures')
                    .select('*')
                    .eq('park_id', parkId)
                    .order('closure_date', { ascending: false });
                if (error) console.error('Error fetching closures:', error);
                else set({ closures: data as DailyClosure[] });
            },

            createClosure: async (closureData) => {
                if (isSupabaseConfigured()) {
                    const { data, error } = await supabase!
                        .from('daily_closures')
                        .insert([closureData])
                        .select()
                        .single();
                    if (error) throw error;
                    if (data) set(state => ({ closures: [data as DailyClosure, ...state.closures] }));
                    return data as DailyClosure;
                }

                const now = new Date().toISOString();
                const newClosure: DailyClosure = {
                    ...closureData,
                    id: `closure_${Date.now()}`,
                    created_at: now,
                    updated_at: now,
                };
                set(state => ({ closures: [newClosure, ...state.closures] }));
                return newClosure;
            },

            validateClosure: async (closureId, userId) => {
                const now = new Date().toISOString();
                if (isSupabaseConfigured()) {
                    const { error } = await supabase!
                        .from('daily_closures')
                        .update({
                            status: 'validated',
                            validated_by: userId,
                            validated_at: now,
                        })
                        .eq('id', closureId);
                    if (error) throw error;
                }

                set(state => ({
                    closures: state.closures.map(c =>
                        c.id === closureId
                            ? {
                                ...c,
                                status: 'validated' as ClosureStatus,
                                validated_by: userId,
                                validated_at: now,
                                updated_at: now,
                            }
                            : c
                    ),
                }));
            },

            lockClosure: async (closureId) => {
                const now = new Date().toISOString();
                if (isSupabaseConfigured()) {
                    const { error } = await supabase!
                        .from('daily_closures')
                        .update({ status: 'locked' })
                        .eq('id', closureId);
                    if (error) throw error;
                }
                set(state => ({
                    closures: state.closures.map(c =>
                        c.id === closureId
                            ? { ...c, status: 'locked' as ClosureStatus, updated_at: now }
                            : c
                    ),
                }));
            },

            updateClosureNotes: async (closureId, notes) => {
                if (isSupabaseConfigured()) {
                    const { error } = await supabase!
                        .from('daily_closures')
                        .update({ notes })
                        .eq('id', closureId);
                    if (error) throw error;
                }
                set(state => ({
                    closures: state.closures.map(c =>
                        c.id === closureId
                            ? { ...c, notes, updated_at: new Date().toISOString() }
                            : c
                    ),
                }));
            },
        }),
        {
            name: 'laserpark-closures',
        }
    )
);
