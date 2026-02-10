/**
 * SmartFilterBar Component - Unified Hide-on-Scroll Filter Toolbar
 *
 * A reusable, responsive filter bar with glassmorphism styling.
 * Uses fixed positioning at top-16 (below SmartNavbar) and shares
 * the same useScrollDirection hook for coordinated "double hide" behavior.
 *
 * Features:
 * - Fixed position, slides in/out with the navbar
 * - Search input with icon
 * - Configurable dropdown filters
 * - Optional toggle buttons (e.g. "PRs Only")
 * - Result count + "Clear Filters" row
 * - Responsive: single row on desktop, stacked on mobile
 */

import { Search, X, type LucideIcon } from 'lucide-react';
import { useScrollDirection } from '../../hooks/useScrollDirection';

// ─── Types ───────────────────────────────────────────────────────

export interface FilterConfig {
    label: string;
    icon: LucideIcon;
    value: string;
    onChange: (val: string) => void;
    options: { value: string; label: string }[];
}

export interface ToggleConfig {
    label: string;
    icon: LucideIcon;
    active: boolean;
    onToggle: () => void;
    activeColor?: string; // tailwind color, default "yellow"
}

interface SmartFilterBarProps {
    /** Current search query value */
    searchValue: string;
    /** Search input change handler */
    onSearchChange: (query: string) => void;
    /** Placeholder text for the search input */
    searchPlaceholder?: string;
    /** Dropdown filter configurations */
    filters: FilterConfig[];
    /** Optional toggle buttons (e.g. "PRs Only") */
    toggles?: ToggleConfig[];
    /** Number of results after filtering */
    resultCount?: number;
    /** Total number of items before filtering */
    totalCount?: number;
    /** Whether any filter is currently active */
    hasActiveFilters: boolean;
    /** Callback to clear all active filters */
    onClearFilters: () => void;
}

// ─── Component ───────────────────────────────────────────────────

export function SmartFilterBar({
    searchValue,
    onSearchChange,
    searchPlaceholder = 'Search...',
    filters,
    toggles,
    resultCount,
    totalCount,
    hasActiveFilters,
    onClearFilters,
}: SmartFilterBarProps) {
    const isVisible = useScrollDirection();

    return (
        <div
            className={`fixed left-0 right-0 z-40 border-b border-white/5
                bg-slate-900/30 backdrop-blur-xl
                transition-transform duration-300 ease-in-out
                ${isVisible ? 'translate-y-0' : '-translate-y-[calc(100%+4rem)]'}`}
            style={{ top: '4rem' }}
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
                {/* ── Main Filter Row ─────────────────────────── */}
                <div className="flex flex-col md:flex-row md:items-center gap-3">
                    {/* Search Input */}
                    <div className="relative flex-shrink-0 md:w-72">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                        <input
                            type="text"
                            value={searchValue}
                            onChange={(e) => onSearchChange(e.target.value)}
                            placeholder={searchPlaceholder}
                            className="w-full pl-10 pr-4 py-2 bg-slate-800/60 border border-white/5 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-lime-400/50 transition-all"
                        />
                    </div>

                    {/* Filters + Toggles */}
                    <div className="flex items-center gap-3 overflow-x-auto scrollbar-hide flex-1">
                        {filters.map((filter) => {
                            const IconComp = filter.icon;
                            return (
                                <div key={filter.label} className="flex-shrink-0">
                                    <div className="relative">
                                        <IconComp className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                        <select
                                            value={filter.value}
                                            onChange={(e) => filter.onChange(e.target.value)}
                                            className="pl-9 pr-4 py-2 bg-slate-800/60 border border-white/5 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-lime-400/50 transition-all cursor-pointer appearance-none"
                                        >
                                            {filter.options.map((opt) => (
                                                <option key={opt.value} value={opt.value} className="bg-slate-900">
                                                    {opt.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            );
                        })}

                        {/* Toggle Buttons */}
                        {toggles?.map((toggle) => {
                            const ToggleIcon = toggle.icon;
                            const color = toggle.activeColor || 'yellow';
                            return (
                                <button
                                    key={toggle.label}
                                    onClick={toggle.onToggle}
                                    className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${toggle.active
                                            ? `bg-${color}-500 hover:bg-${color}-600 text-slate-950`
                                            : 'bg-slate-800/60 hover:bg-slate-700/60 text-slate-300 border border-white/5'
                                        }`}
                                >
                                    <ToggleIcon className="w-4 h-4" />
                                    {toggle.label}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* ── Result Count + Clear Row ────────────────── */}
                {hasActiveFilters && (
                    <div className="mt-2 flex items-center justify-between">
                        <span className="text-slate-400 text-xs">
                            {resultCount !== undefined && totalCount !== undefined
                                ? `${resultCount} of ${totalCount} results`
                                : resultCount !== undefined
                                    ? `${resultCount} result${resultCount !== 1 ? 's' : ''} found`
                                    : 'Filters active'}
                        </span>
                        <button
                            onClick={onClearFilters}
                            className="flex items-center gap-1 px-3 py-1 bg-slate-700/60 hover:bg-slate-600/60 text-slate-300 rounded-lg text-xs font-semibold transition-all"
                        >
                            <X className="w-3.5 h-3.5" /> Clear
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
