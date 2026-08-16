import { Extension } from '@tiptap/core';
import Suggestion, {
    type SuggestionOptions,
} from '@tiptap/suggestion';
import type { Editor } from '@tiptap/core';
import { ReactRenderer } from '@tiptap/react';
import tippy from 'tippy.js';
import type { Instance as TippyInstance } from 'tippy.js';

const getReferenceClientRect = (clientRect: (() => DOMRect | null) | null) => {
  return () =>
    clientRect?.() ??
    new DOMRect(0, 0, 0, 0);
};

import {
    SlashCommandMenu,
    type SlashCommandMenuRef,
} from './SlashCommandMenu';

type CommandProps = {
    editor: Editor;
    range: {
        from: number;
        to: number;
    };
};

export type SlashCommandItem = {
    title: string;
    description: string;
    keywords: string[];
    command: (props: CommandProps) => void;
};

const getItems = ({
    query,
}: {
    query: string;
}): SlashCommandItem[] => {
    const items: SlashCommandItem[] = [
        {
            title: 'Text',
            description: 'Start writing with plain text',
            keywords: ['paragraph', 'text', 'plain'],
            command: ({ editor, range }) => {
                editor
                    .chain()
                    .focus()
                    .deleteRange(range)
                    .setParagraph()
                    .run();
            },
        },
        {
            title: 'Heading 1',
            description: 'Large section heading',
            keywords: ['h1', 'heading', 'title'],
            command: ({ editor, range }) => {
                editor
                    .chain()
                    .focus()
                    .deleteRange(range)
                    .setHeading({ level: 1 })
                    .run();
            },
        },
        {
            title: 'Heading 2',
            description: 'Medium section heading',
            keywords: ['h2', 'heading', 'subtitle'],
            command: ({ editor, range }) => {
                editor
                    .chain()
                    .focus()
                    .deleteRange(range)
                    .setHeading({ level: 2 })
                    .run();
            },
        },
        {
            title: 'Heading 3',
            description: 'Small section heading',
            keywords: ['h3', 'heading'],
            command: ({ editor, range }) => {
                editor
                    .chain()
                    .focus()
                    .deleteRange(range)
                    .setHeading({ level: 3 })
                    .run();
            },
        },
        {
            title: 'Bullet List',
            description: 'Create a bulleted list',
            keywords: ['bullet', 'list', 'ul'],
            command: ({ editor, range }) => {
                editor
                    .chain()
                    .focus()
                    .deleteRange(range)
                    .toggleBulletList()
                    .run();
            },
        },
        {
            title: 'Numbered List',
            description: 'Create a numbered list',
            keywords: ['numbered', 'ordered', 'list', 'ol'],
            command: ({ editor, range }) => {
                editor
                    .chain()
                    .focus()
                    .deleteRange(range)
                    .toggleOrderedList()
                    .run();
            },
        },
        {
            title: 'Quote',
            description: 'Add a blockquote',
            keywords: ['quote', 'blockquote'],
            command: ({ editor, range }) => {
                editor
                    .chain()
                    .focus()
                    .deleteRange(range)
                    .toggleBlockquote()
                    .run();
            },
        },
        {
            title: 'Code Block',
            description: 'Add a block of code',
            keywords: ['code', 'codeblock', 'programming'],
            command: ({ editor, range }) => {
                editor
                    .chain()
                    .focus()
                    .deleteRange(range)
                    .toggleCodeBlock()
                    .run();
            },
        },
        {
            title: 'Divider',
            description: 'Insert a horizontal divider',
            keywords: ['divider', 'hr', 'line', 'separator'],
            command: ({ editor, range }) => {
                editor
                    .chain()
                    .focus()
                    .deleteRange(range)
                    .setHorizontalRule()
                    .run();
            },
        },
    ];

    const normalizedQuery = query.toLowerCase();

    return items.filter((item) => {
        return (
            item.title.toLowerCase().includes(normalizedQuery) ||
            item.description.toLowerCase().includes(normalizedQuery) ||
            item.keywords.some((keyword) =>
                keyword.includes(normalizedQuery)
            )
        );
    });
};

export const SlashCommand = Extension.create({
    name: 'slashCommand',

    addOptions() {
        return {
            suggestion: {
                char: '/',
                startOfLine: false,

                items: getItems,

                command: ({
                    editor,
                    range,
                    props,
                }: {
                    editor: Editor;
                    range: CommandProps['range'];
                    props: SlashCommandItem;
                }) => {
                    props.command({
                        editor,
                        range,
                    });
                },

                render: () => {
                    let component: ReactRenderer<SlashCommandMenuRef> | null = null;
                    let popup: TippyInstance | null = null;

                    return {
                        onStart: (props) => {
                            component = new ReactRenderer(SlashCommandMenu, {
                                props,
                                editor: props.editor,
                            });

                            if (!props.clientRect) return;

                            popup = tippy(document.body, {
                                getReferenceClientRect: getReferenceClientRect(props.clientRect),
                                appendTo: () => document.body,
                                content: component.element,
                                showOnCreate: true,
                                interactive: true,
                                trigger: 'manual',
                                placement: 'bottom-start',
                            });
                        },

                        onUpdate: (props) => {
                            component?.updateProps(props);

                            if (!props.clientRect) return;

                            popup?.setProps({
                                getReferenceClientRect: getReferenceClientRect(props.clientRect),
                            });
                        },

                        onKeyDown: (props) => {
                            if (props.event.key === 'Escape') {
                                popup?.hide();
                                return true;
                            }

                            return component?.ref?.onKeyDown(props) ?? false;
                        },

                        onExit: () => {
                            popup?.destroy();
                            component?.destroy();
                            popup = null;
                            component = null;
                        },
                    };
                },

            } satisfies Partial<SuggestionOptions<SlashCommandItem>>,
        };
    },

    addProseMirrorPlugins() {
        return [
            Suggestion<SlashCommandItem>({
                editor: this.editor,
                ...this.options.suggestion,
            }),
        ];
    },
});