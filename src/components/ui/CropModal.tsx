// src/components/ui/CropModal.tsx
import * as Dialog from '@radix-ui/react-dialog';
import Cropper from 'react-easy-crop';
import { useState, useCallback, useEffect } from 'react';
import type { Area } from 'react-easy-crop';
import { Button } from '@/components/ui/Button';
import { getCroppedImg } from '@/utils/crop';
import { toast } from 'sonner';

interface CropModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageSrc: string;
  aspect: number;
  onSave: (croppedFile: File) => void | Promise<void>;
  title?: string;
}

export function CropModal({
  isOpen,
  onClose,
  imageSrc,
  aspect,
  onSave,
  title = 'Crop image',
}: Readonly<CropModalProps>) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Reset crop/zoom when a new image is loaded
  useEffect(() => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
  }, [imageSrc]);

  const onCropComplete = useCallback((_: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleSave = async () => {
    if (!croppedAreaPixels) return;
    setIsSaving(true);
    try {
      const croppedFile = await getCroppedImg(imageSrc, croppedAreaPixels);
      await onSave(croppedFile);
      onClose();
    } catch (error) {
      console.error(error);
      toast.error('Failed to crop image.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog.Root
      open={isOpen}
      onOpenChange={(open) => {
        if (!open && !isSaving) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm animate-fade-in" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-lg border border-border bg-elevated p-6 shadow-xl flex flex-col gap-4">
          <Dialog.Title className="text-lg font-semibold text-text-primary">
            {title}
          </Dialog.Title>

          <div className="relative w-full aspect-square bg-black rounded-md overflow-hidden">
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={aspect}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
            />
          </div>

          <div className="flex items-center gap-4">
            <label htmlFor="zoom" className="text-sm text-text-secondary whitespace-nowrap">
              Zoom
            </label>
            <input
              id="zoom"
              type="range"
              min={1}
              max={3}
              step={0.1}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-full h-2 bg-surface rounded-lg appearance-none cursor-pointer accent-[var(--color-accent)]"
            />
          </div>

          <div className="flex justify-end gap-3 mt-2">
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