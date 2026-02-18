/**
 * BodyHeatmap - Muscle Recovery Heatmap Component
 *
 * Geometric/low-poly SVG body visualization showing per-muscle-group
 * recovery status. Uses click/tap interaction for mobile-friendly tooltips.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { Activity, Clock, Zap } from 'lucide-react';
import { analyticsService, type MuscleRecoveryData } from '../../services/analyticsService';

interface BodyHeatmapProps {
    mounted: boolean;
}

type MuscleMap = Record<string, MuscleRecoveryData>;

// Default "Ready" state for muscles with no data
const DEFAULT_MUSCLE: MuscleRecoveryData = {
    totalSets: 0,
    strainScore: 0,
    status: 'Ready',
    color: 'lime',
    daysSinceTraining: null,
};

// Tailwind fill class map
const FILL_CLASSES: Record<string, string> = {
    red: 'fill-red-500',
    amber: 'fill-amber-500',
    lime: 'fill-lime-400',
};

const FILL_CLASSES_DIM: Record<string, string> = {
    red: 'fill-red-500/60',
    amber: 'fill-amber-500/60',
    lime: 'fill-lime-400/20',
};

const STATUS_BADGE_CLASSES: Record<string, string> = {
    Recovering: 'bg-red-500/20 text-red-400 border-red-500/30',
    Resting: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    Ready: 'bg-lime-400/20 text-lime-400 border-lime-400/30',
};

export function BodyHeatmap({ mounted }: BodyHeatmapProps) {
    const [muscles, setMuscles] = useState<MuscleMap>({});
    const [loading, setLoading] = useState(true);
    const [activeMuscle, setActiveMuscle] = useState<string | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        let cancelled = false;
        analyticsService.getMuscleRecovery()
            .then((data) => {
                if (!cancelled) setMuscles(data.muscles);
            })
            .catch((err) => console.error('Failed to load muscle recovery:', err))
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, []);

    // Click outside to dismiss tooltip
    useEffect(() => {
        const handler = (e: MouseEvent | TouchEvent) => {
            if (!containerRef.current) return;
            const target = e.target as Element;
            // If click is inside an SVG muscle path, the path's own onClick handles it
            if (target.closest('[data-muscle]')) return;
            setActiveMuscle(null);
        };
        document.addEventListener('mousedown', handler);
        document.addEventListener('touchstart', handler);
        return () => {
            document.removeEventListener('mousedown', handler);
            document.removeEventListener('touchstart', handler);
        };
    }, []);

    const getMuscle = useCallback((name: string): MuscleRecoveryData => {
        return muscles[name] || DEFAULT_MUSCLE;
    }, [muscles]);

    const getFillClass = useCallback((name: string, dim = false): string => {
        const m = getMuscle(name);
        return dim ? (FILL_CLASSES_DIM[m.color] || FILL_CLASSES_DIM.lime) : (FILL_CLASSES[m.color] || FILL_CLASSES.lime);
    }, [getMuscle]);

    const handleMuscleClick = useCallback((name: string) => {
        setActiveMuscle((prev) => (prev === name ? null : name));
    }, []);

    const activeData = activeMuscle ? getMuscle(activeMuscle) : null;

    const formatDays = (days: number | null): string => {
        if (days === null) return 'Not trained recently';
        if (days < 0.1) return 'Trained today';
        if (days < 1) return `${Math.round(days * 24)}h ago`;
        return `${days.toFixed(1)} days ago`;
    };

    if (loading) {
        return (
            <div className={`mb-8 transition-all duration-700 delay-150 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                <div className="glass-card p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-8 h-8 rounded-lg bg-slate-700 animate-pulse" />
                        <div className="h-6 w-48 rounded bg-slate-700 animate-pulse" />
                    </div>
                    <div className="flex justify-center gap-8">
                        <div className="w-40 h-80 rounded-xl bg-slate-800/50 animate-pulse" />
                        <div className="w-40 h-80 rounded-xl bg-slate-800/50 animate-pulse" />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div
            ref={containerRef}
            className={`mb-8 transition-all duration-700 delay-150 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
        >
            <div className="glass-card p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <Activity className="w-8 h-8 text-lime-400" />
                        <div>
                            <h2 className="text-xl font-bold text-white">Muscle Recovery</h2>
                            <p className="text-slate-400 text-sm">Last 7 days • Tap a muscle for details</p>
                        </div>
                    </div>
                    {/* Legend */}
                    <div className="hidden sm:flex items-center gap-4 text-xs text-slate-400">
                        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-red-500 inline-block" /> Recovering</span>
                        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-amber-500 inline-block" /> Resting</span>
                        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-lime-400 inline-block" /> Ready</span>
                    </div>
                </div>

                {/* Mobile Legend */}
                <div className="flex sm:hidden items-center justify-center gap-4 text-xs text-slate-400 mb-4">
                    <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-red-500 inline-block" /> Recovering</span>
                    <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-amber-500 inline-block" /> Resting</span>
                    <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-lime-400 inline-block" /> Ready</span>
                </div>

                <div className="flex flex-col lg:flex-row items-start gap-6">
                    {/* SVG Bodies */}
                    <div className="flex-1 flex justify-center items-start gap-4 sm:gap-8 w-full">
                        {/* Front View */}
                        <div className="flex flex-col items-center">
                            <span className="text-slate-500 text-xs font-medium uppercase tracking-wider mb-2">Front</span>
                            <svg viewBox="0 0 200 420" className="w-36 sm:w-44 h-auto" xmlns="http://www.w3.org/2000/svg">
                                {/* Head */}
                                <circle cx="100" cy="30" r="22" className="fill-slate-700/50 stroke-slate-600" strokeWidth="1" />

                                {/* Neck */}
                                <rect x="90" y="52" width="20" height="16" className="fill-slate-700/40 stroke-slate-600" strokeWidth="0.5" />

                                {/* Shoulders */}
                                <polygon
                                    points="60,68 90,68 90,90 55,85"
                                    className={`${activeMuscle === 'Shoulders' ? getFillClass('Shoulders') : getFillClass('Shoulders', true)} stroke-slate-600 cursor-pointer transition-all duration-300 hover:opacity-90`}
                                    strokeWidth="0.8"
                                    data-muscle="Shoulders"
                                    onClick={() => handleMuscleClick('Shoulders')}
                                />
                                <polygon
                                    points="110,68 140,68 145,85 110,90"
                                    className={`${activeMuscle === 'Shoulders' ? getFillClass('Shoulders') : getFillClass('Shoulders', true)} stroke-slate-600 cursor-pointer transition-all duration-300 hover:opacity-90`}
                                    strokeWidth="0.8"
                                    data-muscle="Shoulders"
                                    onClick={() => handleMuscleClick('Shoulders')}
                                />

                                {/* Chest */}
                                <polygon
                                    points="68,90 100,88 100,130 65,125"
                                    className={`${activeMuscle === 'Chest' ? getFillClass('Chest') : getFillClass('Chest', true)} stroke-slate-600 cursor-pointer transition-all duration-300 hover:opacity-90`}
                                    strokeWidth="0.8"
                                    data-muscle="Chest"
                                    onClick={() => handleMuscleClick('Chest')}
                                />
                                <polygon
                                    points="100,88 132,90 135,125 100,130"
                                    className={`${activeMuscle === 'Chest' ? getFillClass('Chest') : getFillClass('Chest', true)} stroke-slate-600 cursor-pointer transition-all duration-300 hover:opacity-90`}
                                    strokeWidth="0.8"
                                    data-muscle="Chest"
                                    onClick={() => handleMuscleClick('Chest')}
                                />

                                {/* Arms (front - biceps area) */}
                                <polygon
                                    points="55,85 65,90 60,145 48,140"
                                    className={`${activeMuscle === 'Arms' ? getFillClass('Arms') : getFillClass('Arms', true)} stroke-slate-600 cursor-pointer transition-all duration-300 hover:opacity-90`}
                                    strokeWidth="0.8"
                                    data-muscle="Arms"
                                    onClick={() => handleMuscleClick('Arms')}
                                />
                                <polygon
                                    points="135,90 145,85 152,140 140,145"
                                    className={`${activeMuscle === 'Arms' ? getFillClass('Arms') : getFillClass('Arms', true)} stroke-slate-600 cursor-pointer transition-all duration-300 hover:opacity-90`}
                                    strokeWidth="0.8"
                                    data-muscle="Arms"
                                    onClick={() => handleMuscleClick('Arms')}
                                />

                                {/* Forearms */}
                                <polygon
                                    points="48,140 60,145 55,200 42,195"
                                    className={`${activeMuscle === 'Arms' ? getFillClass('Arms') : getFillClass('Arms', true)} stroke-slate-600 cursor-pointer transition-all duration-300 hover:opacity-90`}
                                    strokeWidth="0.5"
                                    data-muscle="Arms"
                                    onClick={() => handleMuscleClick('Arms')}
                                />
                                <polygon
                                    points="140,145 152,140 158,195 145,200"
                                    className={`${activeMuscle === 'Arms' ? getFillClass('Arms') : getFillClass('Arms', true)} stroke-slate-600 cursor-pointer transition-all duration-300 hover:opacity-90`}
                                    strokeWidth="0.5"
                                    data-muscle="Arms"
                                    onClick={() => handleMuscleClick('Arms')}
                                />

                                {/* Core / Abs */}
                                <polygon
                                    points="72,130 100,130 100,210 75,210"
                                    className={`${activeMuscle === 'Core' ? getFillClass('Core') : getFillClass('Core', true)} stroke-slate-600 cursor-pointer transition-all duration-300 hover:opacity-90`}
                                    strokeWidth="0.8"
                                    data-muscle="Core"
                                    onClick={() => handleMuscleClick('Core')}
                                />
                                <polygon
                                    points="100,130 128,130 125,210 100,210"
                                    className={`${activeMuscle === 'Core' ? getFillClass('Core') : getFillClass('Core', true)} stroke-slate-600 cursor-pointer transition-all duration-300 hover:opacity-90`}
                                    strokeWidth="0.8"
                                    data-muscle="Core"
                                    onClick={() => handleMuscleClick('Core')}
                                />

                                {/* Ab detail lines */}
                                <line x1="100" y1="140" x2="100" y2="200" className="stroke-slate-600/40" strokeWidth="0.5" />
                                <line x1="76" y1="155" x2="124" y2="155" className="stroke-slate-600/30" strokeWidth="0.4" />
                                <line x1="77" y1="175" x2="123" y2="175" className="stroke-slate-600/30" strokeWidth="0.4" />
                                <line x1="78" y1="195" x2="122" y2="195" className="stroke-slate-600/30" strokeWidth="0.4" />

                                {/* Quads */}
                                <polygon
                                    points="75,215 100,215 98,310 70,305"
                                    className={`${activeMuscle === 'Quads' ? getFillClass('Quads') : getFillClass('Quads', true)} stroke-slate-600 cursor-pointer transition-all duration-300 hover:opacity-90`}
                                    strokeWidth="0.8"
                                    data-muscle="Quads"
                                    onClick={() => handleMuscleClick('Quads')}
                                />
                                <polygon
                                    points="100,215 125,215 130,305 102,310"
                                    className={`${activeMuscle === 'Quads' ? getFillClass('Quads') : getFillClass('Quads', true)} stroke-slate-600 cursor-pointer transition-all duration-300 hover:opacity-90`}
                                    strokeWidth="0.8"
                                    data-muscle="Quads"
                                    onClick={() => handleMuscleClick('Quads')}
                                />

                                {/* Lower Legs (calves front) */}
                                <polygon
                                    points="72,315 96,315 92,400 75,400"
                                    className={`${activeMuscle === 'Glutes & Hams' ? getFillClass('Glutes & Hams') : getFillClass('Glutes & Hams', true)} stroke-slate-600 cursor-pointer transition-all duration-300 hover:opacity-90`}
                                    strokeWidth="0.5"
                                    data-muscle="Glutes & Hams"
                                    onClick={() => handleMuscleClick('Glutes & Hams')}
                                />
                                <polygon
                                    points="104,315 128,315 125,400 108,400"
                                    className={`${activeMuscle === 'Glutes & Hams' ? getFillClass('Glutes & Hams') : getFillClass('Glutes & Hams', true)} stroke-slate-600 cursor-pointer transition-all duration-300 hover:opacity-90`}
                                    strokeWidth="0.5"
                                    data-muscle="Glutes & Hams"
                                    onClick={() => handleMuscleClick('Glutes & Hams')}
                                />
                            </svg>
                        </div>

                        {/* Back View */}
                        <div className="flex flex-col items-center">
                            <span className="text-slate-500 text-xs font-medium uppercase tracking-wider mb-2">Back</span>
                            <svg viewBox="0 0 200 420" className="w-36 sm:w-44 h-auto" xmlns="http://www.w3.org/2000/svg">
                                {/* Head */}
                                <circle cx="100" cy="30" r="22" className="fill-slate-700/50 stroke-slate-600" strokeWidth="1" />

                                {/* Neck */}
                                <rect x="90" y="52" width="20" height="16" className="fill-slate-700/40 stroke-slate-600" strokeWidth="0.5" />

                                {/* Shoulders (back) */}
                                <polygon
                                    points="60,68 90,68 90,90 55,85"
                                    className={`${activeMuscle === 'Shoulders' ? getFillClass('Shoulders') : getFillClass('Shoulders', true)} stroke-slate-600 cursor-pointer transition-all duration-300 hover:opacity-90`}
                                    strokeWidth="0.8"
                                    data-muscle="Shoulders"
                                    onClick={() => handleMuscleClick('Shoulders')}
                                />
                                <polygon
                                    points="110,68 140,68 145,85 110,90"
                                    className={`${activeMuscle === 'Shoulders' ? getFillClass('Shoulders') : getFillClass('Shoulders', true)} stroke-slate-600 cursor-pointer transition-all duration-300 hover:opacity-90`}
                                    strokeWidth="0.8"
                                    data-muscle="Shoulders"
                                    onClick={() => handleMuscleClick('Shoulders')}
                                />

                                {/* Upper Back */}
                                <polygon
                                    points="68,90 100,88 100,138 65,132"
                                    className={`${activeMuscle === 'Upper Back' ? getFillClass('Upper Back') : getFillClass('Upper Back', true)} stroke-slate-600 cursor-pointer transition-all duration-300 hover:opacity-90`}
                                    strokeWidth="0.8"
                                    data-muscle="Upper Back"
                                    onClick={() => handleMuscleClick('Upper Back')}
                                />
                                <polygon
                                    points="100,88 132,90 135,132 100,138"
                                    className={`${activeMuscle === 'Upper Back' ? getFillClass('Upper Back') : getFillClass('Upper Back', true)} stroke-slate-600 cursor-pointer transition-all duration-300 hover:opacity-90`}
                                    strokeWidth="0.8"
                                    data-muscle="Upper Back"
                                    onClick={() => handleMuscleClick('Upper Back')}
                                />

                                {/* Arms (back - triceps area) */}
                                <polygon
                                    points="55,85 65,90 60,145 48,140"
                                    className={`${activeMuscle === 'Arms' ? getFillClass('Arms') : getFillClass('Arms', true)} stroke-slate-600 cursor-pointer transition-all duration-300 hover:opacity-90`}
                                    strokeWidth="0.8"
                                    data-muscle="Arms"
                                    onClick={() => handleMuscleClick('Arms')}
                                />
                                <polygon
                                    points="135,90 145,85 152,140 140,145"
                                    className={`${activeMuscle === 'Arms' ? getFillClass('Arms') : getFillClass('Arms', true)} stroke-slate-600 cursor-pointer transition-all duration-300 hover:opacity-90`}
                                    strokeWidth="0.8"
                                    data-muscle="Arms"
                                    onClick={() => handleMuscleClick('Arms')}
                                />

                                {/* Forearms (back) */}
                                <polygon
                                    points="48,140 60,145 55,200 42,195"
                                    className={`${activeMuscle === 'Arms' ? getFillClass('Arms') : getFillClass('Arms', true)} stroke-slate-600 cursor-pointer transition-all duration-300 hover:opacity-90`}
                                    strokeWidth="0.5"
                                    data-muscle="Arms"
                                    onClick={() => handleMuscleClick('Arms')}
                                />
                                <polygon
                                    points="140,145 152,140 158,195 145,200"
                                    className={`${activeMuscle === 'Arms' ? getFillClass('Arms') : getFillClass('Arms', true)} stroke-slate-600 cursor-pointer transition-all duration-300 hover:opacity-90`}
                                    strokeWidth="0.5"
                                    data-muscle="Arms"
                                    onClick={() => handleMuscleClick('Arms')}
                                />

                                {/* Lower Back */}
                                <polygon
                                    points="72,138 100,138 100,210 75,210"
                                    className={`${activeMuscle === 'Lower Back' ? getFillClass('Lower Back') : getFillClass('Lower Back', true)} stroke-slate-600 cursor-pointer transition-all duration-300 hover:opacity-90`}
                                    strokeWidth="0.8"
                                    data-muscle="Lower Back"
                                    onClick={() => handleMuscleClick('Lower Back')}
                                />
                                <polygon
                                    points="100,138 128,138 125,210 100,210"
                                    className={`${activeMuscle === 'Lower Back' ? getFillClass('Lower Back') : getFillClass('Lower Back', true)} stroke-slate-600 cursor-pointer transition-all duration-300 hover:opacity-90`}
                                    strokeWidth="0.8"
                                    data-muscle="Lower Back"
                                    onClick={() => handleMuscleClick('Lower Back')}
                                />

                                {/* Spine detail line */}
                                <line x1="100" y1="95" x2="100" y2="205" className="stroke-slate-600/40" strokeWidth="0.6" />

                                {/* Glutes */}
                                <polygon
                                    points="75,210 100,210 100,240 72,238"
                                    className={`${activeMuscle === 'Glutes & Hams' ? getFillClass('Glutes & Hams') : getFillClass('Glutes & Hams', true)} stroke-slate-600 cursor-pointer transition-all duration-300 hover:opacity-90`}
                                    strokeWidth="0.8"
                                    data-muscle="Glutes & Hams"
                                    onClick={() => handleMuscleClick('Glutes & Hams')}
                                />
                                <polygon
                                    points="100,210 125,210 128,238 100,240"
                                    className={`${activeMuscle === 'Glutes & Hams' ? getFillClass('Glutes & Hams') : getFillClass('Glutes & Hams', true)} stroke-slate-600 cursor-pointer transition-all duration-300 hover:opacity-90`}
                                    strokeWidth="0.8"
                                    data-muscle="Glutes & Hams"
                                    onClick={() => handleMuscleClick('Glutes & Hams')}
                                />

                                {/* Hamstrings */}
                                <polygon
                                    points="72,242 98,242 96,310 70,305"
                                    className={`${activeMuscle === 'Glutes & Hams' ? getFillClass('Glutes & Hams') : getFillClass('Glutes & Hams', true)} stroke-slate-600 cursor-pointer transition-all duration-300 hover:opacity-90`}
                                    strokeWidth="0.8"
                                    data-muscle="Glutes & Hams"
                                    onClick={() => handleMuscleClick('Glutes & Hams')}
                                />
                                <polygon
                                    points="102,242 128,242 130,305 104,310"
                                    className={`${activeMuscle === 'Glutes & Hams' ? getFillClass('Glutes & Hams') : getFillClass('Glutes & Hams', true)} stroke-slate-600 cursor-pointer transition-all duration-300 hover:opacity-90`}
                                    strokeWidth="0.8"
                                    data-muscle="Glutes & Hams"
                                    onClick={() => handleMuscleClick('Glutes & Hams')}
                                />

                                {/* Calves (back) */}
                                <polygon
                                    points="72,315 96,315 92,400 75,400"
                                    className={`${activeMuscle === 'Glutes & Hams' ? getFillClass('Glutes & Hams') : getFillClass('Glutes & Hams', true)} stroke-slate-600 cursor-pointer transition-all duration-300 hover:opacity-90`}
                                    strokeWidth="0.5"
                                    data-muscle="Glutes & Hams"
                                    onClick={() => handleMuscleClick('Glutes & Hams')}
                                />
                                <polygon
                                    points="104,315 128,315 125,400 108,400"
                                    className={`${activeMuscle === 'Glutes & Hams' ? getFillClass('Glutes & Hams') : getFillClass('Glutes & Hams', true)} stroke-slate-600 cursor-pointer transition-all duration-300 hover:opacity-90`}
                                    strokeWidth="0.5"
                                    data-muscle="Glutes & Hams"
                                    onClick={() => handleMuscleClick('Glutes & Hams')}
                                />
                            </svg>
                        </div>
                    </div>

                    {/* Detail Panel / Popover */}
                    <div className="lg:w-72 w-full">
                        {activeMuscle && activeData ? (
                            <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-2xl transition-all duration-300 animate-in fade-in">
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="text-white font-semibold text-lg">{activeMuscle}</h3>
                                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${STATUS_BADGE_CLASSES[activeData.status]}`}>
                                        {activeData.status}
                                    </span>
                                </div>

                                {/* Last Trained */}
                                <div className="flex items-center gap-2 text-slate-400 text-sm mb-4">
                                    <Clock className="w-4 h-4" />
                                    <span>Last trained: {formatDays(activeData.daysSinceTraining)}</span>
                                </div>

                                {/* Strain Score Bar */}
                                <div className="mb-3">
                                    <div className="flex items-center justify-between text-xs mb-1.5">
                                        <span className="text-slate-400 flex items-center gap-1">
                                            <Zap className="w-3 h-3" /> Strain Score
                                        </span>
                                        <span className="text-white font-medium">{activeData.strainScore}/100</span>
                                    </div>
                                    <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all duration-500 ${activeData.color === 'red' ? 'bg-red-500' :
                                                    activeData.color === 'amber' ? 'bg-amber-500' :
                                                        'bg-lime-400'
                                                }`}
                                            style={{ width: `${activeData.strainScore}%` }}
                                        />
                                    </div>
                                </div>

                                {/* Total Sets */}
                                <div className="text-xs text-slate-500">
                                    {activeData.totalSets} sets in the last 7 days
                                </div>
                            </div>
                        ) : (
                            <div className="bg-slate-900/30 border border-white/5 rounded-2xl p-5 text-center">
                                <Activity className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                                <p className="text-slate-500 text-sm">
                                    Tap a muscle group to see recovery details
                                </p>
                            </div>
                        )}

                        {/* Quick Overview Grid */}
                        <div className="grid grid-cols-2 gap-2 mt-4">
                            {Object.entries(muscles).map(([name, data]) => (
                                <button
                                    key={name}
                                    onClick={() => handleMuscleClick(name)}
                                    className={`text-left p-2.5 rounded-xl border transition-all duration-200 ${activeMuscle === name
                                            ? 'bg-slate-800/80 border-white/20'
                                            : 'bg-slate-900/30 border-white/5 hover:border-white/10'
                                        }`}
                                >
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className={`w-2 h-2 rounded-full ${data.color === 'red' ? 'bg-red-500' :
                                                data.color === 'amber' ? 'bg-amber-500' :
                                                    'bg-lime-400'
                                            }`} />
                                        <span className="text-white text-xs font-medium truncate">{name}</span>
                                    </div>
                                    <div className="text-slate-500 text-[10px]">{data.totalSets} sets</div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
