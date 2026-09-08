export function getErrorMessage(error, fallback = 'Something went wrong. Please try again.') {
  return error?.response?.data?.message || fallback;
}

/**
 * Returns the browser's LOCAL date as YYYY-MM-DD.
 *
 * Deliberately does NOT use `new Date().toISOString().slice(0, 10)` - that
 * method always converts to UTC first, so for anyone in Cambodia (UTC+7)
 * it reports YESTERDAY's date for the entire midnight-6:59am window, even
 * though the device's clock is set correctly. Building the string from
 * getFullYear()/getMonth()/getDate() instead uses the local calendar date
 * as the user's device actually sees it.
 */
export function todayLocalISO() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** Same local-date safety as todayLocalISO(), truncated to YYYY-MM. */
export function currentMonthLocalISO() {
  return todayLocalISO().slice(0, 7);
}

export function formatCurrency(amount) {
  const value = Number(amount) || 0;
  return '$' + value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function formatDate(dateString) {
  if (!dateString) return '—';
  const date = new Date(dateString.replace(' ', 'T'));
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

export function timeAgo(dateString) {
  if (!dateString) return '—';
  const date = new Date(dateString.replace(' ', 'T'));
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return formatDate(dateString);
}

export function initials(fullName = '') {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 0 || !parts[0]) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
