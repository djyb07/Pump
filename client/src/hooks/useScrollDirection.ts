/**
 * useScrollDirection Hook
 *
 * Shared hook for detecting scroll direction. Used by both
 * SmartNavbar and SmartFilterBar for coordinated hide/show behavior.
 *
 * @param threshold - Minimum scroll distance before hiding (default: 100px)
 * @returns boolean indicating if the header region should be visible
 */

import { useState, useEffect, useCallback, useRef } from 'react';

export function useScrollDirection(threshold = 100): boolean {
    const [isVisible, setIsVisible] = useState(true);
    const lastScrollY = useRef(0);

    const handleScroll = useCallback(() => {
        const currentScrollY = window.scrollY;

        // Always show when near the top of the page
        if (currentScrollY < 50) {
            setIsVisible(true);
        } else if (currentScrollY > lastScrollY.current && currentScrollY > threshold) {
            // Scrolling down past threshold — hide
            setIsVisible(false);
        } else if (currentScrollY < lastScrollY.current) {
            // Scrolling up — show
            setIsVisible(true);
        }

        lastScrollY.current = currentScrollY;
    }, [threshold]);

    useEffect(() => {
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, [handleScroll]);

    return isVisible;
}
