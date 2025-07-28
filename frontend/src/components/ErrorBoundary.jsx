import React from 'react';  // React library import
import { RiErrorWarningLine, RiRefreshLine } from "react-icons/ri";  // React library import
import { Button } from "flowbite-react";  // React library import

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError() {
  // Update state so the next render will show the fallback UI
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
  // Log the error to console in development
        if (process.env.NODE_ENV === 'development') {
            console.error('Error caught by boundary:', error, errorInfo);
        }
        
        this.setState({  // State update
            error: error,
            errorInfo: errorInfo
        });
    }

    render() {
        if (this.state.hasError) {
            return (  // JSX return statement
                <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                    <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
                        <div className="mb-6">
                            <RiErrorWarningLine className="mx-auto h-16 w-16 text-red-500" />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                            Oops! Something went wrong
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400 mb-6">
                            We're sorry, but something unexpected happened. Please try refreshing the page.
                        </p>
                        <div className="space-y-3">
                            <Button 
                                onClick={() => window.location.reload()}  // Event handler assignment
                                className="w-full"
                                color="blue"
                            >
                                <RiRefreshLine className="mr-2 h-4 w-4" />
                                Refresh Page
                            </Button>
                            <Button 
                                onClick={() => window.location.href = '/library'}  // Event handler assignment
                                color="gray"
                                className="w-full"
                            >
                                Go to Library
                            </Button>
                        </div>
                        {process.env.NODE_ENV === 'development' && this.state.error && (
                            <details className="mt-6 text-left">
                                <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                                    Error Details (Development)
                                </summary>
                                <pre className="mt-2 text-xs bg-gray-100 dark:bg-gray-700 p-3 rounded overflow-auto">
                                    {this.state.error.toString()}
                                    {this.state.errorInfo.componentStack}
                                </pre>
                            </details>
                        )}
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;  // Export for use in other modules
