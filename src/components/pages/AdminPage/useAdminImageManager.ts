import { useCallback, useState, type Dispatch, type SetStateAction } from 'react';

export type UseAdminImageManagerReturn = {
  isImageManagerOpen: boolean;
  setIsImageManagerOpen: Dispatch<SetStateAction<boolean>>;
  openImageManager: () => void;
  closeImageManager: () => void;
  imageMode: 'url' | 'upload';
  setImageMode: Dispatch<SetStateAction<'url' | 'upload'>>;
  selectUrlMode: () => void;
  selectUploadMode: () => void;
  galleryInfoCardKeys: ReadonlySet<string>;
  handleToggleGalleryCardInfo: (cardKey: string) => void;
  resetGalleryInfoCardKeys: () => void;
};

export function useAdminImageManager(): UseAdminImageManagerReturn {
  const [isImageManagerOpen, setIsImageManagerOpen] = useState(false);
  const [imageMode, setImageMode] = useState<'url' | 'upload'>('url');
  const [galleryInfoCardKeys, setGalleryInfoCardKeys] = useState<ReadonlySet<string>>(new Set());

  const openImageManager = useCallback(() => {
    setIsImageManagerOpen(true);
  }, []);

  const closeImageManager = useCallback(() => {
    setIsImageManagerOpen(false);
  }, []);

  const selectUrlMode = useCallback(() => {
    setImageMode('url');
  }, []);

  const selectUploadMode = useCallback(() => {
    setImageMode('upload');
  }, []);

  const handleToggleGalleryCardInfo = useCallback((cardKey: string) => {
    setGalleryInfoCardKeys((current) => {
      const next = new Set(current);

      if (next.has(cardKey)) {
        next.delete(cardKey);
      } else {
        next.add(cardKey);
      }

      return next;
    });
  }, []);

  const resetGalleryInfoCardKeys = useCallback(() => {
    setGalleryInfoCardKeys(new Set());
  }, []);

  return {
    isImageManagerOpen,
    setIsImageManagerOpen,
    openImageManager,
    closeImageManager,
    imageMode,
    setImageMode,
    selectUrlMode,
    selectUploadMode,
    galleryInfoCardKeys,
    handleToggleGalleryCardInfo,
    resetGalleryInfoCardKeys,
  };
}
