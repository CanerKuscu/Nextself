import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FiSearch, FiFilter, FiCalendar } from 'react-icons/fi';
import { MdFastfood, MdLocalFireDepartment } from 'react-icons/md';
import { db } from '../lib/supabase';

const Nutrition = () => {
    const { t } = useTranslation();
    const [logs, setLogs] = useState<any[]>([]);
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<any>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [dateFilter, setDateFilter] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const pageSize = 10;

    useEffect(() => {
        fetchLogs();
        fetchStats();
    }, [currentPage, dateFilter]);

    const fetchLogs = async () => {
        try {
            setLoading(true);
            setError(null);
            const filters: any = {};
            if (dateFilter) {
                filters.date = dateFilter;
            }
            const { data, error, total } = await db.getNutritionLogs(currentPage, pageSize, filters);
            if (error) {
                throw error;
            }
            setLogs(data || []);
            setTotalPages(Math.ceil((total || 0) / pageSize));
        } catch (error: any) {
            console.error('Error fetching nutrition logs:', error);
            setError('Failed to load nutrition logs. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            setError(null);
            const { data, error } = await db.getNutritionStats();
            if (error) {
                throw error;
            }
            setStats(data);
        } catch (error: any) {
            console.error('Error fetching nutrition stats:', error);
            setError('Failed to load nutrition statistics. Please try again.');
        }
    };

    const filteredLogs = logs.filter(log => {
        const username = log.user?.username || '';
        return username.toLowerCase().includes(searchTerm.toLowerCase());
    });

    const macroCards = [
        {
            title: t('nutrition.totalLogs'),
            value: stats?.total?.toLocaleString() || '0',
            icon: MdFastfood,
            color: 'primary',
            sub: `+${stats?.logsToday || 0} ${t('dashboard.today')}`,
        },
        {
            title: t('nutrition.avgCalories'),
            value: `${stats?.avgCalories?.toLocaleString() || 0}`,
            icon: MdLocalFireDepartment,
            color: 'warning',
            sub: t('nutrition.kcalDay'),
        },
        {
            title: t('nutrition.totalProtein'),
            value: `${stats?.totalProtein?.toLocaleString() || 0}g`,
            icon: MdFastfood,
            color: 'success',
            sub: t('nutrition.allTime'),
        },
        {
            title: t('nutrition.totalCarbs'),
            value: `${stats?.totalCarbs?.toLocaleString() || 0}g`,
            icon: MdFastfood,
            color: 'secondary',
            sub: t('nutrition.allTime'),
        },
    ];
    const colorClasses: Record<'primary' | 'success' | 'warning' | 'secondary', string> = {
        primary: 'bg-primary-50 text-primary-600',
        success: 'bg-success-50 text-success-600',
        warning: 'bg-warning-50 text-warning-600',
        secondary: 'bg-secondary-50 text-secondary-600',
    };

    if (loading && !logs.length) {
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
                    <h1 className="text-2xl font-bold text-gray-900">Nutrition</h1>
                    <p className="text-gray-600">Manage nutrition logs and dietary data</p>
                </div>
            </div>

            {/* Error message */}
            {error && (
                <div className="alert alert-error mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center">
                        <svg className="w-5 h-5 text-red-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        <span className="text-red-700">{error}</span>
                    </div>
                    <button
                        onClick={() => { fetchLogs(); fetchStats(); }}
                        className="mt-2 text-sm text-red-600 hover:text-red-800 font-medium underline"
                    >
                        Retry
                    </button>
                </div>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {macroCards.map((card, index) => {
                    const Icon = card.icon;
                    return (
                        <div key={index} className="stat-card">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="stat-label">{card.title}</p>
                                    <p className="stat-value mt-2">{card.value}</p>
                                    <p className="stat-change stat-change-positive mt-1">{card.sub}</p>
                                </div>
                                <div className={`p-3 rounded-lg ${colorClasses[card.color as keyof typeof colorClasses]}`}>
                                    <Icon className="w-6 h-6" />
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Macro breakdown */}
            {stats && (
                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">Macro Breakdown (All Time)</h3>
                        <p className="card-subtitle">Overview of total macronutrient intake across all users</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        {[
                            { label: 'Calories', value: stats.totalCalories, unit: 'kcal', color: 'bg-warning-500' },
                            { label: 'Protein', value: stats.totalProtein, unit: 'g', color: 'bg-success-500' },
                            { label: 'Carbs', value: stats.totalCarbs, unit: 'g', color: 'bg-primary-500' },
                            { label: 'Fat', value: stats.totalFat, unit: 'g', color: 'bg-secondary-500' },
                        ].map((macro, i) => (
                            <div key={i} className="text-center p-4 rounded-lg bg-gray-50">
                                <div className={`w-3 h-3 rounded-full ${macro.color} mx-auto mb-2`}></div>
                                <p className="text-2xl font-bold text-gray-900">
                                    {(macro.value || 0).toLocaleString()}
                                </p>
                                <p className="text-sm text-gray-500">{macro.label} ({macro.unit})</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Search and filters */}
            <div className="card">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="relative flex-1">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <FiSearch className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search by user name..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="input pl-10"
                        />
                    </div>
                    <div className="flex gap-3">
                        <input
                            type="date"
                            value={dateFilter}
                            onChange={(e) => setDateFilter(e.target.value)}
                            className="input w-auto"
                        />
                        <button
                            onClick={() => { setDateFilter(''); fetchLogs(); }}
                            className="btn btn-outline"
                        >
                            <FiFilter className="w-5 h-5 mr-2" />
                            Reset
                        </button>
                    </div>
                </div>
            </div>

            {/* Nutrition logs table */}
            <div className="card">
                <div className="overflow-hidden">
                    <div className="table-container">
                        <table className="table">
                            <thead className="table-header">
                                <tr>
                                    <th className="table-header-cell">User</th>
                                    <th className="table-header-cell">Date</th>
                                    <th className="table-header-cell">Calories</th>
                                    <th className="table-header-cell">Protein</th>
                                    <th className="table-header-cell">Carbs</th>
                                    <th className="table-header-cell">Fat</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {filteredLogs.length > 0 ? (
                                    filteredLogs.map((log) => (
                                        <tr key={log.id} className="table-row">
                                            <td className="table-cell">
                                                <div className="flex items-center">
                                                    <div className="w-10 h-10 rounded-full bg-warning-100 flex items-center justify-center">
                                                        <span className="text-warning-700 font-semibold">
                                                            {log.user?.username?.charAt(0).toUpperCase() || 'U'}
                                                        </span>
                                                    </div>
                                                    <div className="ml-4">
                                                        <div className="font-medium text-gray-900">
                                                            {log.user?.username || 'Unknown User'}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="table-cell">
                                                <div className="flex items-center">
                                                    <FiCalendar className="w-4 h-4 text-gray-400 mr-2" />
                                                    {log.date || 'N/A'}
                                                </div>
                                            </td>
                                            <td className="table-cell">
                                                <span className="font-semibold text-warning-600">
                                                    {log.total_calories || 0} kcal
                                                </span>
                                            </td>
                                            <td className="table-cell">
                                                <span className="text-success-600">{log.total_protein || 0}g</span>
                                            </td>
                                            <td className="table-cell">
                                                <span className="text-primary-600">{log.total_carbs || 0}g</span>
                                            </td>
                                            <td className="table-cell">
                                                <span className="text-secondary-600">{log.total_fat || 0}g</span>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center">
                                            <div className="text-gray-500">
                                                <MdFastfood className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                                                <p className="text-lg font-medium">No nutrition logs found</p>
                                                <p className="mt-1">Try adjusting your search or filters</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
                        <div className="text-sm text-gray-700">
                            Page <span className="font-medium">{currentPage}</span> of{' '}
                            <span className="font-medium">{totalPages}</span>
                        </div>
                        <div className="flex space-x-2">
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                disabled={currentPage === 1}
                                className="btn btn-outline px-4 py-2"
                            >
                                Previous
                            </button>
                            <button
                                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                disabled={currentPage === totalPages}
                                className="btn btn-outline px-4 py-2"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Nutrition;
