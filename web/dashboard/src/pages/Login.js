import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FiMail, FiLock, FiAlertCircle } from 'react-icons/fi';
import { auth } from '../lib/supabase';
import toast from 'react-hot-toast';

const Login = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});

    const validateForm = () => {
        const newErrors = {};

        if (!formData.email) {
            newErrors.email = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'Email is invalid';
        }

        if (!formData.password) {
            newErrors.password = 'Password is required';
        } else if (formData.password.length < 8) {
            newErrors.password = 'Password must be at least 8 characters';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setLoading(true);

        try {
            const { data, error } = await auth.signIn(formData.email, formData.password);

            if (error) {
                throw error;
            }

            if (data?.session) {
                toast.success('Login successful!');
                navigate('/');
            }
        } catch (error) {
            console.error('Login error:', error?.message || error);
            // Don't expose raw auth error messages to UI
            toast.error('Invalid email or password.');
            setErrors({
                ...errors,
                general: 'Invalid email or password',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value,
        }));
        // Clear error when user starts typing
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: '',
            }));
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                {/* Logo and header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-600 to-secondary-600 mb-6 shadow-glow animate-float"></div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">BioSync Professional</h2>
                    <p className="text-gray-500">Sign in to the Personal Trainer & Dietitian Dashboard</p>
                </div>

                {/* Login form */}
                <div className="card">
                    <form className="space-y-6" onSubmit={handleSubmit}>
                        {errors.general && (
                            <div className="rounded-lg bg-danger-50 p-4">
                                <div className="flex">
                                    <FiAlertCircle className="h-5 w-5 text-danger-600" />
                                    <div className="ml-3">
                                        <p className="text-sm font-medium text-danger-800">
                                            {errors.general}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div>
                            <label htmlFor="email" className="label">
                                Email address
                            </label>
                            <div className="relative mt-1">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <FiMail className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    value={formData.email}
                                    onChange={handleChange}
                                    className={`appearance-none block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 ${errors.email ? 'input-error' : ''}`}
                                    placeholder="professional@biosync.com"
                                />
                            </div>
                            {errors.email && (
                                <p className="mt-1 text-sm text-danger-600">{errors.email}</p>
                            )}
                        </div>

                        <div>
                            <label htmlFor="password" className="label">
                                Password
                            </label>
                            <div className="relative mt-1">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <FiLock className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    autoComplete="current-password"
                                    required
                                    value={formData.password}
                                    onChange={handleChange}
                                    className={`appearance-none block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 ${errors.password ? 'input-error' : ''}`}
                                    placeholder="••••••••"
                                />
                            </div>
                            {errors.password && (
                                <p className="mt-1 text-sm text-danger-600">{errors.password}</p>
                            )}
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <input
                                    id="remember-me"
                                    name="remember-me"
                                    type="checkbox"
                                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                                />
                                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                                    Remember me
                                </label>
                            </div>

                            <div className="text-sm">
                                <button
                                    type="button"
                                    onClick={async () => {
                                        if (!formData.email) {
                                            setErrors(prev => ({ ...prev, email: 'Enter your email first' }));
                                            return;
                                        }
                                        try {
                                            const { error } = await auth.resetPassword(formData.email);
                                            if (error) { throw error; }
                                            toast.success('Password reset email sent! Check your inbox.');
                                        } catch (err) {
                                            toast.error(err.message || 'Failed to send reset email');
                                        }
                                    }}
                                    className="font-medium text-primary-600 hover:text-primary-500"
                                >
                                    Forgot your password?
                                </button>
                            </div>
                        </div>

                        <div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="btn btn-primary w-full flex justify-center py-3 px-4"
                            >
                                {loading ? (
                                    <>
                                        <div className="loading-spinner w-5 h-5 mr-2 border-2"></div>
                                        Signing in...
                                    </>
                                ) : (
                                    'Sign in'
                                )}
                            </button>
                        </div>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-sm text-gray-600">
                            Don&apos;t have an account?{' '}
                            <Link to="/register" className="font-medium text-primary-600 hover:text-primary-500">
                                Register here
                            </Link>
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div className="text-center">
                    <p className="text-sm text-gray-600">
                        &copy; {new Date().getFullYear()} BioSync. All rights reserved.
                    </p>
                    <p className="text-center text-xs text-gray-400 mt-2 max-w-sm mx-auto">
                        This is a secure professional panel for BioSync Personal Trainers and Dietitians.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;