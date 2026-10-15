export function formatLocalDateTime(value, options = {}) {
  if (!value) return 'Not specified';
  return new Date(value).toLocaleString(undefined, options);
}

export function toLocalDateTimeInput(value) {
  if (!value) return '';
  const date = new Date(value);
  const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return offsetDate.toISOString().slice(0, 16);
}

export function localDateAndTimeToUtc(date, time) {
  if (!date || !time) return '';
  return new Date(`${date}T${time}`).toISOString();
}
