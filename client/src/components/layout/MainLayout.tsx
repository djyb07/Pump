/**
 * MainLayout Component - Authenticated Routes Wrapper
 * 
 * Provides consistent layout for all authenticated pages:
 * - SmartNavbar at top (persistent)
 * - Content area with proper spacing for fixed navbar
 * - Mobile bottom nav spacing
 */

import { useNavigate } from 'react-router-dom';
import { SmartNavbar } from './SmartNavbar';

interface MainLayoutProps {
    children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-slate-950">
            <SmartNavbar onLogout={handleLogout} />

            {/* Main content with padding for fixed navbar */}
            <div className="pt-16 md:pt-16 pb-20 md:pb-0">
                {children}
            </div>
        </div>
    );
}
