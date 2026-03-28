import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import ErrorBoundary from './components/ErrorBoundary';
import './i18n';
import './index.css';
import App from './App';
import { AuthProvider } from './contexts/AuthContext';

const container = document.getElementById('root');
if (!container) {
    throw new Error('Root element not found');
}

const root = ReactDOM.createRoot(container);
root.render(
    <React.StrictMode>
        <ErrorBoundary>
            <AuthProvider>
                <BrowserRouter>
                    <App />
                    <Toaster
                        position="top-right"
                        toastOptions={{
                            duration: 4000,
                            style: {
                                background: '#363636',
                                color: '#fff',
                            },
                            success: {
                                duration: 3000,
                                iconTheme: {
                                    primary: '#10b981',
                                    secondary: '#fff',
                                },
                            },
                            error: {
                                duration: 4000,
                                iconTheme: {
                                    primary: '#ef4444',
                                    secondary: '#fff',
                                },
                            },
                        }}
                    />
                </BrowserRouter>
            </AuthProvider>
        </ErrorBoundary>
    </React.StrictMode>
);
