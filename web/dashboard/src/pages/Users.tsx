import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { FiSearch, FiFilter, FiUserPlus, FiEdit, FiTrash2, FiX, FiCheckSquare, FiMaximize } from 'react-icons/fi';
import { db } from '../lib/supabase';
import QRModal from '../components/QRModal';

const Users = () => {
    const { t } = useTranslation();
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const pageSize = 10;
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingUser, setEditingUser] = useState<any>(null);
    const [editForm, setEditForm] = useState({ username: '', email: '' });

    // QR Modal State
    const [showQRModal, setShowQRModal] = useState(false);
    const [qrSessionId, setQrSessionId] = useState<any>(null);
    const [isQrVerified, setIsQrVerified] = useState(false);

    useEffect(() => {
        fetchUsers();
    }, [currentPage]);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const { data, error, total } = await db.getUsers(currentPage, pageSize);

            if (error) { throw error; }

            setUsers(data || []);
            setTotalCount(total || 0);
            setTotalPages(Math.ceil((total || 0) / pageSize));
        } catch (error: any) {
            console.error('Error fetching users');
        } finally {
            setLoading(false);
        }
    };

    const filteredUsers = users.filter(user =>
        user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleEditUser = (user) => {
        setEditingUser(user);
        setEditForm({ username: user.username || '', email: user.email || '' });
        setShowEditModal(true);
    };

    const handleSaveUser = async () => {
        if (!editingUser) { return; }
        try {
            const { error } = await db.updateUser(editingUser.id, editForm);
            if (error) { throw error; }
            setUsers(prev => prev.map(u => u.id === editingUser.id ? { ...u, ...editForm } : u));
            setShowEditModal(false);
            setEditingUser(null);
        } catch (err: any) {
            console.error('Failed to update user:', err);
            alert('Failed to update user. Please try again.');
        }
    };

    const handleGenerateQR = (userId) => {
        // In a real app, this would create a session record in the DB and return the ID.
        // For demonstration to meet requirements, we use a fake session ID pattern.
        const mockSessionId = `session_${userId}_${Date.now()}`;
        setQrSessionId(mockSessionId);
        setIsQrVerified(false);
        setShowQRModal(true);

        // Simulating the client scanning and verifying after 5 seconds
        setTimeout(() => {
            setIsQrVerified(true);
        }, 5000);
    };

    const handleDeleteUser = async (userId) => {
        if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) { return; }
        try {
            const { error } = await db.deleteUser(userId);
            if (error) { throw error; }
            setUsers(prev => prev.filter(u => u.id !== userId));
        } catch (err: any) {
            console.error('Failed to delete user:', err);
            alert('Failed to delete user. Please try again.');
        }
    };

    const activeToday = users.filter(u => {
        if (!u.updated_at) { return false; }
        const updated = new Date(u.updated_at);
        const today = new Date();
        return updated.toDateString() === today.toDateString();
    }).length;

    const newThisWeek = users.filter(u => {
        if (!u.created_at) { return false; }
        const created = new Date(u.created_at);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return created >= weekAgo;
    }).length;

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
                    <h1 className="text-2xl font-bold text-gray-900">{t('users.title')}</h1>
                    <p className="text-gray-600">{t('users.subtitle')}</p>
                </div>
                <button className="btn btn-primary mt-4 sm:mt-0">
                    <FiUserPlus className="w-5 h-5 mr-2" />
                    {t('users.addUser')}
                </button>
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
                            placeholder={t('users.search')}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="input pl-10"
                        />
                    </div>
                    <button className="btn btn-outline">
                        <FiFilter className="w-5 h-5 mr-2" />
                        {t('users.filters')}
                    </button>
                </div>
            </div>

            {/* Users table */}
            <div className="card">
                <div className="overflow-hidden">
                    <div className="table-container">
                        <table className="table">
                            <thead className="table-header">
                                <tr>
                                    <th className="table-header-cell">User</th>
                                    <th className="table-header-cell">Email</th>
                                    <th className="table-header-cell">Joined</th>
                                    <th className="table-header-cell">Status</th>
                                    <th className="table-header-cell">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {filteredUsers.length > 0 ? (
                                    filteredUsers.map((user) => (
                                        <tr key={user.id} className="table-row">
                                            <td className="table-cell">
                                                <div className="flex items-center">
                                                    <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                                                        <span className="text-primary-700 font-semibold">
                                                            {user.username?.charAt(0).toUpperCase() || 'U'}
                                                        </span>
                                                    </div>
                                                    <div className="ml-4">
                                                        <div className="font-medium text-gray-900">
                                                            {user.username || 'Unknown User'}
                                                        </div>
                                                        <div className="text-sm text-gray-500">
                                                            User ID: {user.id.substring(0, 8)}...
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="table-cell">{user.email || 'No email'}</td>
                                            <td className="table-cell">
                                                {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                                            </td>
                                            <td className="table-cell">
                                                <span className="badge badge-success">
                                                    Active
                                                </span>
                                            </td>
                                            <td className="table-cell">
                                                <div className="flex space-x-2">
                                                    <button
                                                        onClick={() => handleGenerateQR(user.id)}
                                                        className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg flex items-center justify-center group relative tooltip-container"
                                                        aria-label="Generate Session QR"
                                                    >
                                                        <FiMaximize className="w-4 h-4" />
                                                        <span className="tooltip-text absolute bottom-full mb-2 hidden group-hover:block bg-gray-800 text-white text-xs px-2 py-1 rounded w-[max-content] z-10 whitespace-nowrap">Generate Session QR</span>
                                                    </button>
                                                    <button
                                                        onClick={() => handleEditUser(user)}
                                                        className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg group relative tooltip-container"
                                                        aria-label="Edit User"
                                                    >
                                                        <FiEdit className="w-4 h-4" />
                                                        <span className="tooltip-text absolute bottom-full mb-2 hidden group-hover:block bg-gray-800 text-white text-xs px-2 py-1 rounded w-[max-content] z-10 whitespace-nowrap">Edit User</span>
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteUser(user.id)}
                                                        className="p-2 text-danger-600 hover:bg-danger-50 rounded-lg group relative tooltip-container"
                                                        aria-label="Delete User"
                                                    >
                                                        <FiTrash2 className="w-4 h-4" />
                                                        <span className="tooltip-text absolute bottom-full mb-2 hidden group-hover:block bg-gray-800 text-white text-xs px-2 py-1 rounded w-[max-content] z-10 whitespace-nowrap">Delete User</span>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center">
                                            <div className="text-gray-500">
                                                <FiSearch className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                                                <p className="text-lg font-medium">No users found</p>
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
                            Showing <span className="font-medium">{(currentPage - 1) * pageSize + 1}</span> to{' '}
                            <span className="font-medium">
                                {Math.min(currentPage * pageSize, totalCount)}
                            </span>{' '}
                            of <span className="font-medium">{totalCount}</span> results
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

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="card">
                    <div className="flex items-center">
                        <div className="p-3 rounded-lg bg-primary-50">
                            <FiUserPlus className="w-6 h-6 text-primary-600" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-500">{t('users.totalUsers')}</p>
                            <p className="text-2xl font-bold text-gray-900">{totalCount}</p>
                        </div>
                    </div>
                </div>
                <div className="card">
                    <div className="flex items-center">
                        <div className="p-3 rounded-lg bg-success-50">
                            <FiUserPlus className="w-6 h-6 text-success-600" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-500">{t('users.activeToday')}</p>
                            <p className="text-2xl font-bold text-gray-900">{activeToday}</p>
                        </div>
                    </div>
                </div>
                <div className="card">
                    <div className="flex items-center">
                        <div className="p-3 rounded-lg bg-warning-50">
                            <FiUserPlus className="w-6 h-6 text-warning-600" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-500">{t('users.newThisWeek')}</p>
                            <p className="text-2xl font-bold text-gray-900">{newThisWeek}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Edit User Modal */}
            {showEditModal && editingUser && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-bold text-gray-900">Edit User</h3>
                            <button onClick={() => { setShowEditModal(false); setEditingUser(null); }} className="p-1 hover:bg-gray-100 rounded-lg">
                                <FiX className="w-5 h-5 text-gray-400" />
                            </button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                                <input
                                    type="text"
                                    value={editForm.username}
                                    onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                                    className="input w-full"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                <input
                                    type="email"
                                    value={editForm.email}
                                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                                    className="input w-full"
                                />
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 mt-6">
                            <button onClick={() => { setShowEditModal(false); setEditingUser(null); }} className="btn btn-outline">Cancel</button>
                            <button onClick={handleSaveUser} className="btn btn-primary">Save Changes</button>
                        </div>
                    </div>
                </div>
            )}

            {/* QR Verification Modal */}
            <QRModal
                isOpen={showQRModal}
                onClose={() => setShowQRModal(false)}
                sessionId={qrSessionId}
                isVerified={isQrVerified}
            />
        </div>
    );
};

export default Users;