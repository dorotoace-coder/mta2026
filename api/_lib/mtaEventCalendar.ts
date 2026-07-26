/**
 * MTA 2026 spans three calendar days in Africa/Lagos time. Attendance is
 * tracked per event day, not once per lifetime, so a registrant can be
 * checked in on each day they attend.
 */
export const EVENT_DATES = ["2026-09-04", "2026-09-05", "2026-09-06"] as const;
export type EventDate = (typeof EVENT_DATES)[number];

export function isValidEventDate(value: unknown): value is EventDate {
  return typeof value === "string" && (EVENT_DATES as readonly string[]).includes(value);
}

/**
 * Today's calendar date in Africa/Lagos (UTC+1, no DST), formatted as
 * YYYY-MM-DD. Used as the default event_date when an operator does not
 * explicitly specify one — at the live event this resolves correctly
 * without any hardcoded offset; before/after the event window it will
 * not match any entry in EVENT_DATES, which callers must handle.
 */
export function todayInLagos(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Lagos",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}
