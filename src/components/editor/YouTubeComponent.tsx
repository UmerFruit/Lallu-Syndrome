import { useState } from 'react';
import { NodeViewWrapper } from '@tiptap/react';
import type { NodeViewProps } from '@tiptap/react';
import { Trash2 } from 'lucide-react';

export default function YouTubeComponent({
  node,
  updateAttributes,
  deleteNode,
}: Readonly<NodeViewProps>) {
  const [inputValue, setInputValue] = useState('');
  const src = node.attrs.src as string | null;

  const extractVideoId = (input: string): string | null => {
    const patterns = [
      /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
      /^([a-zA-Z0-9_-]{11})$/,
    ];
    for (const p of patterns) {
      const m = new RegExp(p).exec(input);
      if (m) return m[1];
    }
    return null;
  };

  const handleAdd = () => {
    const videoId = extractVideoId(inputValue.trim());
    if (videoId) {
      updateAttributes({ src: `https://www.youtube.com/embed/${videoId}` });
    }
  };

  return (
    <NodeViewWrapper className="my-6">
      {src ? (
        <div className="group relative" contentEditable={false}>
          <iframe
            src={src}
            title="YouTube video"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            className="aspect-video w-full rounded-card border border-border-subtle pointer-events-none"
          />
          <button
            type="button"
            onClick={deleteNode}
            className="absolute right-2 top-2 rounded bg-bg/80 p-1.5 text-text-secondary transition-colors hover:text-accent opacity-0 group-hover:opacity-100"
            aria-label="Delete video"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ) : (
        <div
          className="flex gap-2 rounded-card border border-border-subtle bg-surface p-4"
          contentEditable={false}
        >
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              e.stopPropagation();
              if (e.key === 'Enter') handleAdd();
            }}
            placeholder="Paste a YouTube URL..."
            className="flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-muted focus:outline-none"
          />
          <button
            type="button"
            onClick={handleAdd}
            className="rounded bg-accent px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
          >
            Embed
          </button>
        </div>
      )}
    </NodeViewWrapper>
  );
}