import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Link } from 'react-router-dom';

type Props = { children: ReactNode };
type State = { hasError: boolean };

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // In the future, send this to Sentry/LogRocket
    console.error('Uncaught app error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-bg p-4">
          <div className="max-w-md text-center space-y-4">
            <h1 className="font-serif text-3xl font-semibold text-text-primary">Something went wrong.</h1>
            <p className="text-text-secondary">
              The application encountered an unexpected error. Please try refreshing the page.
            </p>
            <Link
              to="/"
              onClick={() => this.setState({ hasError: false })}
              className="inline-block px-4 py-2 bg-accent text-white rounded hover:bg-accent-hover transition-colors"
            >
              Back to Home
            </Link>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}