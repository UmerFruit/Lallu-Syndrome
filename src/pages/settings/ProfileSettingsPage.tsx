import { useEffect, useState, type FormEvent } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { uploadAvatar } from '@/services/profileService';
type FormState = {
    display_name: string;
    username: string;
    avatar_url: string;
    bio: string;
    website_url: string;
    github_url: string;
    linkedin_url: string;
};

const initialForm: FormState = {
    display_name: '',
    username: '',
    avatar_url: '',
    bio: '',
    website_url: '',
    github_url: '',
    linkedin_url: '',
};

const inputClass =
    'w-full rounded border border-border-subtle bg-bg px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary/70 focus:border-accent focus:outline-none';

const labelClass = 'block text-sm font-medium text-text-primary mb-1.5';

function normalizeUrl(value: string): string {
    const trimmed = value.trim();

    if (!trimmed) return '';

    // Allow relative paths, useful later for Supabase Storage paths.
    if (trimmed.startsWith('/')) return trimmed;

    if (/^https?:\/\//i.test(trimmed)) {
        return trimmed;
    }

    return `https://${trimmed}`;
}

function isValidUrl(value: string): boolean {
    if (!value) return true;

    if (value.startsWith('/')) return true;

    try {
        new URL(value);
        return true;
    } catch {
        return false;
    }
}

function getErrorMessage(error: unknown): string {
    if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        (error as { code?: string }).code === '23505'
    ) {
        return 'That username is already taken.';
    }

    if (error instanceof Error) {
        return error.message;
    }

    return 'Could not save your profile. Please try again.';
}

