interface AvatarProps {
  src?: string | null;
  name?: string | null;
  alt?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeClasses = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-9 h-9 text-sm', // Matches the w-9 h-9 from your example
  lg: 'w-12 h-12 text-base',
  xl: 'w-28 h-28 sm:w-36 sm:h-36 text-2xl', // Useful for the profile settings page!
};

export function Avatar({ src, name, alt, size = 'md', className = '' }: AvatarProps) {
  const dimensions = sizeClasses[size];
  const fallbackInitial = name ? name.charAt(0).toUpperCase() : '?';
  const altText = alt || name || 'Avatar';

  const baseClasses = `${dimensions} shrink-0 rounded-full border border-border-subtle bg-elevated ${className}`;

  if (src) {
    return (
      <img
        src={src}
        alt={altText}
        className={`${baseClasses} object-cover`}
      />
    );
  }

  return (
    <div className={`${baseClasses} flex items-center justify-center font-medium text-text-secondary`}>
      {fallbackInitial}
    </div>
  );
}