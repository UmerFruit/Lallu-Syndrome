import Image from '@tiptap/extension-image';

export const AlignedImage = Image.extend({
    addAttributes() {
        return {
            ...this.parent?.(),

            width: {
                default: '100%',
                parseHTML: (element) =>
                    element.dataset.width || '100%',
                renderHTML: (attributes) => ({
                    'data-width': attributes.width,
                }),
            },

            alignment: {
                default: 'center',
                parseHTML: (element) =>
                    element.dataset.alignment || 'center',
                renderHTML: (attributes) => ({
                    'data-alignment': attributes.alignment,
                }),
            },
        };
    },

    renderHTML({ HTMLAttributes }) {
        const width = HTMLAttributes['data-width'] || '50%';
        const alignment = HTMLAttributes['data-alignment'] || 'center';

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