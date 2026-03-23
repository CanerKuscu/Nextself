import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { FiTrendingUp, FiTrendingDown, FiUsers, FiDownload, FiFilter, FiChevronDown, FiTarget, FiAward, FiBarChart2 } from 'react-icons/fi';
import { Line, Radar } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    ChartOptions,
    RadialLinearScale,
    Filler,
} from 'chart.js';
import { db } from '../lib/supabase';

ChartJS.register(RadialLinearScale, Filler);

const FALLBACK_PROGRESS_DATA = [
    {
        id: 1, name: 'Alex Johnson',
        metrics: { weight: { start: 85, current: 78, goal: 75 }, bodyFat: { start: 22, current: 16, goal: 12 }, muscle: { start: 35, current: 40, goal: 42 } },
        workoutAdherence: 92, nutritionAdherence: 85, streakDays: 45,
        trend: 'up', change: '+8.5%',
    },
    {
        id: 2, name: 'Sarah Chen',
        metrics: { weight: { start: 62, current: 58, goal: 55 }, bodyFat: { start: 28, current: 22, goal: 20 }, muscle: { start: 28, current: 31, goal: 33 } },
        workoutAdherence: 88, nutritionAdherence: 92, streakDays: 32,
        trend: 'up', change: '+12.1%',
    },
    {
        id: 3, name: 'Mike Davis',
        metrics: { weight: { start: 95, current: 90, goal: 82 }, bodyFat: { start: 25, current: 21, goal: 15 }, muscle: { start: 40, current: 42, goal: 48 } },
        workoutAdherence: 75, nutritionAdherence: 65, streakDays: 12,
        trend: 'down', change: '-3.2%',
    },
    {
        id: 4, name: 'Emma Wilson',
        metrics: { weight: { start: 70, current: 65, goal: 60 }, bodyFat: { start: 30, current: 25, goal: 22 }, muscle: { start: 25, current: 28, goal: 30 } },
        workoutAdherence: 95, nutritionAdherence: 90, streakDays: 60,
        trend: 'up', change: '+15.3%',
    },
];

