import React, { useState, useRef, useEffect } from 'react';
import { Bell, X, Check, CheckCheck, Trash2, Package, AlertTriangle, Info } from 'lucide-react';
import { useNotificationStore, NotificationType } from '../../stores/notificationStore';
import { formatRelativeTime } from '../../utils/helpers';
import { useNavigate } from 'react-router-dom';
import './NotificationCenter.css';

const NotificationCenter: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();

    const {
        getUnreadCount,
        getAllNotifications,
        markAsRead,
        markAllAsRead,
        deleteNotification
    } = useNotificationStore();

    const unreadCount = getUnreadCount();
    const notifications = getAllNotifications();

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const getIcon = (type: NotificationType) => {
        switch (type) {
            case 'stock_low':
                return <Package size={16} />;
            case 'warning':
                return <AlertTriangle size={16} />;
            case 'success':
                return <Check size={16} />;
            default:
                return <Info size={16} />;
        }
    };

    const getIconClass = (type: NotificationType) => {
        switch (type) {
            case 'stock_low':
            case 'warning':
                return 'warning';
            case 'success':
                return 'success';
            default:
                return 'info';
        }
    };

    const handleNotificationClick = (notification: ReturnType<typeof getAllNotifications>[0]) => {
        markAsRead(notification.id);
        if (notification.action_url) {
            navigate(notification.action_url);
            setIsOpen(false);
        }
    };

    return (
        <div className="notification-center" ref={dropdownRef}>
            <button
                className="notification-trigger"
                onClick={() => setIsOpen(!isOpen)}
                aria-label="Notifications"
            >
                <Bell size={20} />
                {unreadCount > 0 && (
                    <span className="notification-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
                )}
            </button>

            {isOpen && (
                <div className="notification-dropdown">
                    <div className="notification-header">
                        <h3>Notifications</h3>
                        {unreadCount > 0 && (
                            <button
                                className="mark-all-read"
                                onClick={() => markAllAsRead()}
                            >
                                <CheckCheck size={14} />
                                Tout marquer lu
                            </button>
                        )}
                    </div>

                    <div className="notification-list">
                        {notifications.length === 0 ? (
                            <div className="notification-empty">
                                <Bell size={32} />
                                <p>Aucune notification</p>
                            </div>
                        ) : (
                            notifications.slice(0, 10).map(notification => (
                                <div
                                    key={notification.id}
                                    className={`notification-item ${notification.is_read ? 'read' : 'unread'}`}
                                    onClick={() => handleNotificationClick(notification)}
                                >
                                    <div className={`notification-icon ${getIconClass(notification.type)}`}>
                                        {getIcon(notification.type)}
                                    </div>
                                    <div className="notification-content">
                                        <span className="notification-title">{notification.title}</span>
                                        <span className="notification-message">{notification.message}</span>
                                        <span className="notification-time">
                                            {formatRelativeTime(notification.created_at)}
                                        </span>
                                    </div>
                                    <button
                                        className="notification-delete"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            deleteNotification(notification.id);
                                        }}
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationCenter;
