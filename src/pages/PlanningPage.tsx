import React, { useState, useMemo } from 'react';
import {
    Plus,
    ChevronLeft,
    ChevronRight,
    Users,
    Clock,
    Edit2,
    Trash2,
    Eye
} from 'lucide-react';
import { useParkStore } from '../stores/parkStore';
import { useAuthStore } from '../stores/authStore';
import { usePlanningStore, TeamMember, Shift } from '../stores/planningStore';
import { format, addDays, startOfWeek, isSameDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import '../styles/planning.css';
import MobileModal from '../components/common/MobileModal';

const PlanningPage: React.FC = () => {
    const { selectedParkId } = useParkStore();
    const { canManagePlanning } = useAuthStore();
    const canManage = canManagePlanning();
    const {
        getMembersByPark,
        addMember,
        updateMember,
        toggleMemberStatus,
        addShift,
        updateShift,
        getWeekShifts,
        deleteShift
    } = usePlanningStore();

    const parkId = selectedParkId || '';
    const members = getMembersByPark(parkId);

    const [currentWeekStart, setCurrentWeekStart] = useState(() =>
        startOfWeek(new Date(), { weekStartsOn: 1 })
    );

    // Member modal states
    const [showMemberModal, setShowMemberModal] = useState(false);
    const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
    const [memberName, setMemberName] = useState('');
    const [memberRole, setMemberRole] = useState<'staff' | 'manager'>('staff');

    // Shift modal states
    const [showShiftModal, setShowShiftModal] = useState(false);
    const [editingShift, setEditingShift] = useState<Shift | null>(null);
    const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
    const [selectedDay, setSelectedDay] = useState<Date | null>(null);
    const [shiftStart, setShiftStart] = useState('09:00');
    const [shiftEnd, setShiftEnd] = useState('18:00');

    const weekDays = useMemo(() => {
        return Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i));
    }, [currentWeekStart]);

    const weekShifts = getWeekShifts(parkId, currentWeekStart);

    const navigateWeek = (direction: 'prev' | 'next') => {
        setCurrentWeekStart(prev =>
            addDays(prev, direction === 'next' ? 7 : -7)
        );
    };

    const getShiftForMemberDay = (memberId: string, date: Date): Shift | undefined => {
        const dateStr = format(date, 'yyyy-MM-dd');
        return weekShifts.find(s => s.member_id === memberId && s.date === dateStr);
    };

    // Member handlers
    const openAddMemberModal = () => {
        setEditingMember(null);
        setMemberName('');
        setMemberRole('staff');
        setShowMemberModal(true);
    };

    const openEditMemberModal = (member: TeamMember) => {
        setEditingMember(member);
        setMemberName(member.name);
        setMemberRole(member.role);
        setShowMemberModal(true);
    };

    const handleSaveMember = () => {
        if (!memberName.trim()) return;

        if (editingMember) {
            updateMember(editingMember.id, {
                name: memberName.trim(),
                role: memberRole,
            });
        } else {
            addMember({
                park_id: parkId,
                name: memberName.trim(),
                role: memberRole,
                is_active: true,
            });
        }

        setShowMemberModal(false);
        setEditingMember(null);
    };

    const handleDeleteMember = () => {
        if (!editingMember) return;
        if (confirm(`Supprimer ${editingMember.name} de l'équipe ?`)) {
            toggleMemberStatus(editingMember.id);
            setShowMemberModal(false);
            setEditingMember(null);
        }
    };

    // Shift handlers
    const handleCellClick = (memberId: string, date: Date) => {
        const existingShift = getShiftForMemberDay(memberId, date);

        if (existingShift) {
            // Open edit modal with existing shift data
            setEditingShift(existingShift);
            setSelectedMemberId(memberId);
            setSelectedDay(date);
            setShiftStart(existingShift.start_time);
            setShiftEnd(existingShift.end_time);
            setShowShiftModal(true);
        } else {
            // Open add modal
            setEditingShift(null);
            setSelectedMemberId(memberId);
            setSelectedDay(date);
            setShiftStart('09:00');
            setShiftEnd('18:00');
            setShowShiftModal(true);
        }
    };

    const handleSaveShift = () => {
        if (!selectedMemberId || !selectedDay) return;

        if (editingShift) {
            updateShift(editingShift.id, {
                start_time: shiftStart,
                end_time: shiftEnd,
            });
        } else {
            addShift({
                park_id: parkId,
                member_id: selectedMemberId,
                date: format(selectedDay, 'yyyy-MM-dd'),
                start_time: shiftStart,
                end_time: shiftEnd,
            });
        }

        setShowShiftModal(false);
        setEditingShift(null);
        setSelectedMemberId(null);
        setSelectedDay(null);
    };

    const handleDeleteShift = () => {
        if (!editingShift) return;
        if (confirm('Supprimer ce shift ?')) {
            deleteShift(editingShift.id);
            setShowShiftModal(false);
            setEditingShift(null);
        }
    };

    const getMemberName = (memberId: string): string => {
        const member = members.find(m => m.id === memberId);
        return member?.name || '';
    };

    return (
        <div className="page">
            <div className="page-header">
                <h1 className="page-title">
                    Planning Équipes
                    {!canManage && <span className="badge badge-info" style={{ marginLeft: '8px', fontSize: '12px' }}>Lecture seule</span>}
                </h1>
                {canManage && (
                    <button
                        className="btn btn-sm btn-primary"
                        onClick={openAddMemberModal}
                    >
                        <Plus size={16} />
                        Ajouter
                    </button>
                )}
            </div>

            {/* Week Navigation */}
            <div className="week-navigation">
                <button className="btn btn-icon" onClick={() => navigateWeek('prev')}>
                    <ChevronLeft size={20} />
                </button>
                <span className="week-label">
                    {format(currentWeekStart, 'd MMM', { locale: fr })} - {format(addDays(currentWeekStart, 6), 'd MMM yyyy', { locale: fr })}
                </span>
                <button className="btn btn-icon" onClick={() => navigateWeek('next')}>
                    <ChevronRight size={20} />
                </button>
            </div>

            {/* Planning Grid */}
            <div className="planning-grid">
                {/* Header Row */}
                <div className="planning-header">
                    <div className="planning-cell header-cell member-cell">
                        <Users size={16} />
                    </div>
                    {weekDays.map(day => (
                        <div
                            key={day.toISOString()}
                            className={`planning-cell header-cell ${isSameDay(day, new Date()) ? 'today' : ''}`}
                        >
                            <span className="day-name">{format(day, 'EEE', { locale: fr })}</span>
                            <span className="day-number">{format(day, 'd')}</span>
                        </div>
                    ))}
                </div>

                {/* Member Rows */}
                {members.length === 0 ? (
                    <div className="empty-planning">
                        <Users size={32} />
                        <p>Aucun membre dans l'équipe</p>
                        <button className="btn btn-primary" onClick={openAddMemberModal}>
                            Ajouter un membre
                        </button>
                    </div>
                ) : (
                    members.map(member => (
                        <div key={member.id} className="planning-row">
                            <div
                                className={`planning-cell member-cell ${canManage ? 'clickable' : ''}`}
                                onClick={() => canManage && openEditMemberModal(member)}
                            >
                                <span className="member-name">{member.name}</span>
                                <span className="member-role">{member.role === 'manager' ? 'Manager' : 'Staff'}</span>
                            </div>
                            {weekDays.map(day => {
                                const shift = getShiftForMemberDay(member.id, day);
                                return (
                                    <div
                                        key={day.toISOString()}
                                        className={`planning-cell shift-cell ${shift ? 'has-shift' : ''} ${isSameDay(day, new Date()) ? 'today' : ''} ${canManage ? 'clickable' : ''}`}
                                        onClick={() => canManage && handleCellClick(member.id, day)}
                                    >
                                        {shift && (
                                            <div className="shift-badge">
                                                <Clock size={10} />
                                                <span>{shift.start_time}-{shift.end_time}</span>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    ))
                )}
            </div>

            {/* Member Modal (Add/Edit) */}
            <MobileModal
                isOpen={showMemberModal}
                onClose={() => setShowMemberModal(false)}
                title={editingMember ? 'Modifier le membre' : 'Nouveau membre'}
                size="sm"
            >
                <div className="form-group">
                    <label className="input-label">Nom complet</label>
                    <input
                        type="text"
                        className="input"
                        placeholder="Nom complet"
                        value={memberName}
                        onChange={(e) => setMemberName(e.target.value)}
                        autoFocus
                    />
                </div>
                <div className="form-group">
                    <label className="input-label">Rôle</label>
                    <select
                        className="input"
                        value={memberRole}
                        onChange={(e) => setMemberRole(e.target.value as 'staff' | 'manager')}
                    >
                        <option value="staff">Staff</option>
                        <option value="manager">Manager</option>
                    </select>
                </div>
                <div className="form-actions">
                    {editingMember && (
                        <button
                            className="btn btn-danger-ghost"
                            onClick={handleDeleteMember}
                        >
                            <Trash2 size={16} />
                            Supprimer
                        </button>
                    )}
                    <button className="btn btn-secondary" onClick={() => setShowMemberModal(false)}>
                        Annuler
                    </button>
                    <button className="btn btn-primary" onClick={handleSaveMember}>
                        {editingMember ? 'Enregistrer' : 'Ajouter'}
                    </button>
                </div>
            </MobileModal>

            {/* Shift Modal (Add/Edit) */}
            <MobileModal
                isOpen={showShiftModal && selectedDay !== null}
                onClose={() => setShowShiftModal(false)}
                title={editingShift ? 'Modifier le shift' : 'Ajouter un shift'}
                size="sm"
            >
                {selectedDay && (
                    <>
                        <p className="shift-date-label">
                            {getMemberName(selectedMemberId || '')} • {format(selectedDay, 'EEEE d MMMM', { locale: fr })}
                        </p>
                        <div className="shift-time-inputs">
                            <div className="time-input-group">
                                <label className="input-label">Début</label>
                                <input
                                    type="time"
                                    className="input"
                                    value={shiftStart}
                                    onChange={(e) => setShiftStart(e.target.value)}
                                />
                            </div>
                            <div className="time-input-group">
                                <label className="input-label">Fin</label>
                                <input
                                    type="time"
                                    className="input"
                                    value={shiftEnd}
                                    onChange={(e) => setShiftEnd(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="form-actions">
                            {editingShift && (
                                <button
                                    className="btn btn-danger-ghost"
                                    onClick={handleDeleteShift}
                                >
                                    <Trash2 size={16} />
                                    Supprimer
                                </button>
                            )}
                            <button className="btn btn-secondary" onClick={() => setShowShiftModal(false)}>
                                Annuler
                            </button>
                            <button className="btn btn-primary" onClick={handleSaveShift}>
                                {editingShift ? 'Enregistrer' : 'Ajouter'}
                            </button>
                        </div>
                    </>
                )}
            </MobileModal>
        </div>
    );
};

export default PlanningPage;
