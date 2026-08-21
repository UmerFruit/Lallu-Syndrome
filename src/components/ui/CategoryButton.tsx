import { cn } from "@/utils/cn";

type CategoryButtonProps = {
  label: string;
  active: boolean;
  onClick: () => void;
};

export function CategoryButton({
  label,
  active,
  onClick,
}: Readonly<CategoryButtonProps>) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "px-3.5 py-2 sm:py-1.5 rounded font-mono shrink-0 whitespace-nowrap text-xs uppercase tracking-wider border transition-colors duration-200",
        active
          ? "border-accent text-accent bg-accent/5"
          : "border-border text-text-muted hover:text-text-secondary hover:border-text-muted",
      )}
    >
      {label}
    </button>
  );
}