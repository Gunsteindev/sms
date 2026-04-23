'use client';

import { useState, useRef } from 'react';
import { Sparkles, X, RefreshCw, AlertCircle } from 'lucide-react';
import { Button } from './Button';

interface Props {
    type: string;
    getData: () => unknown;
}

type State = 'idle' | 'loading' | 'done' | 'error';

export function AISummary({ type, getData }: Props) {
    const [state, setState]   = useState<State>('idle');
    const [text, setText]     = useState('');
    const [error, setError]   = useState('');
    const [open, setOpen]     = useState(false);
    const abortRef            = useRef<AbortController | null>(null);

    const generate = async () => {
        abortRef.current?.abort();
        abortRef.current = new AbortController();
        setOpen(true);
        setState('loading');
        setText('');
        setError('');

        try {
            const res = await fetch('/api/ai/summary', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type, data: getData() }),
                signal: abortRef.current.signal,
            });

            if (!res.ok) {
                const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
                throw new Error(err.error ?? 'Request failed');
            }

            const reader = res.body?.getReader();
            if (!reader) throw new Error('No response body');

            const decoder = new TextDecoder();
            setState('done');
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                setText(prev => prev + decoder.decode(value, { stream: true }));
            }
        } catch (err: any) {
            if (err.name === 'AbortError') return;
            setState('error');
            setError(err.message ?? 'Failed to generate summary');
        }
    };

    const dismiss = () => {
        abortRef.current?.abort();
        setOpen(false);
        setState('idle');
        setText('');
    };

    return (
        <div className="w-full">
            {!open && (
                <button
                    onClick={generate}
                    className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors group"
                >
                    <span className="flex items-center justify-center h-7 w-7 rounded-lg bg-blue-50 dark:bg-blue-900/30 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/50 transition-colors">
                        <Sparkles className="h-3.5 w-3.5" />
                    </span>
                    Generate AI Summary
                </button>
            )}

            {open && (
                <div className="rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50/60 dark:bg-blue-900/20 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300 font-medium text-sm">
                            <Sparkles className="h-4 w-4" />
                            AI Summary
                        </div>
                        <div className="flex items-center gap-1">
                            <Button
                                variant="ghost" size="icon"
                                onClick={generate}
                                title="Regenerate"
                                disabled={state === 'loading'}
                                className="h-7 w-7 text-blue-500 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-200 hover:bg-blue-100 dark:hover:bg-blue-900/40"
                            >
                                <RefreshCw className={`h-3.5 w-3.5 ${state === 'loading' ? 'animate-spin' : ''}`} />
                            </Button>
                            <Button
                                variant="ghost" size="icon"
                                onClick={dismiss}
                                title="Dismiss"
                                className="h-7 w-7 text-blue-400 dark:text-blue-500 hover:text-blue-700 dark:hover:text-blue-200 hover:bg-blue-100 dark:hover:bg-blue-900/40"
                            >
                                <X className="h-3.5 w-3.5" />
                            </Button>
                        </div>
                    </div>

                    {state === 'loading' && !text && (
                        <div className="flex items-center gap-2 text-sm text-blue-500 dark:text-blue-400">
                            <div className="flex gap-1">
                                <span className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-bounce [animation-delay:0ms]" />
                                <span className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-bounce [animation-delay:150ms]" />
                                <span className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-bounce [animation-delay:300ms]" />
                            </div>
                            Analyzing data…
                        </div>
                    )}

                    {state === 'error' && (
                        <div className="flex items-start gap-2 text-sm text-red-600 dark:text-red-400">
                            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    {text && (
                        <div className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                            {text}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
