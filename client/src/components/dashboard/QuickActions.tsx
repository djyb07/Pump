/**
 * QuickActions Component
 * Quick navigation buttons for common actions
 */

interface QuickActionsProps {
    mounted: boolean;
    onNavigate: (path: string) => void;
}

interface ActionButtonProps {
    onClick: () => void;
    gradient: string;
    emoji: string;
    label: string;
}

function ActionButton({ onClick, gradient, emoji, label }: ActionButtonProps) {
    return (
        <button
            onClick={onClick}
            className={`${gradient} text-white py-3 px-3 sm:px-4 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg text-sm sm:text-base min-h-[44px]`}>
            {emoji} {label}
        </button>
    );
}

export function QuickActions({ mounted, onNavigate }: QuickActionsProps) {
    const actions: ActionButtonProps[] = [
        {
            onClick: () => onNavigate('/programs'),
            gradient: 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700',
            emoji: '🏋️',
            label: 'Programs'
        },
        {
            onClick: () => onNavigate('/workout/history'),
            gradient: 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700',
            emoji: '📊',
            label: 'History'
        },
        {
            onClick: () => onNavigate('/exercises'),
            gradient: 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700',
            emoji: '📚',
            label: 'Exercises'
        },
        {
            onClick: () => onNavigate('/personal-records'),
            gradient: 'bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700',
            emoji: '🏆',
            label: 'Records'
        }
    ];

    return (
        <div className={`bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-4 sm:p-6 shadow-lg transition-all duration-700 delay-200 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <h3 className="text-lg sm:text-xl font-bold text-white mb-4 flex items-center">
                <span className="mr-2">⚡</span>
                Quick Actions
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">
                {actions.map((action, idx) => (
                    <ActionButton key={idx} {...action} />
                ))}
            </div>
        </div>
    );
}
