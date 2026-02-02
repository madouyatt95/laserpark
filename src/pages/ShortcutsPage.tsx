import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    Plus,
    Zap,
    Edit2,
    Trash2,
    GripVertical,
    X,
    DollarSign
} from 'lucide-react';
import { useParkStore } from '../stores/parkStore';
import { useCategoryStore } from '../stores/categoryStore';
import { useShortcutStore, QuickShortcut } from '../stores/shortcutStore';
import { formatCurrency } from '../utils/helpers';
import { PaymentMethod } from '../types';
import '../styles/shortcuts.css';

const ShortcutsPage: React.FC = () => {
    const navigate = useNavigate();
    const { selectedParkId, getActivePark } = useParkStore();
    const { getCategoriesByPark } = useCategoryStore();
    const { shortcuts, getShortcutsByPark, addShortcut, updateShortcut, deleteShortcut } = useShortcutStore();

    const parkId = selectedParkId || '';
    const park = parkId ? getActivePark(parkId) : null;
    const parkShortcuts = shortcuts.filter(s => s.park_id === parkId);
    const categories = getCategoriesByPark(parkId).filter(c => c.type === 'revenue');

    const [showModal, setShowModal] = useState(false);
    const [editingShortcut, setEditingShortcut] = useState<QuickShortcut | null>(null);
    const [form, setForm] = useState({
        name: '',
        amount: 0,
        quantity: 1,
        category_id: '',
        icon: '🎯',
        payment_method: 'cash' as PaymentMethod,
    });

    const ICONS = ['🎯', '🎮', '🥤', '🍿', '🎂', '🎁', '⚡', '🎪', '🎫', '🏆'];

    const openAddModal = () => {
        setEditingShortcut(null);
        setForm({
            name: '',
            amount: 0,
            quantity: 1,
            category_id: categories[0]?.id || '',
            icon: '🎯',
            payment_method: 'cash',
        });
        setShowModal(true);
    };

    const openEditModal = (shortcut: QuickShortcut) => {
        setEditingShortcut(shortcut);
        setForm({
            name: shortcut.name,
            amount: shortcut.amount,
            quantity: shortcut.quantity,
            category_id: shortcut.category_id,
            icon: shortcut.icon || '🎯',
            payment_method: shortcut.payment_method as PaymentMethod,
        });
        setShowModal(true);
    };

    const handleSave = () => {
        if (!form.name.trim() || !form.category_id || form.amount <= 0) {
            alert('Veuillez remplir tous les champs obligatoires');
            return;
        }

        if (editingShortcut) {
            updateShortcut(editingShortcut.id, {
                name: form.name,
                amount: form.amount,
                quantity: form.quantity,
                category_id: form.category_id,
                icon: form.icon,
                payment_method: form.payment_method,
            });
        } else {
            addShortcut({
                park_id: parkId,
                name: form.name,
                amount: form.amount,
                quantity: form.quantity,
                category_id: form.category_id,
                icon: form.icon,
                payment_method: form.payment_method,
                is_active: true,
            });
        }

        setShowModal(false);
    };

    const handleDelete = (shortcutId: string) => {
        if (confirm('Supprimer ce raccourci ?')) {
            deleteShortcut(shortcutId);
        }
    };

    const getCategoryName = (categoryId: string) => {
        const category = categories.find(c => c.id === categoryId);
        return category?.name || 'Non défini';
    };

    return (
        <div className="page">
            <div className="page-header">
                <button className="btn-icon" onClick={() => navigate(-1)}>
                    <ArrowLeft size={20} />
                </button>
                <div>
                    <h1 className="page-title">
                        <span className="text-gradient">Raccourcis rapides</span>
                    </h1>
                    <p className="page-subtitle">{park?.name}</p>
                </div>
            </div>

            {/* Info Banner */}
            <div className="info-banner">
                <Zap size={20} />
                <p>Les raccourcis permettent d'enregistrer une vente en un seul clic depuis la page Caisse.</p>
            </div>

            {/* Shortcuts List */}
            <div className="shortcuts-list">
                {parkShortcuts.length === 0 ? (
                    <div className="empty-state">
                        <Zap size={48} className="empty-state-icon" />
                        <h3 className="empty-state-title">Aucun raccourci</h3>
                        <p className="empty-state-text">
                            Créez des raccourcis pour accélérer les ventes fréquentes
                        </p>
                    </div>
                ) : (
                    parkShortcuts.map(shortcut => (
                        <div key={shortcut.id} className={`shortcut-card ${!shortcut.is_active ? 'inactive' : ''}`}>
                            <div className="shortcut-drag">
                                <GripVertical size={16} />
                            </div>
                            <div className="shortcut-icon">{shortcut.icon}</div>
                            <div className="shortcut-info">
                                <span className="shortcut-name">{shortcut.name}</span>
                                <span className="shortcut-category">{getCategoryName(shortcut.category_id)}</span>
                                <span className="shortcut-price">{formatCurrency(shortcut.amount)}</span>
                            </div>
                            <div className="shortcut-actions">
                                <button
                                    className="btn-icon"
                                    onClick={() => openEditModal(shortcut)}
                                >
                                    <Edit2 size={16} />
                                </button>
                                <button
                                    className="btn-icon btn-danger-ghost"
                                    onClick={() => handleDelete(shortcut.id)}
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* FAB */}
            <button className="fab" onClick={openAddModal}>
                <Plus size={24} />
            </button>

            {/* Add/Edit Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">
                                {editingShortcut ? 'Modifier le raccourci' : 'Nouveau raccourci'}
                            </h2>
                            <button className="modal-close" onClick={() => setShowModal(false)}>
                                <X size={20} />
                            </button>
                        </div>

                        <div className="modal-body">
                            {/* Icon Selector */}
                            <div className="form-group">
                                <label className="input-label">Icône</label>
                                <div className="icon-grid">
                                    {ICONS.map(icon => (
                                        <button
                                            key={icon}
                                            type="button"
                                            className={`icon-btn ${form.icon === icon ? 'active' : ''}`}
                                            onClick={() => setForm({ ...form, icon })}
                                        >
                                            {icon}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="input-label">Nom du raccourci</label>
                                <input
                                    type="text"
                                    className="input"
                                    placeholder="Ex: Laser 20min"
                                    value={form.name}
                                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                                />
                            </div>

                            <div className="form-group">
                                <label className="input-label">Catégorie de vente</label>
                                <select
                                    className="input"
                                    value={form.category_id}
                                    onChange={(e) => setForm({ ...form, category_id: e.target.value })}
                                >
                                    <option value="">Sélectionner...</option>
                                    {categories.map(cat => (
                                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label className="input-label">Montant (XOF)</label>
                                    <div className="input-with-icon">
                                        <DollarSign size={18} />
                                        <input
                                            type="number"
                                            className="input"
                                            min="0"
                                            step="100"
                                            value={form.amount || ''}
                                            onChange={(e) => setForm({ ...form, amount: parseInt(e.target.value) || 0 })}
                                        />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label className="input-label">Quantité</label>
                                    <input
                                        type="number"
                                        className="input"
                                        min="1"
                                        value={form.quantity}
                                        onChange={(e) => setForm({ ...form, quantity: parseInt(e.target.value) || 1 })}
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="input-label">Paiement par défaut</label>
                                <div className="payment-options">
                                    {(['cash', 'wave', 'orange_money'] as const).map(method => (
                                        <button
                                            key={method}
                                            type="button"
                                            className={`payment-option ${form.payment_method === method ? 'active' : ''}`}
                                            onClick={() => setForm({ ...form, payment_method: method as PaymentMethod })}
                                        >
                                            {method === 'cash' ? 'Espèces' : method === 'wave' ? 'Wave' : 'Orange Money'}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={() => setShowModal(false)}>
                                Annuler
                            </button>
                            <button className="btn btn-primary" onClick={handleSave}>
                                {editingShortcut ? 'Enregistrer' : 'Créer'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ShortcutsPage;
