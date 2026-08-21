import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { resetPassword } from '@/services/authService';

const resetSchema = z.object({
  password: z.string().min(1, 'Password is required.').min(6, 'Password must be at least 6 characters.'),
  confirmPassword: z.string().min(1, 'Please confirm your password.'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match.',
  path: ['confirmPassword'],
});

type ResetForm = z.infer<typeof resetSchema>;

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const { register, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm<ResetForm>({
    resolver: zodResolver(resetSchema),
  });

  const onSubmit = async (data: ResetForm) => {
    try {
      await resetPassword(data.password);
      navigate('/login');
    } catch (err) {
      setError('root', { message: err instanceof Error ? err.message : 'Something went wrong.' });
    }
  };

  return (
    <AuthLayout
      title="Reset password"
      subtitle="Enter your new password below."
      footer={<Link to="/login" className="text-accent hover:text-accent-hover transition-colors font-medium">Back to sign in</Link>}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {errors.root && (
          <div className="rounded border border-accent/30 bg-accent/5 px-3.5 py-2.5 text-sm text-accent">
            {errors.root.message}
          </div>
        )}
        <Input label="New password" isPassword placeholder="At least 6 characters" autoComplete="new-password" {...register('password')} error={errors.password?.message} />
        <Input label="Confirm new password" isPassword placeholder="Re-enter your password" autoComplete="new-password" {...register('confirmPassword')} error={errors.confirmPassword?.message} />
        <Button type="submit" className="w-full" loading={isSubmitting}>Reset password</Button>
      </form>
    </AuthLayout>
  );
}