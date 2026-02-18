/**
 * AICoachCard Component — Midnight Pro Glass Card
 *
 * Dashboard tile for AI-powered workout analysis.
 * Three states: Idle (CTA button), Loading (cycling messages), Result (formatted report).
 */

import { useState, useEffect, useCallback } from 'react';
import { Sparkles, CheckCircle, AlertTriangle, Lightbulb, Brain, RefreshCw, AlertCircle } from 'lucide-react';
import { aiService, type AIReport } from '../../services/aiService';

interface AICoachCardProps {
    mounted: boolean;
}

// Cycling loading messages — changes every 3s to reduce perceived latency
const LOADING_MESSAGES = [
    'Crunching your workout numbers...',
    'Checking for progressive overload...',
    'Identifying weak points...',
    'Formulating plan...',
];

export function AICoachCard({ mounted }: AICoachCardProps) {
    const [state, setState] = useState<'idle' | 'loading' | 'result' | 'error'>('idle');
    const [report, setReport] = useState<AIReport | null>(null);
    const [error, setError] = useState<string>('');
    const [loadingMsgIndex, setLoadingMsgIndex] = useState(0);
    const [cached, setCached] = useState(false);

    // Cycle loading messages every 3s
    useEffect(() => {
        if (state !== 'loading') return;
        setLoadingMsgIndex(0);
        const interval = setInterval(() => {
            setLoadingMsgIndex(prev => (prev + 1) % LOADING_MESSAGES.length);
        }, 3000);
        return () => clearInterval(interval);
    }, [state]);

    const handleGenerate = useCallback(async () => {
        setState('loading');
        setError('');
        try {
            const data = await aiService.generateAnalysis();
            setReport(data.report);
            setCached(data.cached);
            setState('result');
        } catch (err: any) {
            const message = err.response?.data?.error || 'Something went wrong. Please try again.';
            setError(message);
            setState('error');
        }
    }, []);

    return (
        <div className={`mb-8 transition-all duration-700 delay-200 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <div className="glass-card p-6">
                {/* Header — always visible */}
                <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                    <Brain className="w-5 h-5 text-lime-400" />
                    AI Coach
                    {cached && (
                        <span className="text-xs font-normal text-slate-500 ml-auto">cached — refreshes in 24h</span>
                    )}
                </h3>

                {/* ───── State: Idle ───── */}
                {state === 'idle' && (
                    <div className="flex flex-col items-center py-6 gap-4">
                        <p className="text-slate-400 text-center max-w-md">
                            Get an AI-powered analysis of your last 4 weeks of training — progressive overload, muscle balance, and actionable tips.
                        </p>
                        <button
                            onClick={handleGenerate}
                            className="btn-hero px-8 py-3 text-lg flex items-center gap-2"
                        >
                            <Sparkles className="w-5 h-5" />
                            Generate Weekly Analysis
                        </button>
                    </div>
                )}

                {/* ───── State: Loading ───── */}
                {state === 'loading' && (
                    <div className="flex flex-col items-center py-10 gap-5">
                        {/* Pulsing brain icon */}
                        <div className="relative">
                            <div className="absolute inset-0 rounded-full bg-lime-400/20 animate-ping" />
                            <Brain className="w-12 h-12 text-lime-400 animate-pulse relative z-10" />
                        </div>
                        <p className="text-slate-300 text-lg font-medium animate-pulse transition-all duration-300">
                            {LOADING_MESSAGES[loadingMsgIndex]}
                        </p>
                        {/* Skeleton bars */}
                        <div className="w-full max-w-md space-y-3 mt-2">
                            <div className="h-3 bg-slate-800/60 rounded-full animate-pulse" />
                            <div className="h-3 bg-slate-800/60 rounded-full animate-pulse w-4/5" />
                            <div className="h-3 bg-slate-800/60 rounded-full animate-pulse w-3/5" />
                        </div>
                    </div>
                )}

                {/* ───── State: Error ───── */}
                {state === 'error' && (
                    <div className="flex flex-col items-center py-6 gap-4">
                        <AlertCircle className="w-10 h-10 text-red-400" />
                        <p className="text-red-400 text-center">{error}</p>
                        <button
                            onClick={handleGenerate}
                            className="btn-secondary px-6 py-2 flex items-center gap-2"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Try Again
                        </button>
                    </div>
                )}

                {/* ───── State: Result ───── */}
                {state === 'result' && report && (
                    <div className="space-y-5">
                        {/* Summary */}
                        <p className="text-slate-300 italic border-l-2 border-lime-400/30 pl-4">
                            {report.summary}
                        </p>

                        {/* Positive Feedback — Green */}
                        {report.positive_feedback.length > 0 && (
                            <div>
                                <h4 className="text-sm uppercase tracking-wider text-emerald-400 font-semibold mb-2 flex items-center gap-1.5">
                                    <CheckCircle className="w-4 h-4" />
                                    What You're Doing Well
                                </h4>
                                <ul className="space-y-1.5">
                                    {report.positive_feedback.map((item, i) => (
                                        <li key={i} className="flex items-start gap-2 text-slate-300">
                                            <CheckCircle className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                                            <span>{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Areas for Improvement — Amber */}
                        {report.areas_for_improvement.length > 0 && (
                            <div>
                                <h4 className="text-sm uppercase tracking-wider text-amber-400 font-semibold mb-2 flex items-center gap-1.5">
                                    <AlertTriangle className="w-4 h-4" />
                                    Areas for Improvement
                                </h4>
                                <ul className="space-y-1.5">
                                    {report.areas_for_improvement.map((item, i) => (
                                        <li key={i} className="flex items-start gap-2 text-slate-300">
                                            <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                                            <span>{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Actionable Tips — Bullet points */}
                        {report.actionable_tips.length > 0 && (
                            <div>
                                <h4 className="text-sm uppercase tracking-wider text-sky-400 font-semibold mb-2 flex items-center gap-1.5">
                                    <Lightbulb className="w-4 h-4" />
                                    Actionable Tips
                                </h4>
                                <ul className="space-y-1.5">
                                    {report.actionable_tips.map((item, i) => (
                                        <li key={i} className="flex items-start gap-2 text-slate-300">
                                            <Lightbulb className="w-4 h-4 text-sky-400 mt-0.5 shrink-0" />
                                            <span>{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Regenerate button */}
                        <div className="pt-3 border-t border-white/5 flex justify-end">
                            <button
                                onClick={handleGenerate}
                                className="btn-secondary px-4 py-2 text-sm flex items-center gap-1.5"
                            >
                                <RefreshCw className="w-3.5 h-3.5" />
                                Regenerate
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
