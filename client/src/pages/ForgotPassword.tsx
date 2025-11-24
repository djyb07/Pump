import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { forgotPassword } from '../services/auth';

const ForgotPassword: React.FC = () => {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState<any>(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage('');
        setError('');
        setLoading(true);

        try {
            const response = await forgotPassword(email);
            setMessage({
                text: 'Password reset email sent. Please check your inbox.',
                token: response.token
            });
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
            <div className="max-w-md w-full bg-gray-800 rounded-lg shadow-xl p-8">
                <h2 className="text-3xl font-bold text-center text-white mb-8">Reset Password</h2>

                {message && (
                    <div className="bg-green-500 text-white p-3 rounded mb-4 text-center">
                        {message.text}
                        {/* Display link for easy testing */}
                        {message.token && (
                            <div className="mt-2 pt-2 border-t border-green-400">
                                <p className="text-sm mb-1">Development Mode:</p>
                                <Link
                                    to={`/reset-password?token=${message.token}`}
                                    className="underline font-bold hover:text-green-100"
                                >
                                    Click here to reset password
                                </Link>
                            </div>
                        )}
                    </div>
                )}

                {error && (
                    <div className="bg-red-500 text-white p-3 rounded mb-4 text-center">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Email Address</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                            placeholder="john@example.com"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition duration-200 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        {loading ? 'Sending...' : 'Send Reset Link'}
                    </button>
                </form>

                <p className="mt-6 text-center text-gray-400 text-sm">
                    Remember your password?{' '}
                    <Link to="/login" className="text-blue-500 hover:text-blue-400">
                        Log in
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default ForgotPassword;
