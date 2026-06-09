export function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function dateToISO(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function isoToDate(iso: string): Date {
  const [y, m, day] = iso.split('-').map(Number);
  return new Date(y, m - 1, day);
}

export function addDaysToISO(iso: string, n: number): string {
  const d = isoToDate(iso);
  d.setDate(d.getDate() + n);
  return dateToISO(d);
}

export function formatDateLabel(iso: string): string {
  const today = todayISO();
  const tomorrow = addDaysToISO(today, 1);
  if (iso === today) return "Today's Battle Plan";
  if (iso === tomorrow) return "Tomorrow's Battle Plan";
  const d = isoToDate(iso);
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `Battle Plan: ${dayNames[d.getDay()]}, ${monthNames[d.getMonth()]} ${d.getDate()}`;
}

export function formatDateSubtitle(iso: string): string {
  const today = todayISO();
  const tomorrow = addDaysToISO(today, 1);
  if (iso === today) return 'What will you build today?';
  if (iso === tomorrow) return 'What will you build tomorrow?';
  const d = isoToDate(iso);
  if (iso < today) return `Looking back at ${d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}.`;
  return `Planning ahead for ${d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}.`;
}
