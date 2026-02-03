/**
 * ActiveProgramCard Component
 * Displays the user's active workout program
 */

import type { Program } from '../../types/dashboard';

interface ActiveProgramCardProps {
    activeProgram: Program | null;
    onNavigate: (path: string) => void;
}

export function ActiveProgramCard({ activeProgram, onNavigate }: ActiveProgramCardProps) {
    return (
        <div className="glass-card p-6">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                <span className="mr-2">🏋️</span>
                Active Program
            </h3>
            {activeProgram ? (
                <>
                    <div className="mb-4">
                        <h4 className="text-2xl font-bold text-white mb-1">{activeProgram.name}</h4>
                        <p className="text-slate-400 text-sm">
                            {activeProgram.days.length} days • {activeProgram.description || 'Custom program'}
                        </p>
                    </div>
                    <button
                        onClick={() => onNavigate(`/programs/${activeProgram.id}`)}
                        className="w-full bg-lime-400 hover:bg-lime-500 text-slate-950 py-3 px-4 rounded-lg font-semibold transition-all duration-200">
                        View Program →
                    </button>
                </>
            ) : (
                <div className="text-center py-8">
                    <p className="text-slate-400 mb-4">No active program</p>
                    <button
                        onClick={() => onNavigate('/programs')}
                        className="px-6 py-2 bg-lime-400 hover:bg-lime-500 text-slate-950 rounded-lg font-semibold transition-all">
                        Create Program
                    </button>
                </div>
            )}
        </div>
    );
}
