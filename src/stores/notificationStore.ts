import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type NotificationType = 'stock_low' | 'closure_reminder' | 'system' | 'success' | 'warning';

export interface Notification {
    id: string;
    type: NotificationType;
    title: string;
    message: string;
    is_read: boolean;
    created_at: string;
    action_url?: string;
    data?: Record<string, unknown>;
}

interface NotificationState {
    notifications: Notification[];

    // Getters
    getUnreadCount: () => number;
    getUnreadNotifications: () => Notification[];
    getAllNotifications: () => Notification[];

    // Actions
    addNotification: (notification: Omit<Notification, 'id' | 'created_at' | 'is_read'>) => void;
    markAsRead: (notificationId: string) => void;
    markAllAsRead: () => void;
    deleteNotification: (notificationId: string) => void;
    clearAll: () => void;

    // Stock alert helper
    checkStockAlerts: (stockItems: Array<{ id: string; name: string; quantity: number; min_threshold: number }>) => void;
}

export const useNotificationStore = create<NotificationState>()(
    persist(
        (set, get) => ({
            notifications: [],

            getUnreadCount: () => {
                return get().notifications.filter(n => !n.is_read).length;
            },

            getUnreadNotifications: () => {
                return get().notifications
                    .filter(n => !n.is_read)
                    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
            },

            getAllNotifications: () => {
                return get().notifications
                    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
            },

            addNotification: (notification) => {
                const newNotification: Notification = {
                    ...notification,
                    id: `notif_${Date.now()}`,
                    is_read: false,
                    created_at: new Date().toISOString(),
                };
                set(state => ({
                    notifications: [newNotification, ...state.notifications].slice(0, 50), // Keep max 50
                }));
            },

            markAsRead: (notificationId) => {
                set(state => ({
                    notifications: state.notifications.map(n =>
                        n.id === notificationId ? { ...n, is_read: true } : n
                    ),
                }));
            },

            markAllAsRead: () => {
                set(state => ({
                    notifications: state.notifications.map(n => ({ ...n, is_read: true })),
                }));
            },

            deleteNotification: (notificationId) => {
                set(state => ({
                    notifications: state.notifications.filter(n => n.id !== notificationId),
                }));
            },

            clearAll: () => {
                set({ notifications: [] });
            },

            checkStockAlerts: (stockItems) => {
                const lowStockItems = stockItems.filter(
                    item => item.quantity <= item.min_threshold
                );

                const existingAlertIds = new Set(
                    get().notifications
                        .filter(n => n.type === 'stock_low' && !n.is_read)
                        .map(n => n.data?.stockItemId as string)
                );

                lowStockItems.forEach(item => {
                    // Don't duplicate alerts for same item
                    if (!existingAlertIds.has(item.id)) {
                        get().addNotification({
                            type: 'stock_low',
                            title: 'Stock bas',
                            message: `${item.name}: ${item.quantity} restant(s)`,
                            action_url: '/stocks',
                            data: { stockItemId: item.id },
                        });
                    }
                });
            },
        }),
        {
            name: 'laserpark-notifications',
        }
    )
);
