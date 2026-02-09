/**
 * UnifiedPageHeader Component - Consistent Page Headers
 * 
 * Provides a unified header for all pages with:
 * - Optional back button (navigate(-1))
 * - Page title with optional icon (lucide-react)
 * - Optional right-side content (action buttons)
 * - Midnight Pro glassmorphism styling
 */

import { useNavigate } from 'react-router-dom';
import { ChevronLeft, type LucideIcon } from 'lucide-react';

interface UnifiedPageHeaderProps {
    title: string;
    subtitle?: string;
    showBackButton?: boolean;
    rightContent?: React.ReactNode;
    icon?: LucideIcon;
}

export function UnifiedPageHeader({
    title,
    subtitle,
    showBackButton = false,
    rightContent,
    icon: Icon
}: UnifiedPageHeaderProps) {
    const navigate = useNavigate();

    return (
        <header className="bg-slate-900/60 backdrop-blur-md border-b border-white/5">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        {showBackButton && (
                            <button
                                onClick={() => navigate(-1)}
                                className="flex items-center gap-1 text-slate-400 hover:text-white transition-colors text-sm font-medium"
                            >
                                <ChevronLeft className="w-4 h-4" />
                                Back
                            </button>
                        )}
                        <div>
                            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white flex items-center gap-3">
                                {Icon && <Icon className="w-8 h-8 text-lime-400" />}
                                {title}
                            </h1>
                            {subtitle && (
                                <p className="text-slate-400 text-sm mt-1">{subtitle}</p>
                            )}
                        </div>
                    </div>
                    {rightContent && (
                        <div className="flex items-center space-x-2 sm:space-x-3">
                            {rightContent}
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
