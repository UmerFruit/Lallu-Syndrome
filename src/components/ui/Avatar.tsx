import * as AvatarPrimitive from '@radix-ui/react-avatar';
import { cn } from '@/utils/cn';

type AvatarProps = {
  src?: string | null;
  name: string;
  className?: string;
  fallbackClassName?: string;
};

export function Avatar({ src, name, className, fallbackClassName }: Readonly<AvatarProps>) {
  return (
    <AvatarPrimitive.Root className={cn('relative shrink-0 overflow-hidden rounded-full', className)}>
      <AvatarPrimitive.Image src={src ?? undefined} alt={name} className="h-full w-full object-cover" />
      <AvatarPrimitive.Fallback
        className={cn(
          'flex h-full w-full items-center justify-center bg-elevated text-sm font-medium text-text-secondary',
          fallbackClassName
        )}
      >
        {name.charAt(0).toUpperCase()}
      </AvatarPrimitive.Fallback>
    </AvatarPrimitive.Root>
  );
}