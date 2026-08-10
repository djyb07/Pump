import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { loginUser, exchangeOAuthCode } from '../services/auth';

const Login: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // Handle the Google OAuth redirect: trade the one-time code for a token.
    // The code is single-use and short-lived, so it is safe in the URL where
    // the JWT itself was not — but strip it from history regardless.
    useEffect(() => {
        const code = searchParams.get('code');
        const authError = searchParams.get('error');

        if (authError) {
            setError('Google authentication failed. Please try again.');
            return;
        }

        if (!code) {
            return;
        }

        let cancelled = false;

        (async () => {
            try {
                const { token, user } = await exchangeOAuthCode(code);
                if (cancelled) return;

                localStorage.setItem('token', token);
                localStorage.setItem('user', JSON.stringify(user));

                // Remove the code from the address bar and from history
                window.history.replaceState({}, '', '/login');

                navigate('/dashboard');
            } catch (err: any) {
                if (cancelled) return;
                window.history.replaceState({}, '', '/login');
                setError(err.message || 'Google authentication failed. Please try again.');
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [searchParams, navigate]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        setLoading(true);
        try {
            const response = await loginUser({
                email: formData.email,
                password: formData.password,
            });

            // Store token in localStorage
            localStorage.setItem('token', response.token);
            localStorage.setItem('user', JSON.stringify(response.user));

            // Redirect to dashboard
            navigate('/dashboard');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Get API URL for Google OAuth
    const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    const API_URL = `${BASE_URL}/api`;

    return (
        <div className="min-h-screen flex items-center justify-center px-4">
            <div className="max-w-md w-full glass-card-lg p-8">
                <h2 className="text-3xl font-bold text-center text-white mb-8">Welcome Back</h2>

                {error && (
                    <div className="bg-red-900/30 border border-red-500/30 text-red-200 px-4 py-3 rounded-lg mb-4 backdrop-blur-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">Email</label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            className="w-full bg-slate-900/30 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-lime-400/50 focus:border-lime-400/50 backdrop-blur-sm"
                            placeholder="john@example.com"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">Password</label>
                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            className="w-full bg-slate-900/30 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-lime-400/50 focus:border-lime-400/50 backdrop-blur-sm"
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    <div className="flex items-center justify-end">
                        <Link to="/forgot-password" className="text-sm text-lime-400 hover:text-lime-300">
                            Forgot password?
                        </Link>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full bg-lime-400 hover:bg-lime-500 text-slate-950 font-bold py-3 px-4 rounded-lg transition duration-200 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        {loading ? 'Logging in...' : 'Log In'}
                    </button>

                    <div className="relative mt-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-white/10"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-2 bg-slate-900/60 backdrop-blur-sm text-slate-400 rounded">Or continue with</span>
                        </div>
                    </div>

                    <a
                        href={`${API_URL}/auth/google`}
                        className="w-full flex items-center justify-center px-4 py-3 border border-white/10 rounded-lg shadow-sm text-sm font-medium text-slate-200 bg-slate-900/30 hover:bg-slate-800/50 backdrop-blur-sm transition duration-200"
                    >
                        <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
                            <path
                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                fill="#4285F4"
                            />
                            <path
                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                fill="#34A853"
                            />
                            <path
                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                fill="#FBBC05"
                            />
                            <path
                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                fill="#EA4335"
                            />
                        </svg>
                        Sign in with Google
                    </a>
                </form >

                <p className="mt-6 text-center text-slate-400 text-sm">
                    Don't have an account?{' '}
                    <Link to="/register" className="text-lime-400 hover:text-lime-300">
                        Sign up
                    </Link>
                </p>
            </div >
        </div >
    );
};

export default Login;
