import { Navigate,useNavigate } from 'react-router-dom';
import { AuthLayout, AuthLink } from '@/components/layout/AuthLayout';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { signup } from '@/services/authService';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';
import { CheckCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
const signupSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters.'),
  email: z.string().trim().min(1, 'Email is required.').pipe(z.email({ message: 'Please enter a valid email address.' })),
  password: z.string().min(6, 'Password must be at least 6 characters.'),
  confirmPassword: z.string().min(1, 'Please confirm your password.'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match.',
  path: ['confirmPassword'],
});

type SignupForm = z.infer<typeof signupSchema>;


export function SignupPage() {
  const { user, isLoading } = useAuth();
  if (isLoading) { return null; } 
  if (user) { return <Navigate to="/dashboard" replace />; } 

  const navigate = useNavigate();
  const [needsConfirmation, setNeedsConfirmation] = useState(false);
  const [sentEmail, setSentEmail] = useState('');

  const { register, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
  });

  const onSubmit = async (data: SignupForm) => {
    try {
      const result = await signup(data.name, data.email, data.password);
      if (result.session) {
        navigate('/dashboard');
      } else {
        setSentEmail(data.email);
        setNeedsConfirmation(true);
      }
    } catch (err) {
      setError('root', { message: err instanceof Error ? err.message : 'Something went wrong.' });
    }
  };
  if (needsConfirmation) {
    return (
      <AuthLayout
        title="Confirm your email"
        subtitle="We sent you a confirmation link. Click it to activate your account."
        footer={<AuthLink to="/login">Back to sign in</AuthLink>}
      >
        <div className="space-y-4 text-center">
          <CheckCircle size={40} className="mx-auto text-accent" />
          <p className="text-sm text-text-secondary">
            Check <span className="font-medium text-text-primary">{sentEmail}</span> and confirm your signup.
          </p>
        </div>
      </AuthLayout >
    );
  }

  return (
    <AuthLayout
      title="Create account"
      subtitle="Start writing and publishing on LS."
      footer={<>Already have an account? <AuthLink to="/login">Sign in</AuthLink></>}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {errors.root && (
          <div className="rounded border border-accent/30 bg-accent/5 px-3.5 py-2.5 text-sm text-accent">
            {errors.root.message}
          </div>
        )}
        <Input label="Name" type="text" placeholder="Your name" autoComplete="name" {...register('name')} error={errors.name?.message} />
        <Input label="Email" type="email" placeholder="you@example.com" autoComplete="email" {...register('email')} error={errors.email?.message} />
        <Input label="Password" isPassword placeholder="At least 6 characters" autoComplete="new-password" {...register('password')} error={errors.password?.message} />
        <Input label="Confirm password" isPassword placeholder="Re-enter your password" autoComplete="new-password" {...register('confirmPassword')} error={errors.confirmPassword?.message} />
        <Button type="submit" className="w-full" loading={isSubmitting}>
          Create account
        </Button>
      </form>
    </AuthLayout>
  );
}