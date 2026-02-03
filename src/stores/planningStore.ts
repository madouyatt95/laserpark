import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface TeamMember {
    id: string;
    park_id: string;
    name: string;
    role: 'manager' | 'staff';
    phone?: string;
    is_active: boolean;
    created_at: string;
}

export interface Shift {
    id: string;
    park_id: string;
    member_id: string;
    date: string;
    start_time: string;
    end_time: string;
    notes?: string;
    created_at: string;
}

// Initial team members
const createInitialTeam = (parkId: string): TeamMember[] => [
    {
        id: `team_${parkId}_1`,
        park_id: parkId,
        name: parkId === 'park_angre' ? 'Kouamé Jean' : 'Diallo Mamadou',
        role: 'staff',
        is_active: true,
        created_at: new Date().toISOString(),
    },
    {
        id: `team_${parkId}_2`,
        park_id: parkId,
        name: parkId === 'park_angre' ? 'Bamba Fatou' : 'Touré Awa',
        role: 'staff',
        is_active: true,
        created_at: new Date().toISOString(),
    },
];

const INITIAL_TEAM: TeamMember[] = [];

interface PlanningState {
    members: TeamMember[];
    shifts: Shift[];

    // Member actions
    getMembersByPark: (parkId: string) => TeamMember[];
    addMember: (member: Omit<TeamMember, 'id' | 'created_at'>) => void;
    updateMember: (memberId: string, updates: Partial<TeamMember>) => void;
    toggleMemberStatus: (memberId: string) => void;

    // Shift actions
    getShiftsByDate: (parkId: string, date: string) => Shift[];
    getShiftsByMember: (memberId: string) => Shift[];
    getWeekShifts: (parkId: string, weekStart: Date) => Shift[];
    addShift: (shift: Omit<Shift, 'id' | 'created_at'>) => void;
    updateShift: (shiftId: string, updates: Partial<Shift>) => void;
    deleteShift: (shiftId: string) => void;
}

export const usePlanningStore = create<PlanningState>()(
    persist(
        (set, get) => ({
            members: [],
            shifts: [],

            getMembersByPark: (parkId) => {
                return get().members.filter(m => m.park_id === parkId && m.is_active);
            },

            addMember: (memberData) => {
                const newMember: TeamMember = {
                    ...memberData,
                    id: `team_${Date.now()}`,
                    created_at: new Date().toISOString(),
                };
                set(state => ({ members: [...state.members, newMember] }));
            },

            updateMember: (memberId, updates) => {
                set(state => ({
                    members: state.members.map(m =>
                        m.id === memberId ? { ...m, ...updates } : m
                    ),
                }));
            },

            toggleMemberStatus: (memberId) => {
                set(state => ({
                    members: state.members.map(m =>
                        m.id === memberId ? { ...m, is_active: !m.is_active } : m
                    ),
                }));
            },

            getShiftsByDate: (parkId, date) => {
                return get().shifts.filter(s => s.park_id === parkId && s.date === date);
            },

            getShiftsByMember: (memberId) => {
                return get().shifts.filter(s => s.member_id === memberId);
            },

            getWeekShifts: (parkId, weekStart) => {
                const start = new Date(weekStart);
                const end = new Date(weekStart);
                end.setDate(end.getDate() + 7);

                return get().shifts.filter(s => {
                    const shiftDate = new Date(s.date);
                    return s.park_id === parkId && shiftDate >= start && shiftDate < end;
                });
            },

            addShift: (shiftData) => {
                const newShift: Shift = {
                    ...shiftData,
                    id: `shift_${Date.now()}`,
                    created_at: new Date().toISOString(),
                };
                set(state => ({ shifts: [...state.shifts, newShift] }));
            },

            updateShift: (shiftId, updates) => {
                set(state => ({
                    shifts: state.shifts.map(s =>
                        s.id === shiftId ? { ...s, ...updates } : s
                    ),
                }));
            },

            deleteShift: (shiftId) => {
                set(state => ({
                    shifts: state.shifts.filter(s => s.id !== shiftId),
                }));
            },
        }),
        {
            name: 'laserpark-planning',
        }
    )
);
