interface ConfirmModalProps {
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
    onCancel: () => void;
    danger?: boolean;
}

export default function ConfirmModal({
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    onConfirm,
    onCancel,
    danger = false
}: ConfirmModalProps) {
    const handleConfirm = () => {
        onConfirm();
        onCancel();
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="glass-card max-w-md w-full p-6">
                <div className="mb-6">
                    <h2 className="text-2xl font-bold text-white mb-2">{title}</h2>
                    <p className="text-slate-400">{message}</p>
                </div>

                <div className="flex space-x-3">
                    <button
                        onClick={onCancel}
                        className="flex-1 px-4 py-3 bg-slate-800/60 hover:bg-slate-700/60 text-white rounded-lg font-semibold transition-colors border border-white/5"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={handleConfirm}
                        className={`flex-1 px-4 py-3 rounded-lg font-semibold transition-colors ${danger
                            ? 'bg-red-600 hover:bg-red-700 text-white'
                            : 'bg-lime-400 hover:bg-lime-500 text-slate-950'
                            }`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}
