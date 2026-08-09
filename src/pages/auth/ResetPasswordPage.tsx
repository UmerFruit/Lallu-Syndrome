import { useState, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { resetPassword } from '@/services/authService';

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<{ password?: string; confirmPassword?: string; form?: string }>({});
  const [loading, setLoading] = useState(false);

  const validate = (): boolean => {
    const e: typeof errors = {};
    if (!password) e.password = 'Password is required.';
    else if (password.length < 6) e.password = 'Password must be at least 6 characters.';
    if (!confirmPassword) e.confirmPassword = 'Please confirm your password.';
    else if (password !== confirmPassword) e.confirmPassword = 'Passwords do not match.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await resetPassword(password);
      navigate('/login');
    } catch (err) {
      setErrors({ form: err instanceof Error ? err.message : 'Something went wrong.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Reset password"
      subtitle="Enter your new password below."
      footer={
        <Link to="/login" className="text-accent hover:text-accent-hover transition-colors font-medium">
          Back to sign in
        </Link>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {errors.form && (
          <div className="rounded border border-accent/30 bg-accent/5 px-3.5 py-2.5 text-sm text-accent">
            {errors.form}
          </div>
        )}
        <Input
          label="New password"
          isPassword
          name="password"
          placeholder="At least 6 characters"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
          autoComplete="new-password"
          required
        />
        <Input
          label="Confirm new password"
          isPassword
          name="confirmPassword"
          placeholder="Re-enter your password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          error={errors.confirmPassword}
          autoComplete="new-password"
          required
        />
        <Button type="submit" className="w-full" loading={loading}>
          Reset password
        </Button>
      </form>
    </AuthLayout>
  );
}
