import { useState } from 'react';
import { Share2, Check} from 'lucide-react';

type ShareButtonProps = {
  url: string;
  title: string;
};

export function ShareButton({ url, title }: Readonly<ShareButtonProps>) {
  const [shared, setShared] = useState(false);

  const handleShare = async () => {
    const shareData = { title, url };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        // user cancelled, ignore
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      setShared(true);
      setTimeout(() => setShared(false), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <button
      type="button"
      onClick={handleShare}
      className="group inline-flex items-center gap-2.5 px-4 py-2.5 rounded border border-border bg-surface hover:border-text-muted transition-colors duration-200"
      aria-label="Share article"
    >
      {shared ? (
        <>
          <Check size={18} className="text-accent" />
          <span className="text-sm font-medium text-accent">Link copied</span>
        </>
      ) : (
        <>
          <Share2 size={18} className="text-text-muted group-hover:text-text-secondary transition-colors" />
          <span className="text-sm font-medium text-text-secondary">Share</span>
        </>
      )}
    </button>
  );
}
