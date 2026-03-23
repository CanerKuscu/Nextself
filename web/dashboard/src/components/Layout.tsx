import React, { useState } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FiHome, FiUsers, FiActivity, FiPieChart, FiSettings, FiLogOut, FiMenu, FiX, FiMessageSquare, FiClipboard, FiFileText, FiCalendar, FiAward, FiTrendingUp } from 'react-icons/fi';
import { MdFastfood } from 'react-icons/md';
import { supabase } from '../lib/supabase';
import ErrorBoundary from './ErrorBoundary';

const Layout = ({ session }) => {
    const { t, i18n } = useTranslation();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const location = useLocation();

    const handleLogout = async () => {
        await supabase.auth.signOut();
        window.location.href = '/login';
    };

    const navigation = [
        { name: t('sidebar.dashboard'), href: '/', icon: FiHome },
        { name: t('sidebar.users'), href: '/users', icon: FiUsers },
        { name: t('sidebar.calendar'), href: '/calendar', icon: FiCalendar },
        { name: t('sidebar.assignments'), href: '/assignments', icon: FiClipboard },
        { name: t('sidebar.messages'), href: '/messages', icon: FiMessageSquare },
        { name: t('sidebar.courses'), href: '/courses', icon: FiAward },
        { name: t('sidebar.workouts'), href: '/workouts', icon: FiActivity },
        { name: t('sidebar.nutrition'), href: '/nutrition', icon: MdFastfood },
        { name: t('sidebar.progress'), href: '/progress', icon: FiTrendingUp },
        { name: t('sidebar.analytics'), href: '/analytics', icon: FiPieChart },
        { name: t('sidebar.legal'), href: '/legal', icon: FiFileText },
        { name: t('sidebar.settings'), href: '/settings', icon: FiSettings },
    ];

    const getPageTitle = () => {
        const path = location.pathname;
        if (path === '/') { return t('sidebar.dashboard'); }
        const found = navigation.find(n => n.href === path);
        return found ? found.name : t('sidebar.dashboard');
    };

    const SidebarContent = () => (
        <div className="flex flex-col h-full">
            {/* Logo */}
            <div className="flex items-center h-16 px-6 border-b border-gray-200">
                <div className="flex items-center">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-primary-600 to-secondary-600"></div>
                    <span className="ml-3 text-xl font-bold text-gray-900">NextSelf</span>
                    <span className="ml-2 text-xs font-medium text-primary-600 bg-primary-50 px-2 py-1 rounded">Pro</span>
                </div>
            </div>

            {/* User info */}
            <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                        <span className="text-primary-700 font-semibold">
                            {session?.user?.email?.charAt(0).toUpperCase() || 'A'}
                        </span>
                    </div>
                    <div className="ml-3 overflow-hidden">
                        <p className="text-sm font-medium text-gray-900 truncate">
                            {session?.user?.email || t('common.professional')}
                        </p>
                        <p className="text-xs text-gray-500">{t('common.roleLabel')}</p>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
                {navigation.map((item) => {
                    const Icon = item.icon;
                    const isActive = item.href === '/'
                        ? location.pathname === '/'
                        : location.pathname.startsWith(item.href);
                    return (
                        <NavLink
                            key={item.name}
                            to={item.href}
                            onClick={() => setSidebarOpen(false)}
                            className={`flex items-center px-4 py-3 rounded-lg transition-colors duration-200 group ${isActive
                                ? 'bg-primary-50 text-primary-700'
                                : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                                }`}
                        >
                            <Icon className={`w-5 h-5 mr-3 ${isActive ? 'text-primary-600' : 'text-gray-400 group-hover:text-gray-600'
                                }`} />
                            <span className="text-sm font-medium">{item.name}</span>
                            {isActive && (
                                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary-600"></div>
                            )}
                        </NavLink>
                    );
                })}
            </nav>

            {/* Logout button */}
            <div className="p-4 border-t border-gray-200">
                <button
                    onClick={handleLogout}
                    className="flex items-center w-full px-4 py-3 rounded-lg text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors duration-200"
                >
                    <FiLogOut className="w-5 h-5 mr-3" />
                    <span className="text-sm font-medium">{t('sidebar.logout')}</span>
                </button>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Mobile overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                ></div>
            )}

            {/* Sidebar - Mobile */}
            <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-sidebar transform transition-transform duration-300 lg:hidden ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
                }`}>
                <SidebarContent />
            </div>

            {/* Sidebar - Desktop */}
            <div className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-50 lg:w-64 lg:block bg-white shadow-sidebar">
                <SidebarContent />
            </div>

            {/* Main content */}
            <div className="lg:pl-64">
                {/* Header */}
                <header className="sticky top-0 z-40 bg-white border-b border-gray-200">
                    <div className="flex items-center justify-between h-16 px-4 sm:px-8">
                        <div className="flex items-center">
                            {/* Mobile menu button */}
                            <button
                                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg lg:hidden mr-3"
                                onClick={() => setSidebarOpen(!sidebarOpen)}
                            >
                                {sidebarOpen ? <FiX className="w-6 h-6" /> : <FiMenu className="w-6 h-6" />}
                            </button>
                            <div>
                                <h1 className="text-lg font-semibold text-gray-900">{getPageTitle()}</h1>
                                <p className="text-sm text-gray-500 hidden sm:block">{t('dashboard.welcome')}</p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-4">
                            {/* Language Switcher */}
                            <select
                                className="bg-gray-100 border-none text-sm rounded-lg focus:ring-primary-500"
                                value={i18n.language}
                                onChange={(e) => i18n.changeLanguage(e.target.value)}
                            >
                                <option value="en">EN</option>
                                <option value="tr">TR</option>
                                <option value="ru">RU</option>
                            </select>

                            <div className="relative">
                                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                                    <span className="text-sm font-medium text-gray-700">
                                        {session?.user?.email?.charAt(0).toUpperCase() || 'A'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Page content */}
                <main className="p-4 sm:p-8">
                    <ErrorBoundary>
                        <Outlet />
                    </ErrorBoundary>
                </main>
            </div>
        </div>
    );
};

export default Layout;
