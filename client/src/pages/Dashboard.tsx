import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';

export default function Dashboard() {
    const navigate = useNavigate();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    // Get user info from token
    const getUserInfo = () => {
        const token = localStorage.getItem('token');
        const userStr = localStorage.getItem('user');

        if (!token) return { name: 'User', email: '', initials: 'U' };

        try {
            // Try to get from stored user first
            if (userStr) {
                const user = JSON.parse(userStr);
                const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim();

                // If no name, extract from email
                let displayName = fullName;
                if (!displayName && user.email) {
                    // Extract name from email (before @)
                    displayName = user.email.split('@')[0]
                        .replace(/[._-]/g, ' ')
                        .split(' ')
                        .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
                        .join(' ');
                }

                // Get initials
                const nameParts = displayName.split(' ');
                const initials = nameParts.length >= 2
                    ? nameParts[0][0] + nameParts[nameParts.length - 1][0]
                    : nameParts[0]?.slice(0, 2) || 'U';

                return {
                    name: displayName || user.email || 'User',
                    email: user.email || '',
                    initials: initials.toUpperCase()
                };
            }

            // Fallback to decoding token with UTF-8 support
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const binaryString = atob(base64);
            const bytes = Uint8Array.from(binaryString, char => char.charCodeAt(0));
            const jsonString = new TextDecoder('utf-8').decode(bytes);
            const payload = JSON.parse(jsonString);

            const email = payload.email || '';
            const firstName = payload.firstName || '';
            const lastName = payload.lastName || '';
            const fullName = `${firstName} ${lastName}`.trim();

            let displayName = fullName || email.split('@')[0]
                .replace(/[._-]/g, ' ')
                .split(' ')
                .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ');

            const nameParts = displayName.split(' ');
            const initials = nameParts.length >= 2
                ? nameParts[0][0] + nameParts[nameParts.length - 1][0]
                : displayName.slice(0, 2);

            return {
                name: displayName || 'User',
                email: email,
                initials: initials.toUpperCase() || 'U'
            };
        } catch {
            return { name: 'User', email: '', initials: 'U' };
        }
    };

    const userInfo = getUserInfo();

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black relative overflow-hidden">
            {/* Background animated gradient orbs */}
            <div className="absolute top-0 left-0 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-pink-600/20 rounded-full blur-3xl animate-pulse delay-700"></div>

            <div className="relative z-10">
                {/* Header */}
                <header className="border-b border-gray-800/50 backdrop-blur-sm bg-gray-900/30">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <img src="/logo.png" alt="PUMP" className="h-10 w-10" />
                                <div className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                                    PUMP
                                </div>
                                <span className="text-gray-500 text-sm hidden sm:inline">Fitness Tracker</span>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="px-4 py-2 rounded-lg bg-gray-800/50 hover:bg-gray-800 border border-gray-700 text-gray-300 hover:text-white transition-all duration-200 text-sm font-medium"
                            >
                                🚪 Logout
                            </button>
                        </div>
                    </div>
                </header>

                {/* Main Content */}
                <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {/* Welcome Section */}
                    <div className={`mb-8 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                        <div className="bg-gradient-to-br from-purple-900/40 via-pink-900/40 to-purple-900/40 backdrop-blur-sm border border-purple-500/30 rounded-2xl p-8 shadow-2xl">
                            <div className="flex items-center space-x-6">
                                {/* Avatar */}
                                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                                    {userInfo.initials}
                                </div>

                                {/* User Info */}
                                <div className="flex-1">
                                    <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
                                        Welcome Back, {userInfo.name}! 👋
                                    </h1>
                                    {userInfo.email && (
                                        <p className="text-purple-300/80 text-sm">{userInfo.email}</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <div className={`grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 transition-all duration-700 delay-100 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                        <div className="group bg-gradient-to-br from-purple-900/30 to-purple-800/30 backdrop-blur-sm border border-purple-500/30 rounded-xl p-6 hover:scale-105 transition-all duration-300 cursor-pointer shadow-lg hover:shadow-purple-500/20">
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-4xl">💪</span>
                                <div className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs font-medium">
                                    This Week
                                </div>
                            </div>
                            <div className="text-4xl font-bold text-white mb-1">0</div>
                            <div className="text-gray-400 text-sm">Workouts Completed</div>
                            <div className="mt-4 h-2 bg-gray-800 rounded-full overflow-hidden">
                                <div className="h-full w-0 bg-gradient-to-r from-purple-500 to-pink-500 group-hover:w-1/3 transition-all duration-1000"></div>
                            </div>
                        </div>

                        <div className="group bg-gradient-to-br from-pink-900/30 to-pink-800/30 backdrop-blur-sm border border-pink-500/30 rounded-xl p-6 hover:scale-105 transition-all duration-300 cursor-pointer shadow-lg hover:shadow-pink-500/20">
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-4xl">🔥</span>
                                <div className="px-3 py-1 rounded-full bg-pink-500/20 text-pink-300 text-xs font-medium">
                                    Total
                                </div>
                            </div>
                            <div className="text-4xl font-bold text-white mb-1">0</div>
                            <div className="text-gray-400 text-sm">Calories Burned</div>
                            <div className="mt-4 h-2 bg-gray-800 rounded-full overflow-hidden">
                                <div className="h-full w-0 bg-gradient-to-r from-pink-500 to-red-500 group-hover:w-2/3 transition-all duration-1000"></div>
                            </div>
                        </div>

                        <div className="group bg-gradient-to-br from-blue-900/30 to-blue-800/30 backdrop-blur-sm border border-blue-500/30 rounded-xl p-6 hover:scale-105 transition-all duration-300 cursor-pointer shadow-lg hover:shadow-blue-500/20">
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-4xl">⏱️</span>
                                <div className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-medium">
                                    Average
                                </div>
                            </div>
                            <div className="text-4xl font-bold text-white mb-1">0</div>
                            <div className="text-gray-400 text-sm">Minutes Per Day</div>
                            <div className="mt-4 h-2 bg-gray-800 rounded-full overflow-hidden">
                                <div className="h-full w-0 bg-gradient-to-r from-blue-500 to-cyan-500 group-hover:w-1/2 transition-all duration-1000"></div>
                            </div>
                        </div>
                    </div>

                    {/* Quick Actions & Info */}
                    <div className={`grid grid-cols-1 lg:grid-cols-2 gap-6 transition-all duration-700 delay-200 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                        {/* Quick Actions */}
                        <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6 shadow-lg">
                            <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                                <span className="mr-2">⚡</span>
                                Quick Actions
                            </h3>
                            <div className="space-y-3">
                                <button
                                    onClick={() => navigate('/programs')}
                                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white py-3 px-4 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg">
                                    🏋️ My Programs
                                </button>
                                <button
                                    onClick={() => navigate('/workout/history')}
                                    className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white py-3 px-4 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg">
                                    📊 Workout History
                                </button>
                                <button
                                    onClick={() => navigate('/exercises')}
                                    className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white py-3 px-4 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg">
                                    📚 Browse Exercises
                                </button>
                            </div>
                        </div>

                        {/* System Status */}
                        <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6 shadow-lg">
                            <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                                <span className="mr-2">✅</span>
                                System Status
                            </h3>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between py-2 border-b border-gray-800">
                                    <span className="text-gray-400 text-sm">User Registration</span>
                                    <span className="flex items-center text-green-400 text-sm">
                                        <span className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></span>
                                        Active
                                    </span>
                                </div>
                                <div className="flex items-center justify-between py-2 border-b border-gray-800">
                                    <span className="text-gray-400 text-sm">Email/Password Login</span>
                                    <span className="flex items-center text-green-400 text-sm">
                                        <span className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></span>
                                        Active
                                    </span>
                                </div>
                                <div className="flex items-center justify-between py-2 border-b border-gray-800">
                                    <span className="text-gray-400 text-sm">Google OAuth</span>
                                    <span className="flex items-center text-green-400 text-sm">
                                        <span className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></span>
                                        Active
                                    </span>
                                </div>
                                <div className="flex items-center justify-between py-2 border-b border-gray-800">
                                    <span className="text-gray-400 text-sm">Password Reset</span>
                                    <span className="flex items-center text-green-400 text-sm">
                                        <span className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></span>
                                        Active
                                    </span>
                                </div>
                                <div className="flex items-center justify-between py-2">
                                    <span className="text-gray-400 text-sm">JWT Authentication</span>
                                    <span className="flex items-center text-green-400 text-sm">
                                        <span className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></span>
                                        Active
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="mt-8 text-center">
                        <p className="text-gray-600 text-sm">
                            🚀 Powered by Azure & Vercel | Built with ❤️
                        </p>
                    </div>
                </main>
            </div>
        </div>
    );
}
