import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { FiUsers, FiActivity, FiTrendingUp, FiCalendar, FiAward, FiTarget, FiClock, FiZap, FiArrowUpRight, FiArrowDownRight, FiAlertCircle } from 'react-icons/fi';
import { MdFastfood, MdFitnessCenter } from 'react-icons/md';
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

const Dashboard = () => {
    const { t } = useTranslation();
    const [stats, setStats] = useState({
        totalUsers: 0,
        newUsersToday: 0,
        totalWorkouts: 0,
        workoutsToday: 0,
        totalNutritionLogs: 0,
        nutritionLogsToday: 0,
        activeUsers: 0,
    });
    const [dailyStats, setDailyStats] = useState<any[]>([]);
    const [recentActivities, setRecentActivities] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<any>(null);
    const [topClients, setTopClients] = useState<any[]>([]);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);

            // Fetch user stats
            const { data: userStats } = await db.getUserStats();

            // Fetch workout stats
            const { data: workoutStats } = await db.getWorkoutStats();

            // Fetch nutrition stats
            const { data: nutritionStats } = await db.getNutritionStats();

            // Fetch daily stats
            const { data: dailyData } = await db.getDailyStats(7);

            // Fetch recent activities
            const { data: activitiesData } = await db.getRecentActivities();

            setStats({
                totalUsers: userStats?.total || 0,
                newUsersToday: userStats?.newToday || 0,
                totalWorkouts: workoutStats?.total || 0,
                workoutsToday: workoutStats?.workoutsToday || 0,
                totalNutritionLogs: nutritionStats?.total || 0,
                nutritionLogsToday: nutritionStats?.logsToday || 0,
                activeUsers: userStats?.activeUsers || 0,
            });

            setDailyStats(dailyData || []);
            setRecentActivities(activitiesData || []);

            // Fetch top clients (real data)
            const { data: topClientsData } = await db.getTopClients(5);
            setTopClients(topClientsData || []);
        } catch (error: any) {
            console.error('Error fetching dashboard data:', error);
            setError('Failed to load dashboard data. Please check your connection and try again.');
        } finally {
            setLoading(false);
        }
    };

    const statCards = [
        {
            title: t('dashboard.totalClients'),
            value: stats.totalUsers,
            change: `+${stats.newUsersToday}`,
            changeLabel: t('dashboard.today'),
            icon: FiUsers,
            gradient: 'from-blue-500 to-cyan-400',
            bgLight: 'bg-blue-50',
            textColor: 'text-blue-600',
            trend: 'up',
        },
        {
            title: t('dashboard.workouts'),
            value: stats.totalWorkouts,
            change: `+${stats.workoutsToday}`,
            changeLabel: t('dashboard.today'),
            icon: FiActivity,
            gradient: 'from-emerald-500 to-green-400',
            bgLight: 'bg-emerald-50',
            textColor: 'text-emerald-600',
            trend: 'up',
        },
        {
            title: t('dashboard.nutritionLogs'),
            value: stats.totalNutritionLogs,
            change: `+${stats.nutritionLogsToday}`,
            changeLabel: t('dashboard.today'),
            icon: MdFastfood,
            gradient: 'from-amber-500 to-yellow-400',
            bgLight: 'bg-amber-50',
            textColor: 'text-amber-600',
            trend: 'up',
        },
        {
            title: t('dashboard.activeUsers'),
            value: stats.activeUsers,
            change: '+12%',
            changeLabel: t('dashboard.vsLastWeek'),
            icon: FiTrendingUp,
            gradient: 'from-violet-500 to-purple-400',
            bgLight: 'bg-violet-50',
            textColor: 'text-violet-600',
            trend: 'up',
        },
    ];

    const quickActions = [
        { icon: FiCalendar, label: t('dashboard.scheduleSession'), color: 'bg-blue-500', href: '/calendar' },
        { icon: FiTarget, label: t('dashboard.createProgram'), color: 'bg-emerald-500', href: '/assignments' },
        { icon: FiAward, label: t('dashboard.viewCourses'), color: 'bg-violet-500', href: '/courses' },
        { icon: FiUsers, label: t('dashboard.clientList'), color: 'bg-amber-500', href: '/users' },
    ];

    const doughnutData = {
        labels: ['Completed', 'In Progress', 'Missed'],
        datasets: [{
            data: [68, 22, 10],
            backgroundColor: ['#22c55e', '#3b82f6', '#ef4444'],
            borderWidth: 0,
            cutout: '75%',
        }],
    };

    const doughnutOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
    };

    // topClients is now fetched from Supabase (real data)

    // Memoize chart labels and datasets to avoid re-mapping on every render
    const chartLabels = React.useMemo(() => {
        if (dailyStats.length === 0) { return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']; }
        return dailyStats.map(stat => new Date(stat.date).toLocaleDateString('en-US', { weekday: 'short' }));
    }, [dailyStats]);

    const lineChartData = React.useMemo(() => ({
        labels: chartLabels,
        datasets: [
            {
                label: 'Workouts',
                data: dailyStats.length > 0 ? dailyStats.map(stat => stat.workouts) : [12, 19, 15, 22, 18, 25, 20],
                borderColor: '#3b82f6',
                backgroundColor: 'rgba(59, 130, 246, 0.08)',
                tension: 0.4,
                fill: true,
                pointBackgroundColor: '#3b82f6',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 5,
                pointHoverRadius: 7,
            },
            {
                label: 'New Clients',
                data: dailyStats.length > 0 ? dailyStats.map(stat => stat.newUsers) : [5, 8, 4, 12, 7, 10, 9],
                borderColor: '#8b5cf6',
                backgroundColor: 'rgba(139, 92, 246, 0.08)',
                tension: 0.4,
                fill: true,
                pointBackgroundColor: '#8b5cf6',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 5,
                pointHoverRadius: 7,
            },
        ],
    }), [chartLabels, dailyStats]);

    const barChartData = React.useMemo(() => ({
        labels: chartLabels,
        datasets: [
            {
                label: 'Calories Burned',
                data: dailyStats.length > 0 ? dailyStats.map(stat => stat.caloriesBurned || 0) : [0, 0, 0, 0, 0, 0, 0],
                backgroundColor: 'rgba(236, 72, 153, 0.85)',
                borderRadius: 8,
                borderSkipped: false,
            },
            {
                label: 'Nutrition Calories',
                data: dailyStats.length > 0 ? dailyStats.map(stat => stat.nutritionCalories || 0) : [0, 0, 0, 0, 0, 0, 0],
                backgroundColor: 'rgba(245, 158, 11, 0.85)',
                borderRadius: 8,
                borderSkipped: false,
            },
        ],
    }), [chartLabels, dailyStats]);

    const chartBaseOptions = {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index' as const, intersect: false },
        plugins: {
            legend: {
                position: 'top' as const,
                labels: {
                    usePointStyle: true,
                    pointStyle: 'circle',
                    padding: 20,
                    font: { size: 12, weight: 500 },
                },
            },
            tooltip: {
                backgroundColor: 'rgba(15, 23, 42, 0.9)',
                titleFont: { size: 13, weight: 600 },
                bodyFont: { size: 12 },
                padding: 12,
                borderColor: 'rgba(255,255,255,0.1)',
                borderWidth: 1,
                cornerRadius: 8,
            },
        },
        scales: {
            y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.04)' }, ticks: { font: { size: 11 }, color: '#9ca3af' } },
            x: { grid: { display: false }, ticks: { font: { size: 11 }, color: '#9ca3af' } },
        },
    };
    const lineChartOptions: ChartOptions<'line'> = chartBaseOptions;
    const barChartOptions: ChartOptions<'bar'> = chartBaseOptions;

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-center space-y-4">
                    <div className="relative mx-auto w-16 h-16">
                        <div className="w-16 h-16 rounded-full border-4 border-blue-100 border-t-blue-500 animate-spin"></div>
                    </div>
                    <p className="text-gray-500 font-medium">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-center space-y-4 max-w-md">
                    <div className="mx-auto w-16 h-16 rounded-full bg-red-50 flex items-center justify-center">
                        <FiAlertCircle className="w-8 h-8 text-red-500" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">Failed to Load Dashboard</h3>
                    <p className="text-gray-500">{error}</p>
                    <button onClick={fetchDashboardData} className="btn btn-primary">
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Welcome Banner */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 p-8 text-white">
                <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(255,255,255,0.15) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255,255,255,0.1) 0%, transparent 50%)' }}></div>
                <div className="relative z-10 flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold mb-2">{t('dashboard.welcome')} 👋</h1>
                        <p className="text-blue-100 text-lg">{t('dashboard.overview')}</p>
                        <div className="flex items-center gap-4 mt-4 flex-wrap">
                            <div className="flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-lg px-4 py-2">
                                <FiClock className="w-4 h-4" />
                                <span className="text-sm font-medium">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                            </div>
                            <div className="flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-lg px-4 py-2">
                                <FiZap className="w-4 h-4 text-yellow-300" />
                                <span className="text-sm font-medium">{stats.activeUsers} active clients</span>
                            </div>
                        </div>
                    </div>
                    <div className="hidden lg:block">
                        <div className="w-32 h-32 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center animate-float">
                            <MdFitnessCenter className="w-16 h-16 text-white/80" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {statCards.map((card, index) => {
                    const Icon = card.icon;
                    return (
                        <div key={index} className="group relative overflow-hidden bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-500 cursor-pointer">
                            <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${card.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>
                            <div className="flex items-start justify-between mb-4">
                                <div className={`p-3 rounded-xl ${card.bgLight} transition-transform duration-300 group-hover:scale-110`}>
                                    <Icon className={`w-6 h-6 ${card.textColor}`} />
                                </div>
                                <div className={`flex items-center gap-1 text-sm font-semibold ${card.trend === 'up' ? 'text-emerald-500' : 'text-red-500'}`}>
                                    {card.trend === 'up' ? <FiArrowUpRight className="w-4 h-4" /> : <FiArrowDownRight className="w-4 h-4" />}
                                    {card.change}
                                </div>
                            </div>
                            <div>
                                <p className="text-3xl font-bold text-gray-900 mb-1">{card.value.toLocaleString()}</p>
                                <p className="text-sm text-gray-500 font-medium">{card.title}</p>
                                <p className="text-xs text-gray-400 mt-1">{card.changeLabel}</p>
                            </div>
                            <div className={`absolute -bottom-8 -right-8 w-24 h-24 rounded-full bg-gradient-to-r ${card.gradient} opacity-0 group-hover:opacity-10 blur-2xl transition-opacity duration-500`}></div>
                        </div>
                    );
                })}
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {quickActions.map((action, index) => {
                    const Icon = action.icon;
                    return (
                        <Link key={index} to={action.href} className="group flex items-center gap-4 bg-white rounded-xl border border-gray-100 p-4 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
                            <div className={`${action.color} p-3 rounded-xl text-white transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`}>
                                <Icon className="w-5 h-5" />
                            </div>
                            <span className="text-sm font-semibold text-gray-700 group-hover:text-gray-900">{action.label}</span>
                        </Link>
                    );
                })}
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-lg transition-shadow duration-300">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-lg font-bold text-gray-900">Activity Overview</h3>
                            <p className="text-sm text-gray-500 mt-1">Last 7 days performance</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <button className="px-3 py-1.5 text-xs font-medium rounded-lg bg-blue-50 text-blue-600">Week</button>
                            <button className="px-3 py-1.5 text-xs font-medium rounded-lg text-gray-500 hover:bg-gray-50">Month</button>
                        </div>
                    </div>
                    <div className="h-80">
                        <Line data={lineChartData} options={lineChartOptions} />
                    </div>
                </div>
                <div className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-lg transition-shadow duration-300">
                    <h3 className="text-lg font-bold text-gray-900 mb-2">Workout Completion</h3>
                    <p className="text-sm text-gray-500 mb-6">This week&apos;s client progress</p>
                    <div className="relative h-48 flex items-center justify-center">
                        <Doughnut data={doughnutData} options={doughnutOptions} />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="text-center">
                                <p className="text-3xl font-bold text-gray-900">68%</p>
                                <p className="text-xs text-gray-500 mt-1">Completed</p>
                            </div>
                        </div>
                    </div>
                    <div className="mt-6 space-y-3">
                        {[{ color: 'bg-green-500', label: 'Completed', pct: '68%' }, { color: 'bg-blue-500', label: 'In Progress', pct: '22%' }, { color: 'bg-red-500', label: 'Missed', pct: '10%' }].map((item, i) => (
                            <div key={i} className="flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                    <div className={`w-3 h-3 rounded-full ${item.color}`}></div>
                                    <span className="text-sm text-gray-600">{item.label}</span>
                                </div>
                                <span className="text-sm font-semibold text-gray-900">{item.pct}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Bottom Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-lg transition-shadow duration-300">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-lg font-bold text-gray-900">Calories Comparison</h3>
                            <p className="text-sm text-gray-500 mt-1">Burned vs consumed this week</p>
                        </div>
                    </div>
                    <div className="h-72">
                        <Bar data={barChartData} options={barChartOptions} />
                    </div>
                </div>
                <div className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-lg transition-shadow duration-300">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-lg font-bold text-gray-900">Top Clients</h3>
                            <p className="text-sm text-gray-500 mt-1">Most active this week</p>
                        </div>
                        <FiAward className="w-5 h-5 text-amber-500" />
                    </div>
                    <div className="space-y-4">
                        {topClients.map((client, index) => (
                            <div key={index} className="group flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors duration-200 cursor-pointer">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm
                                    ${index === 0 ? 'bg-gradient-to-br from-amber-400 to-orange-500' :
                                        index === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-400' :
                                            index === 2 ? 'bg-gradient-to-br from-amber-600 to-amber-700' :
                                                'bg-gradient-to-br from-blue-400 to-blue-500'}`}>
                                    {index + 1}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-gray-900 truncate">{client.name}</p>
                                    <p className="text-xs text-gray-500">{client.workouts} workouts · 🔥 {client.streak} streak</p>
                                </div>
                                <div className="text-right">
                                    <span className="text-sm font-bold text-blue-600">{client.progress}%</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-lg transition-shadow duration-300">
                <div className="p-6 pb-4 border-b border-gray-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-bold text-gray-900">Recent Activity</h3>
                            <p className="text-sm text-gray-500 mt-1">Latest client actions and workouts</p>
                        </div>
                        <button className="text-sm font-medium text-blue-600 hover:text-blue-700">View all →</button>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-gray-50/80">
                                <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">User</th>
                                <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Activity</th>
                                <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Time</th>
                                <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {recentActivities.length > 0 ? recentActivities.map((item, index) => (
                                <tr key={index} className="hover:bg-blue-50/30 transition-colors duration-150">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-xs font-bold">
                                                {item.user?.charAt(0) || '?'}
                                            </div>
                                            <span className="text-sm font-semibold text-gray-900">{item.user}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600">{item.activity}</td>
                                    <td className="px-6 py-4 text-sm text-gray-500">{item.time}</td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold 
                                            ${item.status === 'success' ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20' : 'bg-amber-50 text-amber-700 ring-1 ring-amber-600/20'}`}>
                                            <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${item.status === 'success' ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                                            {item.status === 'success' ? 'Completed' : 'In Progress'}
                                        </span>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center">
                                        <div className="flex flex-col items-center">
                                            <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mb-4">
                                                <FiActivity className="w-8 h-8 text-gray-300" />
                                            </div>
                                            <p className="text-sm font-medium text-gray-500">No recent activities found</p>
                                            <p className="text-xs text-gray-400 mt-1">Activities will appear here as clients use the app</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
