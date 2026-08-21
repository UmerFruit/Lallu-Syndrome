import { useState, type FormEvent } from 'react';
import { supabase } from '@/lib/supabase';
import { Input } from '@/components/ui/Input';

export function PasswordSettingsPage() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMessage('');

    if (newPassword.length < 6) {
      setStatus('error');
      setMessage('Password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setStatus('error');
      setMessage('Passwords do not match.');
      return;
    }

    setStatus('saving');

    const { error } = await supabase.auth.updateUser({ password: newPassword });

    if (error) {
      setStatus('error');
      setMessage(error.message);
    } else {
      setStatus('success');
      setMessage('Password updated successfully.');
      setNewPassword('');
      setConfirmPassword('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <section className="rounded-lg border border-border-subtle bg-bg p-6">
        <div>
          <h2 className="font-serif text-lg font-semibold text-text-primary">
            Change Password
          </h2>
          <p className="mt-1 text-sm text-text-secondary">
            Ensure your account is using a strong, unique password.
          </p>
        </div>

        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <Input
            id="new_password"
            label="New Password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="••••••••"
            required
          />

          <Input
            id="confirm_password"
            label="Confirm New Password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="••••••••"
            required
          />
        </div>
      </section>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={status === 'saving'}
          className="rounded bg-accent px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {status === 'saving' ? 'Updating...' : 'Update Password'}
        </button>

        {status === 'success' && (
          <span className="text-sm font-medium text-emerald-500">{message}</span>
        )}
      </div>

      {status === 'error' && message && (
        <p className="text-sm text-red-500">{message}</p>
      )}
    </form>
  );
}