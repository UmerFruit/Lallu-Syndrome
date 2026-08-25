import { useEditor, EditorContent } from '@tiptap/react';
import { useRef, useEffect } from 'react';
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
import { toast } from 'sonner';
import { YouTube } from './YouTube';

import {
  Bold,
  Italic,
  Strikethrough,
  Quote,
  Code,
  Heading1,
  Heading2,
  Heading3,
  AlignJustify,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Link as LinkIcon,
  type LucideIcon,
} from 'lucide-react';
type ToolbarButton = {
  key: string;
  icon: LucideIcon;
  title: string;
  isActive: (editor: Editor) => boolean;
  run: (editor: Editor) => void;
};

const textToolbarButtons: ToolbarButton[] = [
  { key: 'bold', icon: Bold, title: 'Bold', isActive: (e) => e.isActive('bold'), run: (e) => e.chain().focus().toggleBold().run() },
  { key: 'italic', icon: Italic, title: 'Italic', isActive: (e) => e.isActive('italic'), run: (e) => e.chain().focus().toggleItalic().run() },
  { key: 'strike', icon: Strikethrough, title: 'Strikethrough', isActive: (e) => e.isActive('strike'), run: (e) => e.chain().focus().toggleStrike().run() },
  { key: 'h1', icon: Heading1, title: 'Heading 1', isActive: (e) => e.isActive('heading', { level: 1 }), run: (e) => e.chain().focus().toggleHeading({ level: 1 }).run() },
  { key: 'h2', icon: Heading2, title: 'Heading 2', isActive: (e) => e.isActive('heading', { level: 2 }), run: (e) => e.chain().focus().toggleHeading({ level: 2 }).run() },
  { key: 'h3', icon: Heading3, title: 'Heading 3', isActive: (e) => e.isActive('heading', { level: 3 }), run: (e) => e.chain().focus().toggleHeading({ level: 3 }).run() },
  { key: 'justify', icon: AlignJustify, title: 'Justify text', isActive: (e) => e.isActive({ textAlign: 'justify' }), run: (e) => e.chain().focus().setTextAlign(e.isActive({ textAlign: 'justify' }) ? 'left' : 'justify').run() },
  { key: 'quote', icon: Quote, title: 'Quote', isActive: (e) => e.isActive('blockquote'), run: (e) => e.chain().focus().toggleBlockquote().run() },
  { key: 'code', icon: Code, title: 'Inline code', isActive: (e) => e.isActive('code'), run: (e) => e.chain().focus().toggleCode().run() },
  {
    key: 'link',
    icon: LinkIcon,
    title: 'Insert Link',
    isActive: (e) => e.isActive('link'),
    run: (e) => {
      const previousUrl = e.getAttributes('link').href;
      const url = window.prompt('Enter URL', previousUrl);

      // Cancelled
      if (url === null) return;

      // Empty string = remove link
      if (url === '') {
        e.chain().focus().extendMarkRange('link').unsetLink().run();
        return;
      }

      // Set/Update link
      e.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    }
  },
];


