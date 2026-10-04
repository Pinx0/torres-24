import assert from "node:assert/strict";
import { test } from "node:test";
import {
  formatParkingDateTime,
  parkingDateTimeForInput,
  parkingDateTimeToUtc,
} from "../src/lib/parking-date-time.ts";

const originalTimeZone = process.env.TZ;

for (const timeZone of ["UTC", "Europe/Madrid", "America/New_York"]) {
  test(`parking keeps Madrid time when the host uses ${timeZone}`, () => {
    process.env.TZ = timeZone;
    try {
      const cases = [
        ["2026-07-15T13:00", "2026-07-15T11:00:00.000Z"],
        ["2026-01-15T13:00", "2026-01-15T12:00:00.000Z"],
        ["2026-07-15T00:30", "2026-07-14T22:30:00.000Z"],
        ["2026-03-29T01:30", "2026-03-29T00:30:00.000Z"],
        ["2026-03-29T03:30", "2026-03-29T01:30:00.000Z"],
        ["2026-10-25T02:30", "2026-10-25T00:30:00.000Z"],
        ["2026-10-25T03:30", "2026-10-25T02:30:00.000Z"],
      ];

      for (const [local, utc] of cases) {
        assert.equal(parkingDateTimeToUtc(local), utc);
        // Reloaded form values and email params retain the requested time.
        assert.equal(parkingDateTimeForInput(utc), local);
        assert.ok(formatParkingDateTime(utc).endsWith(`${local.slice(11)}:00`));
        // Accepting the displayed range must not introduce another offset.
        assert.equal(parkingDateTimeToUtc(parkingDateTimeForInput(utc)), utc);
        assert.equal(parkingDateTimeToUtc(utc), utc);
      }

      assert.equal(
        parkingDateTimeToUtc("2026-07-15T13:00:00+02:00"),
        "2026-07-15T11:00:00.000Z",
      );
      for (const invalid of [
        "",
        "invalid",
        "2026-02-30T13:00",
        "2026-13-01T13:00",
        "2026-07-15T24:00",
        "2026-07-15T13:60",
        "2026-03-29T02:30",
        "2026-07-15",
      ]) {
        assert.equal(parkingDateTimeToUtc(invalid), null);
      }

      // A range crossing the spring change lasts one real hour, not two.
      const start = parkingDateTimeToUtc("2026-03-29T01:30");
      const end = parkingDateTimeToUtc("2026-03-29T03:30");
      assert.equal(new Date(end) - new Date(start), 60 * 60 * 1000);
    } finally {
      if (originalTimeZone === undefined) {
        delete process.env.TZ;
      } else {
        process.env.TZ = originalTimeZone;
      }
    }
  });
}
