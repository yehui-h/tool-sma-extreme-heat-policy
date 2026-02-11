export function formatDateLabel(date: string) {
  return new Intl.DateTimeFormat('en-AU', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
  }).format(new Date(date))
}
