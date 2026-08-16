import { useState } from 'react';
import {
  NodeViewContent,
  NodeViewWrapper,
} from '@tiptap/react';
import type { NodeViewProps } from '@tiptap/react';
import {
  Check,
  Clipboard,
  Trash2,
} from 'lucide-react';

const LANGUAGES = [
  { value: 'text', label: 'Plain Text' },
  { value: 'bash', label: 'Shell / Bash' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'python', label: 'Python' },
  { value: 'json', label: 'JSON' },
  { value: 'html', label: 'HTML' },
  { value: 'css', label: 'CSS' },
  { value: 'sql', label: 'SQL' },
  { value: 'java', label: 'Java' },
  { value: 'c', label: 'C' },
  { value: 'cpp', label: 'C++' },
  { value: 'csharp', label: 'C#' },
  { value: 'php', label: 'PHP' },
  { value: 'go', label: 'Go' },
  { value: 'rust', label: 'Rust' },
];

export default function CodeBlockComponent({
  node,
  updateAttributes,
  deleteNode,
}: NodeViewProps) {
  const [copied, setCopied] = useState(false);

  const language = (node.attrs.language as string) || 'text';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(node.textContent);

      setCopied(true);

      window.setTimeout(() => {
        setCopied(false);
      }, 1500);
    } catch (error) {
      console.error('Failed to copy code:', error);
    }
  };

  return (
    <NodeViewWrapper className="tiptap-code-block">
      <div
        className="tiptap-code-block__header"
        contentEditable={false}
      >
        <select
          value={language}
          onChange={(event) =>
            updateAttributes({
              language: event.target.value,
            })
          }
          className="tiptap-code-block__language"
          aria-label="Code language"
        >
          {LANGUAGES.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>

        <div className="tiptap-code-block__actions">
          <button
            type="button"
            onClick={handleCopy}
            className="tiptap-code-block__action"
            aria-label={copied ? 'Copied' : 'Copy code'}
          >
            {copied ? (
              <Check size={14} />
            ) : (
              <Clipboard size={14} />
            )}
          </button>

          <button
            type="button"
            onClick={deleteNode}
            className="tiptap-code-block__action tiptap-code-block__action--danger"
            aria-label="Delete code block"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      <div className="tiptap-code-block__content">
        <NodeViewContent spellCheck={false} />
      </div>
    </NodeViewWrapper>
  );
}