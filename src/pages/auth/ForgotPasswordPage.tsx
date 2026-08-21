import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AuthLayout, AuthLink } from '@/components/layout/AuthLayout';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { forgotPassword } from '@/services/authService';
import { CheckCircle } from 'lucide-react';

const forgotSchema = z.object({
  email: z.string().min(1, 'Email is required.').pipe(z.email({message: 'Please enter a valid email address.'})),
});

type ForgotForm = z.infer<typeof forgotSchema>;

export function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [sentEmail, setSentEmail] = useState('');
  const { register, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm<ForgotForm>({
    resolver: zodResolver(forgotSchema),
  });

  const onSubmit = async (data: ForgotForm) => {
    try {
      await forgotPassword(data.email);
      setSentEmail(data.email);
      setSent(true);
    } catch (err) {
      setError('root', { message: err instanceof Error ? err.message : 'Something went wrong.' });
    }
  };

  if (sent) {
    return (
      <AuthLayout
        title="Check your email"
        subtitle="If an account exists for that email, we've sent a password reset link."
        footer={<Link to="/login" className="text-accent hover:text-accent-hover transition-colors font-medium">Back to sign in</Link>}
      >
        <div className="text-center space-y-4">
          <CheckCircle size={40} className="mx-auto text-accent" />
          <p className="text-sm text-text-secondary">
            We sent an email to <span className="text-text-primary font-medium">{sentEmail}</span> with instructions to reset your password.
          </p>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Forgot password"
      subtitle="Enter your email and we'll send you a reset link."
      footer={<>Remembered your password? <AuthLink to="/login">Sign in</AuthLink></>}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {errors.root && (
          <div className="rounded border border-accent/30 bg-accent/5 px-3.5 py-2.5 text-sm text-accent">
            {errors.root.message}
          </div>
        )}
        <Input label="Email" type="email" placeholder="you@example.com" autoComplete="email" {...register('email')} error={errors.email?.message} />
        <Button type="submit" className="w-full" loading={isSubmitting}>Send reset link</Button>
      </form>
    </AuthLayout>
  );
}