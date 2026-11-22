import { describe, expect, it } from "vitest";
import { EVENTS, getEventPhase } from "./events";

const tribeX = EVENTS["tribe-x-2026"];

describe("event times are pinned to the venue's time zone (WAT, UTC+1)", () => {
  it("every event start/end carries an explicit UTC offset", () => {
    for (const event of Object.values(EVENTS)) {
      expect(event.start).toMatch(/(Z|[+-]\d{2}:\d{2})$/);
      expect(event.end).toMatch(/(Z|[+-]\d{2}:\d{2})$/);
    }
  });

  it("TRIBE X starts at 7:00 PM in Akute, i.e. 18:00 UTC", () => {
    expect(new Date(tribeX.start).toISOString()).toBe("2026-11-27T18:00:00.000Z");
  });

  it("phase follows Akute time whatever the viewer's clock zone", () => {
    expect(getEventPhase(tribeX, Date.parse("2026-11-27T17:59:00Z"))).toBe("before");
    expect(getEventPhase(tribeX, Date.parse("2026-11-27T18:30:00Z"))).toBe("live");
    expect(getEventPhase(tribeX, Date.parse("2026-11-27T20:31:00Z"))).toBe("past");
  });
});
