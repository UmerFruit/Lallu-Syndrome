import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
const passwordSchema = z.object({
  newPassword: z.string().min(1, 'Password is required.').min(6, 'Password must be at least 6 characters long.'),
  confirmPassword: z.string().min(1, 'Please confirm your password.'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match.',
  path: ['confirmPassword'],
});

type PasswordForm = z.infer<typeof passwordSchema>;

export function PasswordSettingsPage() {
  const { register, handleSubmit, reset, setError, formState: { errors, isSubmitting } } = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
  });

  const onSubmit = async (data: PasswordForm) => {
    const { error } = await supabase.auth.updateUser({ password: data.newPassword });
    if (error) {
      setError('root', { message: error.message });
    } else {
      toast.success('Password updated successfully.');
      reset();
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      <section className="rounded-lg border border-border-subtle bg-bg p-6">
        <div>
          <h2 className="font-serif text-lg font-semibold text-text-primary">Change Password</h2>
          <p className="mt-1 text-sm text-text-secondary">Ensure your account is using a strong, unique password.</p>
        </div>
        {errors.root && (
          <div className="mt-4 rounded border border-accent/30 bg-accent/5 px-3.5 py-2.5 text-sm text-accent">
            {errors.root.message}
          </div>
        )}
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <Input label="New Password" isPassword placeholder="••••••••" autoComplete="new-password" {...register('newPassword')} error={errors.newPassword?.message} />
          <Input label="Confirm New Password" isPassword placeholder="••••••••" autoComplete="new-password" {...register('confirmPassword')} error={errors.confirmPassword?.message} />
        </div>
      </section>
      <Button type="submit" loading={isSubmitting}>Update Password</Button>
    </form>
  );
}