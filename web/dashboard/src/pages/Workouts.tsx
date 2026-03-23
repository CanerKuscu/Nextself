import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FiActivity, FiSearch, FiFilter, FiClock, FiZap, FiTrendingUp, FiCalendar } from 'react-icons/fi';
import { db } from '../lib/supabase';

const Workouts = () => {
    const { t } = useTranslation();
    const [workouts, setWorkouts] = useState<any[]>([]);
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [dateFilter, setDateFilter] = useState('');
    const pageSize = 10;

    useEffect(() => {
        fetchWorkouts();
        fetchStats();
    }, [currentPage, dateFilter]);

    const fetchWorkouts = async () => {
        try {
            setLoading(true);
            const filters: any = {};
            if (dateFilter) {
                filters.startDate = dateFilter;
            }
            const { data, error, total } = await db.getWorkouts(currentPage, pageSize, filters);
            if (error) { throw error; }
            setWorkouts(data || []);
            setTotalPages(Math.ceil((total || 0) / pageSize));
        } catch (error: any) {
            console.error('Error fetching workouts:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const { data, error } = await db.getWorkoutStats();
            if (error) { throw error; }
            setStats(data);
        } catch (error: any) {
            console.error('Error fetching workout stats:', error);
        }
    };

    const filteredWorkouts = workouts.filter((workout: any) => {
        const username = workout.user?.username || '';
        return username.toLowerCase().includes(searchTerm.toLowerCase());
    });

    const formatDuration = (minutes: number) => {
        if (!minutes) { return 'N/A'; }
        const hrs = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
    };

    const statCards = [
        {
            title: t('workouts.totalWorkouts'),
            value: stats?.total || 0,
            icon: FiActivity,
            color: 'primary',
            change: `+${stats?.workoutsToday || 0} ${t('dashboard.today')}`,
        },
        {
            title: t('workouts.todaysWorkouts'),
            value: stats?.workoutsToday || 0,
            icon: FiCalendar,
            color: 'success',
            change: t('workouts.activeToday'),
        },
        {
            title: t('workouts.avgDuration'),
            value: formatDuration(stats?.avgDuration),
            icon: FiClock,
            color: 'warning',
            change: t('workouts.perSession'),
        },
        {
            title: t('workouts.avgCalories'),
            value: `${stats?.avgCalories || 0} kcal`,
            icon: FiZap,
            color: 'secondary',
            change: t('workouts.perSession'),
        },
    ];

    if (loading && !workouts.length) {
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
                    <h1 className="text-2xl font-bold text-gray-900">Workouts</h1>
                    <p className="text-gray-600">Monitor and manage workout sessions</p>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {statCards.map((card, index) => {
                    const Icon = card.icon;
                    const colorClasses: Record<string, string> = {
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
                                    <p className="stat-value mt-2">
                                        {typeof card.value === 'number' ? card.value.toLocaleString() : card.value}
                                    </p>
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
                            onClick={() => { setDateFilter(''); fetchWorkouts(); }}
                            className="btn btn-outline"
                        >
                            <FiFilter className="w-5 h-5 mr-2" />
                            Reset
                        </button>
                    </div>
                </div>
            </div>

            {/* Workouts table */}
            <div className="card">
                <div className="overflow-hidden">
                    <div className="table-container">
                        <table className="table">
                            <thead className="table-header">
                                <tr>
                                    <th className="table-header-cell">User</th>
                                    <th className="table-header-cell">Type</th>
                                    <th className="table-header-cell">Duration</th>
                                    <th className="table-header-cell">Calories</th>
                                    <th className="table-header-cell">Date</th>
                                    <th className="table-header-cell">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {filteredWorkouts.length > 0 ? (
                                    filteredWorkouts.map((workout) => (
                                        <tr key={workout.id} className="table-row">
                                            <td className="table-cell">
                                                <div className="flex items-center">
                                                    <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                                                        <span className="text-primary-700 font-semibold">
                                                            {workout.user?.username?.charAt(0).toUpperCase() || 'U'}
                                                        </span>
                                                    </div>
                                                    <div className="ml-4">
                                                        <div className="font-medium text-gray-900">
                                                            {workout.user?.username || 'Unknown User'}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="table-cell">
                                                <span className="badge badge-info">
                                                    {workout.workout_type || workout.name || 'General'}
                                                </span>
                                            </td>
                                            <td className="table-cell">
                                                <div className="flex items-center">
                                                    <FiClock className="w-4 h-4 text-gray-400 mr-2" />
                                                    {formatDuration(workout.duration_minutes)}
                                                </div>
                                            </td>
                                            <td className="table-cell">
                                                <div className="flex items-center">
                                                    <FiZap className="w-4 h-4 text-warning-500 mr-2" />
                                                    {workout.calories_burned || 0} kcal
                                                </div>
                                            </td>
                                            <td className="table-cell">
                                                {workout.start_time
                                                    ? new Date(workout.start_time).toLocaleDateString('en-US', {
                                                        year: 'numeric',
                                                        month: 'short',
                                                        day: 'numeric',
                                                    })
                                                    : 'N/A'}
                                            </td>
                                            <td className="table-cell">
                                                <span className={`badge ${workout.end_time ? 'badge-success' : 'badge-warning'}`}>
                                                    {workout.end_time ? 'Completed' : 'In Progress'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center">
                                            <div className="text-gray-500">
                                                <FiActivity className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                                                <p className="text-lg font-medium">No workouts found</p>
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

export default Workouts;