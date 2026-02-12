/**
 * ProfilePage — Edit Profile & Settings
 * 
 * Functional profile edit form with Midnight Pro styling.
 * Uses UnifiedPageHeader for consistent layout.
 * Includes avatar preset selector and custom URL input.
 */

import { useState, useEffect } from 'react';
import { UnifiedPageHeader } from '../components/layout';
import { User, Link as LinkIcon, Save, CheckCircle } from 'lucide-react';
import { updateProfile } from '../services/auth';

// ── Avatar Presets ──────────────────────────────────────────────────────
interface AvatarPreset {
    id: string;
    label: string;
    url: string | null;  // null = initials
}

const AVATAR_PRESETS: AvatarPreset[] = [
    { id: 'initials', label: 'Initials', url: null },
    { id: 'gym', label: 'Gym', url: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=150&h=150&fit=crop' },
    { id: 'runner', label: 'Runner', url: 'https://images.unsplash.com/photo-1599058945522-28d584b6f0ff?w=150&h=150&fit=crop' },
    { id: 'weights', label: 'Weights', url: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=150&h=150&fit=crop' },
    { id: 'yoga', label: 'Yoga', url: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=150&h=150&fit=crop' },
    { id: 'boxing', label: 'Boxing', url: 'https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?w=150&h=150&fit=crop' },
];

// ── Types ───────────────────────────────────────────────────────────────
interface ProfileFormData {
    firstName: string;
    lastName: string;
    avatarUrl: string;
}

export default function ProfilePage() {
    const [form, setForm] = useState<ProfileFormData>({
        firstName: '',
        lastName: '',
        avatarUrl: '',
    });
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    // Pre-fill from localStorage
    useEffect(() => {
        try {
            const userStr = localStorage.getItem('user');
            if (userStr) {
                const user = JSON.parse(userStr);
                setForm({
                    firstName: user.firstName || '',
                    lastName: user.lastName || '',
                    avatarUrl: user.avatarUrl || '',
                });
            }
        } catch {
            // Ignore parse errors
        }
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
        setError('');
        setSuccess(false);
    };

    const selectPreset = (preset: AvatarPreset) => {
        setForm(prev => ({ ...prev, avatarUrl: preset.url ?? '' }));
        setError('');
        setSuccess(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError('');
        setSuccess(false);

        try {
            const data = await updateProfile({
                firstName: form.firstName.trim(),
                lastName: form.lastName.trim(),
                avatarUrl: form.avatarUrl.trim() || undefined,
            });

            // Update localStorage so the dashboard reflects changes immediately
            const userStr = localStorage.getItem('user');
            if (userStr) {
                const existingUser = JSON.parse(userStr);
                const updatedUser = { ...existingUser, ...data.user };
                localStorage.setItem('user', JSON.stringify(updatedUser));
            }

            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch (err: any) {
            setError(err.message || 'Failed to update profile');
        } finally {
            setSaving(false);
        }
    };

    // Avatar preview helpers
    const initials = `${form.firstName?.[0] || ''}${form.lastName?.[0] || ''}`.toUpperCase() || 'U';

    /** Is a given preset currently selected? */
    const isSelected = (preset: AvatarPreset): boolean => {
        if (preset.url === null) return form.avatarUrl === '';
        return form.avatarUrl === preset.url;
    };

    return (
        <div className="relative z-10">
            <UnifiedPageHeader
                title="Profile & Settings"
                showBackButton={true}
                icon={User}
            />

            {/* Content — centered & width-restricted */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pb-24">
                <div className="max-w-2xl mx-auto">
                    {/* Success Toast */}
                    {success && (
                        <div className="mb-6 flex items-center gap-3 px-4 py-3 rounded-xl bg-lime-400/10 border border-lime-400/30 text-lime-400 text-sm font-medium">
                            <CheckCircle className="w-5 h-5 flex-shrink-0" />
                            Profile updated successfully!
                        </div>
                    )}

                    {/* Error Toast */}
                    {error && (
                        <div className="mb-6 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm font-medium">
                            {error}
                        </div>
                    )}

                    <div className="glass-card p-6 sm:p-8">
                        {/* Avatar Preview */}
                        <div className="flex flex-col items-center mb-8">
                            {form.avatarUrl ? (
                                <img
                                    src={form.avatarUrl}
                                    alt="Avatar preview"
                                    className="w-24 h-24 rounded-full object-cover ring-2 ring-lime-400/50 shadow-lg shadow-lime-400/10"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).style.display = 'none';
                                    }}
                                />
                            ) : (
                                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center ring-2 ring-lime-400/50 shadow-lg shadow-lime-400/10">
                                    <span className="text-lime-400 font-bold text-2xl">
                                        {initials}
                                    </span>
                                </div>
                            )}
                            <p className="text-sm text-slate-500 mt-3">Your profile photo</p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* First & Last Name — side by side on md+ */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label htmlFor="firstName" className="block text-sm font-medium text-slate-400 mb-2">
                                        First Name
                                    </label>
                                    <input
                                        type="text"
                                        id="firstName"
                                        name="firstName"
                                        dir="auto"
                                        value={form.firstName}
                                        onChange={handleChange}
                                        placeholder="Enter your first name"
                                        className="input-midnight w-full px-4 py-3"
                                        required
                                    />
                                </div>

                                <div>
                                    <label htmlFor="lastName" className="block text-sm font-medium text-slate-400 mb-2">
                                        Last Name
                                    </label>
                                    <input
                                        type="text"
                                        id="lastName"
                                        name="lastName"
                                        dir="auto"
                                        value={form.lastName}
                                        onChange={handleChange}
                                        placeholder="Enter your last name"
                                        className="input-midnight w-full px-4 py-3"
                                        required
                                    />
                                </div>
                            </div>

                            {/* ── Choose an Avatar ─────────────────────── */}
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-3">
                                    Choose an Avatar
                                </label>
                                <div className="flex flex-wrap gap-4">
                                    {AVATAR_PRESETS.map(preset => (
                                        <button
                                            key={preset.id}
                                            type="button"
                                            onClick={() => selectPreset(preset)}
                                            className="flex flex-col items-center gap-1.5 group"
                                            title={preset.label}
                                        >
                                            {preset.url ? (
                                                <img
                                                    src={preset.url}
                                                    alt={preset.label}
                                                    className={`w-16 h-16 rounded-full object-cover transition-all ${isSelected(preset)
                                                            ? 'ring-2 ring-lime-400 shadow-lg shadow-lime-400/20'
                                                            : 'ring-1 ring-slate-700 opacity-70 group-hover:opacity-100 group-hover:ring-slate-500'
                                                        }`}
                                                />
                                            ) : (
                                                <div
                                                    className={`w-16 h-16 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center transition-all ${isSelected(preset)
                                                            ? 'ring-2 ring-lime-400 shadow-lg shadow-lime-400/20'
                                                            : 'ring-1 ring-slate-700 opacity-70 group-hover:opacity-100 group-hover:ring-slate-500'
                                                        }`}
                                                >
                                                    <span className="text-lime-400 font-bold text-sm">
                                                        {initials}
                                                    </span>
                                                </div>
                                            )}
                                            <span className={`text-xs ${isSelected(preset) ? 'text-lime-400' : 'text-slate-500'
                                                }`}>
                                                {preset.label}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Custom Avatar URL */}
                            <div>
                                <label htmlFor="avatarUrl" className="flex items-center gap-2 text-sm font-medium text-slate-400 mb-2">
                                    <LinkIcon className="w-3.5 h-3.5" />
                                    Or paste custom URL
                                </label>
                                <input
                                    type="url"
                                    id="avatarUrl"
                                    name="avatarUrl"
                                    dir="auto"
                                    value={form.avatarUrl}
                                    onChange={handleChange}
                                    placeholder="https://example.com/avatar.jpg"
                                    className="input-midnight w-full px-4 py-3"
                                />
                                <p className="text-xs text-slate-500 mt-1.5">
                                    Paste an image URL to use a custom avatar
                                </p>
                            </div>

                            {/* Submit */}
                            <button
                                type="submit"
                                disabled={saving}
                                className="btn-primary w-full flex items-center justify-center gap-2 mt-8"
                            >
                                <Save className="w-4 h-4" />
                                {saving ? 'Saving...' : 'Save Changes'}
                            </button>
                        </form>
                    </div>
                </div>
            </main>
        </div>
    );
}
