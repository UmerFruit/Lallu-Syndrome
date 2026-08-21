import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/contexts/AuthContext';
import { getProfileByUsername } from '@/services/profileService';
import { toast } from 'sonner';

export const USERNAME_SETUP_SKIP_KEY = 'ls_username_setup_skipped';

const usernameSchema = z.object({
  username: z
    .string()
    .transform((value) => value.trim().toLowerCase())
    .pipe(
      z
        .string()
        .min(3, 'Username must be at least 3 characters.')
        .max(30, 'Username must be 30 characters or less.')
        .regex(
          /^[a-z0-9_-]+$/,
          'Username can include lowercase letters, numbers, hyphens, and underscores.'
        )
    ),
});

type UsernameForm = z.infer<typeof usernameSchema>;

export function UsernameSetupPage() {
  const { user, profile, updateProfile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [checking, setChecking] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<UsernameForm>({
    resolver: zodResolver(usernameSchema),
    defaultValues: {
      username: profile?.username ?? '',
    },
  });

  if (!user) {
    return null;
  }

  const next =
    (location.state as { from?: string } | null)?.from ?? '/dashboard';

  const skipForNow = () => {
    localStorage.setItem(USERNAME_SETUP_SKIP_KEY, '1');
    navigate(next, { replace: true });
  };

  const onSubmit = async (data: UsernameForm) => {
    if (!profile) {
      setError('root', {
        message: 'Your profile is still loading. Please try again.',
      });
      return;
    }

    setChecking(true);

    try {
      const existing = await getProfileByUsername(data.username);

      if (existing && existing.id !== user.id) {
        setError('username', {
          message: 'That username is already taken.',
        });
        return;
      }

      await updateProfile({
        display_name: profile.display_name,
        username: data.username,
        avatar_url: profile.avatar_url,
        bio: profile.bio,
        website_url: profile.website_url,
        github_url: profile.github_url,
        linkedin_url: profile.linkedin_url,
      });

      localStorage.removeItem(USERNAME_SETUP_SKIP_KEY);

      toast.success('Username saved.');
      navigate(next, { replace: true });
    } catch (error: any) {
      if (error?.code === '23505') {
        setError('username', {
          message: 'That username is already taken.',
        });
      } else {
        setError('root', {
          message: 'Could not save username. Please try again.',
        });
      }
    } finally {
      setChecking(false);
    }
  };

  return (
    <AuthLayout
      title="Choose a username"
      subtitle="Optional — only needed if you want a public writer profile."
      footer="You can change this later in Settings → Profile."
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {errors.root && (
          <div className="rounded border border-accent/30 bg-accent/5 px-3.5 py-2.5 text-sm text-accent">
            {errors.root.message}
          </div>
        )}

        <Input
          label="Username"
          placeholder="yourname"
          autoComplete="off"
          {...register('username')}
          error={errors.username?.message}
        />

        <div className="space-y-2 rounded border border-border-subtle bg-bg px-3.5 py-3 text-xs leading-relaxed text-text-secondary">
          <p>
            A username gives you a public writer profile at{' '} <br />
            <span className="font-mono text-text-primary">
              /writers/username
            </span>{' '}
            
          </p>
        </div>

        <div className="flex gap-3">
          <Button
            type="submit"
            className="flex-1"
            loading={isSubmitting || checking}
          >
            Save username
          </Button>

          <Button
            type="button"
            variant="secondary"
            className="flex-1"
            onClick={skipForNow}
            disabled={isSubmitting || checking}
          >
            Skip for now
          </Button>
        </div>
      </form>
    </AuthLayout>
  );
}