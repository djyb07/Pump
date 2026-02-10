/**
 * ActiveProgramCard Component - Midnight Pro Bento Style
 * Displays the user's active workout program
 */

import type { Program } from '../../types/dashboard';
import { Dumbbell, ChevronRight } from 'lucide-react';

interface ActiveProgramCardProps {
    activeProgram: Program | null;
    onNavigate: (path: string) => void;
}

export function ActiveProgramCard({ activeProgram, onNavigate }: ActiveProgramCardProps) {
    return (
        <div className="glass-card p-6 h-full flex flex-col">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Dumbbell className="w-5 h-5 text-lime-400" />
                Active Program
            </h3>
            {activeProgram ? (
                <div className="flex-1 flex flex-col">
                    <div className="flex-1 mb-4">
                        <h4 className="text-xl font-bold text-white mb-1">{activeProgram.name}</h4>
                        <p className="text-slate-400 text-sm">
                            <span className="text-lime-400 font-semibold">{activeProgram.days.length}</span> days • {activeProgram.description || 'Custom program'}
                        </p>
                    </div>
                    <button
                        onClick={() => onNavigate(`/programs/${activeProgram.id}`)}
                        className="w-full flex items-center justify-center gap-1 bg-slate-800/60 hover:bg-slate-700/60 text-white py-2.5 px-4 rounded-lg font-medium transition-all duration-200 border border-white/5 hover:border-lime-400/30"
                    >
                        View Details <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center py-4">
                    <p className="text-slate-400 mb-4">No active program</p>
                    <button
                        onClick={() => onNavigate('/programs')}
                        className="px-6 py-2 bg-lime-400 hover:bg-lime-500 text-slate-950 rounded-lg font-semibold transition-all"
                    >
                        Create Program
                    </button>
                </div>
            )}
        </div>
    );
}
