import { useState } from 'react';
import { Check, Copy } from 'lucide-react';

type CodeBlockProps = {
  language?: string;
  code: string;
};

export function CodeBlock({ language, code }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <div className="relative group my-6 rounded-card overflow-hidden border border-border bg-surface">
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-elevated">
        <span className="font-mono text-xs text-text-muted uppercase tracking-wider">
          {language || 'code'}
        </span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-xs text-text-muted hover:text-text-primary transition-colors duration-200"
          aria-label="Copy code"
        >
          {copied ? (
            <>
              <Check size={14} className="text-accent" />
              <span className="text-accent">Copied</span>
            </>
          ) : (
            <>
              <Copy size={14} />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <pre className="overflow-x-auto p-4">
        <code className={`hljs language-${language ?? 'plaintext'} font-mono text-sm leading-relaxed`} dangerouslySetInnerHTML={{ __html: code }} />
      </pre>
    </div>
  );
}
