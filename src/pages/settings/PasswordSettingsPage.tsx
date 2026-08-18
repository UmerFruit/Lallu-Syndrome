import { useState, type FormEvent } from 'react';
import { supabase } from '@/lib/supabase';

const inputClass =
  'w-full rounded border border-border-subtle bg-bg px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary/70 focus:border-accent focus:outline-none';
const labelClass = 'block text-sm font-medium text-text-primary mb-1.5';

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
          <div>
            <label htmlFor="new_password" className={labelClass}>
              New Password
            </label>
            <input
              id="new_password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
              className={inputClass}
              required
            />
          </div>

          <div>
            <label htmlFor="confirm_password" className={labelClass}>
              Confirm New Password
            </label>
            <input
              id="confirm_password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className={inputClass}
              required
            />
          </div>
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