import type { ReactNode } from 'react';

type GalleryConfirmDeleteModalProps = Readonly<{
  children: ReactNode;
  imageUrl: string;
  imageTitle: string;
  isProcessing: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}>;

export function GalleryConfirmDeleteModal({
  children,
  imageUrl,
  imageTitle,
  isProcessing,
  onConfirm,
  onCancel,
}: GalleryConfirmDeleteModalProps) {
  return (
    <div className="admin-model__image-modal-backdrop">
      <div
        className="admin-model__image-modal admin-model__gallery-confirm-delete"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-delete-title"
      >
        <header className="admin-model__image-modal-header">
          <div className="admin-model__image-modal-title-group">
            <span className="admin-model__image-modal-kicker">CONFIRMAR ELIMINACIÓN</span>
            <h2 id="confirm-delete-title">{children}</h2>
          </div>
          <button
            type="button"
            className="admin-model__image-modal-close"
            aria-label="Cancelar"
            disabled={isProcessing}
            onClick={onCancel}
          >
            <span className="material-symbols-outlined" aria-hidden="true">close</span>
          </button>
        </header>
        <div className="admin-model__gallery-confirm-delete-body">
          <div className="admin-model__gallery-confirm-delete-preview">
            <img src={imageUrl} alt={imageTitle} />
          </div>
          <div className="admin-model__gallery-confirm-delete-text">
            <p>¿Estás seguro de que quieres eliminar esta imagen de la galería?</p>
            <p className="admin-model__gallery-confirm-delete-warning">
              Esta acción no se puede deshacer. Se eliminará el registro de la galería y, si el archivo no está compartido, también la copia guardada en el almacenamiento de MotoAtlas. Tu archivo original no se verá afectado.
            </p>
          </div>
        </div>
        <footer className="admin-model__image-modal-footer">
          <button
            type="button"
            className="account-page__button account-page__button--glass"
            disabled={isProcessing}
            onClick={onCancel}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="account-page__button"
            disabled={isProcessing}
            onClick={onConfirm}
          >
            <span className="material-symbols-outlined" aria-hidden="true">delete_forever</span>
            {isProcessing ? 'Eliminando...' : 'Eliminar'}
          </button>
        </footer>
      </div>
    </div>
  );
}
