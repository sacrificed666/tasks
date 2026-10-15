import { Component, type ReactNode } from "react";

import ErrorScreen from "./ErrorScreen";

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

// Shows the error screen instead of a blank page when rendering fails
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  override state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
    return { error: error instanceof Error ? error : new Error(String(error)) };
  }

  override render() {
    return this.state.error ? <ErrorScreen error={this.state.error} /> : this.props.children;
  }
}

export default ErrorBoundary;