export function ProfileSettingsPage() {
    const { user, profile, isLoading, isProfileLoading, updateProfile } = useAuth();
    const [uploading, setUploading] = useState(false);
    const [form, setForm] = useState<FormState>(initialForm);
    const [status, setStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState('');
    const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof FormState, string>>>({});

    useEffect(() => {
        if (profile) {
            setForm({
                display_name: profile.display_name ?? '',
                username: profile.username ?? '',
                avatar_url: profile.avatar_url ?? '',
                bio: profile.bio ?? '',
                website_url: profile.website_url ?? '',
                github_url: profile.github_url ?? '',
                linkedin_url: profile.linkedin_url ?? '',
            });

            return;
        }

        if (user) {
            const metadata = user.user_metadata as Record<string, unknown> | undefined;

            const fallbackDisplayName =
                typeof metadata?.display_name === 'string'
                    ? metadata.display_name
                    : user.email?.split('@')[0] ?? '';

            setForm((current) => ({
                ...current,
                display_name: current.display_name || fallbackDisplayName,
            }));
        }
    }, [profile, user]);

    if (isLoading || isProfileLoading) {
        return (
            <div className="flex items-center justify-center min-h-[40vh]">
                <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }
    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !user) return;

        if (!file.type.startsWith('image/')) {
            setFieldErrors((prev) => ({ ...prev, avatar_url: 'Please select an image file.' }));
            return;
        }
        if (file.size > 2 * 1024 * 1024) {
            setFieldErrors((prev) => ({ ...prev, avatar_url: 'Image must be smaller than 2MB.' }));
            return;
        }

        setUploading(true);
        try {
            const publicUrl = await uploadAvatar(user.id, file);
            setForm((prev) => ({ ...prev, avatar_url: publicUrl }));
            setFieldErrors((prev) => ({ ...prev, avatar_url: undefined }));
        } catch (err) {
            console.error('Avatar upload error:', err);
            setFieldErrors((prev) => ({ ...prev, avatar_url: 'Failed to upload image.' }));
        } finally {
            setUploading(false);
            e.target.value = ''; // Reset input so the same file can be selected again if needed
        }
    };
    const setField = (name: keyof FormState, value: string) => {
        setForm((prev) => ({
            ...prev,
            [name]: value,
        }));

        if (status !== 'idle') {
            setStatus('idle');
            setErrorMessage('');
        }

        setFieldErrors((prev) => ({
            ...prev,
            [name]: undefined,
        }));
    };

    const validate = (): boolean => {
        const errors: Partial<Record<keyof FormState, string>> = {};

        const displayName = form.display_name.trim();

        if (!displayName) {
            errors.display_name = 'Display name is required.';
        } else if (displayName.length > 100) {
            errors.display_name = 'Display name must be 100 characters or less.';
        }

        const username = form.username.trim().toLowerCase();

        if (username && !/^[a-z0-9_-]{3,30}$/.test(username)) {
            errors.username =
                'Username must be 3-30 characters and can include lowercase letters, numbers, hyphens, and underscores.';
        }

        if (form.bio.length > 500) {
            errors.bio = 'Bio must be 500 characters or less.';
        }

        const urlFields = ['avatar_url', 'website_url', 'github_url', 'linkedin_url'] as const;

        for (const field of urlFields) {
            const rawValue = form[field].trim();

            if (!rawValue) continue;

            const normalized = normalizeUrl(rawValue);

            if (!isValidUrl(normalized)) {
                errors[field] = 'Enter a valid URL.';
            }
        }

        setFieldErrors(errors);

        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!user) return;

        if (!validate()) {
            setStatus('error');
            setErrorMessage('Please fix the highlighted fields.');
            return;
        }

        setStatus('saving');
        setErrorMessage('');

        try {
            await updateProfile({
                display_name: form.display_name.trim(),
                username: form.username.trim() ? form.username.trim().toLowerCase() : null,
                avatar_url: normalizeUrl(form.avatar_url) || null,
                bio: form.bio.trim() || null,
                website_url: normalizeUrl(form.website_url) || null,
                github_url: normalizeUrl(form.github_url) || null,
                linkedin_url: normalizeUrl(form.linkedin_url) || null,
            });

            setStatus('success');
        } catch (error) {
            setStatus('error');
            setErrorMessage(getErrorMessage(error));
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-8">
            <section className="rounded-lg border border-border-subtle bg-bg p-6">
                <div>
                    <h2 className="font-serif text-lg font-semibold text-text-primary">
                        Public profile
                    </h2>
                    <p className="mt-1 text-sm text-text-secondary">
                        This information may be displayed alongside your articles and public profile.
                    </p>
                </div>

                <div className="mt-6 grid gap-6 md:grid-cols-2">
                    <div>
                        <label htmlFor="display_name" className={labelClass}>
                            Display name
                        </label>

                        <input
                            id="display_name"
                            type="text"
                            value={form.display_name}
                            onChange={(event) => setField('display_name', event.target.value)}
                            placeholder="Your name"
                            className={inputClass}
                        />

                        {fieldErrors.display_name && (
                            <p className="mt-1.5 text-sm text-red-500">{fieldErrors.display_name}</p>
                        )}
                    </div>

                    <div>
                        <label htmlFor="username" className={labelClass}>
                            Username
                        </label>

                        <input
                            id="username"
                            type="text"
                            value={form.username}
                            onChange={(event) => setField('username', event.target.value)}
                            placeholder="yourusername"
                            className={inputClass}
                        />

                        <p className="mt-1.5 text-xs text-text-secondary">
                            Lowercase letters, numbers, hyphens, and underscores only.
                        </p>

                        {fieldErrors.username && (
                            <p className="mt-1.5 text-sm text-red-500">{fieldErrors.username}</p>
                        )}
                    </div>
                </div>

                <div className="mt-6">
                    <label htmlFor="avatar_url" className={labelClass}>
                        Avatar
                    </label>

                    <div className="mt-3 flex items-start gap-6">
                        {/* Avatar preview */}
                        {form.avatar_url.trim() ? (
                            <img
                                src={normalizeUrl(form.avatar_url)}
                                alt="Avatar preview"
                                className="h-36 w-36 shrink-0 rounded-full border border-border-subtle bg-elevated object-cover"
                            />
                        ) : (
                            <div className="flex h-36 w-36 shrink-0 items-center justify-center rounded-full border border-border-subtle bg-elevated text-sm text-text-muted">
                                No image
                            </div>
                        )}

                        {/* Controls */}
                        <div className="flex min-w-0 flex-1 flex-col gap-4">
                            {/* Avatar URL */}
                            <div className="max-w-lg">
                                <input
                                    id="avatar_url"
                                    type="text"
                                    value={form.avatar_url}
                                    onChange={(event) =>
                                        setField('avatar_url', event.target.value)
                                    }
                                    placeholder="https://example.com/avatar.jpg"
                                    className={inputClass}
                                />

                                {fieldErrors.avatar_url && (
                                    <p className="mt-1.5 text-sm text-accent">
                                        {fieldErrors.avatar_url}
                                    </p>
                                )}
                            </div>

                            {/* Upload */}
                            <div className="max-w-lg rounded-lg border border-border-subtle bg-surface px-4 py-3">
                                <div className="flex items-center justify-between gap-4">
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium text-text-primary">
                                            Upload an image
                                        </p>
                                        <p className="mt-0.5 text-xs text-text-muted">
                                            JPG, PNG, WebP, or GIF · Max 2MB
                                        </p>
                                    </div>

                                    <label
                                        htmlFor="avatar-upload"
                                        className={`inline-flex shrink-0 cursor-pointer items-center rounded-md border border-border px-3 py-1.5 text-sm font-medium text-text-primary transition-colors duration-200 hover:bg-elevated hover:text-accent ${uploading
                                                ? 'pointer-events-none opacity-50'
                                                : ''
                                            }`}
                                    >
                                        {uploading ? 'Uploading...' : 'Choose image'}
                                    </label>

                                    <input
                                        id="avatar-upload"
                                        type="file"
                                        accept="image/*"
                                        onChange={handleAvatarUpload}
                                        disabled={uploading}
                                        className="sr-only"
                                    />
                                </div>

                                {uploading && (
                                    <div className="mt-2">
                                        <div className="h-1 w-full overflow-hidden rounded-full bg-elevated">
                                            <div className="h-full w-1/3 animate-pulse rounded-full bg-accent" />
                                        </div>
                                        <p className="mt-1 text-xs text-text-muted">
                                            Uploading...
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-6">
                    <label htmlFor="bio" className={labelClass}>
                        Bio
                    </label>

                    <textarea
                        id="bio"
                        value={form.bio}
                        onChange={(event) => setField('bio', event.target.value)}
                        placeholder="Write a short bio..."
                        rows={5}
                        className={`${inputClass} resize-y`}
                    />

                    <div className="mt-1.5 flex items-center justify-between">
                        {fieldErrors.bio ? (
                            <p className="text-sm text-red-500">{fieldErrors.bio}</p>
                        ) : (
                            <p className="text-xs text-text-secondary">
                                A short description shown on your profile and articles.
                            </p>
                        )}

                        <p className="text-xs text-text-secondary">{form.bio.length}/500</p>
                    </div>
                </div>
            </section>

            <section className="rounded-lg border border-border-subtle bg-bg p-6">
                <div>
                    <h2 className="font-serif text-lg font-semibold text-text-primary">Links</h2>
                    <p className="mt-1 text-sm text-text-secondary">
                        Optional external links for your profile.
                    </p>
                </div>

                <div className="mt-6 grid gap-6 md:grid-cols-3">
                    <div>
                        <label htmlFor="website_url" className={labelClass}>
                            Website
                        </label>

                        <input
                            id="website_url"
                            type="text"
                            value={form.website_url}
                            onChange={(event) => setField('website_url', event.target.value)}
                            placeholder="yoursite.com"
                            className={inputClass}
                        />

                        {fieldErrors.website_url && (
                            <p className="mt-1.5 text-sm text-red-500">{fieldErrors.website_url}</p>
                        )}
                    </div>

                    <div>
                        <label htmlFor="github_url" className={labelClass}>
                            GitHub
                        </label>

                        <input
                            id="github_url"
                            type="text"
                            value={form.github_url}
                            onChange={(event) => setField('github_url', event.target.value)}
                            placeholder="github.com/username"
                            className={inputClass}
                        />

                        {fieldErrors.github_url && (
                            <p className="mt-1.5 text-sm text-red-500">{fieldErrors.github_url}</p>
                        )}
                    </div>

                    <div>
                        <label htmlFor="linkedin_url" className={labelClass}>
                            LinkedIn
                        </label>

                        <input
                            id="linkedin_url"
                            type="text"
                            value={form.linkedin_url}
                            onChange={(event) => setField('linkedin_url', event.target.value)}
                            placeholder="linkedin.com/in/username"
                            className={inputClass}
                        />

                        {fieldErrors.linkedin_url && (
                            <p className="mt-1.5 text-sm text-red-500">{fieldErrors.linkedin_url}</p>
                        )}
                    </div>
                </div>
            </section>

            <div className="flex items-center gap-3">
                <button
                    type="submit"
                    disabled={status === 'saving'}
                    className="rounded bg-accent px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                    {status === 'saving' ? 'Saving...' : 'Save changes'}
                </button>

                {status === 'success' && (
                    <span className="text-sm font-medium text-emerald-500">
                        Profile saved.
                    </span>
                )}
            </div>

            {status === 'error' && errorMessage && (
                <p className="text-sm text-red-500">{errorMessage}</p>
            )}
        </form>
    );
}