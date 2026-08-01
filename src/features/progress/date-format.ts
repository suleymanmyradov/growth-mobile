export function formatWeekLabel(weekStart: string, weekEnd: string): string | null {
  const start = parseCalendarDate(weekStart);
  const end = parseCalendarDate(weekEnd);
  if (!start || !end) return null;

  return `${start.toLocaleDateString()} – ${end.toLocaleDateString()}`;
}

function parseCalendarDate(value: string): Date | null {
  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (dateOnly) {
    const year = Number(dateOnly[1]);
    const month = Number(dateOnly[2]);
    const day = Number(dateOnly[3]);
    const date = new Date(year, month - 1, day);
    if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
      return null;
    }
    return date;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}
