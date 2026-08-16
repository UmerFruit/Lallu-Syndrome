import { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import type { SlashCommandItem } from './SlashCommand';

export type SlashCommandMenuRef = {
  onKeyDown: (props: { event: KeyboardEvent }) => boolean;
};

type SlashCommandMenuProps = {
  items: SlashCommandItem[];
  command: (item: SlashCommandItem) => void;
};

export const SlashCommandMenu = forwardRef<
  SlashCommandMenuRef,
  SlashCommandMenuProps
>(({ items, command }, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    setSelectedIndex(0);
  }, [items]);

  const selectItem = (index: number) => {
    const item = items[index];

    if (item) {
      command(item);
    }
  };

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }) => {
      if (event.key === 'ArrowUp') {
        setSelectedIndex((current) =>
          current <= 0 ? items.length - 1 : current - 1
        );

        return true;
      }

      if (event.key === 'ArrowDown') {
        setSelectedIndex((current) =>
          current >= items.length - 1 ? 0 : current + 1
        );

        return true;
      }

      if (event.key === 'Enter') {
        selectItem(selectedIndex);

        return true;
      }

      return false;
    },
  }));

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="w-72 overflow-hidden rounded-lg border border-border bg-surface p-1 shadow-xl">
      {items.map((item, index) => (
        <button
          key={item.title}
          type="button"
          onClick={() => selectItem(index)}
          className={`flex w-full flex-col rounded-md px-3 py-2 text-left transition-colors ${
            index === selectedIndex
              ? 'bg-elevated text-text-primary'
              : 'text-text-secondary hover:bg-elevated'
          }`}
        >
          <span className="text-sm font-medium">
            {item.title}
          </span>

          <span className="text-xs text-text-muted">
            {item.description}
          </span>
        </button>
      ))}
    </div>
  );
});

SlashCommandMenu.displayName = 'SlashCommandMenu';