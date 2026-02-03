import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Tag, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useParkStore } from '../stores/parkStore';
import { useCategoryStore } from '../stores/categoryStore';
import { useAuthStore } from '../stores/authStore';
import { Category, CategoryType } from '../types';
import MobileModal from '../components/common/MobileModal';
import '../styles/categories.css';

// Common emoji icons for categories
const CATEGORY_ICONS = ['🎯', '🎮', '🎪', '🎰', '🍿', '🥤', '🍔', '🎂', '🎁', '🛒', '💳', '🔧', '🧹', '💡', '📦', '🚗', '👕', '🎨'];
const CATEGORY_COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#ec4899', '#06b6d4', '#84cc16'];

const CategoriesPage: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const { selectedParkId } = useParkStore();
    const {
        getCategoriesByPark,
        addCategory,
        updateCategory,
        deleteCategory,
        toggleCategoryStatus
    } = useCategoryStore();

    const parkId = selectedParkId || '';
    const categories = getCategoriesByPark(parkId);

    const revenueCategories = categories.filter(c => c.type === 'revenue');
    const expenseCategories = categories.filter(c => c.type === 'expense');

    const [showModal, setShowModal] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [categoryForm, setCategoryForm] = useState({
        name: '',
        type: 'revenue' as CategoryType,
        icon: '🎯',
        color: '#10b981',
    });

    const canManage = user?.role === 'super_admin' || user?.role === 'manager';

    const openAddModal = (type: CategoryType) => {
        setEditingCategory(null);
        setCategoryForm({
            name: '',
            type,
            icon: '🎯',
            color: '#10b981',
        });
        setShowModal(true);
    };

    const openEditModal = (category: Category) => {
        setEditingCategory(category);
        setCategoryForm({
            name: category.name,
            type: category.type,
            icon: category.icon || '🎯',
            color: category.color || '#10b981',
        });
        setShowModal(true);
    };

    const handleSave = async () => {
        if (!categoryForm.name.trim()) {
            alert('Veuillez entrer un nom');
            return;
        }

        try {
            if (editingCategory) {
                await updateCategory(editingCategory.id, {
                    name: categoryForm.name.trim(),
                    icon: categoryForm.icon,
                    color: categoryForm.color,
                });
            } else {
                await addCategory({
                    park_id: parkId,
                    name: categoryForm.name.trim(),
                    type: categoryForm.type,
                    icon: categoryForm.icon,
                    color: categoryForm.color,
                    impacts_stock: false,
                    is_active: true,
                    sort_order: categories.length,
                });
            }
            setShowModal(false);
            setEditingCategory(null);
        } catch (error) {
            console.error('Error saving category:', error);
            alert('Erreur lors de l\'enregistrement');
        }
    };

    const handleDelete = async () => {
        if (!editingCategory) return;

        if (confirm(`Supprimer la catégorie "${editingCategory.name}" ?`)) {
            try {
                await deleteCategory(editingCategory.id);
                setShowModal(false);
                setEditingCategory(null);
            } catch (error) {
                console.error('Error deleting category:', error);
                alert('Erreur lors de la suppression');
            }
        }
    };

    const CategoryCard = ({ category }: { category: Category }) => (
        <div
            className={`category-card ${!category.is_active ? 'inactive' : ''}`}
            onClick={() => canManage && openEditModal(category)}
        >
            <div
                className="category-card-icon"
                style={{ backgroundColor: `${category.color}20`, color: category.color }}
            >
                {category.icon || '🎯'}
            </div>
            <div className="category-card-info">
                <span className="category-card-name">{category.name}</span>
                {!category.is_active && (
                    <span className="category-card-badge inactive">Inactif</span>
                )}
            </div>
            {canManage && (
                <Edit2 size={16} className="category-card-edit" />
            )}
        </div>
    );

    return (
        <div className="page">
            <div className="page-header">
                <button className="btn btn-icon" onClick={() => navigate(-1)}>
                    <ArrowLeft size={20} />
                </button>
                <div>
                    <h1 className="page-title">Catégories</h1>
                    <p className="page-subtitle">Gérer les catégories de recettes et dépenses</p>
                </div>
            </div>

            {/* Revenue Categories */}
            <section className="section">
                <div className="section-header">
                    <h2 className="section-title">💰 Recettes</h2>
                    {canManage && (
                        <button
                            className="btn btn-sm btn-primary"
                            onClick={() => openAddModal('revenue')}
                        >
                            <Plus size={16} />
                            Ajouter
                        </button>
                    )}
                </div>
                {revenueCategories.length === 0 ? (
                    <div className="empty-state-sm">
                        <p>Aucune catégorie de recette</p>
                    </div>
                ) : (
                    <div className="categories-grid">
                        {revenueCategories.map(cat => (
                            <CategoryCard key={cat.id} category={cat} />
                        ))}
                    </div>
                )}
            </section>

            {/* Expense Categories */}
            <section className="section">
                <div className="section-header">
                    <h2 className="section-title">💸 Dépenses</h2>
                    {canManage && (
                        <button
                            className="btn btn-sm btn-secondary"
                            onClick={() => openAddModal('expense')}
                        >
                            <Plus size={16} />
                            Ajouter
                        </button>
                    )}
                </div>
                {expenseCategories.length === 0 ? (
                    <div className="empty-state-sm">
                        <p>Aucune catégorie de dépense</p>
                    </div>
                ) : (
                    <div className="categories-grid">
                        {expenseCategories.map(cat => (
                            <CategoryCard key={cat.id} category={cat} />
                        ))}
                    </div>
                )}
            </section>

            {/* Add/Edit Modal */}
            <MobileModal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                title={editingCategory ? 'Modifier la catégorie' : 'Nouvelle catégorie'}
                size="md"
            >
                <div className="form-group">
                    <label className="input-label">Nom</label>
                    <input
                        type="text"
                        className="input"
                        placeholder="Nom de la catégorie"
                        value={categoryForm.name}
                        onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                        autoFocus
                    />
                </div>

                <div className="form-group">
                    <label className="input-label">Icône</label>
                    <div className="icon-selector">
                        {CATEGORY_ICONS.map(icon => (
                            <button
                                key={icon}
                                type="button"
                                className={`icon-option ${categoryForm.icon === icon ? 'selected' : ''}`}
                                onClick={() => setCategoryForm({ ...categoryForm, icon })}
                            >
                                {icon}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="form-group">
                    <label className="input-label">Couleur</label>
                    <div className="color-selector">
                        {CATEGORY_COLORS.map(color => (
                            <button
                                key={color}
                                type="button"
                                className={`color-option ${categoryForm.color === color ? 'selected' : ''}`}
                                style={{ backgroundColor: color }}
                                onClick={() => setCategoryForm({ ...categoryForm, color })}
                            />
                        ))}
                    </div>
                </div>

                <div className="form-actions">
                    {editingCategory && (
                        <button
                            className="btn btn-danger-ghost"
                            onClick={handleDelete}
                        >
                            <Trash2 size={16} />
                            Supprimer
                        </button>
                    )}
                    <button className="btn btn-secondary" onClick={() => setShowModal(false)}>
                        Annuler
                    </button>
                    <button className="btn btn-primary" onClick={handleSave}>
                        {editingCategory ? 'Enregistrer' : 'Créer'}
                    </button>
                </div>
            </MobileModal>
        </div>
    );
};

export default CategoriesPage;
