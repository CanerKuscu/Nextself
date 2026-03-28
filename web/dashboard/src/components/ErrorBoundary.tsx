import React, { ErrorInfo, ReactNode } from 'react';
import { FiAlertTriangle, FiRefreshCw } from 'react-icons/fi';

interface Props {
    children?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error, errorInfo: null };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        this.setState({
            error: error,
            errorInfo: errorInfo
        });

        // Log error to error reporting service
        console.error('ErrorBoundary caught an error');
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null, errorInfo: null });
        window.location.reload();
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                    <div className="max-w-md w-full">
                        <div className="card text-center">
                            <div className="mx-auto w-16 h-16 rounded-full bg-danger-50 flex items-center justify-center mb-6">
                                <FiAlertTriangle className="w-8 h-8 text-danger-600" />
                            </div>

                            <h2 className="text-2xl font-bold text-gray-900 mb-2">
                                Something went wrong
                            </h2>

                            <p className="text-gray-600 mb-6">
                                We apologize for the inconvenience. An error has occurred in the application.
                            </p>

                            <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
                                <p className="text-sm font-medium text-gray-700 mb-2">Error details:</p>
                                <code className="text-xs text-gray-600 font-mono break-all">
                                    An unexpected error occurred. Please try reloading the page.
                                </code>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-3">
                                <button
                                    onClick={this.handleReset}
                                    className="btn btn-primary flex-1 flex items-center justify-center"
                                >
                                    <FiRefreshCw className="w-4 h-4 mr-2" />
                                    Reload Application
                                </button>

                                <button
                                    onClick={() => window.history.back()}
                                    className="btn btn-outline flex-1"
                                >
                                    Go Back
                                </button>
                            </div>

                            <div className="mt-6 pt-6 border-t border-gray-200">
                                <p className="text-sm text-gray-500">
                                    If the problem persists, please contact support.
                                </p>
                                <button
                                    onClick={() => window.location.href = 'mailto:app.nextself@gmail.com'}
                                    className="mt-2 text-sm text-primary-600 hover:text-primary-700 font-medium"
                                >
                                    Contact Support
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;