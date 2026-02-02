import React, { useState } from 'react';
import {
    History,
    User,
    Calendar,
    Filter,
    ChevronDown
} from 'lucide-react';
import { useParkStore } from '../stores/parkStore';
import { useAuditStore, AuditLogEntry } from '../stores/auditStore';
import { formatRelativeTime, formatDate } from '../utils/helpers';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import '../styles/audit.css';

const AuditPage: React.FC = () => {
    const { selectedParkId, getSelectedPark } = useParkStore();
    const { getRecentLogs, getLogsByDate } = useAuditStore();

    const parkId = selectedParkId || '';
    const park = getSelectedPark();

    const [filterType, setFilterType] = useState<'all' | 'today' | 'date'>('all');
    const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));

    const logs = filterType === 'date'
        ? getLogsByDate(parkId, new Date(selectedDate))
        : filterType === 'today'
            ? getLogsByDate(parkId, new Date())
            : getRecentLogs(parkId, 100);

    const getActionIcon = (action: AuditLogEntry['action']) => {
        switch (action) {
            case 'create': return '➕';
            case 'update': return '✏️';
            case 'delete': return '🗑️';
            case 'login': return '🔓';
            case 'logout': return '🔒';
            case 'closure': return '📋';
            case 'stock_movement': return '📦';
            default: return '📝';
        }
    };

    const getActionColor = (action: AuditLogEntry['action']) => {
        switch (action) {
            case 'create': return 'success';
            case 'delete': return 'danger';
            case 'closure': return 'primary';
            case 'login':
            case 'logout': return 'info';
            default: return 'default';
        }
    };

    return (
        <div className="page">
            <div className="page-header">
                <h1 className="page-title">Journal d'Audit</h1>
                <p className="page-subtitle">{park?.name}</p>
            </div>

            {/* Filters */}
            <div className="audit-filters">
                <button
                    className={`filter-btn ${filterType === 'all' ? 'active' : ''}`}
                    onClick={() => setFilterType('all')}
                >
                    Tout
                </button>
                <button
                    className={`filter-btn ${filterType === 'today' ? 'active' : ''}`}
                    onClick={() => setFilterType('today')}
                >
                    Aujourd'hui
                </button>
                <div className="date-filter">
                    <input
                        type="date"
                        className="input input-sm"
                        value={selectedDate}
                        onChange={(e) => {
                            setSelectedDate(e.target.value);
                            setFilterType('date');
                        }}
                    />
                </div>
            </div>

            {/* Audit Log List */}
            <div className="audit-list">
                {logs.length === 0 ? (
                    <div className="empty-state">
                        <History size={48} className="empty-state-icon" />
                        <h3 className="empty-state-title">Aucune activité</h3>
                        <p className="empty-state-text">
                            Le journal d'audit est vide pour cette période
                        </p>
                    </div>
                ) : (
                    logs.map(log => (
                        <div key={log.id} className={`audit-item ${getActionColor(log.action)}`}>
                            <div className="audit-icon">
                                {getActionIcon(log.action)}
                            </div>
                            <div className="audit-content">
                                <p className="audit-description">{log.description}</p>
                                <div className="audit-meta">
                                    <span className="audit-user">
                                        <User size={12} />
                                        {log.user_name}
                                    </span>
                                    <span className="audit-time">
                                        <Calendar size={12} />
                                        {formatRelativeTime(new Date(log.created_at))}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default AuditPage;
