import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DailyClosure, ClosureStatus, PaymentMethod } from '../types';

interface ClosureState {
    closures: DailyClosure[];

    // Getters
    getClosureByDate: (parkId: string, date: string) => DailyClosure | undefined;
    getClosuresByPark: (parkId: string) => DailyClosure[];
    getPendingClosure: (parkId: string) => DailyClosure | undefined;

    // Actions
    createClosure: (closure: Omit<DailyClosure, 'id' | 'created_at' | 'updated_at'>) => DailyClosure;
    validateClosure: (closureId: string, userId: string) => void;
    lockClosure: (closureId: string) => void;
    updateClosureNotes: (closureId: string, notes: string) => void;
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

            createClosure: (closureData) => {
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

            validateClosure: (closureId, userId) => {
                const now = new Date().toISOString();
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

            lockClosure: (closureId) => {
                set(state => ({
                    closures: state.closures.map(c =>
                        c.id === closureId
                            ? { ...c, status: 'locked' as ClosureStatus, updated_at: new Date().toISOString() }
                            : c
                    ),
                }));
            },

            updateClosureNotes: (closureId, notes) => {
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
