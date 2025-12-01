import { useToast } from '../contexts/ToastContext';

export default function ToastContainer() {
    const { toasts, removeToast } = useToast();

    const icons = {
        success: '✓',
        error: '✕',
        warning: '⚠',
        info: 'ℹ'
    };

    const styles = {
        success: 'bg-green-600 border-green-500',
        error: 'bg-red-600 border-red-500',
        warning: 'bg-yellow-600 border-yellow-500',
        info: 'bg-blue-600 border-blue-500'
    };

    return (
        <div className="fixed top-4 right-4 z-50 space-y-2">
            {toasts.map(toast => (
                <div
                    key={toast.id}
                    className={`${styles[toast.type]} border-l-4 p-4 rounded-lg shadow-lg text-white 
                        min-w-[300px] max-w-md animate-slide-in`}
                >
                    <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                            <span className="text-xl font-bold">{icons[toast.type]}</span>
                            <p className="text-sm font-medium">{toast.message}</p>
                        </div>
                        <button
                            onClick={() => removeToast(toast.id)}
                            className="text-white/80 hover:text-white transition-colors text-lg leading-none"
                            aria-label="Close"
                        >
                            ✕
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
}
