import { MotoIcon } from '../../../shared/ui/icons/MotoIcon';

type AccountPaginationProps = Readonly<{
  ariaLabel: string;
  className: string;
  currentClassName: string;
  currentPage: number;
  onPageChange: (page: number) => void;
  totalPages: number;
}>;

function getVisiblePageNumbers(currentPage: number, totalPages: number) {
  const maxVisiblePages = 5;
  const visibleCount = Math.min(maxVisiblePages, totalPages);
  const halfWindow = Math.floor(visibleCount / 2);
  let start = Math.max(1, currentPage - halfWindow);
  const endOverflow = start + visibleCount - 1 - totalPages;

  if (endOverflow > 0) {
    start = Math.max(1, start - endOverflow);
  }

  return Array.from({ length: visibleCount }, (_, index) => start + index);
}

export function AccountPagination({
  ariaLabel,
  className,
  currentClassName,
  currentPage,
  onPageChange,
  totalPages,
}: AccountPaginationProps) {
  if (totalPages <= 1) {
    return null;
  }

  const visiblePages = getVisiblePageNumbers(currentPage, totalPages);

  return (
    <nav className={className} aria-label={ariaLabel}>
      <button type="button" aria-label="Primera página" disabled={currentPage === 1} onClick={() => onPageChange(1)}>
        <MotoIcon name="keyboard_double_arrow_left" width="1.18rem" height="1.18rem" />
      </button>
      <button type="button" aria-label="Página anterior" disabled={currentPage === 1} onClick={() => onPageChange(currentPage - 1)}>
        <MotoIcon name="chevron_left" width="1.18rem" height="1.18rem" />
      </button>
      {visiblePages.map((page) => (
        <button
          className={page === currentPage ? currentClassName : undefined}
          type="button"
          aria-current={page === currentPage ? 'page' : undefined}
          aria-label={`Página ${page}`}
          key={page}
          onClick={() => onPageChange(page)}
        >
          {page}
        </button>
      ))}
      <button type="button" aria-label="Página siguiente" disabled={currentPage === totalPages} onClick={() => onPageChange(currentPage + 1)}>
        <MotoIcon name="chevron_right" width="1.18rem" height="1.18rem" />
      </button>
      <button type="button" aria-label="Última página" disabled={currentPage === totalPages} onClick={() => onPageChange(totalPages)}>
        <MotoIcon name="keyboard_double_arrow_right" width="1.18rem" height="1.18rem" />
      </button>
    </nav>
  );
}
