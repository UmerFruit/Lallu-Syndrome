import * as Dialog from '@radix-ui/react-dialog';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Cropper, ImageRestriction, type CropperRef } from 'react-advanced-cropper';
import 'react-advanced-cropper/dist/style.css';
import { Button } from '@/components/ui/Button';
import { getCroppedImg } from '@/utils/crop';
import { toast } from 'sonner';

interface CropModalProps {
    isOpen: boolean;
    onClose: () => void;
    imageSrc: string;
    /**
     * Optional fixed aspect ratio (e.g. 16 / 9).
     * Leave undefined for a free-hand rectangular crop.
     */
    aspect?: number;
    onSave: (croppedFile: File) => void | Promise<void>;
    title?: string;
}

const MIN_ZOOM = 1;
const MAX_ZOOM = 4;

export function CropModal({
    isOpen,
    onClose,
    imageSrc,
    aspect,
    onSave,
    title = 'Crop image',
}: Readonly<CropModalProps>) {
    const cropperRef = useRef<CropperRef>(null);
    const [zoom, setZoom] = useState(MIN_ZOOM);
    const [isSaving, setIsSaving] = useState(false);

    // Store the baseline visible width when the image is first fitted into the box
    const initialVisibleAreaWidthRef = useRef<number | null>(null);

    // Reset the slider and baseline width whenever a new image is loaded
    useEffect(() => {
        setZoom(MIN_ZOOM);
        initialVisibleAreaWidthRef.current = null;
    }, [imageSrc]);

    const handleCropperChange = useCallback((cropper: CropperRef) => {
        const state = cropper.getState();

        if (state?.visibleArea) {

            if (initialVisibleAreaWidthRef.current === null) {
                const defaultState = cropper.getDefaultState();
                const baseWidth = defaultState?.visibleArea?.width ?? state.visibleArea.width;
                initialVisibleAreaWidthRef.current = baseWidth;
            }

            const scale = initialVisibleAreaWidthRef.current / state.visibleArea.width;

            if (typeof scale === 'number' && Number.isFinite(scale) && scale > 0) {
                setZoom(scale);
            }
        }
    }, []);

    const handleZoomChange = (value: number) => {
        const cropper = cropperRef.current;
        if (!cropper || value <= 0 || value === zoom) return;
        // zoomImage expects a *relative* factor → convert the absolute slider value
        cropper.zoomImage(value / zoom);
    };

    const handleSave = async () => {
        const cropper = cropperRef.current;
        if (!cropper) return;

        const coordinates = cropper.getCoordinates();
        if (!coordinates || coordinates.width <= 0 || coordinates.height <= 0) return;

        setIsSaving(true);
        try {
            const croppedFile = await getCroppedImg(imageSrc, {
                x: coordinates.left,
                y: coordinates.top,
                width: coordinates.width,
                height: coordinates.height,
            });

            await onSave(croppedFile);
            onClose();
        } catch (error) {
            console.error(error);
            toast.error('Failed to crop image.');
        } finally {
            setIsSaving(false);
        }
    };

    const sliderValue = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom));

    return (
        <Dialog.Root
            open={isOpen}
            onOpenChange={(open) => {
                if (!open && !isSaving) onClose();
            }}
        >
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm animate-fade-in" />
                <Dialog.Content className="fixed left-1/2 top-1/2 z-50 flex max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 flex-col gap-4 overflow-y-auto rounded-lg border border-border bg-elevated p-6 shadow-xl">
                    <Dialog.Title className="text-lg font-semibold text-text-primary">
                        {title}
                    </Dialog.Title>

                    <div className="h-[320px] w-full shrink-0 overflow-hidden rounded-md bg-black sm:h-[400px]">
                        <Cropper
                            ref={cropperRef}
                            src={imageSrc}
                            className="h-full"
                            onChange={handleCropperChange}
                            // fitArea shows the entire image up front. The previous
                            // fillArea forced the image to *cover* the box, which is
                            // what caused the over-zoomed look.
                            imageRestriction={ImageRestriction.fitArea}
                            stencilProps={{
                                // undefined = free-hand rectangle, draggable corner handles
                                aspectRatio: aspect,
                                minWidth: 48,
                                minHeight: 48,
                            }}
                        />
                    </div>

                    <div className="flex items-center gap-4">
                        <label htmlFor="zoom-slider" className="whitespace-nowrap text-sm text-text-secondary">
                            Zoom
                        </label>
                        <input
                            id="zoom-slider"
                            type="range"
                            min={MIN_ZOOM}
                            max={MAX_ZOOM}
                            step={0.01}
                            value={sliderValue}
                            onChange={(e) => handleZoomChange(Number(e.target.value))}
                            className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-surface accent-[var(--color-accent)]"
                        />
                        <span className="w-12 shrink-0 text-right font-mono text-xs text-text-muted">
                            {Math.round(sliderValue * 100)}%
                        </span>
                    </div>

                    <div className="mt-2 flex justify-end gap-3">
                        <Button variant="secondary" onClick={onClose} disabled={isSaving}>
                            Cancel
                        </Button>
                        <Button variant="primary" onClick={handleSave} loading={isSaving}>
                            Apply
                        </Button>
                    </div>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
}