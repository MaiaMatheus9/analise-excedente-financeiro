export function validDate(value: string) {
  return (
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    Number.isFinite(Date.parse(value)) &&
    new Date(value).toISOString().slice(0, 10) === value
  );
}
export function validRange(start: string, end: string, today: string) {
  if (!validDate(start) || !validDate(end) || start >= end || end > today)
    return false;
  const limit = new Date(end + "T12:00:00Z");
  limit.setUTCFullYear(limit.getUTCFullYear() - 10);
  return start >= limit.toISOString().slice(0, 10);
}
