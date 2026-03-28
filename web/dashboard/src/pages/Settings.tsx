import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { FiSettings, FiBell, FiShield, FiDatabase, FiCheck, FiAlertTriangle } from 'react-icons/fi';
import { db, auth } from '../lib/supabase';

type SettingsState = {
    notifications: boolean;
    emailAlerts: boolean;
    darkMode: boolean;
    autoSave: boolean;
    language: string;
};

type SaveStatus = 'saving' | 'saved' | 'error' | null;
type SettingOption = { value: string; label: string };
type SettingItem = {
    key: keyof SettingsState | 'twoFactor' | 'dataExport';
    label: string;
    description: string;
    type: 'toggle' | 'select' | 'button';
    options?: SettingOption[];
    disabled?: boolean;
    action?: () => void;
};
type SettingGroup = { title: string; icon: any; settings: SettingItem[] };

const Settings = () => {
    const { i18n } = useTranslation();
    const [settings, setSettings] = useState<SettingsState>({
        notifications: true,
        emailAlerts: true,
        darkMode: false,
        autoSave: true,
        language: 'en',
    });
    const [saveStatus, setSaveStatus] = useState<SaveStatus>(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showResetConfirm, setShowResetConfirm] = useState(false);
    const settingsKeys: Array<keyof SettingsState> = ['notifications', 'emailAlerts', 'darkMode', 'autoSave', 'language'];
    const isSettingsKey = (key: string): key is keyof SettingsState => settingsKeys.includes(key as keyof SettingsState);

    const loadSettings = useCallback(async () => {
        try {
            const { data } = await db.getSettings();
            if (data) {
                setSettings(prev => ({ ...prev, ...data }));
                if (data.language) {
                    i18n.changeLanguage(data.language);
                }
            }
        } catch (err: any) {
            console.error('Failed to load settings:', err);
        }
    }, [i18n]);

    useEffect(() => {
        loadSettings();
    }, [loadSettings]);

    const persistSettings = useCallback(async (newSettings: SettingsState) => {
        setSaveStatus('saving');
        try {
            const { error } = await db.saveSettings(newSettings);
            if (error) { throw error; }
            setSaveStatus('saved');
            setTimeout(() => setSaveStatus(null), 2000);
        } catch (err: any) {
            console.error('Failed to save settings:', err);
            setSaveStatus('error');
            setTimeout(() => setSaveStatus(null), 3000);
        }
    }, []);

    const handleToggle = (key: keyof SettingsState) => {
        const current = settings[key];
        if (typeof current !== 'boolean') {
            return;
        }
        const newSettings: SettingsState = { ...settings, [key]: !current };
        setSettings(newSettings);
        if (newSettings.autoSave) { persistSettings(newSettings); }
    };

    const handleSelect = (key: keyof SettingsState, value: string) => {
        const newSettings: SettingsState = { ...settings, [key]: value };
        setSettings(newSettings);
        if (key === 'language') {
            i18n.changeLanguage(value);
        }
        if (newSettings.autoSave) { persistSettings(newSettings); }
    };

    const handleDeleteAccount = async () => {
        try {
            // Attempt server-side account deletion via RPC
            const { error } = await db.deleteOwnAccount();
            if (error) { throw error; }
            await auth.signOut();
            window.location.href = '/login';
        } catch (err: any) {
            console.error('Delete account failed:', err);
            alert('Failed to delete account. Please contact support.');
            setShowDeleteConfirm(false);
        }
    };

    const handleResetSettings = async () => {
        const defaults = { notifications: true, emailAlerts: true, darkMode: false, autoSave: true, language: 'en' };
        setSettings(defaults);
        await persistSettings(defaults);
        setShowResetConfirm(false);
    };

    const settingGroups: SettingGroup[] = [
        {
            title: 'General Settings',
            icon: FiSettings,
            settings: [
                {
                    key: 'language',
                    label: 'Language',
                    description: 'Select your preferred language',
                    type: 'select',
                    options: [
                        { value: 'en', label: 'English' },
                        { value: 'tr', label: 'Türkçe' },
                        { value: 'ru', label: 'Русский' },
                    ],
                },
                {
                    key: 'autoSave',
                    label: 'Auto Save',
                    description: 'Automatically save changes',
                    type: 'toggle',
                },
            ],
        },
        {
            title: 'Notifications',
            icon: FiBell,
            settings: [
                {
                    key: 'notifications',
                    label: 'Push Notifications',
                    description: 'Receive push notifications',
                    type: 'toggle',
                },
                {
                    key: 'emailAlerts',
                    label: 'Email Alerts',
                    description: 'Receive email alerts',
                    type: 'toggle',
                },
            ],
        },
        {
            title: 'Security',
            icon: FiShield,
            settings: [
                {
                    key: 'twoFactor',
                    label: 'Two-Factor Authentication',
                    description: 'Enable 2FA for extra security',
                    type: 'toggle',
                    disabled: true,
                },
            ],
        },
        {
            title: 'Data Management',
            icon: FiDatabase,
            settings: [
                {
                    key: 'dataExport',
                    label: 'Export Data',
                    description: 'Export your data',
                    type: 'button',
                    action: () => alert('Export initiated'),
                },
            ],
        },
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
                    <p className="text-gray-600">Configure your dashboard preferences</p>
                </div>
                <div className="flex items-center gap-3">
                    {saveStatus === 'saving' && <span className="text-sm text-blue-600 flex items-center gap-1"><FiSettings className="w-4 h-4 animate-spin" /> Saving...</span>}
                    {saveStatus === 'saved' && <span className="text-sm text-emerald-600 flex items-center gap-1"><FiCheck className="w-4 h-4" /> Saved</span>}
                    {saveStatus === 'error' && <span className="text-sm text-red-600 flex items-center gap-1"><FiAlertTriangle className="w-4 h-4" /> Save failed</span>}
                    {!settings.autoSave && (
                        <button onClick={() => persistSettings(settings)} className="btn btn-primary text-sm">
                            Save Changes
                        </button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {settingGroups.map((group, groupIndex) => {
                    const Icon = group.icon;
                    return (
                        <div key={groupIndex} className="card">
                            <div className="flex items-center mb-6">
                                <div className="p-2 rounded-lg bg-primary-50">
                                    <Icon className="w-5 h-5 text-primary-600" />
                                </div>
                                <h3 className="ml-3 text-lg font-semibold text-gray-900">{group.title}</h3>
                            </div>

                            <div className="space-y-6">
                                {group.settings.map((setting, settingIndex) => {
                                    const settingsKey = isSettingsKey(setting.key) ? setting.key : null;
                                    return <div key={settingIndex} className="flex items-center justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center">
                                                <h4 className="text-sm font-medium text-gray-900">
                                                    {setting.label}
                                                </h4>
                                                {setting.disabled && (
                                                    <span className="ml-2 px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded">
                                                        Coming Soon
                                                    </span>
                                                )}
                                            </div>
                                            <p className="mt-1 text-sm text-gray-500">
                                                {setting.description}
                                            </p>
                                        </div>

                                        <div className="ml-4">
                                            {setting.type === 'toggle' && settingsKey && typeof settings[settingsKey] === 'boolean' && (
                                                <button
                                                    onClick={() => !setting.disabled && handleToggle(settingsKey)}
                                                    disabled={setting.disabled}
                                                    className={`relative inline-flex h-6 w-11 items-center rounded-full ${settings[settingsKey] ? 'bg-primary-600' : 'bg-gray-200'
                                                        } ${setting.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                >
                                                    <span
                                                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${settings[settingsKey] ? 'translate-x-6' : 'translate-x-1'
                                                            }`}
                                                    />
                                                </button>
                                            )}

                                            {setting.type === 'select' && settingsKey && setting.options && (
                                                <select
                                                    value={String(settings[settingsKey])}
                                                    onChange={(e) => handleSelect(settingsKey, e.target.value)}
                                                    className="input py-1 text-sm"
                                                >
                                                    {setting.options.map((option: SettingOption) => (
                                                        <option key={option.value} value={option.value}>
                                                            {option.label}
                                                        </option>
                                                    ))}
                                                </select>
                                            )}

                                            {setting.type === 'button' && setting.action && (
                                                <button
                                                    onClick={setting.action}
                                                    className="btn btn-outline text-sm"
                                                >
                                                    Export
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ;})}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Danger zone */}
            <div className="card border-2 border-danger-200">
                <div className="flex items-center mb-6">
                    <div className="p-2 rounded-lg bg-danger-50">
                        <FiShield className="w-5 h-5 text-danger-600" />
                    </div>
                    <h3 className="ml-3 text-lg font-semibold text-danger-700">Danger Zone</h3>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h4 className="text-sm font-medium text-gray-900">Delete Account</h4>
                            <p className="mt-1 text-sm text-gray-500">
                                Permanently delete your account and all data
                            </p>
                        </div>
                        <button onClick={() => setShowDeleteConfirm(true)} className="btn btn-danger">
                            Delete Account
                        </button>
                    </div>

                    <div className="flex items-center justify-between">
                        <div>
                            <h4 className="text-sm font-medium text-gray-900">Reset All Settings</h4>
                            <p className="mt-1 text-sm text-gray-500">
                                Reset all settings to default values
                            </p>
                        </div>
                        <button onClick={() => setShowResetConfirm(true)} className="btn btn-outline">
                            Reset Settings
                        </button>
                    </div>
                </div>
            </div>

            {/* Delete Account Confirmation Modal */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 rounded-full bg-red-100">
                                <FiAlertTriangle className="w-6 h-6 text-red-600" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900">Delete Account</h3>
                        </div>
                        <p className="text-sm text-gray-600 mb-6">
                            Are you sure you want to permanently delete your account? This action cannot be undone and all your data will be lost.
                        </p>
                        <div className="flex justify-end gap-3">
                            <button onClick={() => setShowDeleteConfirm(false)} className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50">Cancel</button>
                            <button onClick={handleDeleteAccount} className="px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700">Yes, Delete Account</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Reset Settings Confirmation Modal */}
            {showResetConfirm && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 rounded-full bg-amber-100">
                                <FiAlertTriangle className="w-6 h-6 text-amber-600" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900">Reset Settings</h3>
                        </div>
                        <p className="text-sm text-gray-600 mb-6">
                            Are you sure you want to reset all settings to their default values?
                        </p>
                        <div className="flex justify-end gap-3">
                            <button onClick={() => setShowResetConfirm(false)} className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50">Cancel</button>
                            <button onClick={handleResetSettings} className="px-4 py-2 bg-amber-600 text-white rounded-xl text-sm font-semibold hover:bg-amber-700">Yes, Reset</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Settings;
