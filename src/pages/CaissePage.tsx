import React, { useState, useMemo } from 'react';
import { Plus, TrendingUp, TrendingDown, CreditCard, Banknote, Smartphone, Printer, Ban, ChevronLeft, ChevronRight, Calendar, Minus } from 'lucide-react';
import { useParkStore } from '../stores/parkStore';
import { useActivityStore } from '../stores/activityStore';
import { useExpenseStore } from '../stores/expenseStore';
import { useCategoryStore } from '../stores/categoryStore';
import { useAuthStore } from '../stores/authStore';
import { formatCurrency, formatTime } from '../utils/helpers';
import { printReceipt } from '../services/ReceiptService';
import { Activity, Expense } from '../types';
import ActivityForm from '../components/caisse/ActivityForm';
import ExpenseForm from '../components/caisse/ExpenseForm';
import QuickShortcuts from '../components/caisse/QuickShortcuts';
import '../styles/caisse.css';
import MobileModal from '../components/common/MobileModal';
import { format, isToday, addDays } from 'date-fns';
import { fr } from 'date-fns/locale';

type TransactionType = 'revenue' | 'expense';

interface CombinedTransaction {
    id: string;
    type: TransactionType;
    amount: number;
    category_id: string;
    payment_method: string;
    date: string;
    status?: string;
    cancelled_reason?: string;
    comment?: string;
}

