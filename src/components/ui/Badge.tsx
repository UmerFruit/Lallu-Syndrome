type BadgeProps = {
  children: React.ReactNode;
  variant?: 'default' | 'accent' | 'muted';
  className?: string;
};

const variantClasses = {
  default: 'text-text-secondary border-border',
  accent: 'text-accent border-accent/30',
  muted: 'text-text-muted border-border-subtle',
};

export function Badge({ children, variant = 'default', className }: Readonly<BadgeProps>) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 font-mono text-xs font-medium uppercase tracking-wider px-2 py-0.5 rounded border ${variantClasses[variant]} ${className ?? ''}`}
    >
      {children}
    </span>
  );
}
