import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { uploadAvatar } from '@/services/profileService';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { PageSpinner } from '@/components/ui/Skeleton';
import { Textarea } from '@/components/ui/Textarea';
import { useQueryClient } from '@tanstack/react-query';
import { Avatar } from '@/components/ui/Avatar';
import { deleteOwnAccount } from '@/services/authService';
import { useNavigate } from 'react-router-dom';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { CropModal } from '@/components/ui/CropModal';

const optionalUrl = z.string().refine(
    (value) => {
        const trimmed = value.trim();
        if (!trimmed || trimmed.startsWith('/')) return true;
        const normalized = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
        try {
            new URL(normalized);
            return true;
        } catch {
            return false;
        }
    },
    { message: 'Enter a valid URL.' }
);

const profileSchema = z.object({
    display_name: z
        .string()
        .min(1, 'Display name is required.')
        .max(100, 'Display name must be 100 characters or less.'),
    username: z.string().refine((val) => !val || /^[a-z0-9_-]{3,30}$/.test(val), {
        message:
            'Username must be 3-30 characters and can include lowercase letters, numbers, hyphens, and underscores.',
    }),
    bio: z.string().max(500, 'Bio must be 500 characters or less.'),
    avatar_url: optionalUrl,
    website_url: optionalUrl,
    github_url: optionalUrl,
    linkedin_url: optionalUrl,
});

type ProfileForm = z.infer<typeof profileSchema>;

