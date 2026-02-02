import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Park } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

// Initial demo parks
const INITIAL_PARKS: Park[] = [
    {
        id: 'park_angre',
        name: 'LaserPark Angré',
        country: 'Côte d\'Ivoire',
        city: 'Abidjan - Angré',
        currency: 'XOF',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    },
    {
        id: 'park_zone4',
        name: 'LaserPark Zone 4',
        country: 'Côte d\'Ivoire',
        city: 'Abidjan - Zone 4',
        currency: 'XOF',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    },
    {
        id: 'park_senegal',
        name: 'LaserPark Dakar',
        country: 'Sénégal',
        city: 'Dakar',
        currency: 'XOF',
        is_active: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    },
];

interface ParkState {
    parks: Park[];
    selectedParkId: string | null;
    isLoading: boolean;

    // Getters
    getSelectedPark: () => Park | null;
    getActivePark: (parkId: string) => Park | undefined;
    getActiveParks: () => Park[];

    // Actions
    fetchParks: () => Promise<void>;
    selectPark: (parkId: string) => void;
    addPark: (park: Omit<Park, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
    updatePark: (parkId: string, updates: Partial<Park>) => Promise<void>;
    toggleParkStatus: (parkId: string) => Promise<void>;
}

export const useParkStore = create<ParkState>()(
    persist(
        (set, get) => ({
            parks: INITIAL_PARKS,
            selectedParkId: 'park_angre',
            isLoading: false,

            getSelectedPark: () => {
                const { parks, selectedParkId } = get();
                return parks.find(p => p.id === selectedParkId) || null;
            },

            getActivePark: (parkId: string) => {
                return get().parks.find(p => p.id === parkId);
            },

            getActiveParks: () => {
                return get().parks.filter(p => p.is_active);
            },

            fetchParks: async () => {
                if (!isSupabaseConfigured()) return;

                set({ isLoading: true });
                const { data, error } = await supabase!
                    .from('parks')
                    .select('*')
                    .order('name');

                if (error) {
                    console.error('Error fetching parks:', error);
                    set({ isLoading: false });
                    return;
                }

                set({ parks: data as Park[], isLoading: false });
            },

            selectPark: (parkId: string) => {
                set({ selectedParkId: parkId });
            },

            addPark: async (parkData) => {
                if (isSupabaseConfigured()) {
                    const { data, error } = await supabase!
                        .from('parks')
                        .insert([parkData])
                        .select()
                        .single();

                    if (error) throw error;
                    if (data) {
                        set(state => ({ parks: [...state.parks, data as Park] }));
                    }
                    return;
                }

                // Fallback Local
                const newPark: Park = {
                    ...parkData,
                    id: `park_${Date.now()}`,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                };
                set(state => ({ parks: [...state.parks, newPark] }));
            },

            updatePark: async (parkId, updates) => {
                if (isSupabaseConfigured()) {
                    const { error } = await supabase!
                        .from('parks')
                        .update(updates)
                        .eq('id', parkId);

                    if (error) throw error;
                }

                set(state => ({
                    parks: state.parks.map(park =>
                        park.id === parkId
                            ? { ...park, ...updates, updated_at: new Date().toISOString() }
                            : park
                    ),
                }));
            },

            toggleParkStatus: async (parkId) => {
                const park = get().parks.find(p => p.id === parkId);
                if (!park) return;

                const newStatus = !park.is_active;

                if (isSupabaseConfigured()) {
                    const { error } = await supabase!
                        .from('parks')
                        .update({ is_active: newStatus })
                        .eq('id', parkId);

                    if (error) throw error;
                }

                set(state => ({
                    parks: state.parks.map(park =>
                        park.id === parkId
                            ? { ...park, is_active: newStatus, updated_at: new Date().toISOString() }
                            : park
                    ),
                }));
            },
        }),
        {
            name: 'laserpark-parks',
        }
    )
);
