import dayjs from 'dayjs';

export function formatDate(date: string): string {
  return dayjs(date).format('MMM DD, YYYY');
}

export function formatDateLong(date: string): string {
  return dayjs(date).format('MMMM D, YYYY');
}

export function relativeTime(date: string): string {
  const then = dayjs(date);
  const now = dayjs();
  const minutes = now.diff(then, 'minute');
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = now.diff(then, 'hour');
  if (hours < 24) return `${hours}h ago`;
  const days = now.diff(then, 'day');
  if (days < 7) return `${days}d ago`;
  return formatDate(date);
}