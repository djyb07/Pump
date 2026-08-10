const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const API_URL = `${BASE_URL}/api`;
const AUTH_API_URL = `${API_URL}/auth`;

export const registerUser = async (userData: any) => {
    const response = await fetch(`${AUTH_API_URL}/register`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
    }

    return data;
};

export const loginUser = async (credentials: { email: string; password: string }) => {
    const response = await fetch(`${AUTH_API_URL}/login`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || 'Login failed');
    }

    return data;
};

/**
 * Trade the one-time code from the Google OAuth redirect for a JWT.
 * The code is single-use and expires in 60 seconds; the token comes back
 * in the POST response body so it never appears in a URL.
 */
export const exchangeOAuthCode = async (code: string) => {
    const response = await fetch(`${AUTH_API_URL}/oauth/exchange`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code }),
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || 'Google sign-in failed');
    }

    return data as { token: string; user: Record<string, unknown> };
};

export const forgotPassword = async (email: string) => {
    const response = await fetch(`${AUTH_API_URL}/forgot-password`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
    });

    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Received non-JSON response:', text);
        throw new Error('Server error: Received HTML instead of JSON. Check server logs.');
    }

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || 'Failed to send reset email');
    }

    return data;
};

export const resetPassword = async (token: string, newPassword: string) => {
    const response = await fetch(`${AUTH_API_URL}/reset-password`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, newPassword }),
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || 'Failed to reset password');
    }

    return data;
};

export const updateProfile = async (profileData: {
    firstName?: string;
    lastName?: string;
    avatarUrl?: string;
}) => {
    const token = localStorage.getItem('token');

    const response = await fetch(`${AUTH_API_URL}/profile`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(profileData),
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || 'Failed to update profile');
    }

    return data;
};

