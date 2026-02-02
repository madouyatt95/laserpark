import React, { useState, useMemo } from 'react';
import {
    Lock,
    CheckCircle,
    AlertTriangle,
    FileText,
    DollarSign,
    CreditCard,
    Smartphone,
    Save
} from 'lucide-react';
import { useParkStore } from '../stores/parkStore';
import { useAuthStore } from '../stores/authStore';
import { useActivityStore } from '../stores/activityStore';
import { useExpenseStore } from '../stores/expenseStore';
import { useClosureStore } from '../stores/closureStore';
import { useAuditStore } from '../stores/auditStore';
import { useCategoryStore } from '../stores/categoryStore';
import { formatCurrency, formatDate } from '../utils/helpers';
import { format } from 'date-fns';
import '../styles/closure.css';

const ClosurePage: React.FC = () => {
    const { user } = useAuthStore();
    const { selectedParkId, getSelectedPark } = useParkStore();
    const { getActivitiesByDate, getRevenueByPayment, getRevenueByCategory } = useActivityStore();
    const { getExpensesByDate } = useExpenseStore();
    const { getClosureByDate, createClosure, validateClosure, lockClosure, updateClosureNotes } = useClosureStore();
    const { addLog } = useAuditStore();
    const { getCategory } = useCategoryStore();

    const parkId = selectedParkId || '';
    const park = getSelectedPark();
    const today = format(new Date(), 'yyyy-MM-dd');

    const [selectedDate, setSelectedDate] = useState(today);
    const [notes, setNotes] = useState('');
    const [showConfirmation, setShowConfirmation] = useState(false);

    const activities = getActivitiesByDate(parkId, new Date(selectedDate));
    const expenses = getExpensesByDate(parkId, new Date(selectedDate));
    const revenueByPayment = getRevenueByPayment(parkId, new Date(selectedDate));
    const revenueByCategory = getRevenueByCategory(parkId, new Date(selectedDate));

    const existingClosure = getClosureByDate(parkId, selectedDate);

    const totalRevenue = activities.reduce((sum, a) => sum + a.amount, 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const netResult = totalRevenue - totalExpenses;

    const handleCreateClosure = async () => {
        if (!user) return;

        try {
            const closure = await createClosure({
                park_id: parkId,
                closure_date: selectedDate,
                status: 'pending',
                total_revenue: totalRevenue,
                total_expenses: totalExpenses,
                net_result: netResult,
                cash_total: revenueByPayment.cash,
                wave_total: revenueByPayment.wave,
                orange_money_total: revenueByPayment.orange_money,
                activities_count: activities.length,
                expenses_count: expenses.length,
                created_by: user.id,
                notes,
            });

            addLog({
                park_id: parkId,
                user_id: user.id,
                user_name: user.full_name,
                action: 'create',
                entity_type: 'closure',
                entity_id: closure.id,
                description: `Clôture créée pour le ${formatDate(new Date(selectedDate))}`,
                metadata: { total_revenue: totalRevenue, net_result: netResult },
            });

            setShowConfirmation(false);
        } catch (error) {
            console.error('Error creating closure:', error);
            alert('Erreur lors de la création de la clôture');
        }
    };

    const handleValidateClosure = async () => {
        if (!existingClosure || !user) return;

        try {
            await validateClosure(existingClosure.id, user.id);

            addLog({
                park_id: parkId,
                user_id: user.id,
                user_name: user.full_name,
                action: 'closure',
                entity_type: 'closure',
                entity_id: existingClosure.id,
                description: `Clôture validée pour le ${formatDate(new Date(selectedDate))}`,
            });
        } catch (error) {
            console.error('Error validating closure:', error);
            alert('Erreur lors de la validation');
        }
    };

    const handleLockClosure = async () => {
        if (!existingClosure || !user) return;

        try {
            await lockClosure(existingClosure.id);

            addLog({
                park_id: parkId,
                user_id: user.id,
                user_name: user.full_name,
                action: 'closure',
                entity_type: 'closure',
                entity_id: existingClosure.id,
                description: `Clôture verrouillée pour le ${formatDate(new Date(selectedDate))}`,
            });
        } catch (error) {
            console.error('Error locking closure:', error);
            alert('Erreur lors du verrouillage');
        }
    };

    const getStatusBadge = () => {
        if (!existingClosure) return null;

        const statusConfig = {
            pending: { icon: AlertTriangle, label: 'En attente', class: 'warning' },
            validated: { icon: CheckCircle, label: 'Validée', class: 'success' },
            locked: { icon: Lock, label: 'Verrouillée', class: 'locked' },
        };

        const config = statusConfig[existingClosure.status];
        return (
            <div className={`closure-status ${config.class}`}>
                <config.icon size={16} />
                <span>{config.label}</span>
            </div>
        );
    };

    return (
        <div className="page">
            <div className="page-header">
                <h1 className="page-title">Clôture Journalière</h1>
                <p className="page-subtitle">{park?.name}</p>
            </div>

            {/* Date Selection */}
            <div className="closure-date-picker">
                <input
                    type="date"
                    className="input"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    max={today}
                />
                {getStatusBadge()}
            </div>

            {/* Summary Cards */}
            <div className="closure-summary">
                <div className="closure-card revenue">
                    <span className="closure-card-label">Recettes</span>
                    <span className="closure-card-value">{formatCurrency(totalRevenue)}</span>
                    <span className="closure-card-count">{activities.length} transactions</span>
                </div>
                <div className="closure-card expenses">
                    <span className="closure-card-label">Dépenses</span>
                    <span className="closure-card-value">{formatCurrency(totalExpenses)}</span>
                    <span className="closure-card-count">{expenses.length} transactions</span>
                </div>
                <div className={`closure-card result ${netResult >= 0 ? 'positive' : 'negative'}`}>
                    <span className="closure-card-label">Résultat Net</span>
                    <span className="closure-card-value">{formatCurrency(netResult)}</span>
                </div>
            </div>

            {/* Payment Breakdown */}
            <section className="section">
                <div className="section-header">
                    <h2 className="section-title">Répartition des paiements</h2>
                </div>
                <div className="payment-summary-cards">
                    <div className="payment-summary-card">
                        <DollarSign size={20} />
                        <div>
                            <span className="payment-label">Espèces</span>
                            <span className="payment-amount">{formatCurrency(revenueByPayment.cash)}</span>
                        </div>
                    </div>
                    <div className="payment-summary-card">
                        <CreditCard size={20} />
                        <div>
                            <span className="payment-label">Wave</span>
                            <span className="payment-amount">{formatCurrency(revenueByPayment.wave)}</span>
                        </div>
                    </div>
                    <div className="payment-summary-card">
                        <Smartphone size={20} />
                        <div>
                            <span className="payment-label">Orange Money</span>
                            <span className="payment-amount">{formatCurrency(revenueByPayment.orange_money)}</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Category Breakdown */}
            {revenueByCategory.length > 0 && (
                <section className="section">
                    <div className="section-header">
                        <h2 className="section-title">Détail par catégorie</h2>
                    </div>
                    <div className="category-list">
                        {revenueByCategory.map(cat => (
                            <div key={cat.categoryId} className="category-item">
                                <span className="category-name">{cat.name}</span>
                                <span className="category-amount">{formatCurrency(cat.amount)}</span>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Notes */}
            {!existingClosure && (
                <section className="section">
                    <div className="section-header">
                        <h2 className="section-title">Notes de clôture</h2>
                    </div>
                    <textarea
                        className="input closure-notes"
                        placeholder="Observations, remarques particulières..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={3}
                    />
                </section>
            )}

            {existingClosure?.notes && (
                <section className="section">
                    <div className="section-header">
                        <h2 className="section-title">Notes</h2>
                    </div>
                    <p className="closure-notes-display">{existingClosure.notes}</p>
                </section>
            )}

            {/* Action Buttons */}
            <div className="closure-actions">
                {!existingClosure && (
                    <button
                        className="btn btn-primary btn-lg"
                        onClick={() => setShowConfirmation(true)}
                    >
                        <Save size={20} />
                        Créer la clôture
                    </button>
                )}

                {existingClosure?.status === 'pending' && (
                    <button
                        className="btn btn-success btn-lg"
                        onClick={handleValidateClosure}
                    >
                        <CheckCircle size={20} />
                        Valider la clôture
                    </button>
                )}

                {existingClosure?.status === 'validated' && user?.role === 'super_admin' && (
                    <button
                        className="btn btn-warning btn-lg"
                        onClick={handleLockClosure}
                    >
                        <Lock size={20} />
                        Verrouiller définitivement
                    </button>
                )}
            </div>

            {/* Confirmation Modal */}
            {showConfirmation && (
                <div className="modal-overlay" onClick={() => setShowConfirmation(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">Confirmer la clôture</h2>
                        </div>
                        <div className="modal-body">
                            <p className="confirmation-text">
                                Vous êtes sur le point de créer la clôture pour le <strong>{formatDate(new Date(selectedDate))}</strong>.
                            </p>
                            <div className="confirmation-summary">
                                <div className="confirmation-row">
                                    <span>Recettes:</span>
                                    <span className="positive">{formatCurrency(totalRevenue)}</span>
                                </div>
                                <div className="confirmation-row">
                                    <span>Dépenses:</span>
                                    <span className="negative">{formatCurrency(totalExpenses)}</span>
                                </div>
                                <div className="confirmation-row total">
                                    <span>Résultat:</span>
                                    <span className={netResult >= 0 ? 'positive' : 'negative'}>
                                        {formatCurrency(netResult)}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={() => setShowConfirmation(false)}>
                                Annuler
                            </button>
                            <button className="btn btn-primary" onClick={handleCreateClosure}>
                                Confirmer
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ClosurePage;
