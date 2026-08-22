import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import YouTubeComponent from './YouTubeComponent';

export const YouTube = Node.create({
  name: 'youtube',
  group: 'block',
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      src: {
        default: null,
        parseHTML: (element) => element.getAttribute('src'),
        renderHTML: (attributes) => (attributes.src ? { src: attributes.src } : {}),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'iframe' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'iframe',
      mergeAttributes(HTMLAttributes, {
        class: 'youtube-embed',
        frameborder: '0',
        allowfullscreen: 'true',
        allow:
          'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share',
        title: 'YouTube video',
        loading: 'lazy',
      }),
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(YouTubeComponent);
  },
});