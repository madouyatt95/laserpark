import React, { useState } from 'react';
import { X, Calculator, Check, AlertTriangle } from 'lucide-react';
import { formatCurrency } from '../../utils/helpers';
import '../../styles/closure.css';

// XOF denominations
const DENOMINATIONS = [
    { value: 10000, label: '10 000 XOF', type: 'bill' },
    { value: 5000, label: '5 000 XOF', type: 'bill' },
    { value: 2000, label: '2 000 XOF', type: 'bill' },
    { value: 1000, label: '1 000 XOF', type: 'bill' },
    { value: 500, label: '500 XOF', type: 'coin' },
    { value: 250, label: '250 XOF', type: 'coin' },
    { value: 200, label: '200 XOF', type: 'coin' },
    { value: 100, label: '100 XOF', type: 'coin' },
    { value: 50, label: '50 XOF', type: 'coin' },
    { value: 25, label: '25 XOF', type: 'coin' },
];

interface CashCountModalProps {
    expectedAmount: number;
    onConfirm: (countedAmount: number) => void;
    onClose: () => void;
}

const CashCountModal: React.FC<CashCountModalProps> = ({
    expectedAmount,
    onConfirm,
    onClose,
}) => {
    const [counts, setCounts] = useState<Record<number, number>>({});

    const handleCountChange = (denomination: number, count: number) => {
        setCounts(prev => ({
            ...prev,
            [denomination]: Math.max(0, count),
        }));
    };

    const totalCounted = Object.entries(counts).reduce(
        (sum, [denom, count]) => sum + parseInt(denom) * count,
        0
    );

    const difference = totalCounted - expectedAmount;
    const hasDiscrepancy = difference !== 0;

    const handleConfirm = () => {
        onConfirm(totalCounted);
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content modal-lg" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2 className="modal-title">
                        <Calculator size={20} />
                        Comptage de caisse
                    </h2>
                    <button className="modal-close" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <div className="modal-body">
                    {/* Expected Amount */}
                    <div className="cash-count-summary">
                        <div className="cash-count-row">
                            <span>Espèces attendues (théorique)</span>
                            <span className="cash-expected">{formatCurrency(expectedAmount)}</span>
                        </div>
                    </div>

                    {/* Denomination Grid */}
                    <div className="denomination-grid">
                        {DENOMINATIONS.map(denom => (
                            <div key={denom.value} className={`denomination-row ${denom.type}`}>
                                <span className="denomination-label">{denom.label}</span>
                                <div className="denomination-input">
                                    <button
                                        className="denomination-btn"
                                        onClick={() => handleCountChange(denom.value, (counts[denom.value] || 0) - 1)}
                                    >
                                        −
                                    </button>
                                    <input
                                        type="number"
                                        className="denomination-count"
                                        value={counts[denom.value] || ''}
                                        onChange={e => handleCountChange(denom.value, parseInt(e.target.value) || 0)}
                                        placeholder="0"
                                        min="0"
                                    />
                                    <button
                                        className="denomination-btn"
                                        onClick={() => handleCountChange(denom.value, (counts[denom.value] || 0) + 1)}
                                    >
                                        +
                                    </button>
                                </div>
                                <span className="denomination-subtotal">
                                    {formatCurrency((counts[denom.value] || 0) * denom.value)}
                                </span>
                            </div>
                        ))}
                    </div>

                    {/* Result Summary */}
                    <div className="cash-count-result">
                        <div className="cash-count-row">
                            <span className="cash-count-label">Total compté</span>
                            <span className="cash-counted">{formatCurrency(totalCounted)}</span>
                        </div>
                        <div className={`cash-count-row ${hasDiscrepancy ? 'discrepancy' : 'match'}`}>
                            <span className="cash-count-label">
                                {hasDiscrepancy ? (
                                    <>
                                        <AlertTriangle size={16} />
                                        Écart
                                    </>
                                ) : (
                                    <>
                                        <Check size={16} />
                                        Caisse OK
                                    </>
                                )}
                            </span>
                            <span className={`cash-difference ${difference > 0 ? 'positive' : difference < 0 ? 'negative' : ''}`}>
                                {difference >= 0 ? '+' : ''}{formatCurrency(difference)}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="modal-footer">
                    <button className="btn btn-secondary" onClick={onClose}>
                        Annuler
                    </button>
                    <button
                        className="btn btn-primary"
                        onClick={handleConfirm}
                        disabled={totalCounted === 0}
                    >
                        <Check size={16} />
                        Valider le comptage
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CashCountModal;
