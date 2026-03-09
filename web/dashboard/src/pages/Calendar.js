import React, { useState, useEffect, useCallback } from 'react';
import { FiPlus, FiChevronLeft, FiChevronRight, FiClock, FiUser, FiMapPin, FiX, FiTrash2 } from 'react-icons/fi';
import { MdFitnessCenter, MdRestaurant } from 'react-icons/md';
import { db } from '../lib/supabase';

const SESSION_COLORS = ['bg-blue-500', 'bg-emerald-500', 'bg-violet-500', 'bg-pink-500', 'bg-amber-500', 'bg-cyan-500', 'bg-indigo-500', 'bg-teal-500'];

const Calendar = () => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [view, setView] = useState('month');
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [newSession, setNewSession] = useState({
        client: '', date: '', time: '', type: 'fitness', location: '', notes: '',
    });

    const fetchSessions = useCallback(async () => {
        try {
            setLoading(true);
            const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).toISOString();
            const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0, 23, 59, 59).toISOString();
            const { data, error } = await db.getSessions(startOfMonth, endOfMonth);
            if (error) { throw error; }
            if (data && data.length > 0) {
                const mapped = data.map((s, i) => ({
                    id: s.id,
                    title: s.title || `${s.type === 'fitness' ? 'Training' : 'Nutrition'} - ${s.client?.username || 'Client'}`,
                    type: s.type || 'fitness',
                    time: s.start_time ? new Date(s.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
                    client: s.client?.username || s.client_name || 'Client',
                    location: s.location || 'TBD',
                    color: SESSION_COLORS[i % SESSION_COLORS.length],
                    date: new Date(s.start_time),
                }));
                setSessions(mapped);
            }
        } catch (err) {
            console.error('Failed to load sessions:', err);
        } finally {
            setLoading(false);
        }
    }, [currentDate]);

    useEffect(() => {
        fetchSessions();
    }, [fetchSessions]);

    const handleCreateSession = async () => {
        if (!newSession.date || !newSession.time) { return; }
        setSaving(true);
        try {
            const startTime = new Date(`${newSession.date}T${newSession.time}`).toISOString();
            const { error } = await db.createSession({
                title: `${newSession.type === 'fitness' ? 'Training' : 'Nutrition'} - ${newSession.client || 'Client'}`,
                type: newSession.type,
                start_time: startTime,
                location: newSession.location,
                notes: newSession.notes,
                client_name: newSession.client,
            });
            if (error) { throw error; }
            setShowCreateModal(false);
            setNewSession({ client: '', date: '', time: '', type: 'fitness', location: '', notes: '' });
            fetchSessions();
        } catch (err) {
            console.error('Failed to create session:', err);
            alert('Failed to create session: ' + err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteSession = async (sessionId) => {
        if (!window.confirm('Delete this session?')) { return; }
        try {
            const { error } = await db.deleteSession(sessionId);
            if (error) { throw error; }
            setSessions(prev => prev.filter(s => s.id !== sessionId));
        } catch (err) {
            console.error('Failed to delete session:', err);
        }
    };

    const getDaysInMonth = (date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    const getFirstDayOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();

    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
    const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));

    const getSessionsForDate = (day) => {
        return sessions.filter(s =>
            s.date.getDate() === day &&
            s.date.getMonth() === currentDate.getMonth() &&
            s.date.getFullYear() === currentDate.getFullYear()
        );
    };

    const todaySessions = sessions.filter(s => {
        const today = new Date();
        return s.date.getDate() === today.getDate() &&
            s.date.getMonth() === today.getMonth() &&
            s.date.getFullYear() === today.getFullYear();
    });

    const selectedDaySessions = getSessionsForDate(selectedDate.getDate());

    const renderCalendarDays = () => {
        const daysInMonth = getDaysInMonth(currentDate);
        const firstDay = getFirstDayOfMonth(currentDate);
        const days = [];

        // Empty cells
        for (let i = 0; i < firstDay; i++) {
            days.push(<div key={`empty-${i}`} className="h-28 border border-gray-50"></div>);
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const daySessions = getSessionsForDate(day);
            const isToday = new Date().getDate() === day && new Date().getMonth() === currentDate.getMonth() && new Date().getFullYear() === currentDate.getFullYear();
            const isSelected = selectedDate.getDate() === day && selectedDate.getMonth() === currentDate.getMonth();

            days.push(
                <div
                    key={day}
                    onClick={() => setSelectedDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), day))}
                    className={`h-28 border border-gray-50 p-2 cursor-pointer transition-all duration-200 hover:bg-blue-50/50
                        ${isToday ? 'bg-blue-50/30 border-blue-200' : ''}
                        ${isSelected ? 'ring-2 ring-blue-500 bg-blue-50/50 rounded-xl' : ''}
                    `}
                >
                    <div className={`text-sm font-medium mb-1 ${isToday ? 'w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center' : 'text-gray-700'}`}>
                        {day}
                    </div>
                    <div className="space-y-1">
                        {daySessions.slice(0, 2).map(session => (
                            <div key={session.id} className={`${session.color} text-white text-[10px] font-medium px-1.5 py-0.5 rounded truncate`}>
                                {session.time.split(' - ')[0]} {session.client.split(' ')[0]}
                            </div>
                        ))}
                        {daySessions.length > 2 && (
                            <div className="text-[10px] text-gray-500 font-medium">+{daySessions.length - 2} more</div>
                        )}
                    </div>
                </div>
            );
        }
        return days;
    };

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Calendar</h1>
                    <p className="text-gray-500 mt-1">Manage your training sessions and appointments</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-xl p-1">
                        <button
                            onClick={() => setView('month')}
                            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${view === 'month' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
                        >
                            Month
                        </button>
                        <button
                            onClick={() => setView('week')}
                            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${view === 'week' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
                        >
                            Week
                        </button>
                    </div>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold text-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
                    >
                        <FiPlus className="w-4 h-4" />
                        New Session
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Calendar Grid */}
                <div className="lg:col-span-3 bg-white rounded-2xl border border-gray-100 overflow-hidden">
                    {/* Month Controls */}
                    <div className="flex items-center justify-between p-5 border-b border-gray-100">
                        <button onClick={prevMonth} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                            <FiChevronLeft className="w-5 h-5 text-gray-600" />
                        </button>
                        <h2 className="text-lg font-bold text-gray-900">
                            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                        </h2>
                        <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                            <FiChevronRight className="w-5 h-5 text-gray-600" />
                        </button>
                    </div>

                    {/* Day Headers */}
                    <div className="grid grid-cols-7 bg-gray-50/80">
                        {dayNames.map(day => (
                            <div key={day} className="p-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                {day}
                            </div>
                        ))}
                    </div>

                    {/* Calendar Days */}
                    <div className="grid grid-cols-7">
                        {renderCalendarDays()}
                    </div>
                </div>

                {/* Sidebar - Today's Schedule / Selected Day */}
                <div className="space-y-6">
                    {/* Selected Day Sessions */}
                    <div className="bg-white rounded-2xl border border-gray-100 p-5">
                        <h3 className="text-base font-bold text-gray-900 mb-1">
                            {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                        </h3>
                        <p className="text-xs text-gray-500 mb-4">{selectedDaySessions.length} session(s) scheduled</p>
                        <div className="space-y-3">
                            {selectedDaySessions.length > 0 ? selectedDaySessions.map(session => (
                                <div key={session.id} className="group relative p-3 rounded-xl border border-gray-100 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 cursor-pointer">
                                    <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-xl ${session.color}`}></div>
                                    <button
                                        onClick={() => handleDeleteSession(session.id)}
                                        className="absolute top-2 right-2 p-1 rounded-md text-gray-300 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all"
                                    >
                                        <FiTrash2 className="w-3 h-3" />
                                    </button>
                                    <div className="pl-3">
                                        <p className="text-sm font-semibold text-gray-900">{session.client}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <FiClock className="w-3 h-3 text-gray-400" />
                                            <span className="text-xs text-gray-500">{session.time}</span>
                                        </div>
                                        <div className="flex items-center gap-2 mt-1">
                                            <FiMapPin className="w-3 h-3 text-gray-400" />
                                            <span className="text-xs text-gray-500">{session.location}</span>
                                        </div>
                                        <div className="mt-2">
                                            <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md ${session.type === 'fitness' ? 'bg-blue-50 text-blue-700' : 'bg-emerald-50 text-emerald-700'
                                                }`}>
                                                {session.type === 'fitness' ? <MdFitnessCenter className="w-3 h-3" /> : <MdRestaurant className="w-3 h-3" />}
                                                {session.type === 'fitness' ? 'Training' : 'Nutrition'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )) : (
                                <div className="text-center py-8">
                                    <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-3">
                                        <FiClock className="w-6 h-6 text-gray-300" />
                                    </div>
                                    <p className="text-sm text-gray-500">No sessions scheduled</p>
                                    <button
                                        onClick={() => setShowCreateModal(true)}
                                        className="mt-3 text-sm font-medium text-blue-600 hover:text-blue-700"
                                    >
                                        + Add session
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Quick Stats */}
                    <div className="bg-gradient-to-br from-indigo-500 to-violet-600 rounded-2xl p-5 text-white">
                        <h3 className="font-bold mb-4">This Week</h3>
                        <div className="space-y-3">
                            <div className="flex justify-between">
                                <span className="text-indigo-100 text-sm">Sessions</span>
                                <span className="font-bold">{sessions.length}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-indigo-100 text-sm">Clients</span>
                                <span className="font-bold">{new Set(sessions.map(s => s.client)).size}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-indigo-100 text-sm">Hours</span>
                                <span className="font-bold">{sessions.length}h</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Create Session Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full mx-4 animate-scale-in">
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">New Session</h2>
                                <p className="text-sm text-gray-500 mt-1">Schedule a training session</p>
                            </div>
                            <button onClick={() => setShowCreateModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                                <FiX className="w-5 h-5 text-gray-400" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Client</label>
                                <input
                                    type="text"
                                    value={newSession.client}
                                    onChange={(e) => setNewSession({ ...newSession, client: e.target.value })}
                                    placeholder="Client name..."
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Date</label>
                                    <input type="date" value={newSession.date} onChange={(e) => setNewSession({ ...newSession, date: e.target.value })} className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Time</label>
                                    <input type="time" value={newSession.time} onChange={(e) => setNewSession({ ...newSession, time: e.target.value })} className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Type</label>
                                    <select value={newSession.type} onChange={(e) => setNewSession({ ...newSession, type: e.target.value })} className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                                        <option value="fitness">Training</option>
                                        <option value="nutrition">Nutrition</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Location</label>
                                    <input type="text" value={newSession.location} onChange={(e) => setNewSession({ ...newSession, location: e.target.value })} placeholder="e.g. BioSync Gym" className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Notes</label>
                                <textarea rows={2} value={newSession.notes} onChange={(e) => setNewSession({ ...newSession, notes: e.target.value })} className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none" placeholder="Session notes..."></textarea>
                            </div>
                        </div>
                        <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
                            <button onClick={() => setShowCreateModal(false)} className="px-5 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
                            <button onClick={handleCreateSession} disabled={saving} className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-sm font-semibold hover:shadow-lg transition-all disabled:opacity-50">{saving ? 'Creating...' : 'Create Session'}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Calendar;
