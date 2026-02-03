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
        <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
            <div className="glass-card-lg max-w-md w-full p-8">
                <h2 className="text-3xl font-bold text-center text-white mb-8">Reset Password</h2>

                {message && (
                    <div className="bg-lime-400/20 border border-lime-400/30 text-lime-300 p-3 rounded-lg mb-4 text-center">
                        {message.text}
                        {/* Display link for easy testing */}
                        {message.token && (
                            <div className="mt-2 pt-2 border-t border-lime-400/30">
                                <p className="text-sm mb-1">Development Mode:</p>
                                <Link
                                    to={`/reset-password?token=${message.token}`}
                                    className="underline font-bold hover:text-lime-200"
                                >
                                    Click here to reset password
                                </Link>
                            </div>
                        )}
                    </div>
                )}

                {error && (
                    <div className="bg-red-500/20 border border-red-500/30 text-red-300 p-3 rounded-lg mb-4 text-center">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">Email Address</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-slate-800/60 border border-white/5 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-lime-400/50 focus:border-lime-400/50"
                            placeholder="john@example.com"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full bg-lime-400 hover:bg-lime-500 text-slate-950 font-bold py-2 px-4 rounded-lg transition duration-200 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        {loading ? 'Sending...' : 'Send Reset Link'}
                    </button>
                </form>

                <p className="mt-6 text-center text-slate-400 text-sm">
                    Remember your password?{' '}
                    <Link to="/login" className="text-lime-400 hover:text-lime-300">
                        Log in
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default ForgotPassword;
