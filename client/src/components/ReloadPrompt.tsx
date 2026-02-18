/// <reference types="vite-plugin-pwa/react" />
import { useRegisterSW } from 'virtual:pwa-register/react';
import { RefreshCw, X } from 'lucide-react';

/**
 * ReloadPrompt Component
 *
 * Displays a toast notification when a new service worker is available.
 * Uses `registerType: 'prompt'` so updates never force-refresh the page
 * (critical during active workout tracking).
 */
export function ReloadPrompt() {
    const {
        needRefresh: [needRefresh, setNeedRefresh],
        updateServiceWorker,
    } = useRegisterSW({
        onRegisteredSW(_swUrl: string, _registration: ServiceWorkerRegistration | undefined) {
            // SW registered successfully
        },
        onRegisterError(error: Error) {
            console.error('[SW] Registration error:', error);
        },
    });

    if (!needRefresh) return null;

    return (
        <div className="fixed bottom-24 md:bottom-6 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-bottom-4">
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-800/90 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/40">
                <RefreshCw className="w-4 h-4 text-lime-400 shrink-0" />
                <span className="text-sm text-slate-200">New version available</span>
                <button
                    onClick={() => updateServiceWorker(true)}
                    className="px-3 py-1 text-xs font-semibold rounded-lg bg-lime-400 text-slate-950 hover:bg-lime-300 transition-colors"
                >
                    Update
                </button>
                <button
                    onClick={() => setNeedRefresh(false)}
                    className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-700/60 transition-colors"
                    aria-label="Dismiss"
                >
                    <X className="w-3.5 h-3.5" />
                </button>
            </div>
        </div>
    );
}
