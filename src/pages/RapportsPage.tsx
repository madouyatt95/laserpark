import React, { useState } from 'react';
import { Download, Calendar, FileBarChart, Lock } from 'lucide-react';
import { useParkStore } from '../stores/parkStore';
import { useActivityStore } from '../stores/activityStore';
import { useExpenseStore } from '../stores/expenseStore';
import { useCategoryStore } from '../stores/categoryStore';
import { useAuthStore } from '../stores/authStore';
import { formatCurrency, formatDate } from '../utils/helpers';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';
import '../styles/rapports.css';

const RapportsPage: React.FC = () => {
    const { user } = useAuthStore();
    const { selectedParkId, getSelectedPark } = useParkStore();
    const { getActivitiesByDate, getRevenueByCategory, getRevenueByPayment } = useActivityStore();
    const { getExpensesByDate, getTodayExpensesTotal } = useExpenseStore();
    const { getCategory } = useCategoryStore();

    const parkId = selectedParkId || '';
    const selectedPark = getSelectedPark();

    // Staff cannot access reports
    const canAccessReports = user?.role === 'super_admin' || user?.role === 'manager';

    const [selectedDate, setSelectedDate] = useState(new Date());
    const [reportType, setReportType] = useState<'daily' | 'monthly'>('daily');

    const activities = getActivitiesByDate(parkId, selectedDate);
    const expenses = getExpensesByDate(parkId, selectedDate);
    const revenueByCategory = getRevenueByCategory(parkId, selectedDate);
    const revenueByPayment = getRevenueByPayment(parkId, selectedDate);

    const totalRevenue = activities.reduce((sum, a) => sum + a.amount, 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const netResult = totalRevenue - totalExpenses;

    const handleExportCSV = () => {
        // Generate CSV content
        let csvContent = 'Type,Catégorie,Montant,Paiement,Date\n';

        activities.forEach(activity => {
            const category = getCategory(activity.category_id);
            csvContent += `Recette,${category?.name || 'N/A'},${activity.amount},${activity.payment_method},${formatDate(activity.activity_date)}\n`;
        });

        expenses.forEach(expense => {
            const category = getCategory(expense.category_id);
            csvContent += `Dépense,${category?.name || 'N/A'},${expense.amount},${expense.payment_method},${formatDate(expense.expense_date)}\n`;
        });

        // Download
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `rapport_${selectedPark?.name}_${format(selectedDate, 'yyyy-MM-dd')}.csv`;
        link.click();
    };

    // Show access denied for Staff
    if (!canAccessReports) {
        return (
            <div className="page">
                <div className="page-header">
                    <h1 className="page-title">Rapports</h1>
                    <p className="page-subtitle">Analyse des performances</p>
                </div>
                <div className="access-denied">
                    <Lock size={64} className="access-denied-icon" />
                    <h2>Accès restreint</h2>
                    <p>Les rapports sont réservés aux managers et administrateurs.</p>
                    <p className="access-denied-hint">Contactez votre responsable pour plus d'informations.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="page">
            <div className="page-header">
                <h1 className="page-title">Rapports</h1>
                <p className="page-subtitle">Analyse des performances</p>
            </div>

            {/* Report Type Tabs */}
            <div className="tabs">
                <button
                    className={`tab ${reportType === 'daily' ? 'active' : ''}`}
                    onClick={() => setReportType('daily')}
                >
                    Journalier
                </button>
                <button
                    className={`tab ${reportType === 'monthly' ? 'active' : ''}`}
                    onClick={() => setReportType('monthly')}
                >
                    Mensuel
                </button>
            </div>

            {/* Date Selection */}
            <div className="report-date-selector">
                <Calendar size={20} />
                <input
                    type="date"
                    className="input"
                    value={format(selectedDate, 'yyyy-MM-dd')}
                    onChange={(e) => setSelectedDate(new Date(e.target.value))}
                />
            </div>

            {/* Summary Cards */}
            <div className="report-summary">
                <div className="report-card">
                    <span className="report-card-label">Recettes</span>
                    <span className="report-card-value positive">{formatCurrency(totalRevenue)}</span>
                </div>
                <div className="report-card">
                    <span className="report-card-label">Dépenses</span>
                    <span className="report-card-value negative">{formatCurrency(totalExpenses)}</span>
                </div>
                <div className="report-card highlight">
                    <span className="report-card-label">Résultat</span>
                    <span className={`report-card-value ${netResult >= 0 ? 'positive' : 'negative'}`}>
                        {formatCurrency(netResult)}
                    </span>
                </div>
            </div>

            {/* Revenue by Payment */}
            <section className="section">
                <div className="section-header">
                    <h2 className="section-title">Par mode de paiement</h2>
                </div>
                <div className="payment-breakdown">
                    <div className="payment-row">
                        <span className="payment-label">💵 Espèces</span>
                        <span className="payment-value">{formatCurrency(revenueByPayment.cash)}</span>
                    </div>
                    <div className="payment-row">
                        <span className="payment-label">💳 Wave</span>
                        <span className="payment-value">{formatCurrency(revenueByPayment.wave)}</span>
                    </div>
                    <div className="payment-row">
                        <span className="payment-label">📱 Orange Money</span>
                        <span className="payment-value">{formatCurrency(revenueByPayment.orange_money)}</span>
                    </div>
                </div>
            </section>

            {/* Revenue by Category */}
            {revenueByCategory.length > 0 && (
                <section className="section">
                    <div className="section-header">
                        <h2 className="section-title">Par catégorie</h2>
                    </div>
                    <div className="category-breakdown">
                        {revenueByCategory.map(cat => (
                            <div key={cat.categoryId} className="category-row">
                                <span className="category-label">{cat.name}</span>
                                <span className="category-value">{formatCurrency(cat.amount)}</span>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Export Button */}
            <button className="btn btn-secondary export-btn" onClick={handleExportCSV}>
                <Download size={20} />
                Exporter en CSV
            </button>
        </div>
    );
};

export default RapportsPage;
