import Image from '@tiptap/extension-image';

export const AlignedImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),

      width: {
        default: '75%',

        parseHTML: (element) => {
          const dataWidth = element.dataset.width;

          if (dataWidth) {
            return dataWidth;
          }

          const styleWidth = (element as HTMLElement).style.width;

          return styleWidth || '100%';
        },

        renderHTML: (attributes) => ({
          'data-width': attributes.width,
        }),
      },

      alignment: {
        default: 'center',

        parseHTML: (element) => {
          const dataAlignment =
            element.dataset.alignment;

          if (dataAlignment) {
            return dataAlignment;
          }

          const style = (element as HTMLElement).style;

          if (style.marginLeft === 'auto' && style.marginRight === '0px') {
            return 'right';
          }

          if (style.marginLeft === '0px' && style.marginRight === 'auto') {
            return 'left';
          }

          return 'center';
        },

        renderHTML: (attributes) => ({
          'data-alignment': attributes.alignment,
        }),
      },
    };
  },

  renderHTML({ HTMLAttributes }) {
    const width =
      HTMLAttributes['data-width'] || '100%';

    const alignment =
      HTMLAttributes['data-alignment'] || 'center';

    let margin = '0 auto 1rem auto';

    if (alignment === 'left') {
      margin = '0 auto 1rem 0';
    } else if (alignment === 'right') {
      margin = '0 0 1rem auto';
    }

    return [
      'img',
      {
        ...HTMLAttributes,
        style: `display:block;width:${width};margin:${margin};`,
      },
    ];
  },
});