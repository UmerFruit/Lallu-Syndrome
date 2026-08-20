import { createContext, useContext, useState, useCallback, type ReactNode, useMemo } from 'react';
import { CheckCircle, AlertCircle, X } from 'lucide-react'

type ToastType = 'success' | 'error' | 'info';
type Toast = {
    id: string;
    message: string;
    type: ToastType;
};

type ToastContextValue = {
    toast: {
        success: (message: string) => void;
        error: (message: string) => void;
        info: (message: string) => void;
    };
};

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: Readonly<{ children: ReactNode }>) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const showToast = useCallback(
        (message: string, type: ToastType = 'info') => {
            const id = crypto.randomUUID();

            setToasts((prev) => [...prev, { id, message, type }]);

            setTimeout(() => {
                setToasts((prev) => prev.filter((t) => t.id !== id));
            }, 4000);
        },
        []
    );

    const removeToast = (id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    };

    const toastValue = useMemo(
        () => ({
            toast: {
                success: (message: string) => showToast(message, 'success'),
                error: (message: string) => showToast(message, 'error'),
                info: (message: string) => showToast(message, 'info'),
            },
        }),
        [showToast]
    );
    return (
        <ToastContext.Provider value={toastValue}>
            {children}

            {/* Toast Container */}
            <div className="pointer-events-none fixed bottom-4 left-4 right-4 z-[100] flex flex-col gap-3 sm:left-auto sm:bottom-6 sm:right-6">
                {toasts.map((t) => {
                    const toastClassNames: Record<ToastType, string> = {
                        error: 'bg-red-950/90 border-red-800 text-red-100',
                        success: 'bg-emerald-950/90 border-emerald-800 text-emerald-100',
                        info: 'bg-surface/90 border-border text-text-primary',
                    };

                    let toastIcon: ReactNode = null;
                    if (t.type === 'error') {
                        toastIcon = <AlertCircle size={18} className="text-red-400 shrink-0" />;
                    } else if (t.type === 'success') {
                        toastIcon = <CheckCircle size={18} className="text-emerald-400 shrink-0" />;
                    }

                    return <div
                        key={t.id}
                        className={`pointer-events-auto flex w-full items-center gap-3 rounded-lg border px-4 py-3 shadow-lg animate-slide-up backdrop-blur-sm sm:w-auto sm:min-w-[280px] sm:max-w-sm ${toastClassNames[t.type]}`}                    >
                        {toastIcon}
                        <p className="text-sm flex-1">{t.message}</p>
                        <button
                            type="button"
                            onClick={() => removeToast(t.id)}
                            className="text-text-muted hover:text-text-primary transition-colors shrink-0"
                            aria-label="Dismiss"
                        >
                            <X size={14} />
                        </button>
                    </div>;
                })
                }
            </div >
        </ToastContext.Provider >
    );
}

export function useToast() {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error('useToast must be used within ToastProvider');
    return ctx;
}