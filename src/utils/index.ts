export function formatDate(timestamp: number | undefined): string {
  if (!timestamp) return '-';
  try {
    return new Date(timestamp).toLocaleString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '-';
  }
}

export function formatNumber(n: number): string {
  if (typeof n !== 'number' || isNaN(n)) return '0';
  return n.toLocaleString('id-ID');
}

export function classNames(...classes: (string | false | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}
