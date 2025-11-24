import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    // Get user info from token
    const getUserInfo = () => {
        const token = localStorage.getItem('token');
        const userStr = localStorage.getItem('user');

        if (!token) return { name: 'User', email: '' };

        try {
            // Try to get from stored user first
            if (userStr) {
                const user = JSON.parse(userStr);
                const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
                return {
                    name: fullName || user.email || 'User',
                    email: user.email || ''
                };
            }

            // Fallback to decoding token
            const payload = JSON.parse(atob(token.split('.')[1]));
            return {
                name: payload.email || 'User',
                email: payload.email || ''
            };
        } catch {
            return { name: 'User', email: '' };
        }
    };

    const userInfo = getUserInfo();

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center p-4">
            <div className="bg-gray-800 border border-gray-700 rounded-2xl shadow-2xl p-8 max-w-2xl w-full">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="flex items-center justify-center mb-4">
                        <img src="/logo.png" alt="PUMP" className="h-16 w-auto" />
                    </div>
                    <p className="text-gray-400">Fitness Tracking Dashboard</p>
                </div>

                {/* Welcome Card */}
                <div className="bg-gradient-to-r from-purple-900/50 to-pink-900/50 border border-purple-800/30 rounded-xl p-6 mb-6 text-white">
                    <h2 className="text-2xl font-bold mb-2">Welcome Back 👋</h2>
                    <p className="text-xl font-semibold mb-1 text-purple-100">{userInfo.name}</p>
                    {userInfo.email && (
                        <p className="text-sm text-purple-300/70">{userInfo.email}</p>
                    )}
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-4 text-center">
                        <div className="text-3xl mb-2">💪</div>
                        <div className="text-2xl font-bold text-purple-400">0</div>
                        <div className="text-sm text-gray-400">Workouts</div>
                    </div>
                    <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-4 text-center">
                        <div className="text-3xl mb-2">🔥</div>
                        <div className="text-2xl font-bold text-pink-400">0</div>
                        <div className="text-sm text-gray-400">Calories</div>
                    </div>
                    <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-4 text-center">
                        <div className="text-3xl mb-2">⏱️</div>
                        <div className="text-2xl font-bold text-purple-400">0</div>
                        <div className="text-sm text-gray-400">Minutes</div>
                    </div>
                </div>

                {/* Success Message */}
                <div className="bg-green-900/20 border-l-4 border-green-500 rounded-lg p-4 mb-6">
                    <div className="flex items-center">
                        <div className="text-2xl mr-3">✅</div>
                        <div>
                            <h3 className="font-bold text-green-400">Successfully Logged In!</h3>
                            <p className="text-green-300/70 text-sm">All authentication features are working perfectly.</p>
                        </div>
                    </div>
                </div>

                {/* Info */}
                <div className="bg-gray-900/30 border border-gray-700 rounded-lg p-4 mb-6">
                    <h3 className="font-bold mb-2 text-gray-200">🚀 What's Working:</h3>
                    <ul className="space-y-1 text-sm text-gray-400">
                        <li>✅ User Registration</li>
                        <li>✅ Email/Password Login</li>
                        <li>✅ Google OAuth Login</li>
                        <li>✅ Password Reset via Email</li>
                        <li>✅ JWT Token Authentication</li>
                    </ul>
                </div>

                {/* Logout Button */}
                <button
                    onClick={handleLogout}
                    className="w-full bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white py-3 rounded-lg font-semibold transition-all transform hover:scale-105 shadow-lg"
                >
                    🚪 Logout
                </button>

                {/* Footer */}
                <p className="text-center text-gray-500 text-sm mt-6">
                    🎉 Deployment successful! Backend (Azure) + Frontend (Vercel)
                </p>
            </div>
        </div>
    );
}
