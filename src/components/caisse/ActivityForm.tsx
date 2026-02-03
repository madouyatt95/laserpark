import React, { useState } from 'react';
import { X, Plus } from 'lucide-react';
import { useActivityStore } from '../../stores/activityStore';
import { useCategoryStore } from '../../stores/categoryStore';
import { PaymentMethod, ActivityFormData, Activity } from '../../types';
import '../../styles/caisse.css';

interface ActivityFormProps {
    onClose: () => void;
    onActivityCreated?: (activity: Activity) => void;
    parkId: string;
    userId: string;
}

const ActivityForm: React.FC<ActivityFormProps> = ({ onClose, onActivityCreated, parkId, userId }) => {
    const { addActivity } = useActivityStore();
    const { getRevenueCategories } = useCategoryStore();

    const categories = getRevenueCategories(parkId);

    const [formData, setFormData] = useState<ActivityFormData>({
        category_id: categories[0]?.id || '',
        amount: 0,
        quantity: 1,
        payment_method: 'cash',
        comment: '',
    });

    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.category_id || formData.amount <= 0) {
            return;
        }

        setIsSubmitting(true);

        try {
            const newActivity = await addActivity(parkId, userId, formData);
            setIsSubmitting(false);

            if (onActivityCreated) {
                onActivityCreated(newActivity);
            } else {
                onClose();
            }
        } catch (error) {
            console.error('Error adding activity:', error);
            setIsSubmitting(false);
            alert('Erreur lors de l\'enregistrement de la vente');
        }
    };

    const handlePaymentSelect = (method: PaymentMethod) => {
        setFormData(prev => ({ ...prev, payment_method: method }));
    };

    const handleCategorySelect = (categoryId: string) => {
        setFormData(prev => ({ ...prev, category_id: categoryId }));
    };

    const handleQuantityChange = (delta: number) => {
        setFormData(prev => ({
            ...prev,
            quantity: Math.max(1, prev.quantity + delta)
        }));
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2 className="modal-title">Nouvelle vente</h2>
                    <button className="btn btn-ghost btn-icon" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <div className="modal-body">
                    <form onSubmit={handleSubmit} id="activity-form">
                        {/* Category Selection */}
                        <div className="form-section">
                            <label className="input-label">Catégorie</label>
                            <div className="category-grid">
                                {categories.map(category => (
                                    <button
                                        key={category.id}
                                        type="button"
                                        className={`category-chip ${formData.category_id === category.id ? 'selected' : ''}`}
                                        style={{
                                            '--category-color': category.color || '#8b5cf6'
                                        } as React.CSSProperties}
                                        onClick={() => handleCategorySelect(category.id)}
                                    >
                                        <span className="category-icon">{category.icon || '🎯'}</span>
                                        <span className="category-name">{category.name}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Amount */}
                        <div className="form-section">
                            <label className="input-label" htmlFor="amount">Montant (XOF)</label>
                            <input
                                type="number"
                                id="amount"
                                className="input input-lg"
                                value={formData.amount || ''}
                                onChange={(e) => setFormData(prev => ({
                                    ...prev,
                                    amount: parseInt(e.target.value) || 0
                                }))}
                                placeholder="0"
                                min="0"
                                step="100"
                                required
                            />
                        </div>

                        {/* Quantity */}
                        <div className="form-section">
                            <label className="input-label">Quantité</label>
                            <div className="quantity-control">
                                <button
                                    type="button"
                                    className="quantity-btn"
                                    onClick={() => handleQuantityChange(-1)}
                                    disabled={formData.quantity <= 1}
                                >
                                    −
                                </button>
                                <span className="quantity-value">{formData.quantity}</span>
                                <button
                                    type="button"
                                    className="quantity-btn"
                                    onClick={() => handleQuantityChange(1)}
                                >
                                    +
                                </button>
                            </div>
                        </div>

                        {/* Payment Method */}
                        <div className="form-section">
                            <label className="input-label">Mode de paiement</label>
                            <div className="payment-methods">
                                <button
                                    type="button"
                                    className={`payment-chip cash ${formData.payment_method === 'cash' ? 'selected' : ''}`}
                                    onClick={() => handlePaymentSelect('cash')}
                                >
                                    💵 Espèces
                                </button>
                                <button
                                    type="button"
                                    className={`payment-chip wave ${formData.payment_method === 'wave' ? 'selected' : ''}`}
                                    onClick={() => handlePaymentSelect('wave')}
                                >
                                    💳 Wave
                                </button>
                                <button
                                    type="button"
                                    className={`payment-chip orange_money ${formData.payment_method === 'orange_money' ? 'selected' : ''}`}
                                    onClick={() => handlePaymentSelect('orange_money')}
                                >
                                    📱 Orange Money
                                </button>
                            </div>
                        </div>

                        {/* Comment */}
                        <div className="form-section">
                            <label className="input-label" htmlFor="comment">Commentaire (optionnel)</label>
                            <input
                                type="text"
                                id="comment"
                                className="input"
                                value={formData.comment}
                                onChange={(e) => setFormData(prev => ({ ...prev, comment: e.target.value }))}
                                placeholder="Note ou remarque..."
                            />
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            className="btn btn-primary btn-lg form-submit"
                            disabled={isSubmitting || !formData.category_id || formData.amount <= 0}
                        >
                            {isSubmitting ? (
                                <span className="spinner spinner-sm"></span>
                            ) : (
                                <>
                                    <Plus size={20} />
                                    Enregistrer la vente
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ActivityForm;
