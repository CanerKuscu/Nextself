import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { FiPlus, FiClipboard, FiCheckCircle, FiClock, FiX, FiRefreshCw, FiUser, FiActivity, FiHeart } from 'react-icons/fi';

/* ────────────────────────────────────────────────────────
   PT & Dietitian web dashboard – Assignments page
   Fetches real data from Supabase tables:
     • assigned_workouts   (PT)
     • assigned_nutrition_plans (Dietitian)
   Falls back to demo data when tables are unavailable.
   ──────────────────────────────────────────────────────── */

const statusColors = {
    completed: 'bg-green-100 text-green-800',
    pending: 'bg-yellow-100 text-yellow-800',
    active: 'bg-blue-100 text-blue-800',
    expired: 'bg-red-100 text-red-800',
};

const demoData = [
    { id: 1, type: 'Workout', client: 'John Doe', title: 'Upper Body Strength', date: '2025-12-20', status: 'completed' },
    { id: 2, type: 'Nutrition', client: 'Sarah Smith', title: 'Calorie Deficit Plan', date: '2025-12-21', status: 'active' },
];

const Assignments = () => {
    const [assignments, setAssignments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState('all'); // all | workout | nutrition
    const [showCreateModal, setShowCreateModal] = useState(false);

    // ── Form state (New Assignment) ───────────────────────
    const [form, setForm] = useState({
        clientId: '', type: 'workout', title: '', description: '', scheduledDate: '',
        targetCalories: '', targetProtein: '', targetCarbs: '', targetFats: '',
        startDate: '', endDate: '', notes: '',
    });
    const [clients, setClients] = useState([]);
    const [saving, setSaving] = useState(false);

    // ── Load ──────────────────────────────────────────────
    const loadAssignments = useCallback(async () => {
        setLoading(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.user) { setAssignments(demoData); setLoading(false); return; }

            const userId = session.user.id;

            const [workoutsRes, nutritionRes] = await Promise.allSettled([
                supabase.from('assigned_workouts')
                    .select('*, client:client_id(first_name, last_name, email)')
                    .eq('pt_id', userId)
                    .order('scheduled_date', { ascending: false }),
                supabase.from('assigned_nutrition_plans')
                    .select('*, client:client_id(first_name, last_name, email)')
                    .eq('dietitian_id', userId)
                    .order('start_date', { ascending: false }),
            ]);

            const rows = [];
            if (workoutsRes.status === 'fulfilled' && workoutsRes.value.data) {
                workoutsRes.value.data.forEach((w) => {
                    rows.push({
                        id: w.id, type: 'Workout',
                        client: w.client ? `${w.client.first_name || ''} ${w.client.last_name || ''}`.trim() : 'N/A',
                        title: w.title || '', date: w.scheduled_date || '',
                        status: w.is_completed ? 'completed' : 'pending', raw: w,
                    });
                });
            }
            if (nutritionRes.status === 'fulfilled' && nutritionRes.value.data) {
                nutritionRes.value.data.forEach((n) => {
                    const today = new Date().toISOString().slice(0, 10);
                    const isExpired = n.end_date && n.end_date < today;
                    rows.push({
                        id: n.id, type: 'Nutrition',
                        client: n.client ? `${n.client.first_name || ''} ${n.client.last_name || ''}`.trim() : 'N/A',
                        title: n.title || '', date: n.start_date || '',
                        status: isExpired ? 'expired' : n.is_active ? 'active' : 'pending', raw: n,
                    });
                });
            }
            rows.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
            setAssignments(rows.length > 0 ? rows : demoData);
        } catch (err) {
            console.error('Load assignments error:', err);
            setAssignments(demoData);
        } finally { setLoading(false); }
    }, []);

    // ── Load connected clients ────────────────────────────
    const loadClients = useCallback(async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.user) { return; }
            const userId = session.user.id;
            const { data } = await supabase
                .from('chat_participants')
                .select('chat_id, chats:chat_id(chat_participants(user_id, users:user_id(id, first_name, last_name, email)))')
                .eq('user_id', userId);
            if (!data) { return; }
            const clientMap = new Map();
            data.forEach((item) => {
                const chat = item.chats;
                if (chat?.chat_participants) {
                    chat.chat_participants.forEach((p) => {
                        if (p.user_id !== userId && p.users) { clientMap.set(p.user_id, p.users); }
                    });
                }
            });
            setClients(Array.from(clientMap.values()));
        } catch (err) { console.error('Load clients error:', err); }
    }, []);

    useEffect(() => { loadAssignments(); loadClients(); }, [loadAssignments, loadClients]);

    // ── Create Assignment ─────────────────────────────────
    const handleCreate = async (e) => {
        e.preventDefault();
        if (!form.clientId || !form.title) { return; }
        setSaving(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.user) { throw new Error('Not authenticated'); }
            if (form.type === 'workout') {
                const { error } = await supabase.from('assigned_workouts').insert({
                    pt_id: session.user.id, client_id: form.clientId,
                    title: form.title, description: form.description,
                    scheduled_date: form.scheduledDate || new Date().toISOString().slice(0, 10),
                });
                if (error) { throw error; }
            } else {
                const { error } = await supabase.from('assigned_nutrition_plans').insert({
                    dietitian_id: session.user.id, client_id: form.clientId,
                    title: form.title, notes: form.notes,
                    target_calories: parseInt(form.targetCalories) || null,
                    target_protein: parseInt(form.targetProtein) || null,
                    target_carbs: parseInt(form.targetCarbs) || null,
                    target_fats: parseInt(form.targetFats) || null,
                    start_date: form.startDate || new Date().toISOString().slice(0, 10),
                    end_date: form.endDate || null, is_active: true,
                });
                if (error) { throw error; }
            }
            setShowCreateModal(false);
            setForm({ clientId: '', type: 'workout', title: '', description: '', scheduledDate: '', targetCalories: '', targetProtein: '', targetCarbs: '', targetFats: '', startDate: '', endDate: '', notes: '' });
            loadAssignments();
        } catch (err) {
            console.error('Create assignment error:', err);
            alert('Failed to create assignment: ' + (err.message || 'Unknown error'));
        } finally { setSaving(false); }
    };

    // ── Derived ───────────────────────────────────────────
    const filteredAssignments = tab === 'all' ? assignments : assignments.filter((a) => a.type.toLowerCase() === tab);
    const totalWorkouts = assignments.filter(a => a.type === 'Workout').length;
    const totalNutrition = assignments.filter(a => a.type === 'Nutrition').length;
    const completedCount = assignments.filter(a => a.status === 'completed').length;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-2">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Program Assignments</h1>
                    <p className="mt-1 text-sm text-gray-500">Manage and assign workout &amp; nutrition plans to your clients</p>
                </div>
                <div className="flex space-x-3">
                    <button onClick={loadAssignments} className="flex items-center px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
                        <FiRefreshCw className="w-4 h-4 mr-2" /> Refresh
                    </button>
                    <button onClick={() => setShowCreateModal(true)} className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition">
                        <FiPlus className="w-4 h-4 mr-2" /> New Assignment
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center"><FiActivity className="w-6 h-6 text-blue-600" /></div>
                    <div><p className="text-2xl font-bold text-gray-900">{totalWorkouts}</p><p className="text-sm text-gray-500">Workouts</p></div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center"><FiHeart className="w-6 h-6 text-green-600" /></div>
                    <div><p className="text-2xl font-bold text-gray-900">{totalNutrition}</p><p className="text-sm text-gray-500">Nutrition Plans</p></div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-yellow-50 flex items-center justify-center"><FiCheckCircle className="w-6 h-6 text-yellow-600" /></div>
                    <div><p className="text-2xl font-bold text-gray-900">{completedCount}</p><p className="text-sm text-gray-500">Completed</p></div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex space-x-2 border-b border-gray-200">
                {['all', 'workout', 'nutrition'].map((t) => (
                    <button key={t} onClick={() => setTab(t)}
                        className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition ${tab === t ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                        {t === 'all' ? 'All' : t === 'workout' ? 'Workouts' : 'Nutrition'}
                    </button>
                ))}
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {loading ? (
                                <tr><td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-500">Loading assignments...</td></tr>
                            ) : filteredAssignments.length === 0 ? (
                                <tr><td colSpan="5" className="px-6 py-12 text-center text-sm text-gray-500">
                                    <div className="flex flex-col items-center"><FiClipboard className="w-12 h-12 text-gray-300 mb-4" /><p className="text-gray-500">No assignments found</p></div>
                                </td></tr>
                            ) : (
                                filteredAssignments.map((a) => (
                                    <tr key={a.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap"><div className="flex items-center gap-2"><FiUser className="w-4 h-4 text-gray-400" /><span className="text-sm font-medium text-gray-900">{a.client}</span></div></td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{a.title || '—'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${a.type === 'Workout' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>{a.type}</span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{a.date || '—'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[a.status] || 'bg-gray-100 text-gray-800'}`}>
                                                {a.status === 'completed' && <FiCheckCircle className="mr-1 w-3 h-3" />}
                                                {a.status === 'pending' && <FiClock className="mr-1 w-3 h-3" />}
                                                {a.status.charAt(0).toUpperCase() + a.status.slice(1)}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ────── Create Modal ────── */}
            {showCreateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 p-6 relative max-h-[90vh] overflow-y-auto">
                        <button onClick={() => setShowCreateModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><FiX className="w-5 h-5" /></button>
                        <h2 className="text-lg font-bold text-gray-900 mb-4">New Assignment</h2>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                                <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-500">
                                    <option value="workout">Workout</option>
                                    <option value="nutrition">Nutrition Plan</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Client</label>
                                {clients.length > 0 ? (
                                    <select value={form.clientId} onChange={(e) => setForm({ ...form, clientId: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" required>
                                        <option value="">Select a client</option>
                                        {clients.map((c) => (<option key={c.id} value={c.id}>{c.first_name} {c.last_name} ({c.email})</option>))}
                                    </select>
                                ) : (
                                    <input type="text" value={form.clientId} onChange={(e) => setForm({ ...form, clientId: e.target.value })} placeholder="Client ID (no connected clients yet)" className="w-full px-3 py-2 border rounded-lg text-sm" required />
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                                <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Upper Body Workout" className="w-full px-3 py-2 border rounded-lg text-sm" required />
                            </div>
                            {form.type === 'workout' ? (
                                <>
                                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Description</label><textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows="3" className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
                                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Scheduled Date</label><input type="date" value={form.scheduledDate} onChange={(e) => setForm({ ...form, scheduledDate: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
                                </>
                            ) : (
                                <>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div><label className="block text-sm font-medium text-gray-700 mb-1">Target Calories</label><input type="number" value={form.targetCalories} onChange={(e) => setForm({ ...form, targetCalories: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
                                        <div><label className="block text-sm font-medium text-gray-700 mb-1">Target Protein (g)</label><input type="number" value={form.targetProtein} onChange={(e) => setForm({ ...form, targetProtein: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
                                        <div><label className="block text-sm font-medium text-gray-700 mb-1">Target Carbs (g)</label><input type="number" value={form.targetCarbs} onChange={(e) => setForm({ ...form, targetCarbs: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
                                        <div><label className="block text-sm font-medium text-gray-700 mb-1">Target Fats (g)</label><input type="number" value={form.targetFats} onChange={(e) => setForm({ ...form, targetFats: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div><label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label><input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
                                        <div><label className="block text-sm font-medium text-gray-700 mb-1">End Date</label><input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
                                    </div>
                                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Notes</label><textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows="3" className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
                                </>
                            )}
                            <button type="submit" disabled={saving} className="w-full py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition">
                                {saving ? 'Creating...' : 'Create Assignment'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Assignments;
