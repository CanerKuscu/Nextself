import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FiMail, FiLock, FiUser, FiAlertCircle } from 'react-icons/fi';
import { auth, supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

const Register = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: '',
        fullName: '',
        userType: 'pt', // 'pt' or 'dietitian'
    });
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const validateForm = () => {
        const newErrors: Record<string, string> = {};

        if (!formData.fullName.trim()) {
            newErrors.fullName = 'Full Name is required';
        }

        if (!formData.email) {
            newErrors.email = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'Email is invalid';
        }

        if (!formData.password) {
            newErrors.password = 'Password is required';
        } else if (formData.password.length < 6) {
            newErrors.password = 'Password must be at least 6 characters';
        }

        if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setLoading(true);

        try {
            // 1. Sign up user in Supabase Auth
            const { data, error: signUpError } = await (auth as any).signUp(formData.email, formData.password);

            if (signUpError) {
                if (signUpError.message.includes('User already registered')) {
                    throw new Error('This email is already registered.');
                }
                throw signUpError;
            }

            // In some Supabase setups, signUp returns data.user directly or data.session
            const user = data?.user || (data?.session?.user);

            if (user) {
                // 2. Insert into profiles table
                const { error: profileError } = await supabase
                    .from('profiles')
                    .insert([
                        {
                            id: user.id,
                            email: formData.email,
                            full_name: formData.fullName,
                            user_type: formData.userType,
                            is_onboarded: true, // Auto-onboard for professionals as a default for web
                            created_at: new Date().toISOString(),
                        }
                    ]);

                if (profileError) {
                    console.error('Profile creation error:', profileError);
                    throw new Error('Failed to create user profile. Please try again.');
                }

                toast.success('Registration successful! You can now log in.');
                navigate('/login');
            } else {
                toast.success('Registration successful! Please check your email to verify your account.');
                navigate('/login');
            }
        } catch (error: any) {
            console.error('Registration error:', error?.message || error);
            toast.error(error?.message || 'Failed to register account.');
            setErrors({
                ...errors,
                general: error?.message || 'Failed to register account.',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement> | { target: { name: string; value: string } }) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value,
        }));
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
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">Join NextSelf Professional</h2>
                    <p className="text-gray-500">Create your Personal Trainer or Dietitian account</p>
                </div>

                {/* Registration form */}
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

                        {/* User Type Selection */}
                        <div>
                            <label className="label mb-2 block">I am a...</label>
                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    type="button"
                                    onClick={() => handleChange({ target: { name: 'userType', value: 'pt' } })}
                                    className={`py-2 px-4 rounded-xl border-2 transition-all ${formData.userType === 'pt'
                                            ? 'border-primary-500 bg-primary-50 text-primary-700 font-semibold'
                                            : 'border-gray-200 text-gray-600 hover:border-primary-200'
                                        }`}
                                >
                                    Personal Trainer
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleChange({ target: { name: 'userType', value: 'dietitian' } })}
                                    className={`py-2 px-4 rounded-xl border-2 transition-all ${formData.userType === 'dietitian'
                                            ? 'border-primary-500 bg-primary-50 text-primary-700 font-semibold'
                                            : 'border-gray-200 text-gray-600 hover:border-primary-200'
                                        }`}
                                >
                                    Dietitian
                                </button>
                            </div>
                        </div>

                        <div>
                            <label htmlFor="fullName" className="label">Full Name</label>
                            <div className="relative mt-1">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <FiUser className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    id="fullName"
                                    name="fullName"
                                    type="text"
                                    required
                                    value={formData.fullName}
                                    onChange={handleChange}
                                    className={`appearance-none block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 ${errors.fullName ? 'input-error' : ''}`}
                                    placeholder="John Doe"
                                />
                            </div>
                            {errors.fullName && <p className="mt-1 text-sm text-danger-600">{errors.fullName}</p>}
                        </div>


                        <div>
                            <label htmlFor="email" className="label">Email address</label>
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
                                    placeholder="professional@nextself.com"
                                />
                            </div>
                            {errors.email && <p className="mt-1 text-sm text-danger-600">{errors.email}</p>}
                        </div>

                        <div>
                            <label htmlFor="password" className="label">Password</label>
                            <div className="relative mt-1">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <FiLock className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    autoComplete="new-password"
                                    required
                                    value={formData.password}
                                    onChange={handleChange}
                                    className={`appearance-none block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 ${errors.password ? 'input-error' : ''}`}
                                    placeholder="••••••••"
                                />
                            </div>
                            {errors.password && <p className="mt-1 text-sm text-danger-600">{errors.password}</p>}
                        </div>

                        <div>
                            <label htmlFor="confirmPassword" className="label">Confirm Password</label>
                            <div className="relative mt-1">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <FiLock className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    type="password"
                                    autoComplete="new-password"
                                    required
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    className={`appearance-none block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 ${errors.confirmPassword ? 'input-error' : ''}`}
                                    placeholder="••••••••"
                                />
                            </div>
                            {errors.confirmPassword && <p className="mt-1 text-sm text-danger-600">{errors.confirmPassword}</p>}
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
                                        Registering...
                                    </>
                                ) : (
                                    'Create Account'
                                )}
                            </button>
                        </div>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-sm text-gray-600">
                            Already have an account?{' '}
                            <Link to="/login" className="font-medium text-primary-600 hover:text-primary-500">
                                Sign in here
                            </Link>
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div className="text-center">
                    <p className="text-sm text-gray-600">
                        &copy; {new Date().getFullYear()} NextSelf. All rights reserved.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Register;
