import React, { useState, useEffect } from 'react';
import { FiTrendingUp, FiHeart, FiActivity, FiUsers } from 'react-icons/fi';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    ChartOptions,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler,
} from 'chart.js';
import { db } from '../lib/supabase';

// Register ChartJS components
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

const Analytics = () => {
    const [dailyStats, setDailyStats] = useState<any[]>([]);
    const [healthStats, setHealthStats] = useState<any>(null);
    const [userStats, setUserStats] = useState<any>(null);
    const [workoutStats, setWorkoutStats] = useState<any>(null);
    const [nutritionStats, setNutritionStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [timeRange, setTimeRange] = useState(30);

    useEffect(() => {
        fetchAllData();
    }, [timeRange]);

    const fetchAllData = async () => {
        try {
            setLoading(true);
            const [daily, health, users, workouts, nutrition] = await Promise.all([
                db.getDailyStats(timeRange),
                db.getHealthStats(),
                db.getUserStats(),
                db.getWorkoutStats(),
                db.getNutritionStats(),
            ]);
            setDailyStats(daily.data || []);
            setHealthStats(health.data || null);
            setUserStats(users.data || null);
            setWorkoutStats(workouts.data || null);
            setNutritionStats(nutrition.data || null);
        } catch (error: any) {
            console.error('Error fetching analytics:', error);
        } finally {
            setLoading(false);
        }
    };

    const summaryCards = [
        {
            title: 'Total Users',
            value: userStats?.total?.toLocaleString() || '0',
            change: `+${userStats?.newThisWeek || 0} this week`,
            icon: FiUsers,
            color: 'primary',
        },
        {
            title: 'Total Workouts',
            value: workoutStats?.total?.toLocaleString() || '0',
            change: `${workoutStats?.avgDuration || 0}min avg`,
            icon: FiActivity,
            color: 'success',
        },
        {
            title: 'Nutrition Logs',
            value: nutritionStats?.total?.toLocaleString() || '0',
            change: `${nutritionStats?.avgCalories || 0} avg cal`,
            icon: FiTrendingUp,
            color: 'warning',
        },
        {
            title: 'Avg Heart Rate',
            value: healthStats?.avgHeartRate || '—',
            change: `${healthStats?.avgSteps || 0} avg steps`,
            icon: FiHeart,
            color: 'secondary',
        },
    ];

    // Activity Trend Chart
    const activityChartData = {
        labels: dailyStats.map(stat => {
            const date = new Date(stat.date);
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        }),
        datasets: [
            {
                label: 'Workouts',
                data: dailyStats.map(stat => stat.workouts),
                borderColor: 'rgb(59, 130, 246)',
                backgroundColor: 'rgba(59, 130, 246, 0.08)',
                tension: 0.4,
                fill: true,
                pointRadius: 3,
                pointHoverRadius: 6,
            },
            {
                label: 'New Users',
                data: dailyStats.map(stat => stat.newUsers),
                borderColor: 'rgb(16, 185, 129)',
                backgroundColor: 'rgba(16, 185, 129, 0.08)',
                tension: 0.4,
                fill: true,
                pointRadius: 3,
                pointHoverRadius: 6,
            },
        ],
    };

    // Calories Chart
    const caloriesChartData = {
        labels: dailyStats.map(stat => {
            const date = new Date(stat.date);
            return date.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' });
        }),
        datasets: [
            {
                label: 'Calories Burned',
                data: dailyStats.map(stat => stat.caloriesBurned),
                backgroundColor: 'rgba(236, 72, 153, 0.8)',
                borderRadius: 6,
            },
            {
                label: 'Nutrition Calories',
                data: dailyStats.map(stat => stat.nutritionCalories),
                backgroundColor: 'rgba(245, 158, 11, 0.8)',
                borderRadius: 6,
            },
        ],
    };

    // Macro distribution doughnut
    const macroChartData = {
        labels: ['Protein', 'Carbs', 'Fat'],
        datasets: [
            {
                data: [
                    nutritionStats?.totalProtein || 0,
                    nutritionStats?.totalCarbs || 0,
                    nutritionStats?.totalFat || 0,
                ],
                backgroundColor: [
                    'rgba(16, 185, 129, 0.8)',
                    'rgba(59, 130, 246, 0.8)',
                    'rgba(245, 158, 11, 0.8)',
                ],
                borderWidth: 0,
                hoverOffset: 8,
            },
        ],
    };

    const lineOptions: ChartOptions<'line'> = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { position: 'top' as const },
            tooltip: {
                mode: 'index' as const,
                intersect: false,
                backgroundColor: 'rgba(0,0,0,0.8)',
                padding: 12,
                cornerRadius: 8,
            },
        },
        scales: {
            y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' } },
            x: { grid: { display: false } },
        },
        interaction: { mode: 'nearest', axis: 'x', intersect: false },
    };

    const barOptions: ChartOptions<'bar'> = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { position: 'top' as const },
            tooltip: {
                backgroundColor: 'rgba(0,0,0,0.8)',
                padding: 12,
                cornerRadius: 8,
            },
        },
        scales: {
            y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' } },
            x: { grid: { display: false } },
        },
    };

    const doughnutOptions: ChartOptions<'doughnut'> = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { position: 'bottom' as const, labels: { padding: 20 } },
        },
        cutout: '65%',
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="loading-spinner w-12 h-12"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
                    <p className="text-gray-600">Detailed insights and performance metrics</p>
                </div>
                <div className="mt-4 sm:mt-0 flex gap-2">
                    {[7, 14, 30].map((days) => (
                        <button
                            key={days}
                            onClick={() => setTimeRange(days)}
                            className={`btn ${timeRange === days ? 'btn-primary' : 'btn-outline'} text-sm px-4 py-2`}
                        >
                            {days}D
                        </button>
                    ))}
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {summaryCards.map((card, index) => {
                    const Icon = card.icon;
                    const colorClasses = {
                        primary: 'bg-primary-50 text-primary-600',
                        success: 'bg-success-50 text-success-600',
                        warning: 'bg-warning-50 text-warning-600',
                        secondary: 'bg-secondary-50 text-secondary-600',
                    };
                    return (
                        <div key={index} className="stat-card">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="stat-label">{card.title}</p>
                                    <p className="stat-value mt-2">{card.value}</p>
                                    <p className="stat-change stat-change-positive mt-1">{card.change}</p>
                                </div>
                                <div className={`p-3 rounded-lg ${colorClasses[card.color]}`}>
                                    <Icon className="w-6 h-6" />
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Activity Trend + Macro Distribution */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="card lg:col-span-2">
                    <div className="card-header">
                        <h3 className="card-title">Activity Trend</h3>
                        <p className="card-subtitle">Workouts and new user registrations over {timeRange} days</p>
                    </div>
                    <div className="h-80">
                        <Line data={activityChartData} options={lineOptions} />
                    </div>
                </div>

                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">Macro Distribution</h3>
                        <p className="card-subtitle">All-time macronutrient split</p>
                    </div>
                    <div className="h-80 flex items-center justify-center">
                        <Doughnut data={macroChartData} options={doughnutOptions} />
                    </div>
                </div>
            </div>

            {/* Calories Comparison */}
            <div className="card">
                <div className="card-header">
                    <h3 className="card-title">Calories: Burned vs Consumed</h3>
                    <p className="card-subtitle">Daily comparison of calories burned in workouts vs consumed via nutrition</p>
                </div>
                <div className="h-80">
                    <Bar data={caloriesChartData} options={barOptions} />
                </div>
            </div>

            {/* Health Summary */}
            {healthStats && (
                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">Health Data Summary</h3>
                        <p className="card-subtitle">Aggregated health metrics from all users</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        {[
                            { label: 'Total Records', value: healthStats.totalRecords?.toLocaleString(), icon: '📊' },
                            { label: 'Avg Steps/Day', value: healthStats.avgSteps?.toLocaleString(), icon: '🚶' },
                            { label: 'Avg Heart Rate', value: `${healthStats.avgHeartRate} bpm`, icon: '❤️' },
                            { label: 'Avg Sleep', value: `${healthStats.avgSleep}h`, icon: '😴' },
                        ].map((item, i) => (
                            <div key={i} className="text-center p-6 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                                <span className="text-3xl">{item.icon}</span>
                                <p className="text-2xl font-bold text-gray-900 mt-3">{item.value}</p>
                                <p className="text-sm text-gray-500 mt-1">{item.label}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Analytics;
