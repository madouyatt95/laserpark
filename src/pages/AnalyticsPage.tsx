import React, { useState, useMemo } from 'react';
import {
    TrendingUp,
    BarChart3,
    Calendar,
    ArrowUpRight,
    ArrowDownRight
} from 'lucide-react';
import { useParkStore } from '../stores/parkStore';
import { useActivityStore } from '../stores/activityStore';
import { formatCurrency } from '../utils/helpers';
import { format, subDays, eachDayOfInterval, startOfWeek, addDays, getHours } from 'date-fns';
import { fr } from 'date-fns/locale';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import '../styles/analytics.css';

const AnalyticsPage: React.FC = () => {
    const { selectedParkId, getSelectedPark } = useParkStore();
    const { activities } = useActivityStore();

    const parkId = selectedParkId || '';
    const park = getSelectedPark();

    const [period, setPeriod] = useState<7 | 30>(7);

    const parkActivities = activities.filter(a => a.park_id === parkId);

    // Trend data for line chart
    const trendData = useMemo(() => {
        const endDate = new Date();
        const startDate = subDays(endDate, period - 1);
        const days = eachDayOfInterval({ start: startDate, end: endDate });

        return days.map(day => {
            const dayStr = format(day, 'yyyy-MM-dd');
            const dayActivities = parkActivities.filter(a =>
                a.activity_date.startsWith(dayStr)
            );
            const revenue = dayActivities.reduce((sum, a) => sum + a.amount, 0);

            return {
                date: format(day, 'd MMM', { locale: fr }),
                revenue,
                transactions: dayActivities.length,
            };
        });
    }, [parkActivities, period]);

    // Peak hours heatmap data
    const peakHoursData = useMemo(() => {
        const hoursCount: Record<number, number> = {};

        parkActivities.forEach(activity => {
            const hour = getHours(new Date(activity.activity_date));
            hoursCount[hour] = (hoursCount[hour] || 0) + 1;
        });

        const maxCount = Math.max(...Object.values(hoursCount), 1);

        return Array.from({ length: 14 }, (_, i) => {
            const hour = i + 9; // 9h to 22h
            const count = hoursCount[hour] || 0;
            const intensity = count / maxCount;
            return { hour, count, intensity };
        });
    }, [parkActivities]);

    // Period comparison
    const comparison = useMemo(() => {
        const today = new Date();
        const currentStart = subDays(today, period - 1);
        const previousStart = subDays(currentStart, period);
        const previousEnd = subDays(currentStart, 1);

        const currentPeriod = parkActivities.filter(a => {
            const date = new Date(a.activity_date);
            return date >= currentStart && date <= today;
        });

        const previousPeriod = parkActivities.filter(a => {
            const date = new Date(a.activity_date);
            return date >= previousStart && date <= previousEnd;
        });

        const currentRevenue = currentPeriod.reduce((sum, a) => sum + a.amount, 0);
        const previousRevenue = previousPeriod.reduce((sum, a) => sum + a.amount, 0);

        const change = previousRevenue > 0
            ? ((currentRevenue - previousRevenue) / previousRevenue) * 100
            : 0;

        return {
            currentRevenue,
            previousRevenue,
            currentTransactions: currentPeriod.length,
            previousTransactions: previousPeriod.length,
            revenueChange: change,
            transactionsChange: previousPeriod.length > 0
                ? ((currentPeriod.length - previousPeriod.length) / previousPeriod.length) * 100
                : 0,
        };
    }, [parkActivities, period]);

    const getHeatmapColor = (intensity: number) => {
        if (intensity === 0) return 'var(--color-bg-tertiary)';
        if (intensity < 0.25) return 'rgba(139, 92, 246, 0.2)';
        if (intensity < 0.5) return 'rgba(139, 92, 246, 0.4)';
        if (intensity < 0.75) return 'rgba(139, 92, 246, 0.6)';
        return 'rgba(139, 92, 246, 0.9)';
    };

    return (
        <div className="page">
            <div className="page-header">
                <h1 className="page-title">Analytiques</h1>
                <p className="page-subtitle">{park?.name}</p>
            </div>

            {/* Period Selector */}
            <div className="period-selector">
                <button
                    className={`period-btn ${period === 7 ? 'active' : ''}`}
                    onClick={() => setPeriod(7)}
                >
                    7 jours
                </button>
                <button
                    className={`period-btn ${period === 30 ? 'active' : ''}`}
                    onClick={() => setPeriod(30)}
                >
                    30 jours
                </button>
            </div>

            {/* Comparison Cards */}
            <div className="comparison-cards">
                <div className="comparison-card">
                    <div className="comparison-header">
                        <span className="comparison-label">Revenus</span>
                        <div className={`comparison-change ${comparison.revenueChange >= 0 ? 'positive' : 'negative'}`}>
                            {comparison.revenueChange >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                            {Math.abs(comparison.revenueChange).toFixed(1)}%
                        </div>
                    </div>
                    <div className="comparison-value">{formatCurrency(comparison.currentRevenue)}</div>
                    <div className="comparison-previous">
                        vs {formatCurrency(comparison.previousRevenue)} période précédente
                    </div>
                </div>
                <div className="comparison-card">
                    <div className="comparison-header">
                        <span className="comparison-label">Transactions</span>
                        <div className={`comparison-change ${comparison.transactionsChange >= 0 ? 'positive' : 'negative'}`}>
                            {comparison.transactionsChange >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                            {Math.abs(comparison.transactionsChange).toFixed(1)}%
                        </div>
                    </div>
                    <div className="comparison-value">{comparison.currentTransactions}</div>
                    <div className="comparison-previous">
                        vs {comparison.previousTransactions} période précédente
                    </div>
                </div>
            </div>

            {/* Trend Chart */}
            <section className="section">
                <div className="section-header">
                    <h2 className="section-title">
                        <TrendingUp size={18} />
                        Tendance des revenus
                    </h2>
                </div>
                <div className="chart-container">
                    <ResponsiveContainer width="100%" height={200}>
                        <LineChart data={trendData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                            <XAxis
                                dataKey="date"
                                stroke="var(--color-text-tertiary)"
                                tick={{ fontSize: 10 }}
                            />
                            <YAxis
                                stroke="var(--color-text-tertiary)"
                                tick={{ fontSize: 10 }}
                                tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                            />
                            <Tooltip
                                contentStyle={{
                                    background: 'var(--color-bg-card)',
                                    border: '1px solid var(--color-border)',
                                    borderRadius: '8px',
                                }}
                                formatter={(value: number) => [formatCurrency(value), 'Revenus']}
                            />
                            <Line
                                type="monotone"
                                dataKey="revenue"
                                stroke="var(--color-primary)"
                                strokeWidth={2}
                                dot={{ fill: 'var(--color-primary)', r: 3 }}
                                activeDot={{ r: 5 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </section>

            {/* Peak Hours Heatmap */}
            <section className="section">
                <div className="section-header">
                    <h2 className="section-title">
                        <BarChart3 size={18} />
                        Heures de pointe
                    </h2>
                </div>
                <div className="heatmap-container">
                    <div className="heatmap-grid">
                        {peakHoursData.map(({ hour, count, intensity }) => (
                            <div
                                key={hour}
                                className="heatmap-cell"
                                style={{ background: getHeatmapColor(intensity) }}
                                title={`${hour}h: ${count} transactions`}
                            >
                                <span className="heatmap-hour">{hour}h</span>
                                <span className="heatmap-count">{count}</span>
                            </div>
                        ))}
                    </div>
                    <div className="heatmap-legend">
                        <span>Moins actif</span>
                        <div className="heatmap-legend-bar" />
                        <span>Plus actif</span>
                    </div>
                </div>
            </section>

            {/* Transactions Chart */}
            <section className="section">
                <div className="section-header">
                    <h2 className="section-title">
                        <Calendar size={18} />
                        Transactions par jour
                    </h2>
                </div>
                <div className="chart-container">
                    <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={trendData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                            <XAxis
                                dataKey="date"
                                stroke="var(--color-text-tertiary)"
                                tick={{ fontSize: 10 }}
                            />
                            <YAxis
                                stroke="var(--color-text-tertiary)"
                                tick={{ fontSize: 10 }}
                            />
                            <Tooltip
                                contentStyle={{
                                    background: 'var(--color-bg-card)',
                                    border: '1px solid var(--color-border)',
                                    borderRadius: '8px',
                                }}
                                formatter={(value: number) => [value, 'Transactions']}
                            />
                            <Bar
                                dataKey="transactions"
                                fill="var(--color-info)"
                                radius={[4, 4, 0, 0]}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </section>
        </div>
    );
};

export default AnalyticsPage;
