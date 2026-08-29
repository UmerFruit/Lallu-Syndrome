import { useState } from 'react';
import { MessageSquarePlus } from 'lucide-react';
import { FeedbackModal } from '@/components/feedback/FeedbackModal';

export function FloatingFeedbackButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Got ideas? Tell me — open feedback form"
        className="fixed bottom-[max(1rem,env(safe-area-inset-bottom))] right-4 z-40 flex animate-slide-up items-center gap-2 rounded-full border border-border bg-elevated/90 px-4 py-2.5 text-sm font-medium text-text-secondary shadow-lg backdrop-blur-md transition-colors duration-200 hover:border-accent hover:text-text-primary"
      >
        <MessageSquarePlus size={16} className="shrink-0 text-accent" />
        <span className="hidden sm:inline">Got ideas? Tell me</span>
        <span className="sm:hidden">Ideas?</span>
      </button>

      <FeedbackModal open={open} onOpenChange={setOpen} />
    </>
  );
}