type TiptapEditorProps = {
  value: string;
  onChange: (html: string) => void;
  onImageUpload: (file: File) => Promise<string>;
  articleId?: string | null;
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
  onImageUpload,
  articleId = null
}: Readonly<TiptapEditorProps>) {

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
      } catch (error: any) {
        console.error('Failed to upload image:', error);
        toast.error(error.message || 'Failed to upload image. Please try again.');
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
        autolink: true,
      }),
      TextAlign.extend({
        addKeyboardShortcuts() {
          return {}; // disable all TextAlign shortcuts
        },
      }).configure({
        types: ['paragraph', 'heading'],
      }),
      SlashCommand.configure({
        onImageUpload: openImagePicker,
      }),
      AlignedImage,
      CodeBlock,
      YouTube,
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
            } catch (error: any) {
              console.error('Failed to upload pasted image:', error);
              toast.error(error.message || 'Failed to upload pasted image. Please try again.'); // ✅ FIXED
            }
          })();

          return true;
        }

        // 2. Direct image URL pasted as text
        const pastedText = clipboardData.getData('text/plain').trim();

        if (pastedText && isDirectImageUrl(pastedText)) {
          if (!editor) return true;
          editor.chain().focus().setImage({ src: pastedText, alt: '' }).run();

          void (async () => {
            try {
              const response = await fetch(pastedText);
              if (!response.ok) return;
              const blob = await response.blob();
              if (!blob.type.startsWith('image/')) return;

              const extension = blob.type.split('/')[1]?.split('+')[0] || 'png';
              const file = new File([blob], `pasted-image.${extension}`, { type: blob.type });
              const url = await onImageUpload(file);

              // Find the image node by its original src and update it
              editor.chain().command(({ tr }) => {
                let updated = false;
                tr.doc.descendants((node, pos) => {
                  if (node.type.name === 'image' && node.attrs.src === pastedText) {
                    tr.setNodeMarkup(pos, undefined, { ...node.attrs, src: url });
                    updated = true;
                    return false;
                  }
                });
                return updated;
              }).run();
            }
            catch (error) {
              console.error('Failed to upload image from URL:', error);
              toast.error('Failed to upload image from URL. Please try again.');
            }
          })();

          return true;
        }

        // 3. Pasted HTML content
        const pastedHtml = clipboardData.getData('text/html');

        if (pastedHtml) {
          if (!editor) return true;

          // Process HTML synchronously to get the content and the list of images
          const { html: processedHtml, images } = processPastedHtml(pastedHtml, articleId);

          // FIX: Let Tiptap parse the HTML string directly. 
          // This safely handles the schema and replaces active text selections.
          editor.chain().focus().insertContent(processedHtml).run();

          void (async () => {
            const uploadedUrls = new Map<string, string>();
            for (const img of images) {
              try {
                let url = uploadedUrls.get(img.originalSrc);

                if (!url) {
                  const response = await fetch(img.originalSrc);
                  if (!response.ok) continue;

                  const blob = await response.blob();
                  if (!blob.type.startsWith('image/')) continue;

                  const extension = blob.type.split('/')[1]?.split('')[0] || 'png';
                  const file = new File([blob], `pasted-image.${extension}`, { type: blob.type });

                  url = await onImageUpload(file);
                  uploadedUrls.set(img.originalSrc, url);
                }
                // Find the image node by its original src and update it
                editor.chain().command(({ tr }) => {
                  let updated = false;
                  tr.doc.descendants((node, pos) => {
                    if (node.type.name === 'image' && node.attrs.src === img.originalSrc) {
                      tr.setNodeMarkup(pos, undefined, { ...node.attrs, src: url });
                      updated = true;
                      return false;
                    }
                  });
                  return updated;
                }).run();
              } catch (error) {
                console.error('Failed to process pasted image:', error);
                toast.error('Failed to process pasted image. Please try again.');
              }
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
  useEffect(() => {
    if (!editor) return;

    if (editor.getHTML() !== value) {
      editor.commands.setContent(value, { emitUpdate: false });
    }
  }, [value, editor]);
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
        options={{ placement: 'top', offset: 8 }}
      >
        <div
          className="flex items-center gap-1 rounded-lg bg-elevated border border-border px-1.5 py-1 shadow-lg"
          onMouseDown={(e) => e.preventDefault()}>

          {textToolbarButtons.map(({ key, icon: Icon, title, isActive, run }) => (
            <button
              key={key}
              type="button"
              onClick={() => run(editor)}
              className={`p-2.5 rounded transition-colors ${isActive(editor) ? 'text-accent bg-surface' : 'text-text-secondary hover:text-text-primary hover:bg-surface'
                }`}
              title={title}
            >
              <Icon size={16} />
            </button>
          ))}
        </div>
      </BubbleMenu>
      {/* ====== IMAGE BUBBLE MENU ====== */}
      <BubbleMenu
        editor={editor}
        shouldShow={imageMenuShouldShow}
        options={{ placement: 'top', offset: 8 }}
      >
        <div
          className="flex items-center gap-1 rounded-lg bg-elevated border border-border px-1.5 py-1 shadow-lg"
          onMouseDown={(e) => e.preventDefault()}
        >
          {/* Alignment */}
          <button
            type="button"
            onClick={() =>
              editor.chain().focus().updateAttributes('image', { alignment: 'left' }).run()
            }
            className={`p-2.5 rounded transition-colors ${editor.getAttributes('image').alignment === 'left'
              ? 'text-accent bg-surface'
              : 'text-text-secondary hover:text-text-primary hover:bg-surface'
              }`}
            title="Align image left"
          >
            <AlignLeft size={16} />
          </button>

          <button
            type="button"
            onClick={() =>
              editor.chain().focus().updateAttributes('image', { alignment: 'center' }).run()
            }
            className={`p-2.5 rounded transition-colors ${editor.getAttributes('image').alignment === 'center'
              ? 'text-accent bg-surface'
              : 'text-text-secondary hover:text-text-primary hover:bg-surface'
              }`}
            title="Center image"
          >
            <AlignCenter size={16} />
          </button>

          <button
            type="button"
            onClick={() =>
              editor.chain().focus().updateAttributes('image', { alignment: 'right' }).run()
            }
            className={`p-2.5 rounded transition-colors ${editor.getAttributes('image').alignment === 'right'
              ? 'text-accent bg-surface'
              : 'text-text-secondary hover:text-text-primary hover:bg-surface'
              }`}
            title="Align image right"
          >
            <AlignRight size={16} />
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
              className={`p-2.5 rounded text-xs transition-colors ${editor.getAttributes('image').width === width
                ? 'text-accent bg-surface'
                : 'text-text-secondary hover:text-text-primary hover:bg-surface'
                }`}
              title={title}
            >
              {label}
            </button>
          ))}
        </div>
      </BubbleMenu>

      <EditorContent editor={editor} />
    </>
  );
}