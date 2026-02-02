import React, { useState } from 'react';
import { Plus, TrendingUp, CreditCard, Banknote, Smartphone, Printer, X, Ban } from 'lucide-react';
import { useParkStore } from '../stores/parkStore';
import { useActivityStore } from '../stores/activityStore';
import { useCategoryStore } from '../stores/categoryStore';
import { useAuthStore } from '../stores/authStore';
import { formatCurrency, formatTime } from '../utils/helpers';
import { printReceipt, generateReceipt } from '../services/ReceiptService';
import { Activity } from '../types';
import ActivityForm from '../components/caisse/ActivityForm';
import QuickShortcuts from '../components/caisse/QuickShortcuts';
import '../styles/caisse.css';

const CaissePage: React.FC = () => {
    const [showActivityForm, setShowActivityForm] = useState(false);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
    const [cancelReason, setCancelReason] = useState('');
    const [showReceiptConfirm, setShowReceiptConfirm] = useState(false);
    const [lastActivity, setLastActivity] = useState<Activity | null>(null);

    const { user } = useAuthStore();
    const { selectedParkId, getSelectedPark } = useParkStore();
    const { getTodayActivities, getTodayRevenue, getRevenueByPayment, cancelActivity } = useActivityStore();
    const { getCategory } = useCategoryStore();

    const selectedPark = getSelectedPark();
    const parkId = selectedParkId || '';

    const todayActivities = getTodayActivities(parkId);
    const activeActivities = todayActivities.filter(a => a.status !== 'cancelled');
    const todayRevenue = activeActivities.reduce((sum, a) => sum + a.amount, 0);
    const revenueByPayment = getRevenueByPayment(parkId);

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

    const handleDownloadReceipt = (activity: Activity) => {
        const park = getSelectedPark();
        const category = getCategory(activity.category_id);
        if (park && category) {
            generateReceipt({
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

    const handleQuickSaleComplete = () => {
        // Quick sales auto-complete, no receipt prompt for now
    };

    return (
        <div className="page">
            <div className="page-header">
                <h1 className="page-title">
                    <span className="text-gradient">Caisse Live</span>
                </h1>
                <p className="page-subtitle">
                    {new Date().toLocaleDateString('fr-FR', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long'
                    })}
                </p>
            </div>

            {/* Quick Shortcuts */}
            <QuickShortcuts parkId={parkId} onSaleComplete={handleQuickSaleComplete} />
            <div className="caisse-summary">
                <div className="summary-card total">
                    <div className="summary-card-icon">
                        <TrendingUp size={24} />
                    </div>
                    <div className="summary-card-content">
                        <span className="summary-card-label">Total du jour</span>
                        <span className="summary-card-value">{formatCurrency(todayRevenue)}</span>
                    </div>
                </div>

                <div className="summary-cards-row">
                    <div className="summary-card cash">
                        <Banknote size={20} />
                        <span className="summary-card-label">Espèces</span>
                        <span className="summary-card-value">{formatCurrency(revenueByPayment.cash)}</span>
                    </div>

                    <div className="summary-card wave">
                        <CreditCard size={20} />
                        <span className="summary-card-label">Wave</span>
                        <span className="summary-card-value">{formatCurrency(revenueByPayment.wave)}</span>
                    </div>

                    <div className="summary-card orange">
                        <Smartphone size={20} />
                        <span className="summary-card-label">Orange Money</span>
                        <span className="summary-card-value">{formatCurrency(revenueByPayment.orange_money)}</span>
                    </div>
                </div>
            </div>

            {/* Activities List */}
            <section className="section">
                <div className="section-header">
                    <h2 className="section-title">Activités du jour</h2>
                    <span className="badge badge-primary">{activeActivities.length}</span>
                </div>

                {todayActivities.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-state-icon">🎯</div>
                        <h3 className="empty-state-title">Aucune activité</h3>
                        <p className="empty-state-text">
                            Cliquez sur le bouton + pour enregistrer votre première vente
                        </p>
                    </div>
                ) : (
                    <div className="activities-list">
                        {todayActivities.map((activity) => {
                            const category = getCategory(activity.category_id);
                            const isCancelled = activity.status === 'cancelled';
                            return (
                                <div
                                    key={activity.id}
                                    className={`activity-item ${isCancelled ? 'cancelled' : ''}`}
                                >
                                    <div
                                        className="activity-icon"
                                        style={{ backgroundColor: category?.color ? `${category.color}20` : undefined }}
                                    >
                                        <span>{category?.icon || '🎯'}</span>
                                    </div>
                                    <div className="activity-content">
                                        <span className="activity-name">{category?.name || 'Activité'}</span>
                                        <span className="activity-meta">
                                            {formatTime(activity.activity_date)} • x{activity.quantity}
                                        </span>
                                        {isCancelled && (
                                            <span className="activity-cancelled-badge">
                                                Annulé: {activity.cancelled_reason}
                                            </span>
                                        )}
                                    </div>
                                    <div className="activity-payment">
                                        <span className={`payment-badge ${activity.payment_method}`}>
                                            {activity.payment_method === 'cash' ? 'Espèces' :
                                                activity.payment_method === 'wave' ? 'Wave' : 'OM'}
                                        </span>
                                        <span className={`activity-amount ${isCancelled ? 'cancelled' : ''}`}>
                                            {formatCurrency(activity.amount)}
                                        </span>
                                    </div>
                                    {!isCancelled && (
                                        <div className="activity-actions">
                                            <button
                                                className="btn-icon-sm"
                                                onClick={() => handlePrintReceipt(activity)}
                                                title="Imprimer ticket"
                                            >
                                                <Printer size={14} />
                                            </button>
                                            <button
                                                className="btn-icon-sm btn-danger-ghost"
                                                onClick={() => handleCancelClick(activity)}
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

            {/* FAB Button */}
            <button
                className="fab"
                onClick={() => setShowActivityForm(true)}
                aria-label="Nouvelle activité"
            >
                <Plus size={28} />
            </button>

            {/* Activity Form Modal */}
            {showActivityForm && (
                <ActivityForm
                    onClose={() => setShowActivityForm(false)}
                    onActivityCreated={handleActivityCreated}
                    parkId={parkId}
                    userId={user?.id || ''}
                />
            )}

            {/* Receipt Confirmation Modal */}
            {showReceiptConfirm && lastActivity && (
                <div className="modal-overlay" onClick={() => setShowReceiptConfirm(false)}>
                    <div className="modal-content modal-sm" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">✅ Vente enregistrée</h2>
                            <button className="modal-close" onClick={() => setShowReceiptConfirm(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        <div className="modal-body text-center">
                            <p className="receipt-confirm-amount">
                                {formatCurrency(lastActivity.amount)}
                            </p>
                            <p className="receipt-confirm-text">
                                Voulez-vous imprimer le ticket de caisse ?
                            </p>
                        </div>
                        <div className="modal-footer">
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
                    </div>
                </div>
            )}

            {/* Cancel Confirmation Modal */}
            {showCancelModal && selectedActivity && (
                <div className="modal-overlay" onClick={() => setShowCancelModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">⚠️ Annuler cette vente ?</h2>
                            <button className="modal-close" onClick={() => setShowCancelModal(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        <div className="modal-body">
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
                        </div>
                        <div className="modal-footer">
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
                    </div>
                </div>
            )}
        </div>
    );
};

export default CaissePage;
