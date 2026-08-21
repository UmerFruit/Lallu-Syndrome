import { type InputHTMLAttributes, forwardRef, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '@/utils/cn';

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
  isPassword?: boolean;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, isPassword, className, id, type, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const inputId = id ?? props.name;

    let inputType = type ?? 'text';

    if (isPassword) {
      inputType = showPassword ? 'text' : 'password';
    }

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-text-secondary mb-1.5">
            {label}
          </label>
        )}
        <div className="relative">
          <input
            ref={ref}
            id={inputId}
            type={inputType}
            className={cn(
              'w-full rounded bg-surface border border-border px-3.5 py-2.5 text-text-primary placeholder:text-text-muted text-base sm:text-sm transition-colors duration-200 focus:border-accent focus:outline-none',
              error && 'border-accent',
              className
            )}
            aria-describedby={error ? `${inputId}-error` : undefined}
            {...props}
          />
          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary transition-colors"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              tabIndex={-1}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          )}
        </div>
        {error && (
          <p id={`${inputId}-error`} className="mt-1.5 text-xs text-accent">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
