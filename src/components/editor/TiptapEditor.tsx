import { useEditor, EditorContent } from '@tiptap/react';
import { BubbleMenu } from '@tiptap/react/menus';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import { Markdown } from 'tiptap-markdown';
import { CodeBlock } from './CodeBlock';
import { SlashCommand } from './SlashCommand';
import {
  Bold,
  Italic,
  Strikethrough,
  Link as LinkIcon,
  Quote,
  Code,
  Eraser,
  Heading1,
  Heading2,
  Heading3,
} from 'lucide-react';

type TiptapEditorProps = {
  value: string;
  onChange: (markdown: string) => void;
  onImageUpload: (file: File) => Promise<string>;
};

export function TiptapEditor({
  value,
  onChange,
  onImageUpload
}: Readonly<TiptapEditorProps>) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false,
      }),
      Placeholder.configure({
        placeholder: "Type '/' for commands...",
      }),
      Link.configure({
        openOnClick: false,
      }),
      Image,
      Markdown.configure({
        html: false,
        transformCopiedText: true,
      }),
      SlashCommand,
      CodeBlock,
    ],

    content: value,

    onUpdate: ({ editor }) => {
      const markdownStorage = editor.storage as unknown as {
        markdown: {
          getMarkdown: () => string;
        };
      };

      onChange(markdownStorage.markdown.getMarkdown());
    },

    editorProps: {
      attributes: {
        class: 'article-prose focus:outline-none min-h-[300px]',
      },

      handlePaste: (_view, event) => {
        const items = Array.from(event.clipboardData?.items ?? []);

        const imageItem = items.find((item) =>
          item.type.startsWith('image/')
        );

        if (!imageItem) {
          return false;
        }

        const file = imageItem.getAsFile();

        if (!file) {
          return false;
        }

        const position = editor?.state.selection.from;

        void (async () => {
          try {
            const url = await onImageUpload(file);

            if (!editor || position === undefined) {
              return;
            }

            editor
              .chain()
              .focus()
              .insertContentAt(position, {
                type: 'image',
                attrs: {
                  src: url,
                  alt: file.name,
                },
              })
              .run();
          } catch (error) {
            console.error('Failed to upload pasted image:', error);
            alert('Failed to upload image. Please try again.');
          }
        })();

        return true;
      },

      handleDrop: (_view, event, _slice, moved) => {
        if (moved) {
          return false;
        }

        const files = Array.from(event.dataTransfer?.files ?? []);

        const imageFile = files.find((file) =>
          file.type.startsWith('image/')
        );

        if (!imageFile) {
          return false;
        }

        void (async () => {
          try {
            const url = await onImageUpload(imageFile);

            editor?.chain()
              .focus()
              .setImage({
                src: url,
                alt: imageFile.name,
              })
              .run();
          } catch (error) {
            console.error('Failed to upload dropped image:', error);
            alert('Failed to upload image. Please try again.');
          }
        })();

        return true;
      },
    },
  });

  const setLink = () => {
    if (!editor) return;

    const previousUrl = editor.getAttributes('link').href;

    const url = window.prompt('Enter URL', previousUrl);

    if (url === null) return;

    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    editor
      .chain()
      .focus()
      .extendMarkRange('link')
      .setLink({ href: url })
      .run();
  };

  if (!editor) {
    return null;
  }

  return (
    <>
      <BubbleMenu
        editor={editor}
        className="flex items-center gap-1 rounded-lg bg-elevated border border-border px-1.5 py-1 shadow-lg"
      >
        {/* Bold */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`p-1.5 rounded transition-colors ${editor.isActive('bold')
            ? 'text-accent bg-surface'
            : 'text-text-secondary hover:text-text-primary hover:bg-surface'
            }`}
          title="Bold"
        >
          <Bold size={15} />
        </button>

        {/* Italic */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`p-1.5 rounded transition-colors ${editor.isActive('italic')
            ? 'text-accent bg-surface'
            : 'text-text-secondary hover:text-text-primary hover:bg-surface'
            }`}
          title="Italic"
        >
          <Italic size={15} />
        </button>

        {/* Strike */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={`p-1.5 rounded transition-colors ${editor.isActive('strike')
            ? 'text-accent bg-surface'
            : 'text-text-secondary hover:text-text-primary hover:bg-surface'
            }`}
          title="Strikethrough"
        >
          <Strikethrough size={15} />
        </button>

        <div className="w-px h-5 bg-border" />

        {/* Heading 1 */}
        <button
          type="button"
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 1 }).run()
          }
          className={`p-1.5 rounded transition-colors ${editor.isActive('heading', { level: 1 })
            ? 'text-accent bg-surface'
            : 'text-text-secondary hover:text-text-primary hover:bg-surface'
            }`}
          title="Heading 1"
        >
          <Heading1 size={15} />
        </button>

        {/* Heading 2 */}
        <button
          type="button"
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
          className={`p-1.5 rounded transition-colors ${editor.isActive('heading', { level: 2 })
            ? 'text-accent bg-surface'
            : 'text-text-secondary hover:text-text-primary hover:bg-surface'
            }`}
          title="Heading 2"
        >
          <Heading2 size={15} />
        </button>

        {/* Heading 3 */}
        <button
          type="button"
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 3 }).run()
          }
          className={`p-1.5 rounded transition-colors ${editor.isActive('heading', { level: 3 })
            ? 'text-accent bg-surface'
            : 'text-text-secondary hover:text-text-primary hover:bg-surface'
            }`}
          title="Heading 3"
        >
          <Heading3 size={15} />
        </button>

        <div className="w-px h-5 bg-border" />

        {/* Quote */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={`p-1.5 rounded transition-colors ${editor.isActive('blockquote')
            ? 'text-accent bg-surface'
            : 'text-text-secondary hover:text-text-primary hover:bg-surface'
            }`}
          title="Quote"
        >
          <Quote size={15} />
        </button>

        {/* Inline Code */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleCode().run()}
          className={`p-1.5 rounded transition-colors ${editor.isActive('code')
            ? 'text-accent bg-surface'
            : 'text-text-secondary hover:text-text-primary hover:bg-surface'
            }`}
          title="Inline code"
        >
          <Code size={15} />
        </button>

        {/* Clear formatting */}
        <button
          type="button"
          onClick={() =>
            editor.chain().focus().unsetAllMarks().clearNodes().run()
          }
          className="p-1.5 rounded text-text-secondary hover:text-text-primary hover:bg-surface transition-colors"
          title="Clear formatting"
        >
          <Eraser size={15} />
        </button>

        {/* Link */}
        <button
          type="button"
          onClick={setLink}
          className={`p-1.5 rounded transition-colors ${editor.isActive('link')
            ? 'text-accent bg-surface'
            : 'text-text-secondary hover:text-text-primary hover:bg-surface'
            }`}
          title="Add link"
        >
          <LinkIcon size={15} />
        </button>
      </BubbleMenu>

      <EditorContent editor={editor} />
    </>
  );
}