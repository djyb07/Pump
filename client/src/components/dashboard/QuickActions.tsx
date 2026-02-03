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
            className={`${gradient} py-3 px-3 sm:px-4 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg text-sm sm:text-base min-h-[44px]`}>
            {emoji} {label}
        </button>
    );
}

export function QuickActions({ mounted, onNavigate }: QuickActionsProps) {
    const actions: ActionButtonProps[] = [
        {
            onClick: () => onNavigate('/programs'),
            gradient: 'bg-lime-400 hover:bg-lime-500 text-slate-950',
            emoji: '🏋️',
            label: 'Programs'
        },
        {
            onClick: () => onNavigate('/workout/history'),
            gradient: 'bg-lime-400 hover:bg-lime-500 text-slate-950',
            emoji: '📊',
            label: 'History'
        },
        {
            onClick: () => onNavigate('/exercises'),
            gradient: 'bg-lime-400 hover:bg-lime-500 text-slate-950',
            emoji: '📚',
            label: 'Exercises'
        },
        {
            onClick: () => onNavigate('/personal-records'),
            gradient: 'bg-lime-400 hover:bg-lime-500 text-slate-950',
            emoji: '🏆',
            label: 'Records'
        }
    ];

    return (
        <div className={`glass-card p-4 sm:p-6 transition-all duration-700 delay-200 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
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