const CaissePage: React.FC = () => {
    const [showActivityForm, setShowActivityForm] = useState(false);
    const [showExpenseForm, setShowExpenseForm] = useState(false);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
    const [cancelReason, setCancelReason] = useState('');
    const [showReceiptConfirm, setShowReceiptConfirm] = useState(false);
    const [lastActivity, setLastActivity] = useState<Activity | null>(null);
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [showFabMenu, setShowFabMenu] = useState(false);

    const { user } = useAuthStore();
    const { selectedParkId, getSelectedPark } = useParkStore();
    const { getActivitiesByDate, cancelActivity } = useActivityStore();
    const { getExpensesByDate, getTodayExpensesTotal } = useExpenseStore();
    const { getCategory } = useCategoryStore();

    const selectedPark = getSelectedPark();
    const parkId = selectedParkId || '';

    // Get transactions for selected date
    const dateActivities = useMemo(() => {
        return getActivitiesByDate(parkId, selectedDate);
    }, [parkId, selectedDate, getActivitiesByDate]);

    const dateExpenses = useMemo(() => {
        return getExpensesByDate(parkId, selectedDate);
    }, [parkId, selectedDate, getExpensesByDate]);

    // Combine and sort transactions
    const allTransactions = useMemo((): CombinedTransaction[] => {
        const activities: CombinedTransaction[] = dateActivities.map(a => ({
            id: a.id,
            type: 'revenue' as TransactionType,
            amount: a.amount,
            category_id: a.category_id,
            payment_method: a.payment_method,
            date: a.activity_date,
            status: a.status,
            cancelled_reason: a.cancelled_reason,
        }));

        const expenses: CombinedTransaction[] = dateExpenses.map(e => ({
            id: e.id,
            type: 'expense' as TransactionType,
            amount: e.amount,
            category_id: e.category_id,
            payment_method: e.payment_method,
            date: e.expense_date,
            comment: e.comment,
        }));

        return [...activities, ...expenses].sort((a, b) =>
            new Date(b.date).getTime() - new Date(a.date).getTime()
        );
    }, [dateActivities, dateExpenses]);

    const activeActivities = dateActivities.filter(a => a.status !== 'cancelled');
    const dateRevenue = activeActivities.reduce((sum, a) => sum + a.amount, 0);
    const dateExpensesTotal = dateExpenses.reduce((sum, e) => sum + e.amount, 0);
    const netResult = dateRevenue - dateExpensesTotal;

    const isViewingToday = isToday(selectedDate);

    const navigateDate = (direction: 'prev' | 'next') => {
        setSelectedDate(prev => addDays(prev, direction === 'next' ? 1 : -1));
    };

    const goToToday = () => {
        setSelectedDate(new Date());
    };

    const handlePrintReceipt = (activity: Activity) => {
        const park = getSelectedPark();
        const category = getCategory(activity.category_id);
        if (park && category) {
            printReceipt({
                activity,
                park,
                category,
                cashierName: user?.full_name || 'Caissier',
            });
        }
    };

    const handleCancelClick = (activity: Activity) => {
        setSelectedActivity(activity);
        setCancelReason('');
        setShowCancelModal(true);
    };

    const handleConfirmCancel = async () => {
        if (!selectedActivity || !cancelReason.trim()) {
            alert('Veuillez entrer une raison pour l\'annulation');
            return;
        }

        try {
            await cancelActivity(selectedActivity.id, cancelReason, user?.id || '');
            setShowCancelModal(false);
            setSelectedActivity(null);
            setCancelReason('');
        } catch (error) {
            console.error('Error cancelling activity:', error);
            alert('Erreur lors de l\'annulation');
        }
    };

    const handleActivityCreated = (newActivity: Activity) => {
        setLastActivity(newActivity);
        setShowReceiptConfirm(true);
        setShowActivityForm(false);
    };

    const handleExpenseCreated = () => {
        setShowExpenseForm(false);
    };

    const handleQuickSaleComplete = () => {
        // Quick sales auto-complete
    };

    const handleFabClick = () => {
        if (showFabMenu) {
            setShowFabMenu(false);
        } else {
            setShowFabMenu(true);
        }
    };

    const openActivityForm = () => {
        setShowFabMenu(false);
        setShowActivityForm(true);
    };

    const openExpenseForm = () => {
        setShowFabMenu(false);
        setShowExpenseForm(true);
    };

    return (
        <div className="page">
            <div className="page-header">
                <h1 className="page-title">
                    <span className="text-gradient">Caisse Live</span>
                </h1>
                <p className="page-subtitle">
                    {selectedPark?.name}
                </p>
            </div>

            {/* Date Navigation */}
            <div className="date-navigation">
                <button className="btn btn-icon" onClick={() => navigateDate('prev')}>
                    <ChevronLeft size={20} />
                </button>
                <div className="date-display">
                    <Calendar size={16} />
                    <span className="date-label">
                        {isViewingToday
                            ? "Aujourd'hui"
                            : format(selectedDate, 'EEEE d MMMM', { locale: fr })}
                    </span>
                    {!isViewingToday && (
                        <button className="btn btn-xs btn-secondary" onClick={goToToday}>
                            Aujourd'hui
                        </button>
                    )}
                </div>
                <button
                    className="btn btn-icon"
                    onClick={() => navigateDate('next')}
                    disabled={isViewingToday}
                >
                    <ChevronRight size={20} />
                </button>
            </div>

            {/* Quick Shortcuts - only show when viewing today */}
            {isViewingToday && (
                <QuickShortcuts parkId={parkId} onSaleComplete={handleQuickSaleComplete} />
            )}

            <div className="caisse-summary">
                <div className="summary-card total">
                    <div className="summary-card-icon">
                        <TrendingUp size={24} />
                    </div>
                    <div className="summary-card-content">
                        <span className="summary-card-label">
                            {isViewingToday ? 'Recettes' : 'Recettes'}
                        </span>
                        <span className="summary-card-value">{formatCurrency(dateRevenue)}</span>
                    </div>
                </div>

                <div className="summary-cards-row">
                    <div className="summary-card expense-total">
                        <TrendingDown size={20} />
                        <span className="summary-card-label">Dépenses</span>
                        <span className="summary-card-value expense">{formatCurrency(dateExpensesTotal)}</span>
                    </div>

                    <div className="summary-card net-result">
                        <Banknote size={20} />
                        <span className="summary-card-label">Résultat</span>
                        <span className={`summary-card-value ${netResult >= 0 ? 'positive' : 'negative'}`}>
                            {formatCurrency(netResult)}
                        </span>
                    </div>
                </div>
            </div>

            {/* Transactions List */}
            <section className="section">
                <div className="section-header">
                    <h2 className="section-title">
                        {isViewingToday ? 'Transactions du jour' : `Transactions du ${format(selectedDate, 'd MMM', { locale: fr })}`}
                    </h2>
                    <span className="badge badge-primary">{allTransactions.length}</span>
                </div>

                {allTransactions.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-state-icon">🎯</div>
                        <h3 className="empty-state-title">Aucune transaction</h3>
                        <p className="empty-state-text">
                            {isViewingToday
                                ? "Cliquez sur le bouton + pour enregistrer"
                                : "Aucune transaction ce jour"}
                        </p>
                    </div>
                ) : (
                    <div className="activities-list">
                        {allTransactions.map((transaction) => {
                            const category = getCategory(transaction.category_id);
                            const isCancelled = transaction.status === 'cancelled';
                            const isExpense = transaction.type === 'expense';

                            return (
                                <div
                                    key={transaction.id}
                                    className={`activity-item ${isCancelled ? 'cancelled' : ''} ${isExpense ? 'expense-item' : ''}`}
                                >
                                    <div
                                        className="activity-icon"
                                        style={{
                                            backgroundColor: isExpense
                                                ? 'rgba(239, 68, 68, 0.15)'
                                                : category?.color ? `${category.color}20` : undefined
                                        }}
                                    >
                                        <span>{isExpense ? '💸' : (category?.icon || '🎯')}</span>
                                    </div>
                                    <div className="activity-content">
                                        <span className="activity-name">
                                            {isExpense && transaction.comment
                                                ? transaction.comment
                                                : (category?.name || 'Transaction')}
                                        </span>
                                        <span className="activity-meta">
                                            {formatTime(transaction.date)}
                                            {isExpense && category && ` • ${category.name}`}
                                        </span>
                                        {isCancelled && (
                                            <span className="activity-cancelled-badge">
                                                Annulé: {transaction.cancelled_reason}
                                            </span>
                                        )}
                                    </div>
                                    <div className="activity-payment">
                                        <span className={`payment-badge ${transaction.payment_method}`}>
                                            {transaction.payment_method === 'cash' ? 'Espèces' :
                                                transaction.payment_method === 'wave' ? 'Wave' : 'OM'}
                                        </span>
                                        <span className={`activity-amount ${isCancelled ? 'cancelled' : ''} ${isExpense ? 'expense' : ''}`}>
                                            {isExpense ? '-' : '+'}{formatCurrency(transaction.amount)}
                                        </span>
                                    </div>
                                    {!isCancelled && !isExpense && isViewingToday && (
                                        <div className="activity-actions">
                                            <button
                                                className="btn-icon-sm"
                                                onClick={() => {
                                                    const activity = dateActivities.find(a => a.id === transaction.id);
                                                    if (activity) handlePrintReceipt(activity);
                                                }}
                                                title="Imprimer ticket"
                                            >
                                                <Printer size={14} />
                                            </button>
                                            <button
                                                className="btn-icon-sm btn-danger-ghost"
                                                onClick={() => {
                                                    const activity = dateActivities.find(a => a.id === transaction.id);
                                                    if (activity) handleCancelClick(activity);
                                                }}
                                                title="Annuler"
                                            >
                                                <Ban size={14} />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </section>

            {/* FAB Menu - only show when viewing today */}
            {isViewingToday && (
                <>
                    {showFabMenu && (
                        <div className="fab-backdrop" onClick={() => setShowFabMenu(false)} />
                    )}
                    <div className={`fab-menu ${showFabMenu ? 'open' : ''}`}>
                        <button
                            className="fab-menu-item expense"
                            onClick={openExpenseForm}
                        >
                            <Minus size={20} />
                            <span>Dépense</span>
                        </button>
                        <button
                            className="fab-menu-item revenue"
                            onClick={openActivityForm}
                        >
                            <Plus size={20} />
                            <span>Recette</span>
                        </button>
                    </div>
                    <button
                        className={`fab ${showFabMenu ? 'active' : ''}`}
                        onClick={handleFabClick}
                        aria-label="Nouvelle transaction"
                    >
                        <Plus size={28} className={showFabMenu ? 'rotated' : ''} />
                    </button>
                </>
            )}

            {/* Activity Form Modal */}
            <ActivityForm
                isOpen={showActivityForm}
                onClose={() => setShowActivityForm(false)}
                onActivityCreated={handleActivityCreated}
                parkId={parkId}
                userId={user?.id || ''}
            />

            {/* Expense Form Modal */}
            <ExpenseForm
                isOpen={showExpenseForm}
                onClose={() => setShowExpenseForm(false)}
                onExpenseCreated={handleExpenseCreated}
                parkId={parkId}
                userId={user?.id || ''}
            />

            {/* Receipt Confirmation Modal */}
            <MobileModal
                isOpen={showReceiptConfirm && lastActivity !== null}
                onClose={() => setShowReceiptConfirm(false)}
                title="✅ Vente enregistrée"
                size="sm"
            >
                {lastActivity && (
                    <>
                        <div className="text-center">
                            <p className="receipt-confirm-amount">
                                {formatCurrency(lastActivity.amount)}
                            </p>
                            <p className="receipt-confirm-text">
                                Voulez-vous imprimer le ticket de caisse ?
                            </p>
                        </div>
                        <div className="form-actions">
                            <button
                                className="btn btn-secondary"
                                onClick={() => setShowReceiptConfirm(false)}
                            >
                                Non merci
                            </button>
                            <button
                                className="btn btn-primary"
                                onClick={() => {
                                    handlePrintReceipt(lastActivity);
                                    setShowReceiptConfirm(false);
                                }}
                            >
                                <Printer size={16} />
                                Imprimer
                            </button>
                        </div>
                    </>
                )}
            </MobileModal>

            {/* Cancel Confirmation Modal */}
            <MobileModal
                isOpen={showCancelModal && selectedActivity !== null}
                onClose={() => setShowCancelModal(false)}
                title="⚠️ Annuler cette vente ?"
                size="md"
            >
                {selectedActivity && (
                    <>
                        <div className="cancel-preview">
                            <span className="cancel-preview-amount">
                                {formatCurrency(selectedActivity.amount)}
                            </span>
                            <span className="cancel-preview-category">
                                {getCategory(selectedActivity.category_id)?.name}
                            </span>
                        </div>
                        <div className="form-group">
                            <label className="input-label">Raison de l'annulation *</label>
                            <textarea
                                className="input"
                                rows={3}
                                placeholder="Ex: Erreur de saisie, client annulé..."
                                value={cancelReason}
                                onChange={(e) => setCancelReason(e.target.value)}
                                required
                            />
                        </div>
                        <div className="form-actions">
                            <button
                                className="btn btn-secondary"
                                onClick={() => setShowCancelModal(false)}
                            >
                                Retour
                            </button>
                            <button
                                className="btn btn-danger"
                                onClick={handleConfirmCancel}
                                disabled={!cancelReason.trim()}
                            >
                                <Ban size={16} />
                                Confirmer l'annulation
                            </button>
                        </div>
                    </>
                )}
            </MobileModal>
        </div>
    );
};

export default CaissePage;
