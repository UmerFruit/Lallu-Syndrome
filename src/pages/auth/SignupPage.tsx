import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthLayout, AuthLink } from '@/components/layout/AuthLayout';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { signup } from '@/services/authService';
// import { Turnstile } from '@/components/auth/Turnstile';

// Replace with your actual Cloudflare Turnstile Site Key
// const TURNSTILE_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY
export function SignupPage() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
    captcha?: string;
    form?: string;
  }>({});
  const [loading, setLoading] = useState(false);

  const validate = (): boolean => {
    const e: typeof errors = {};
    if (!name) e.name = 'Name is required.';
    else if (name.length < 2) e.name = 'Name must be at least 2 characters.';
    if (!email) e.email = 'Email is required.';
    else if (!email.includes('@')) e.email = 'Please enter a valid email address.';
    if (!password) e.password = 'Password is required.';
    else if (password.length < 6) e.password = 'Password must be at least 6 characters.';
    if (!confirmPassword) e.confirmPassword = 'Please confirm your password.';
    else if (password !== confirmPassword) e.confirmPassword = 'Passwords do not match.';
    // if (!captchaToken) e.captcha = 'Please complete the captcha verification.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    console.log("I got called 1")
    if (!validate()) return;
    setLoading(true);
    console.log("I got called 2")
    try {
      await signup(name, email, password, captchaToken ?? undefined);
      navigate('/dashboard');
      console.log("I got called 3")
    } catch (err) {
      setErrors({ form: err instanceof Error ? err.message : 'Something went wrong.' });
      console.log("I got called 4")
    } finally {
      setLoading(false);
      console.log("I got called 5")
    }
  };

  return (
    <AuthLayout
      title="Create account"
      subtitle="Start writing and publishing on Lallu Syndrome."
      footer={
        <>
          Already have an account? <AuthLink to="/login">Sign in</AuthLink>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {errors.form && (
          <div className="rounded border border-accent/30 bg-accent/5 px-3.5 py-2.5 text-sm text-accent">
            {errors.form}
          </div>
        )}
        <Input
          label="Name"
          type="text"
          name="name"
          placeholder="Your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={errors.name}
          autoComplete="name"
          required
        />
        <Input
          label="Email"
          type="email"
          name="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
          autoComplete="email"
          required
        />
        <Input
          label="Password"
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
          label="Confirm password"
          isPassword
          name="confirmPassword"
          placeholder="Re-enter your password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          error={errors.confirmPassword}
          autoComplete="new-password"
          required
        />

        {/* Turnstile Captcha */}
        {/* <div>
          <Turnstile
            siteKey={TURNSTILE_SITE_KEY}
            onVerify={(token) => {
              setCaptchaToken(token);
              setErrors((prev) => ({ ...prev, captcha: undefined }));
            }}
          />
          {errors.captcha && (
            <p className="mt-1.5 text-xs text-accent">{errors.captcha}</p>
          )}
        </div> */}

        <Button type="submit" className="w-full" loading={loading}>
          Create account
        </Button>
      </form>
    </AuthLayout>
  );
}