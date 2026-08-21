import { Navigate, useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AuthLayout, AuthLink } from '@/components/layout/AuthLayout';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { login } from '@/services/authService';
import { useAuth } from '@/contexts/AuthContext';

const loginSchema = z.object({
  email: z.string().trim().min(1, 'Email is required.').pipe(z.email({ message: 'Please enter a valid email address.' })),
  password: z.string().min(1, 'Password is required.').min(6, 'Password must be at least 6 characters.'),
});

type LoginForm = z.infer<typeof loginSchema>;

export function LoginPage() {
  const { user, isLoading } = useAuth();
  if (isLoading) {return null; } // Prevents flash of login form while checking session
  if (user) { return <Navigate to="/dashboard" replace />; } // if logged in, redirect to dashboard

  const navigate = useNavigate();
  const { register, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    try {
      await login(data.email, data.password);
      navigate('/dashboard');
    } catch (err) {
      setError('root', { message: err instanceof Error ? err.message : 'Something went wrong.' });
    }
  };

  return (
    <AuthLayout
      title="Sign in"
      subtitle="Welcome back. Sign in to access your dashboard."
      footer={<>Don't have an account? <AuthLink to="/signup">Create one</AuthLink></>}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {errors.root && (
          <div className="rounded border border-accent/30 bg-accent/5 px-3.5 py-2.5 text-sm text-accent">
            {errors.root.message}
          </div>
        )}
        <Input label="Email" type="email" placeholder="you@example.com" autoComplete="email" {...register('email')} error={errors.email?.message} />
        <Input label="Password" isPassword placeholder="Your password" autoComplete="current-password" {...register('password')} error={errors.password?.message} />
        <div className="flex justify-end">
          <Link to="/forgot-password" className="text-xs text-text-muted hover:text-text-secondary transition-colors">
            Forgot password?
          </Link>
        </div>
        <Button type="submit" className="w-full" loading={isSubmitting}>Sign in</Button>
      </form>
    </AuthLayout>
  );
}