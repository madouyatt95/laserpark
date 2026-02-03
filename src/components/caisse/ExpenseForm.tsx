import React, { useState } from 'react';
import { Minus } from 'lucide-react';
import { useExpenseStore } from '../../stores/expenseStore';
import { useCategoryStore } from '../../stores/categoryStore';
import { PaymentMethod, ExpenseFormData, Expense } from '../../types';
import MobileModal from '../common/MobileModal';
import '../../styles/caisse.css';

interface ExpenseFormProps {
    isOpen: boolean;
    onClose: () => void;
    onExpenseCreated?: (expense: Expense) => void;
    parkId: string;
    userId: string;
}

const ExpenseForm: React.FC<ExpenseFormProps> = ({ isOpen, onClose, onExpenseCreated, parkId, userId }) => {
    const { addExpense } = useExpenseStore();
    const { getExpenseCategories } = useCategoryStore();

    const categories = getExpenseCategories(parkId);

    const [formData, setFormData] = useState<ExpenseFormData>({
        category_id: categories[0]?.id || '',
        amount: 0,
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
            addExpense(parkId, userId, formData);
            setIsSubmitting(false);

            // Reset form
            setFormData({
                category_id: categories[0]?.id || '',
                amount: 0,
                payment_method: 'cash',
                comment: '',
            });

            if (onExpenseCreated) {
                // Create a mock expense object for callback
                const newExpense: Expense = {
                    id: `temp_${Date.now()}`,
                    park_id: parkId,
                    category_id: formData.category_id,
                    amount: formData.amount,
                    payment_method: formData.payment_method,
                    comment: formData.comment,
                    created_by: userId,
                    expense_date: new Date().toISOString(),
                    created_at: new Date().toISOString(),
                };
                onExpenseCreated(newExpense);
            } else {
                onClose();
            }
        } catch (error) {
            console.error('Error adding expense:', error);
            setIsSubmitting(false);
            alert('Erreur lors de l\'enregistrement de la dépense');
        }
    };

    const handlePaymentSelect = (method: PaymentMethod) => {
        setFormData(prev => ({ ...prev, payment_method: method }));
    };

    const handleCategorySelect = (categoryId: string) => {
        setFormData(prev => ({ ...prev, category_id: categoryId }));
    };

    return (
        <MobileModal
            isOpen={isOpen}
            onClose={onClose}
            title="Nouvelle dépense"
            size="lg"
        >
            <form onSubmit={handleSubmit} id="expense-form">
                {/* Category Selection */}
                <div className="form-section">
                    <label className="input-label">Catégorie</label>
                    {categories.length === 0 ? (
                        <div className="empty-state-sm">
                            <p>Aucune catégorie de dépense configurée</p>
                        </div>
                    ) : (
                        <div className="category-grid">
                            {categories.map(category => (
                                <button
                                    key={category.id}
                                    type="button"
                                    className={`category-chip ${formData.category_id === category.id ? 'selected' : ''}`}
                                    style={{
                                        '--category-color': category.color || '#ef4444'
                                    } as React.CSSProperties}
                                    onClick={() => handleCategorySelect(category.id)}
                                >
                                    <span className="category-icon">{category.icon || '💸'}</span>
                                    <span className="category-name">{category.name}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Amount */}
                <div className="form-section">
                    <label className="input-label" htmlFor="expense-amount">Montant (CFA)</label>
                    <input
                        type="number"
                        id="expense-amount"
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
                    <label className="input-label" htmlFor="expense-comment">Description *</label>
                    <input
                        type="text"
                        id="expense-comment"
                        className="input"
                        value={formData.comment}
                        onChange={(e) => setFormData(prev => ({ ...prev, comment: e.target.value }))}
                        placeholder="Ex: Achat fournitures, Électricité..."
                        required
                    />
                </div>

                {/* Submit */}
                <div className="form-actions">
                    <button
                        type="submit"
                        className="btn btn-danger btn-lg form-submit"
                        disabled={isSubmitting || !formData.category_id || formData.amount <= 0 || !formData.comment?.trim()}
                    >
                        {isSubmitting ? (
                            <span className="spinner spinner-sm"></span>
                        ) : (
                            <>
                                <Minus size={20} />
                                Enregistrer la dépense
                            </>
                        )}
                    </button>
                </div>
            </form>
        </MobileModal>
    );
};

export default ExpenseForm;
