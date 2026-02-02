import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, Settings } from 'lucide-react';
import { useCategoryStore } from '../../stores/categoryStore';
import { useActivityStore } from '../../stores/activityStore';
import { useAuthStore } from '../../stores/authStore';
import { useShortcutStore } from '../../stores/shortcutStore';
import { formatCurrency } from '../../utils/helpers';
import './QuickShortcuts.css';

interface QuickShortcutsProps {
    parkId: string;
    onSaleComplete?: () => void;
}

const QUANTITY_OPTIONS = [1, 2, 5, 10];

const QuickShortcuts: React.FC<QuickShortcutsProps> = ({ parkId, onSaleComplete }) => {
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const { addActivity } = useActivityStore();
    const { getShortcutsByPark } = useShortcutStore();

    const [activeShortcut, setActiveShortcut] = useState<string | null>(null);
    const [showQuantityPicker, setShowQuantityPicker] = useState(false);
    const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const quantityPickerRef = useRef<HTMLDivElement>(null);

    const shortcuts = getShortcutsByPark(parkId);

    // Close quantity picker when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (quantityPickerRef.current && !quantityPickerRef.current.contains(event.target as Node)) {
                setShowQuantityPicker(false);
                setActiveShortcut(null);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleQuickSale = (shortcut: typeof shortcuts[0], quantity: number = 1) => {
        if (!user) return;

        addActivity(parkId, user.id, {
            category_id: shortcut.category_id,
            amount: shortcut.amount * quantity,
            quantity: shortcut.quantity * quantity,
            payment_method: shortcut.payment_method,
            comment: quantity > 1 ? `Vente rapide x${quantity}` : 'Vente rapide',
        });

        setShowQuantityPicker(false);
        setActiveShortcut(null);
        onSaleComplete?.();
    };

    const handleTouchStart = (shortcutId: string) => {
        longPressTimer.current = setTimeout(() => {
            setActiveShortcut(shortcutId);
            setShowQuantityPicker(true);
        }, 500); // 500ms for long press
    };

    const handleTouchEnd = (shortcut: typeof shortcuts[0]) => {
        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
        }
        // If quantity picker is not shown, it was a tap
        if (!showQuantityPicker) {
            handleQuickSale(shortcut, 1);
        }
    };

    const handleTouchCancel = () => {
        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
        }
    };

    const handleQuantitySelect = (quantity: number) => {
        const shortcut = shortcuts.find(s => s.id === activeShortcut);
        if (shortcut) {
            handleQuickSale(shortcut, quantity);
        }
    };

    return (
        <div className="quick-shortcuts">
            <div className="quick-shortcuts-header">
                <div className="quick-shortcuts-title">
                    <Zap size={16} />
                    <span>Ventes rapides</span>
                    <span className="quick-shortcuts-hint">(appui long = quantité)</span>
                </div>
                <button
                    className="btn-icon-sm"
                    onClick={() => navigate('/raccourcis')}
                    title="Gérer les raccourcis"
                >
                    <Settings size={14} />
                </button>
            </div>
            <div className="quick-shortcuts-grid">
                {shortcuts.length === 0 ? (
                    <button
                        className="quick-shortcut-btn add-shortcut"
                        onClick={() => navigate('/raccourcis')}
                    >
                        <span className="shortcut-icon">+</span>
                        <span className="shortcut-name">Ajouter</span>
                    </button>
                ) : (
                    shortcuts.map((shortcut) => (
                        <div key={shortcut.id} className="shortcut-wrapper">
                            <button
                                className={`quick-shortcut-btn ${activeShortcut === shortcut.id ? 'active' : ''}`}
                                onMouseDown={() => handleTouchStart(shortcut.id)}
                                onMouseUp={() => handleTouchEnd(shortcut)}
                                onMouseLeave={handleTouchCancel}
                                onTouchStart={() => handleTouchStart(shortcut.id)}
                                onTouchEnd={(e) => {
                                    e.preventDefault();
                                    handleTouchEnd(shortcut);
                                }}
                                onTouchCancel={handleTouchCancel}
                            >
                                <span className="shortcut-icon">{shortcut.icon}</span>
                                <span className="shortcut-name">{shortcut.name}</span>
                                <span className="shortcut-price">{formatCurrency(shortcut.amount)}</span>
                            </button>

                            {/* Quantity Picker Popup */}
                            {showQuantityPicker && activeShortcut === shortcut.id && (
                                <div className="quantity-picker" ref={quantityPickerRef}>
                                    <span className="quantity-picker-label">Quantité</span>
                                    <div className="quantity-options">
                                        {QUANTITY_OPTIONS.map(qty => (
                                            <button
                                                key={qty}
                                                className="quantity-option"
                                                onClick={() => handleQuantitySelect(qty)}
                                            >
                                                ×{qty}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default QuickShortcuts;