const ProgressReports = () => {
    const [selectedClient, setSelectedClient] = useState('all');
    const [timeRange, setTimeRange] = useState('month');
    const [progressData, setProgressData] = useState(FALLBACK_PROGRESS_DATA);
    const [clients, setClients] = useState<any[]>([
        { id: 'all', name: 'All Clients' },
        { id: '1', name: 'Alex Johnson' },
        { id: '2', name: 'Sarah Chen' },
        { id: '3', name: 'Mike Davis' },
        { id: '4', name: 'Emma Wilson' },
    ]);

    useEffect(() => {
        const loadClients = async () => {
            try {
                const { data } = await db.getUsers(1, 50);
                if (data && data.length > 0) {
                    setClients([
                        { id: 'all', name: 'All Clients' },
                        ...data.map((u: any) => ({ id: String(u.id), name: u.username || u.email || 'Unknown' })),
                    ]);
                }
            } catch (err: any) {
                console.error('Failed to load clients:', err);
            }
        };
        loadClients();
    }, []);

    const filteredProgress = useMemo(() => {
        if (selectedClient === 'all') { return progressData; }
        return progressData.filter((p: any) => String(p.id) === selectedClient || p.name === clients.find(c => c.id === selectedClient)?.name);
    }, [selectedClient, progressData, clients]);

    const handleExportPDF = () => {
        // Generate a simple printable report
        const printWindow = window.open('', '_blank');
        if (!printWindow) { return; }
        const rows = filteredProgress.map((c: any) => `
            <tr><td>${c.name}</td><td>${c.metrics.weight.current}kg</td><td>${c.metrics.bodyFat.current}%</td>
            <td>${c.workoutAdherence}%</td><td>${c.nutritionAdherence}%</td><td>${c.streakDays}</td></tr>
        `).join('');
        printWindow.document.write(`<html><head><title>NextSelf Progress Report</title></head><body>
            <h1>NextSelf Progress Report</h1><p>Generated: ${new Date().toLocaleDateString()}</p>
            <table border="1" cellpadding="8"><tr><th>Client</th><th>Weight</th><th>Body Fat</th><th>Workout</th><th>Nutrition</th><th>Streak</th></tr>${rows}</table>
        </body></html>`);
        printWindow.document.close();
        printWindow.print();
    };

    const radarData = {
        labels: ['Strength', 'Endurance', 'Flexibility', 'Nutrition', 'Consistency', 'Recovery'],
        datasets: [
            {
                label: 'Current',
                data: [85, 78, 65, 88, 92, 70],
                backgroundColor: 'rgba(59, 130, 246, 0.15)',
                borderColor: '#3b82f6',
                borderWidth: 2,
                pointBackgroundColor: '#3b82f6',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
            },
            {
                label: 'Start',
                data: [45, 50, 40, 55, 60, 45],
                backgroundColor: 'rgba(156, 163, 175, 0.1)',
                borderColor: '#9ca3af',
                borderWidth: 1.5,
                borderDash: [5, 5],
                pointBackgroundColor: '#9ca3af',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
            },
        ],
    };

    const radarOptions: ChartOptions<'radar'> = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { position: 'top', labels: { usePointStyle: true, padding: 20, font: { size: 12 } } },
        },
        scales: {
            r: {
                beginAtZero: true,
                max: 100,
                ticks: { stepSize: 20, font: { size: 10 }, backdropColor: 'transparent' },
                grid: { color: 'rgba(0,0,0,0.05)' },
                pointLabels: { font: { size: 11, weight: 500 } },
            },
        },
    };

    const weightTrendData = {
        labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6', 'Week 7', 'Week 8'],
        datasets: [
            {
                label: 'Weight (kg)',
                data: [85, 84, 83, 82, 81, 80, 79, 78],
                borderColor: '#3b82f6',
                backgroundColor: 'rgba(59, 130, 246, 0.08)',
                tension: 0.4,
                fill: true,
                pointRadius: 4,
                pointBackgroundColor: '#3b82f6',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
            },
            {
                label: 'Goal',
                data: [75, 75, 75, 75, 75, 75, 75, 75],
                borderColor: '#22c55e',
                borderDash: [6, 4],
                borderWidth: 1.5,
                pointRadius: 0,
                fill: false,
            }
        ],
    };

    const weightTrendOptions: ChartOptions<'line'> = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { position: 'top', labels: { usePointStyle: true, padding: 20, font: { size: 12 } } },
        },
        scales: {
            y: { grid: { color: 'rgba(0,0,0,0.04)' }, ticks: { font: { size: 11 } } },
            x: { grid: { display: false }, ticks: { font: { size: 11 } } },
        },
    };

    const avgAdherence = filteredProgress.length > 0
        ? Math.round(filteredProgress.reduce((s: number, c: any) => s + c.workoutAdherence, 0) / filteredProgress.length)
        : 0;
    const avgStreak = filteredProgress.length > 0
        ? Math.round(filteredProgress.reduce((s: number, c: any) => s + c.streakDays, 0) / filteredProgress.length)
        : 0;
    const goalAchievement = filteredProgress.length > 0
        ? Math.round(filteredProgress.filter((c: any) => c.trend === 'up').length / filteredProgress.length * 100)
        : 0;

    const overallStats = [
        { label: 'Avg. Adherence', value: `${avgAdherence}%`, icon: FiTarget, color: 'bg-blue-500', subtext: 'Workout consistency' },
        { label: 'Avg. Progress', value: filteredProgress.length > 0 ? filteredProgress[0].change : 'N/A', icon: FiTrendingUp, color: 'bg-emerald-500', subtext: 'Body composition' },
        { label: 'Active Streaks', value: String(avgStreak), icon: FiAward, color: 'bg-amber-500', subtext: 'Average days' },
        { label: 'Goal Achievement', value: `${goalAchievement}%`, icon: FiBarChart2, color: 'bg-violet-500', subtext: 'On track to goals' },
    ];

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Progress Reports</h1>
                    <p className="text-gray-500 mt-1">Track client progress, body metrics and goal achievement</p>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                    <select
                        value={selectedClient}
                        onChange={(e) => setSelectedClient(e.target.value)}
                        className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                        {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-xl p-1">
                        {['week', 'month', 'quarter'].map(range => (
                            <button
                                key={range}
                                onClick={() => setTimeRange(range)}
                                className={`px-3 py-1.5 text-xs font-medium rounded-lg capitalize transition-all ${timeRange === range ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-50'
                                    }`}
                            >
                                {range}
                            </button>
                        ))}
                    </div>
                    <button onClick={handleExportPDF} className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                        <FiDownload className="w-4 h-4" />
                        Export PDF
                    </button>
                </div>
            </div>

            {/* Overall Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {overallStats.map((stat, index) => {
                    const Icon = stat.icon;
                    return (
                        <div key={index} className="group bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
                            <div className="flex items-center gap-4">
                                <div className={`${stat.color} p-3 rounded-xl text-white group-hover:scale-110 transition-transform duration-300`}>
                                    <Icon className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                                    <p className="text-xs text-gray-500 font-medium">{stat.label}</p>
                                    <p className="text-[10px] text-gray-400 mt-0.5">{stat.subtext}</p>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Weight Trend */}
                <div className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-lg transition-shadow duration-300">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-lg font-bold text-gray-900">Weight Trend</h3>
                            <p className="text-sm text-gray-500 mt-1">Progress towards weight goal</p>
                        </div>
                        <div className="flex items-center gap-1 text-sm font-semibold text-emerald-500">
                            <FiTrendingDown className="w-4 h-4" />
                            -7 kg
                        </div>
                    </div>
                    <div className="h-72">
                        <Line data={weightTrendData} options={weightTrendOptions} />
                    </div>
                </div>

                {/* Performance Radar */}
                <div className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-lg transition-shadow duration-300">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-lg font-bold text-gray-900">Performance Overview</h3>
                            <p className="text-sm text-gray-500 mt-1">Current vs starting metrics</p>
                        </div>
                    </div>
                    <div className="h-72">
                        <Radar data={radarData} options={radarOptions} />
                    </div>
                </div>
            </div>

            {/* Client Progress Table */}
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-lg transition-shadow duration-300">
                <div className="p-6 pb-4 border-b border-gray-100">
                    <h3 className="text-lg font-bold text-gray-900">Client Progress</h3>
                    <p className="text-sm text-gray-500 mt-1">Individual client metrics and adherence</p>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-gray-50/80">
                                <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Client</th>
                                <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Weight Progress</th>
                                <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Body Fat</th>
                                <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Workout</th>
                                <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Nutrition</th>
                                <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Streak</th>
                                <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Trend</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredProgress.map((client) => {
                                const weightProgress = ((client.metrics.weight.start - client.metrics.weight.current) / (client.metrics.weight.start - client.metrics.weight.goal)) * 100;
                                return (
                                    <tr key={client.id} className="hover:bg-blue-50/30 transition-colors duration-150">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-xs font-bold">
                                                    {client.name.split(' ').map(n => n[0]).join('')}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold text-gray-900">{client.name}</p>
                                                    <p className="text-xs text-gray-500">{client.streakDays} day streak</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-medium text-gray-900">{client.metrics.weight.current}kg</span>
                                                <span className="text-xs text-gray-400">/ {client.metrics.weight.goal}kg</span>
                                            </div>
                                            <div className="w-24 h-1.5 bg-gray-100 rounded-full mt-1.5">
                                                <div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.min(weightProgress, 100)}%` }}></div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm font-medium text-gray-900">{client.metrics.bodyFat.current}%</span>
                                            <span className="text-xs text-emerald-500 ml-1">↓{client.metrics.bodyFat.start - client.metrics.bodyFat.current}%</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-20 h-2 bg-gray-100 rounded-full">
                                                    <div className={`h-full rounded-full ${client.workoutAdherence >= 80 ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{ width: `${client.workoutAdherence}%` }}></div>
                                                </div>
                                                <span className="text-xs font-semibold text-gray-700">{client.workoutAdherence}%</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-20 h-2 bg-gray-100 rounded-full">
                                                    <div className={`h-full rounded-full ${client.nutritionAdherence >= 80 ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{ width: `${client.nutritionAdherence}%` }}></div>
                                                </div>
                                                <span className="text-xs font-semibold text-gray-700">{client.nutritionAdherence}%</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center gap-1 text-sm font-bold text-amber-600">
                                                🔥 {client.streakDays}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1 text-sm font-semibold ${client.trend === 'up' ? 'text-emerald-500' : 'text-red-500'}`}>
                                                {client.trend === 'up' ? <FiTrendingUp className="w-4 h-4" /> : <FiTrendingDown className="w-4 h-4" />}
                                                {client.change}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ProgressReports;
