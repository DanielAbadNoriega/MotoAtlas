import './VersusBadge.scss';

type VersusBadgeProps = {
  label: string;
};

export function VersusBadge({ label }: VersusBadgeProps) {
  return (
    <div className="versus-badge" aria-hidden="true">
      <span>{label}</span>
    </div>
  );
}
