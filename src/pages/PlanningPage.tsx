import React, { useState, useMemo } from 'react';
import {
    Plus,
    ChevronLeft,
    ChevronRight,
    Users,
    Calendar,
    Clock,
    Trash2
} from 'lucide-react';
import { useParkStore } from '../stores/parkStore';
import { usePlanningStore, TeamMember, Shift } from '../stores/planningStore';
import { format, addDays, startOfWeek, isSameDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import '../styles/planning.css';
import MobileModal from '../components/common/MobileModal';

const PlanningPage: React.FC = () => {
    const { selectedParkId } = useParkStore();
    const { getMembersByPark, addMember, addShift, getWeekShifts, deleteShift } = usePlanningStore();

    const parkId = selectedParkId || '';
    const members = getMembersByPark(parkId);

    const [currentWeekStart, setCurrentWeekStart] = useState(() =>
        startOfWeek(new Date(), { weekStartsOn: 1 })
    );
    const [showAddMember, setShowAddMember] = useState(false);
    const [showAddShift, setShowAddShift] = useState(false);
    const [selectedMember, setSelectedMember] = useState<string | null>(null);
    const [selectedDay, setSelectedDay] = useState<Date | null>(null);
    const [newMemberName, setNewMemberName] = useState('');
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

    const handleAddMember = () => {
        if (!newMemberName.trim()) return;

        addMember({
            park_id: parkId,
            name: newMemberName.trim(),
            role: 'staff',
            is_active: true,
        });

        setNewMemberName('');
        setShowAddMember(false);
    };

    const handleAddShift = () => {
        if (!selectedMember || !selectedDay) return;

        addShift({
            park_id: parkId,
            member_id: selectedMember,
            date: format(selectedDay, 'yyyy-MM-dd'),
            start_time: shiftStart,
            end_time: shiftEnd,
        });

        setShowAddShift(false);
        setSelectedMember(null);
        setSelectedDay(null);
    };

    const handleCellClick = (memberId: string, date: Date) => {
        const existingShift = getShiftForMemberDay(memberId, date);

        if (existingShift) {
            // Delete shift if exists
            if (confirm('Supprimer ce shift ?')) {
                deleteShift(existingShift.id);
            }
        } else {
            // Open add shift modal
            setSelectedMember(memberId);
            setSelectedDay(date);
            setShowAddShift(true);
        }
    };

    return (
        <div className="page">
            <div className="page-header">
                <h1 className="page-title">Planning Équipes</h1>
                <button
                    className="btn btn-sm btn-primary"
                    onClick={() => setShowAddMember(true)}
                >
                    <Plus size={16} />
                    Ajouter
                </button>
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
                        <button className="btn btn-primary" onClick={() => setShowAddMember(true)}>
                            Ajouter un membre
                        </button>
                    </div>
                ) : (
                    members.map(member => (
                        <div key={member.id} className="planning-row">
                            <div className="planning-cell member-cell">
                                <span className="member-name">{member.name}</span>
                                <span className="member-role">{member.role}</span>
                            </div>
                            {weekDays.map(day => {
                                const shift = getShiftForMemberDay(member.id, day);
                                return (
                                    <div
                                        key={day.toISOString()}
                                        className={`planning-cell shift-cell ${shift ? 'has-shift' : ''} ${isSameDay(day, new Date()) ? 'today' : ''}`}
                                        onClick={() => handleCellClick(member.id, day)}
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

            {/* Add Member Modal */}
            <MobileModal
                isOpen={showAddMember}
                onClose={() => setShowAddMember(false)}
                title="Nouveau membre"
                size="sm"
            >
                <div className="form-group">
                    <input
                        type="text"
                        className="input"
                        placeholder="Nom complet"
                        value={newMemberName}
                        onChange={(e) => setNewMemberName(e.target.value)}
                        autoFocus
                    />
                </div>
                <div className="form-actions">
                    <button className="btn btn-secondary" onClick={() => setShowAddMember(false)}>
                        Annuler
                    </button>
                    <button className="btn btn-primary" onClick={handleAddMember}>
                        Ajouter
                    </button>
                </div>
            </MobileModal>

            {/* Add Shift Modal */}
            <MobileModal
                isOpen={showAddShift && selectedDay !== null}
                onClose={() => setShowAddShift(false)}
                title="Ajouter un shift"
                size="sm"
            >
                {selectedDay && (
                    <>
                        <p className="shift-date-label">
                            {format(selectedDay, 'EEEE d MMMM', { locale: fr })}
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
                            <button className="btn btn-secondary" onClick={() => setShowAddShift(false)}>
                                Annuler
                            </button>
                            <button className="btn btn-primary" onClick={handleAddShift}>
                                Ajouter
                            </button>
                        </div>
                    </>
                )}
            </MobileModal>
        </div>
    );
};

export default PlanningPage;
