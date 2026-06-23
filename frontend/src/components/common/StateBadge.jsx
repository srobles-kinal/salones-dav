const mapping = {
  PENDIENTE: 'badge-warning',
  APROBADA: 'badge-success',
  RECHAZADA: 'badge-danger',
  CANCELADA: 'badge-neutral',
  COMPLETADA: 'badge-info',
  ACTIVA: 'badge-success',
  FINALIZADA: 'badge-neutral',
  EXPIRADA: 'badge-warning',
};
export default function StateBadge({ value }) {
  return <span className={mapping[value] || 'badge-neutral'}>{value}</span>;
}