function normalizeUrl(value: string): string {
    const trimmed = value.trim();
    if (!trimmed) return '';
    if (trimmed.startsWith('/')) return trimmed;
    if (/^https?:\/\//i.test(trimmed)) {
        return trimmed;
    }
    return `https://${trimmed}`;
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
    const { user, profile, isLoading, isProfileLoading, updateProfile, logout } = useAuth();
    const queryClient = useQueryClient();
    const [uploading, setUploading] = useState(false);
    const navigate = useNavigate();
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showFinalDeleteModal, setShowFinalDeleteModal] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [cropModalState, setCropModalState] = useState<{ isOpen: boolean; src: string | null }>({ isOpen: false, src: null });
    const handleDeleteAccount = async () => {
        setDeleting(true);
        try {
            await deleteOwnAccount();
            toast.success('Your account has been deleted.');
        } catch (error) {
            console.error('Failed to delete account:', error);
            toast.error(error instanceof Error ? error.message : 'Failed to delete account.');
            setDeleting(false);
            return;
        }
        try {
            await logout();
        } catch {
            // session is already invalid after account deletion
        }
        navigate('/', { replace: true });
    };
    const {
        register,
        handleSubmit,
        setValue,
        watch,
        reset,
        setError,
        formState: { errors, isSubmitting },
    } = useForm<ProfileForm>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            display_name: '',
            username: '',
            bio: '',
            avatar_url: '',
            website_url: '',
            github_url: '',
            linkedin_url: '',
        },
    });

    useEffect(() => {
        if (profile) {
            reset({
                display_name: profile.display_name ?? '',
                username: profile.username ?? '',
                avatar_url: profile.avatar_url ?? '',
                bio: profile.bio ?? '',
                website_url: profile.website_url ?? '',
                github_url: profile.github_url ?? '',
                linkedin_url: profile.linkedin_url ?? '',
            });
        } else if (user) {
            const metadata = user.user_metadata as Record<string, unknown> | undefined;
            const fallback =
                typeof metadata?.display_name === 'string'
                    ? metadata.display_name
                    : user.email?.split('@')[0] ?? '';
            reset({
                display_name: fallback,
                username: '',
                avatar_url: '',
                bio: '',
                website_url: '',
                github_url: '',
                linkedin_url: '',
            });
        }
    }, [profile, user?.id, reset]);;

    const bioText = watch('bio') ?? '';
    const avatarUrl = watch('avatar_url') ?? '';

    if (isLoading || (isProfileLoading && !profile)) {
        return <PageSpinner />;
    }

    const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !user) return;

        if (!file.type.startsWith('image/')) {
            setError('avatar_url', { message: 'Please select an image file.' });
            e.target.value = '';
            return;
        }

        if (file.size > 2 * 1024 * 1024) {
            setError('avatar_url', { message: 'Image must be smaller than 2MB.' });
            e.target.value = '';
            return;
        }
        e.target.value = '';
        const objectUrl = URL.createObjectURL(file);
        setCropModalState({ isOpen: true, src: objectUrl });
    };

    const handleCropModalClose = () => {
        if (cropModalState.src) URL.revokeObjectURL(cropModalState.src);
        setCropModalState({ isOpen: false, src: null });
    };

    const handleAvatarCropSave = async (croppedFile: File) => {
        if (cropModalState.src) URL.revokeObjectURL(cropModalState.src);
        setCropModalState({ isOpen: false, src: null });

        if (!user) return;

        setUploading(true);
        try {
            const publicUrl = await uploadAvatar(user.id, croppedFile);
            setValue('avatar_url', publicUrl, { shouldValidate: true });
        } catch {
            setError('avatar_url', { message: 'Failed to upload image.' });
        } finally {
            setUploading(false);
        }
    };

    const onSubmit = async (data: ProfileForm) => {
        if (!user) return;
        try {
            await updateProfile({
                display_name: data.display_name.trim(),
                username: data.username.trim() ? data.username.trim().toLowerCase() : null,
                avatar_url: normalizeUrl(data.avatar_url) || null,
                bio: data.bio.trim() || null,
                website_url: normalizeUrl(data.website_url) || null,
                github_url: normalizeUrl(data.github_url) || null,
                linkedin_url: normalizeUrl(data.linkedin_url) || null,
            });
            toast.success('Profile saved.');
            queryClient.invalidateQueries({ queryKey: ['profile'] });
        } catch (error) {
            toast.error(getErrorMessage(error));
            setError('root', { message: getErrorMessage(error) });
        }
    };

    return (
        <>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                <section className="rounded-lg border border-border-subtle bg-bg p-6">
                    <div className="mb-6 flex items-center justify-between gap-3">
                        <div>
                            <h2 className="font-serif text-lg font-semibold text-text-primary">
                                Public profile
                            </h2>
                            <p className="mt-1 text-sm text-text-secondary">
                                This information may be displayed alongside your articles and public profile.
                            </p>
                        </div>
                        <Button type="submit" loading={isSubmitting}>
                            {isSubmitting ? 'Saving...' : 'Save changes'}
                        </Button>
                    </div>
                    <div className="mt-6 grid gap-6 md:grid-cols-2">
                        <Input
                            id="display_name"
                            label="Display name"
                            type="text"
                            {...register('display_name')}
                            placeholder="Your name"
                            error={errors.display_name?.message}
                        />

                        <div>
                            <Input
                                id="username"
                                label="Username"
                                type="text"
                                {...register('username')}
                                placeholder="yourusername"
                                error={errors.username?.message}
                            />
                            <p className="mt-1.5 text-xs text-text-secondary">
                                Lowercase letters, numbers, hyphens, and underscores only.
                            </p>
                        </div>
                    </div>

                    <div className="mt-6">
                        <p className="mb-1.5 block text-sm font-medium text-text-primary">Avatar</p>

                        <div className="mt-3 flex flex-col items-start gap-6 sm:flex-row">
                            <Avatar
                                src={avatarUrl.trim() ? normalizeUrl(avatarUrl) : undefined}
                                name={profile?.display_name ?? 'User'}
                                className="h-28 w-28 shrink-0 border border-border-subtle bg-elevated sm:h-36 sm:w-36"
                                fallbackClassName="text-sm text-text-muted"
                            />
                            {/* Controls */}
                            <div className="flex min-w-0 flex-1 flex-col gap-4">
                                {/* Avatar URL */}
                                <div className="max-w-lg">
                                    <Input
                                        id="avatar_url"
                                        type="text"
                                        {...register('avatar_url')}
                                        placeholder="https://example.com/avatar.jpg"
                                        error={errors.avatar_url?.message}
                                    />
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
                                            className={`inline-flex shrink-0 cursor-pointer items-center rounded-md border border-border px-3 py-2 text-sm font-medium text-text-primary transition-colors duration-200 hover:bg-elevated hover:text-accent ${uploading ? 'pointer-events-none opacity-50' : ''
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
                        <Textarea
                            id="bio"
                            label="Bio"
                            {...register('bio')}
                            placeholder="Write a short bio..."
                            rows={5}
                            error={errors.bio?.message}
                        />

                        <div className="mt-1.5 flex items-center justify-between">
                            {!errors.bio?.message && (
                                <p className="text-xs text-text-secondary">
                                    A short description shown on your profile and articles.
                                </p>
                            )}

                            <p className="text-xs text-text-secondary">{bioText.length}/500</p>
                        </div>
                    </div>
                    {/* add a little padding between logical sections */}
                    <div className="mt-6 mb-6 border-t border-border-subtle" />

                    <div>
                        <h2 className="font-serif text-lg font-semibold text-text-primary">Links</h2>
                        <p className="mt-1 text-sm text-text-secondary">
                            Optional external links for your profile.
                        </p>
                    </div>

                    <div className="mt-6 grid gap-6 md:grid-cols-3">
                        <Input
                            id="website_url"
                            label="Website"
                            type="text"
                            {...register('website_url')}
                            placeholder="yoursite.com"
                            error={errors.website_url?.message}
                        />

                        <Input
                            id="github_url"
                            label="GitHub"
                            type="text"
                            {...register('github_url')}
                            placeholder="github.com/username"
                            error={errors.github_url?.message}
                        />

                        <Input
                            id="linkedin_url"
                            label="LinkedIn"
                            type="text"
                            {...register('linkedin_url')}
                            placeholder="linkedin.com/in/username"
                            error={errors.linkedin_url?.message}
                        />
                    </div>
                </section>
            </form>
            {/* Danger Zone */}
            <section className="mt-4 rounded-lg border border-accent/40 bg-bg p-6">
                <h2 className="font-serif text-lg font-semibold text-accent">Danger zone</h2>
                <p className="mt-1 text-sm text-text-secondary">
                    Permanently delete your account, articles, comments, and all associated data.
                    This cannot be undone.
                </p>
                <Button
                    variant="danger"
                    size="md"
                    className="mt-4 bg-accent text-white hover:bg-accent-hover"
                    onClick={() => setShowDeleteModal(true)}
                >
                    Delete my account
                </Button>
            </section>

            <ConfirmationModal
                isOpen={showDeleteModal}
                title="Delete account"
                message="This will permanently delete your account and all of your content. This action cannot be undone. Are you absolutely sure?"
                confirmText="Delete forever"
                onConfirm={() => {
                    setShowDeleteModal(false);
                    setShowFinalDeleteModal(true);
                }}
                onClose={() => !deleting && setShowDeleteModal(false)}
            />

            <ConfirmationModal
                isOpen={showFinalDeleteModal}
                title="Are you really sure?"
                message="Your account and all of your content will be permanently deleted. This action cannot be undone."
                confirmText="Yes, delete forever"
                isLoading={deleting}
                onConfirm={handleDeleteAccount}
                onClose={() => !deleting && setShowFinalDeleteModal(false)}
            />
            <CropModal
                isOpen={cropModalState.isOpen}
                onClose={handleCropModalClose}
                imageSrc={cropModalState.src || ''}
                onSave={handleAvatarCropSave}
                title="Crop profile picture"
            />
        </>
    );
}