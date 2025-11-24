import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/login');
    };

    // Get user email from token (simple decode - not secure validation!)
    const getEmailFromToken = () => {
        const token = localStorage.getItem('token');
        if (!token) return null;

        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            return payload.email || 'User';
        } catch {
            return 'User';
        }
    };

    const userEmail = getEmailFromToken();

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl w-full">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-5xl font-bold mb-2">🏋️ PUMP</h1>
                    <p className="text-gray-600">Fitness Tracking Dashboard</p>
                </div>

                {/* Welcome Card */}
                <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl p-6 mb-6 text-white">
                    <h2 className="text-2xl font-bold mb-2">Welcome Back! 👋</h2>
                    <p className="text-lg opacity-90">{userEmail}</p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="bg-blue-50 rounded-lg p-4 text-center">
                        <div className="text-3xl mb-2">💪</div>
                        <div className="text-2xl font-bold text-blue-600">0</div>
                        <div className="text-sm text-gray-600">Workouts</div>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-4 text-center">
                        <div className="text-3xl mb-2">🔥</div>
                        <div className="text-2xl font-bold text-purple-600">0</div>
                        <div className="text-sm text-gray-600">Calories</div>
                    </div>
                    <div className="bg-pink-50 rounded-lg p-4 text-center">
                        <div className="text-3xl mb-2">⏱️</div>
                        <div className="text-2xl font-bold text-pink-600">0</div>
                        <div className="text-sm text-gray-600">Minutes</div>
                    </div>
                </div>

                {/* Success Message */}
                <div className="bg-green-50 border-l-4 border-green-500 rounded-lg p-4 mb-6">
                    <div className="flex items-center">
                        <div className="text-2xl mr-3">✅</div>
                        <div>
                            <h3 className="font-bold text-green-800">Successfully Logged In!</h3>
                            <p className="text-green-700 text-sm">All authentication features are working perfectly.</p>
                        </div>
                    </div>
                </div>

                {/* Info */}
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                    <h3 className="font-bold mb-2">🚀 What's Working:</h3>
                    <ul className="space-y-1 text-sm text-gray-700">
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
                    className="w-full bg-gradient-to-r from-red-500 to-pink-500 text-white py-3 rounded-lg font-semibold hover:from-red-600 hover:to-pink-600 transition-all transform hover:scale-105 shadow-lg"
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
