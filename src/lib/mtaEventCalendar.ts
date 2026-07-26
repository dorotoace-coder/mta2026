/**
 * Client-side mirror of api/_lib/mtaEventCalendar.ts. Duplicated
 * (rather than imported across the api/src boundary) to keep the
 * frontend bundle independent of the serverless-function source tree.
 */
export const EVENT_DATES = ["2026-09-04", "2026-09-05", "2026-09-06"] as const;
export type EventDate = (typeof EVENT_DATES)[number];

export function isValidEventDate(value: string): value is EventDate {
  return (EVENT_DATES as readonly string[]).includes(value);
}

export function todayInLagos(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Lagos",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

/** Today in Lagos if it's a valid event day, otherwise the first event day. */
export function defaultEventDate(): EventDate {
  const today = todayInLagos();
  return isValidEventDate(today) ? today : EVENT_DATES[0];
}
