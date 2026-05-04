'use client';

import { Component, ReactNode } from 'react';

interface Props { children: ReactNode }
interface State { hasError: boolean; message: string }

export class ErrorBoundary extends Component<Props, State> {
    state: State = { hasError: false, message: '' };

    static getDerivedStateFromError(error: unknown): State {
        return { hasError: true, message: error instanceof Error ? error.message : 'Unknown error' };
    }

    componentDidCatch(error: unknown, info: { componentStack: string }) {
        console.error('[ErrorBoundary]', error, info.componentStack);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center">
                    <p className="text-lg font-semibold text-slate-800 dark:text-slate-200">Something went wrong</p>
                    <p className="max-w-md text-sm text-slate-500 dark:text-slate-400">{this.state.message}</p>
                    <button
                        onClick={() => this.setState({ hasError: false, message: '' })}
                        className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
                    >
                        Try again
                    </button>
                </div>
            );
        }
        return this.props.children;
    }
}
