import React from 'react';
import {
    TrendingUp,
    TrendingDown,
    Wallet,
    ShoppingCart,
    AlertTriangle,
    Users,
    Calendar
} from 'lucide-react';
import { useParkStore } from '../stores/parkStore';
import { useActivityStore } from '../stores/activityStore';
import { useExpenseStore } from '../stores/expenseStore';
import { useStockStore } from '../stores/stockStore';
import { useAuthStore } from '../stores/authStore';
import { formatCurrency } from '../utils/helpers';
import '../styles/dashboard.css';

const DashboardPage: React.FC = () => {
    const { user } = useAuthStore();
    const { selectedParkId, getSelectedPark, getActiveParks } = useParkStore();
    const { getTodayRevenue, getTodayActivities, getRevenueByCategory } = useActivityStore();
    const { getTodayExpensesTotal, getTodayExpenses } = useExpenseStore();
    const { getLowStockItems } = useStockStore();

    const selectedPark = getSelectedPark();
    const parkId = selectedParkId || '';
    const isSuperAdmin = user?.role === 'super_admin';

    const todayRevenue = getTodayRevenue(parkId);
    const todayExpenses = getTodayExpensesTotal(parkId);
    const netResult = todayRevenue - todayExpenses;
    const todayActivitiesCount = getTodayActivities(parkId).length;
    const lowStockItems = getLowStockItems(parkId);
    const revenueByCategory = getRevenueByCategory(parkId);

    // Multi-park comparison for Super Admin
    const activeParks = getActiveParks();
    const parkComparison = isSuperAdmin ? activeParks.map(park => ({
        ...park,
        revenue: getTodayRevenue(park.id),
        expenses: getTodayExpensesTotal(park.id),
        activities: getTodayActivities(park.id).length,
    })) : [];

    return (
        <div className="page dashboard">
            <div className="page-header">
                <h1 className="page-title">
                    <span className="text-gradient">
                        {isSuperAdmin ? 'Vue Globale' : `Tableau de bord`}
                    </span>
                </h1>
                <p className="page-subtitle">
                    {new Date().toLocaleDateString('fr-FR', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long'
                    })}
                </p>
            </div>

            {/* KPI Cards */}
            <div className="kpi-grid">
                <div className="kpi-card revenue">
                    <div className="kpi-icon">
                        <TrendingUp size={24} />
                    </div>
                    <div className="kpi-content">
                        <span className="kpi-label">Recettes du jour</span>
                        <span className="kpi-value">{formatCurrency(todayRevenue)}</span>
                    </div>
                </div>

                <div className="kpi-card expenses">
                    <div className="kpi-icon">
                        <TrendingDown size={24} />
                    </div>
                    <div className="kpi-content">
                        <span className="kpi-label">Dépenses du jour</span>
                        <span className="kpi-value">{formatCurrency(todayExpenses)}</span>
                    </div>
                </div>

                <div className="kpi-card result">
                    <div className="kpi-icon">
                        <Wallet size={24} />
                    </div>
                    <div className="kpi-content">
                        <span className="kpi-label">Résultat net</span>
                        <span className={`kpi-value ${netResult >= 0 ? 'positive' : 'negative'}`}>
                            {formatCurrency(netResult)}
                        </span>
                    </div>
                </div>

                <div className="kpi-card activities">
                    <div className="kpi-icon">
                        <ShoppingCart size={24} />
                    </div>
                    <div className="kpi-content">
                        <span className="kpi-label">Transactions</span>
                        <span className="kpi-value">{todayActivitiesCount}</span>
                    </div>
                </div>
            </div>

            {/* Low Stock Alerts */}
            {lowStockItems.length > 0 && (
                <section className="section">
                    <div className="section-header">
                        <h2 className="section-title">⚠️ Alertes Stock</h2>
                    </div>
                    <div className="alerts-list">
                        {lowStockItems.map(item => (
                            <div key={item.id} className="alert-item">
                                <AlertTriangle size={18} className="alert-icon" />
                                <span className="alert-text">
                                    <strong>{item.name}</strong> : {item.quantity} {item.unit} restants
                                    {item.quantity === 0 && ' (Rupture!)'}
                                </span>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Revenue by Category */}
            {revenueByCategory.length > 0 && (
                <section className="section">
                    <div className="section-header">
                        <h2 className="section-title">Ventes par catégorie</h2>
                    </div>
                    <div className="category-stats">
                        {revenueByCategory.slice(0, 5).map((cat, index) => (
                            <div key={cat.categoryId} className="category-stat-item">
                                <div className="category-stat-rank">{index + 1}</div>
                                <div className="category-stat-info">
                                    <span className="category-stat-name">{cat.name}</span>
                                    <div className="category-stat-bar">
                                        <div
                                            className="category-stat-fill"
                                            style={{
                                                width: `${(cat.amount / revenueByCategory[0].amount) * 100}%`,
                                                backgroundColor: cat.color || 'var(--color-primary)'
                                            }}
                                        />
                                    </div>
                                </div>
                                <span className="category-stat-value">{formatCurrency(cat.amount)}</span>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Multi-Park Comparison (Super Admin Only) */}
            {isSuperAdmin && parkComparison.length > 1 && (
                <section className="section">
                    <div className="section-header">
                        <h2 className="section-title">Comparaison des parcs</h2>
                    </div>
                    <div className="park-comparison">
                        {parkComparison.map(park => (
                            <div
                                key={park.id}
                                className={`park-card ${park.id === selectedParkId ? 'selected' : ''}`}
                            >
                                <div className="park-card-header">
                                    <span className="park-card-name">{park.name}</span>
                                    <span className="park-card-location">{park.city}</span>
                                </div>
                                <div className="park-card-stats">
                                    <div className="park-stat">
                                        <span className="park-stat-label">Recettes</span>
                                        <span className="park-stat-value positive">
                                            {formatCurrency(park.revenue)}
                                        </span>
                                    </div>
                                    <div className="park-stat">
                                        <span className="park-stat-label">Dépenses</span>
                                        <span className="park-stat-value negative">
                                            {formatCurrency(park.expenses)}
                                        </span>
                                    </div>
                                    <div className="park-stat">
                                        <span className="park-stat-label">Ventes</span>
                                        <span className="park-stat-value">{park.activities}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
};

export default DashboardPage;
