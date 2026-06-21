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
};

export function useAdminImageManager(): UseAdminImageManagerReturn {
  const [isImageManagerOpen, setIsImageManagerOpen] = useState(false);
  const [imageMode, setImageMode] = useState<'url' | 'upload'>('url');

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

  return {
    isImageManagerOpen,
    setIsImageManagerOpen,
    openImageManager,
    closeImageManager,
    imageMode,
    setImageMode,
    selectUrlMode,
    selectUploadMode,
  };
}
