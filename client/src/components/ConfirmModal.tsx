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
            <div className="bg-gray-900 rounded-xl border border-gray-800 max-w-md w-full p-6 shadow-2xl">
                <div className="mb-6">
                    <h2 className="text-2xl font-bold text-white mb-2">{title}</h2>
                    <p className="text-gray-400">{message}</p>
                </div>

                <div className="flex space-x-3">
                    <button
                        onClick={onCancel}
                        className="flex-1 px-4 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-semibold transition-colors"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={handleConfirm}
                        className={`flex-1 px-4 py-3 rounded-lg font-semibold transition-colors ${danger
                                ? 'bg-red-600 hover:bg-red-700 text-white'
                                : 'bg-purple-600 hover:bg-purple-700 text-white'
                            }`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}
