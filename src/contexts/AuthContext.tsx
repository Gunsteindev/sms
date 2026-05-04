'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Toaster } from 'react-hot-toast';

export interface SessionUser {
    email: string;
    name: string;
    role: string;
}

interface Session {
    user: SessionUser;
    expires: string;
}

type Status = 'loading' | 'authenticated' | 'unauthenticated';

interface SessionContextValue {
    data: Session | null;
    status: Status;
    update: () => Promise<void>;
}

const SessionContext = createContext<SessionContextValue>({
    data: null,
    status: 'loading',
    update: async () => {},
});

export function useSession() {
    return useContext(SessionContext);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [data, setData]     = useState<Session | null>(null);
    const [status, setStatus] = useState<Status>('loading');

    const fetchSession = useCallback(async () => {
        try {
            const res = await fetch('/api/auth/session', { credentials: 'include' });
            if (!res.ok) { setData(null); setStatus('unauthenticated'); return; }
            const json = await res.json();
            if (json?.user) {
                setData(json as Session);
                setStatus('authenticated');
            } else {
                setData(null);
                setStatus('unauthenticated');
            }
        } catch {
            setData(null);
            setStatus('unauthenticated');
        }
    }, []);

    useEffect(() => {
        fetch('/api/auth/session', { credentials: 'include' })
            .then(res => res.ok ? res.json() : null)
            .then(json => {
                if (json?.user) { setData(json as Session); setStatus('authenticated'); }
                else            { setData(null); setStatus('unauthenticated'); }
            })
            .catch(() => { setData(null); setStatus('unauthenticated'); });
    }, []);

    return (
        <SessionContext.Provider value={{ data, status, update: fetchSession }}>
        {children}
        <Toaster
            position="top-right"
            toastOptions={{
            style: { borderRadius: 8, fontSize: 13 },
            success: { iconTheme: { primary: '#22c55e', secondary: '#fff' } },
            error:   { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
            }}
        />
        </SessionContext.Provider>
    );
}
