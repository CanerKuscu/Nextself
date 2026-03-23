import React, { useState, useEffect, Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './lib/supabase';
import { Session } from '@supabase/supabase-js';
import Layout from './components/Layout';
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Users = lazy(() => import('./pages/Users'));
const Workouts = lazy(() => import('./pages/Workouts'));
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
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);
    const [authorized, setAuthorized] = useState(false);

    /** Check whether the current user has a professional role (PT or Dietitian). */
    const checkRole = async (userId: string) => {
        if (!userId) { setAuthorized(false); return; }
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('user_type')
                .eq('id', userId)
                .single();
            if (error || !data) { 
                console.error('Failed to fetch user role:', error);
                setAuthorized(false); 
                return; 
            }
            const role = (data.user_type || '').toLowerCase();
            setAuthorized(role === 'pt' || role === 'dietitian' || role === 'admin');
        } catch (error) {
            console.error('Exception occurred while checking role:', error);
            setAuthorized(false);
        }
    };

    useEffect(() => {
        let isMounted = true;

        // Check active session
        supabase.auth.getSession().then(async ({ data: { session } }) => {
            if (!isMounted) { return; }
            setSession(session);
            if (session?.user?.id) {
                await checkRole(session.user.id);
            }
            if (isMounted) { setLoading(false); }
        });

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            if (!isMounted) { return; }
            setSession(session);
            if (session?.user?.id) {
                await checkRole(session.user.id);
            } else {
                setAuthorized(false);
            }
        });

        return () => {
            isMounted = false;
            subscription.unsubscribe();
        };
    }, []);

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
                        onClick={() => supabase.auth.signOut()}
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