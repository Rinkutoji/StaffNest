// Assigns a consistent accent color to each department so the same
// department always reads as the same color across the dashboard chart,
// employee badges, and filters — regardless of how many departments exist.
const PALETTE = [
  'var(--dept-1)',
  'var(--dept-2)',
  'var(--dept-3)',
  'var(--dept-4)',
  'var(--dept-5)',
  'var(--dept-6)',
];

export function departmentColor(departmentId) {
  if (departmentId === null || departmentId === undefined) {
    return 'var(--dept-fallback)';
  }
  const index = Number(departmentId) % PALETTE.length;
  return PALETTE[index];
}
