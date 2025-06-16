'use client'

import React from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error?: Error; resetError: () => void }>;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to monitoring service in production
    if (process.env.NODE_ENV === 'production') {
      console.error('Error caught by boundary:', error, errorInfo);
      // TODO: Send to error monitoring service (Sentry, LogRocket, etc.)
    }
  }

  resetError = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return <FallbackComponent error={this.state.error} resetError={this.resetError} />;
      }

      return <DefaultErrorFallback error={this.state.error} resetError={this.resetError} />;
    }

    return this.props.children;
  }
}

const DefaultErrorFallback: React.FC<{ error?: Error; resetError: () => void }> = ({ 
  error, 
  resetError 
}) => {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6">
      <div className="brutalist-card brutalist-card-white max-w-md w-full p-8 text-center">
        <div className="mb-6">
          <div className="inline-flex h-16 w-16 items-center justify-center bg-red-500 border-4 border-black shadow-brutalist mb-4">
            <AlertCircle className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-black text-black mb-2 font-retro uppercase">
            Something went wrong
          </h1>
          <p className="text-black font-bold">
            We encountered an unexpected error. Don't worry, your data is safe.
          </p>
        </div>

        {process.env.NODE_ENV === 'development' && error && (
          <div className="mb-6 p-4 bg-gray border-3 border-black text-left">
            <p className="text-xs text-black font-bold break-all">
              {error.message}
            </p>
          </div>
        )}

        <div className="space-y-3">
          <button
            onClick={resetError}
            className="brutalist-button brutalist-button-primary brutalist-button-full"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </button>
          
          <Link 
            href="/"
            className="brutalist-button brutalist-button-secondary brutalist-button-full"
          >
            <Home className="h-4 w-4 mr-2" />
            Go Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ErrorBoundary; 