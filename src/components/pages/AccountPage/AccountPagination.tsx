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
        <span className="material-symbols-outlined" aria-hidden="true">keyboard_double_arrow_left</span>
      </button>
      <button type="button" aria-label="Página anterior" disabled={currentPage === 1} onClick={() => onPageChange(currentPage - 1)}>
        <span className="material-symbols-outlined" aria-hidden="true">chevron_left</span>
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
        <span className="material-symbols-outlined" aria-hidden="true">chevron_right</span>
      </button>
      <button type="button" aria-label="Última página" disabled={currentPage === totalPages} onClick={() => onPageChange(totalPages)}>
        <span className="material-symbols-outlined" aria-hidden="true">keyboard_double_arrow_right</span>
      </button>
    </nav>
  );
}
