import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface AuditLogEntry {
    id: string;
    park_id: string;
    user_id: string;
    user_name: string;
    action: 'create' | 'update' | 'delete' | 'login' | 'logout' | 'closure' | 'stock_movement';
    entity_type: 'activity' | 'expense' | 'stock' | 'category' | 'user' | 'closure' | 'session';
    entity_id?: string;
    description: string;
    metadata?: Record<string, any>;
    created_at: string;
}

interface AuditState {
    logs: AuditLogEntry[];

    // Actions
    addLog: (entry: Omit<AuditLogEntry, 'id' | 'created_at'>) => void;
    getLogsByPark: (parkId: string) => AuditLogEntry[];
    getLogsByUser: (userId: string) => AuditLogEntry[];
    getLogsByDate: (parkId: string, date: Date) => AuditLogEntry[];
    getRecentLogs: (parkId: string, limit?: number) => AuditLogEntry[];
    clearOldLogs: (daysToKeep: number) => void;
}

export const useAuditStore = create<AuditState>()(
    persist(
        (set, get) => ({
            logs: [],

            addLog: (entry) => {
                const newLog: AuditLogEntry = {
                    ...entry,
                    id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    created_at: new Date().toISOString(),
                };
                set(state => ({ logs: [newLog, ...state.logs].slice(0, 1000) })); // Keep max 1000 logs
            },

            getLogsByPark: (parkId) => {
                return get().logs.filter(log => log.park_id === parkId);
            },

            getLogsByUser: (userId) => {
                return get().logs.filter(log => log.user_id === userId);
            },

            getLogsByDate: (parkId, date) => {
                const start = new Date(date);
                start.setHours(0, 0, 0, 0);
                const end = new Date(date);
                end.setHours(23, 59, 59, 999);

                return get().logs.filter(log => {
                    const logDate = new Date(log.created_at);
                    return log.park_id === parkId && logDate >= start && logDate <= end;
                });
            },

            getRecentLogs: (parkId, limit = 50) => {
                return get().logs
                    .filter(log => log.park_id === parkId)
                    .slice(0, limit);
            },

            clearOldLogs: (daysToKeep) => {
                const cutoff = new Date();
                cutoff.setDate(cutoff.getDate() - daysToKeep);

                set(state => ({
                    logs: state.logs.filter(log => new Date(log.created_at) >= cutoff),
                }));
            },
        }),
        {
            name: 'laserpark-audit',
        }
    )
);
