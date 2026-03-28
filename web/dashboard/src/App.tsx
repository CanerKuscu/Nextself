import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { auth } from './lib/supabase';
import { useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import { isSupabaseConfigured } from './services/api/client';
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Users = lazy(() => import('./pages/Users'));
const Workouts = lazy(() => import('./pages/Workouts'));
const WorkoutBuilder = lazy(() => import('./pages/WorkoutBuilder'));
const Nutrition = lazy(() => import('./pages/Nutrition'));
const Analytics = lazy(() => import('./pages/Analytics'));
const Settings = lazy(() => import('./pages/Settings'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Assignments = lazy(() => import('./pages/Assignments'));
const Messages = lazy(() => import('./pages/Messages'));
const LegalAgreements = lazy(() => import('./pages/LegalAgreements'));
const Courses = lazy(() => import('./pages/Courses'));
const Calendar = lazy(() => import('./pages/Calendar'));
const ProgressReports = lazy(() => import('./pages/ProgressReports'));
const Billing = lazy(() => import('./pages/Billing'));
const Ratings = lazy(() => import('./pages/Ratings'));
const ServiceListing = lazy(() => import('./pages/ServiceListing'));

function App() {
    const { session, authorized, loading } = useAuth();

    if (!isSupabaseConfigured) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
                <div className="w-full max-w-xl rounded-2xl border border-amber-200 bg-amber-50 p-6">
                    <h2 className="text-xl font-bold text-amber-900">Configuration Required</h2>
                    <p className="mt-2 text-sm text-amber-800">
                        VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are missing. Add these variables to web/dashboard/.env and restart the app.
                    </p>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="loading-spinner w-12 h-12 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    // User is logged in but NOT a professional – show an access denied page
    if (session && !authorized) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center max-w-md p-8">
                    <div className="text-5xl mb-4">🚫</div>
                    <h2 className="text-xl font-bold text-gray-800 mb-2">Access Denied</h2>
                    <p className="text-gray-600 mb-6">This dashboard is only available to PT and Dietitian accounts. Please log in with a professional account.</p>
                    <button
                        onClick={() => auth.signOut()}
                        className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
                    >
                        Sign Out
                    </button>
                </div>
            </div>
        );
    }

    return (
        <Routes>
            <Route path="/login" element={!session ? <Suspense fallback={<div>Loading...</div>}><Login /></Suspense> : <Navigate to="/" />} />
            <Route path="/register" element={!session ? <Suspense fallback={<div>Loading...</div>}><Register /></Suspense> : <Navigate to="/" />} />
            <Route path="/*" element={session ? <Layout session={session} /> : <Navigate to="/login" />}>
                <Route index element={<Suspense fallback={<div>Loading...</div>}><Dashboard /></Suspense>} />
                <Route path="users" element={<Suspense fallback={<div>Loading...</div>}><Users /></Suspense>} />
                <Route path="assignments" element={<Suspense fallback={<div>Loading...</div>}><Assignments /></Suspense>} />
                <Route path="messages" element={<Suspense fallback={<div>Loading...</div>}><Messages /></Suspense>} />
                <Route path="workouts" element={<Suspense fallback={<div>Loading...</div>}><Workouts /></Suspense>} />
                <Route path="workouts/builder" element={<Suspense fallback={<div>Loading...</div>}><WorkoutBuilder /></Suspense>} />
                <Route path="nutrition" element={<Suspense fallback={<div>Loading...</div>}><Nutrition /></Suspense>} />
                <Route path="analytics" element={<Suspense fallback={<div>Loading...</div>}><Analytics /></Suspense>} />
                <Route path="courses" element={<Suspense fallback={<div>Loading...</div>}><Courses /></Suspense>} />
                <Route path="calendar" element={<Suspense fallback={<div>Loading...</div>}><Calendar /></Suspense>} />
                <Route path="progress" element={<Suspense fallback={<div>Loading...</div>}><ProgressReports /></Suspense>} />
                <Route path="billing" element={<Suspense fallback={<div>Loading...</div>}><Billing /></Suspense>} />
                <Route path="ratings" element={<Suspense fallback={<div>Loading...</div>}><Ratings /></Suspense>} />
                <Route path="services" element={<Suspense fallback={<div>Loading...</div>}><ServiceListing /></Suspense>} />
                <Route path="settings" element={<Suspense fallback={<div>Loading...</div>}><Settings /></Suspense>} />
                <Route path="legal" element={<Suspense fallback={<div>Loading...</div>}><LegalAgreements /></Suspense>} />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
        </Routes>
    );
}

export default App;
