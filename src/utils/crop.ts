// src/utils/crop.ts
export type PixelCrop = {
    x: number; y: number;
    width: number; height: number;
};

function createImage(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const image = new Image();
        image.addEventListener('load', () => resolve(image));
        image.addEventListener('error', (error) => reject(new Error(error.message)));
        image.setAttribute('crossOrigin', 'anonymous');
        image.src = url;
    });
}

export async function getCroppedImg(
    imageSrc: string,
    pixelCrop: PixelCrop
): Promise<File> {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) throw new Error('No 2d context');

    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    ctx.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        pixelCrop.width,
        pixelCrop.height
    );

    return new Promise((resolve, reject) => {
        canvas.toBlob(
            (blob) => {
                if (!blob) {
                    reject(new Error('Canvas is empty'));
                    return;
                }
                // We export as high-quality JPEG. 
                // Your existing `optimizeForUpload` will automatically convert this to WebP later.
                const file = new File([blob], 'cropped.jpg', { type: 'image/jpeg' });
                resolve(file);
            },
            'image/jpeg',
            0.95
        );
    });
}