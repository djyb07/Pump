/**
 * QuickActions Component - Midnight Pro Compact Tiles
 * Quick navigation buttons as compact square tiles
 */

interface QuickActionsProps {
    mounted: boolean;
    onNavigate: (path: string) => void;
}

interface ActionTileProps {
    onClick: () => void;
    emoji: string;
    label: string;
}

function ActionTile({ onClick, emoji, label }: ActionTileProps) {
    return (
        <button
            onClick={onClick}
            className="glass-card p-4 sm:p-6 flex flex-col items-center justify-center gap-2 transition-all duration-200 hover:bg-slate-800/60 hover:border-lime-400/30 hover:scale-105 group min-h-[100px]"
        >
            <span className="text-2xl sm:text-3xl group-hover:scale-110 transition-transform">{emoji}</span>
            <span className="text-sm sm:text-base font-medium text-slate-300 group-hover:text-white transition-colors">{label}</span>
        </button>
    );
}

export function QuickActions({ mounted, onNavigate }: QuickActionsProps) {
    const actions: ActionTileProps[] = [
        {
            onClick: () => onNavigate('/programs'),
            emoji: '🏋️',
            label: 'Programs'
        },
        {
            onClick: () => onNavigate('/workout/history'),
            emoji: '📊',
            label: 'History'
        },
        {
            onClick: () => onNavigate('/exercises'),
            emoji: '📚',
            label: 'Exercises'
        },
        {
            onClick: () => onNavigate('/personal-records'),
            emoji: '🏆',
            label: 'Records'
        }
    ];

    return (
        <div className={`transition-all duration-700 delay-200 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <span className="mr-2">⚡</span>
                Quick Actions
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                {actions.map((action, idx) => (
                    <ActionTile key={idx} {...action} />
                ))}
            </div>
        </div>
    );
}
