import React, { useState } from 'react';
import { Plus, Package, AlertTriangle, ArrowDownCircle, X, Boxes, Eye } from 'lucide-react';
import { useParkStore } from '../stores/parkStore';
import { useStockStore } from '../stores/stockStore';
import { useAuthStore } from '../stores/authStore';
import '../styles/stocks.css';

// Stock categories for dropdown
const STOCK_CATEGORIES = [
    'Boissons',
    'Alimentation',
    'Équipement',
    'Consommables',
    'Merchandising',
    'Autre'
];

const StocksPage: React.FC = () => {
    const { user } = useAuthStore();
    const { selectedParkId } = useParkStore();
    const { getStockByPark, addStockItem, addStockEntry, adjustStock } = useStockStore();

    const parkId = selectedParkId || '';
    const stockItems = getStockByPark(parkId);

    // Only managers and admins can manage stock
    const canManageStock = user?.role === 'super_admin' || user?.role === 'manager';

    const [showAddStock, setShowAddStock] = useState(false);
    const [showAddItem, setShowAddItem] = useState(false);
    const [selectedItem, setSelectedItem] = useState<string | null>(null);
    const [movementType, setMovementType] = useState<'entry' | 'adjustment'>('entry');
    const [quantity, setQuantity] = useState<number>(0);
    const [reason, setReason] = useState('');

    // New item form
    const [newItem, setNewItem] = useState({
        name: '',
        category: 'Boissons',
        quantity: 0,
        min_threshold: 5,
        unit: 'unités',
    });

    const handleSubmitMovement = () => {
        if (!selectedItem || quantity <= 0) return;

        const item = stockItems.find(s => s.id === selectedItem);
        if (!item) return;

        if (movementType === 'entry') {
            addStockEntry(selectedItem, quantity, reason || 'Entrée de stock', user?.id || '');
        } else {
            adjustStock(selectedItem, quantity, reason || 'Ajustement', user?.id || '');
        }

        setShowAddStock(false);
        setSelectedItem(null);
        setQuantity(0);
        setReason('');
    };

    const handleAddItem = () => {
        if (!newItem.name.trim()) {
            alert('Veuillez entrer un nom');
            return;
        }

        addStockItem({
            park_id: parkId,
            name: newItem.name.trim(),
            category: newItem.category,
            quantity: newItem.quantity,
            min_threshold: newItem.min_threshold,
            unit: newItem.unit,
            is_active: true,
        });

        setNewItem({
            name: '',
            category: 'Boissons',
            quantity: 0,
            min_threshold: 5,
            unit: 'unités',
        });
        setShowAddItem(false);
    };

    const getStockStatus = (current: number, min: number) => {
        if (current === 0) return 'danger';
        if (current <= min) return 'warning';
        return 'good';
    };

    // Group items by category
    const itemsByCategory = stockItems.reduce((acc, item) => {
        const cat = item.category || 'Autre';
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(item);
        return acc;
    }, {} as Record<string, typeof stockItems>);

    return (
        <div className="page">
            <div className="page-header">
                <h1 className="page-title">
                    <span className="text-gradient">Stocks</span>
                </h1>
                {canManageStock ? (
                    <button className="btn btn-sm btn-primary" onClick={() => setShowAddItem(true)}>
                        <Plus size={16} />
                        Ajouter
                    </button>
                ) : (
                    <span className="badge badge-secondary">
                        <Eye size={14} /> Lecture seule
                    </span>
                )}
            </div>

            {/* Stock Items by Category */}
            {Object.keys(itemsByCategory).length === 0 ? (
                <div className="empty-state">
                    <Package size={48} className="empty-state-icon" />
                    <h3 className="empty-state-title">Aucun article</h3>
                    <p className="empty-state-text">
                        Cliquez sur + Ajouter pour créer des articles de stock
                    </p>
                </div>
            ) : (
                Object.entries(itemsByCategory).map(([category, items]) => (
                    <section key={category} className="section">
                        <div className="section-header">
                            <h2 className="section-title">
                                <Boxes size={18} />
                                {category}
                            </h2>
                            <span className="badge badge-secondary">{items.length}</span>
                        </div>
                        <div className="stock-list">
                            {items.map(item => {
                                const status = getStockStatus(item.quantity, item.min_threshold);
                                const percentage = Math.min((item.quantity / (item.min_threshold * 3)) * 100, 100);

                                return (
                                    <div key={item.id} className={`stock-item ${status}`}>
                                        <div className="stock-item-header">
                                            <div className="stock-item-info">
                                                <span className="stock-item-name">{item.name}</span>
                                            </div>
                                            <div className="stock-item-quantity">
                                                <span className={`stock-quantity ${status}`}>
                                                    {item.quantity}
                                                </span>
                                                <span className="stock-unit">{item.unit}</span>
                                            </div>
                                        </div>

                                        <div className="stock-gauge">
                                            <div
                                                className={`stock-gauge-fill ${status}`}
                                                style={{ width: `${percentage}%` }}
                                            />
                                        </div>

                                        <div className="stock-item-footer">
                                            <span className="stock-threshold">
                                                Seuil min: {item.min_threshold} {item.unit}
                                            </span>
                                            {status !== 'good' && (
                                                <span className="stock-alert">
                                                    <AlertTriangle size={14} />
                                                    {status === 'danger' ? 'Rupture' : 'Stock bas'}
                                                </span>
                                            )}
                                        </div>

                                        {canManageStock && (
                                            <div className="stock-actions">
                                                <button
                                                    className="btn btn-sm btn-success"
                                                    onClick={() => {
                                                        setSelectedItem(item.id);
                                                        setMovementType('entry');
                                                        setShowAddStock(true);
                                                    }}
                                                >
                                                    <ArrowDownCircle size={16} />
                                                    Entrée
                                                </button>
                                                <button
                                                    className="btn btn-sm btn-secondary"
                                                    onClick={() => {
                                                        setSelectedItem(item.id);
                                                        setMovementType('adjustment');
                                                        setQuantity(item.quantity);
                                                        setShowAddStock(true);
                                                    }}
                                                >
                                                    Ajuster
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </section>
                ))
            )}

            {/* Add New Item Modal */}
            {showAddItem && (
                <div className="modal-overlay" onClick={() => setShowAddItem(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">Nouvel article de stock</h2>
                            <button className="modal-close" onClick={() => setShowAddItem(false)}>
                                <X size={20} />
                            </button>
                        </div>

                        <div className="modal-body">
                            <div className="form-group">
                                <label className="input-label">Nom de l'article</label>
                                <input
                                    type="text"
                                    className="input"
                                    placeholder="Ex: Coca-Cola, Batterie laser..."
                                    value={newItem.name}
                                    onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                                />
                            </div>

                            <div className="form-group">
                                <label className="input-label">Catégorie</label>
                                <select
                                    className="input"
                                    value={newItem.category}
                                    onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                                >
                                    {STOCK_CATEGORIES.map(cat => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label className="input-label">Quantité initiale</label>
                                    <input
                                        type="number"
                                        className="input"
                                        min="0"
                                        value={newItem.quantity}
                                        onChange={(e) => setNewItem({ ...newItem, quantity: parseInt(e.target.value) || 0 })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="input-label">Seuil minimum</label>
                                    <input
                                        type="number"
                                        className="input"
                                        min="0"
                                        value={newItem.min_threshold}
                                        onChange={(e) => setNewItem({ ...newItem, min_threshold: parseInt(e.target.value) || 0 })}
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="input-label">Unité</label>
                                <select
                                    className="input"
                                    value={newItem.unit}
                                    onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
                                >
                                    <option value="unités">Unités</option>
                                    <option value="pièces">Pièces</option>
                                    <option value="kg">Kilogrammes</option>
                                    <option value="L">Litres</option>
                                    <option value="boîtes">Boîtes</option>
                                    <option value="packs">Packs</option>
                                </select>
                            </div>
                        </div>

                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={() => setShowAddItem(false)}>
                                Annuler
                            </button>
                            <button className="btn btn-primary" onClick={handleAddItem}>
                                <Plus size={16} />
                                Créer l'article
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Stock Movement Modal */}
            {showAddStock && (
                <div className="modal-overlay" onClick={() => setShowAddStock(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">
                                {movementType === 'entry' ? 'Entrée de stock' : 'Ajuster le stock'}
                            </h2>
                        </div>

                        <div className="modal-body">
                            <div className="form-section">
                                <label className="input-label">
                                    {movementType === 'entry' ? 'Quantité à ajouter' : 'Nouvelle quantité'}
                                </label>
                                <input
                                    type="number"
                                    className="input input-lg"
                                    value={quantity || ''}
                                    onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                                    min="0"
                                    placeholder="0"
                                />
                            </div>

                            <div className="form-section">
                                <label className="input-label">Raison (optionnel)</label>
                                <input
                                    type="text"
                                    className="input"
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    placeholder="Ex: Réapprovisionnement, Inventaire..."
                                />
                            </div>
                        </div>

                        <div className="modal-footer">
                            <button
                                className="btn btn-secondary"
                                onClick={() => setShowAddStock(false)}
                            >
                                Annuler
                            </button>
                            <button
                                className="btn btn-primary"
                                onClick={handleSubmitMovement}
                                disabled={quantity <= 0 && movementType === 'entry'}
                            >
                                Confirmer
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StocksPage;
