import { useEditor, EditorContent } from '@tiptap/react';
import { useRef } from 'react';
import type { Editor } from '@tiptap/core';
import { BubbleMenu } from '@tiptap/react/menus';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Link from '@tiptap/extension-link';
import { CodeBlock } from './CodeBlock';
import { AlignedImage } from './AlignedImage';
import { SlashCommand } from './SlashCommand';
import TextAlign from '@tiptap/extension-text-align';
import { processPastedHtml } from './processPastedHtml';
import { DOMParser as TiptapDOMParser } from '@tiptap/pm/model';
import { useToast } from '@/contexts/ToastContext';

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
  AlignJustify,
  AlignLeft,
  AlignCenter,
  AlignRight,
} from 'lucide-react';


type TiptapEditorProps = {
  value: string;
  onChange: (html: string) => void;
  onImageUpload: (file: File) => Promise<string>;
};
function isDirectImageUrl(value: string): boolean {
  try {
    const url = new URL(value.trim());

    return /\.(jpg|jpeg|png|gif|webp|avif)(\?.*)?$/i.test(url.pathname + url.search);
  } catch {
    return false;
  }
}
export function TiptapEditor({
  value,
  onChange,
  onImageUpload
}: Readonly<TiptapEditorProps>) {

  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const openImagePicker = (targetEditor: Editor) => {
    fileInputRef.current?.click();

    const handleFileChange = async () => {
      const file = fileInputRef.current?.files?.[0];

      if (!file) return;

      try {
        const url = await onImageUpload(file);

        targetEditor
          .chain()
          .focus()
          .setImage({
            src: url,
            alt: file.name,
          })
          .run();
      } catch (error) {
        console.error('Failed to upload image:', error);
        toast.error('Failed to upload image. Please try again.');
      } finally {
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }

        fileInputRef.current?.removeEventListener(
          'change',
          handleFileChange
        );
      }
    };

    fileInputRef.current?.addEventListener(
      'change',
      handleFileChange,
      { once: true }
    );
  };

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false,
        link: false,
      }),
      Placeholder.configure({
        placeholder: "Type '/' for commands...",
      }),
      Link.configure({
        openOnClick: false,
      }),
      TextAlign.configure({
        types: ['paragraph', 'heading'],
        defaultAlignment: 'justify',
      }),
      SlashCommand.configure({
        onImageUpload: openImagePicker,
      }),
      AlignedImage,
      CodeBlock,
    ],


    content: value,

    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'article-prose focus:outline-none min-h-[300px]',
      },

      handlePaste: (_view, event) => {
        const clipboardData = event.clipboardData;

        if (!clipboardData) {
          return false;
        }

        // 1. Pasted image file from clipboard
        const items = Array.from(clipboardData.items);

        const imageItem = items.find((item) =>
          item.type.startsWith('image/')
        );

        if (imageItem) {
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
              toast.error('Failed to upload image. Please try again.');
            }
          })();

          return true;
        }

        // 2. Direct image URL pasted as text
        const pastedText = clipboardData.getData('text/plain').trim();

        if (pastedText && isDirectImageUrl(pastedText)) {
          editor
            ?.chain()
            .focus()
            .setImage({
              src: pastedText,
              alt: '',
            })
            .run();

          return true;
        }

        // 3. Pasted HTML content
        const pastedHtml = clipboardData.getData('text/html');

        if (pastedHtml) {
          const position = editor?.state.selection.from;

          void (async () => {
            try {
              if (!editor || position === undefined) {
                return;
              }

              const processedHtml = await processPastedHtml(
                pastedHtml,
                onImageUpload
              );

              const parsed = TiptapDOMParser.fromSchema(editor.schema).parse(
                new window.DOMParser()
                  .parseFromString(processedHtml, 'text/html')
                  .body
              );

              editor
                .chain()
                .focus()
                .insertContentAt(position, parsed.toJSON())
                .run();


            } catch (error) {
              console.error('Paste processing failed:', error);
            }
          })();

          return true;
        }
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
            toast.error('Failed to upload image. Please try again.');
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
  // Predicates for bubble menus
  const textMenuShouldShow = ({ editor }: { editor: Editor }) => {
    // Show only when there is a selection and the active node is NOT an image
    return !editor.isActive('image') && !editor.state.selection.empty;
  };

  const imageMenuShouldShow = ({ editor }: { editor: Editor }) => {
    return editor.isActive('image');
  };
  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
      />
      {/* ====== TEXT BUBBLE MENU ====== */}
      <BubbleMenu
        editor={editor}
        shouldShow={textMenuShouldShow}
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
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
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
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
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
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={`p-1.5 rounded transition-colors ${editor.isActive('heading', { level: 3 })
            ? 'text-accent bg-surface'
            : 'text-text-secondary hover:text-text-primary hover:bg-surface'
            }`}
          title="Heading 3"
        >
          <Heading3 size={15} />
        </button>

        <div className="w-px h-5 bg-border" />

        {/* Justify text */}
        <button
          type="button"
          onClick={() => {
            if (editor.isActive({ textAlign: 'justify' })) {
              editor.chain().focus().setTextAlign('left').run();
            } else {
              editor.chain().focus().setTextAlign('justify').run();
            }
          }}
          className={`p-1.5 rounded transition-colors ${editor.isActive({ textAlign: 'justify' })
            ? 'text-accent bg-surface'
            : 'text-text-secondary hover:text-text-primary hover:bg-surface'
            }`}
          title="Justify text"
        >
          <AlignJustify size={15} />
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
          onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}
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
      {/* ====== IMAGE BUBBLE MENU ====== */}
      <BubbleMenu
        editor={editor}
        shouldShow={imageMenuShouldShow}
        className="flex items-center gap-1 rounded-lg bg-elevated border border-border px-1.5 py-1 shadow-lg"
      >
        {/* Alignment */}
        <button
          type="button"
          onClick={() =>
            editor.chain().focus().updateAttributes('image', { alignment: 'left' }).run()
          }
          className={`p-1.5 rounded transition-colors ${editor.getAttributes('image').alignment === 'left'
            ? 'text-accent bg-surface'
            : 'text-text-secondary hover:text-text-primary hover:bg-surface'
            }`}
          title="Align image left"
        >
          <AlignLeft size={15} />
        </button>

        <button
          type="button"
          onClick={() =>
            editor.chain().focus().updateAttributes('image', { alignment: 'center' }).run()
          }
          className={`p-1.5 rounded transition-colors ${editor.getAttributes('image').alignment === 'center'
            ? 'text-accent bg-surface'
            : 'text-text-secondary hover:text-text-primary hover:bg-surface'
            }`}
          title="Center image"
        >
          <AlignCenter size={15} />
        </button>

        <button
          type="button"
          onClick={() =>
            editor.chain().focus().updateAttributes('image', { alignment: 'right' }).run()
          }
          className={`p-1.5 rounded transition-colors ${editor.getAttributes('image').alignment === 'right'
            ? 'text-accent bg-surface'
            : 'text-text-secondary hover:text-text-primary hover:bg-surface'
            }`}
          title="Align image right"
        >
          <AlignRight size={15} />
        </button>

        <div className="w-px h-5 bg-border" />

        {/* Width presets */}
        {[
          { label: 'S', width: '25%', title: 'Small image' },
          { label: 'M', width: '50%', title: 'Medium image' },
          { label: 'L', width: '75%', title: 'Large image' },
          { label: 'F', width: '100%', title: 'Full width image' },
        ].map(({ label, width, title }) => (
          <button
            key={width}
            type="button"
            onClick={() =>
              editor.chain().focus().updateAttributes('image', { width }).run()
            }
            className={`p-1.5 rounded text-xs transition-colors ${editor.getAttributes('image').width === width
              ? 'text-accent bg-surface'
              : 'text-text-secondary hover:text-text-primary hover:bg-surface'
              }`}
            title={title}
          >
            {label}
          </button>
        ))}
      </BubbleMenu>

      <EditorContent editor={editor} />
    </>
  );
}