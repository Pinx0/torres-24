import { TZDate, tzOffset } from "@date-fns/tz";
import { format } from "date-fns";
import { es } from "date-fns/locale/es";

const PARKING_TIME_ZONE = "Europe/Madrid";
const INPUT_FORMAT = "yyyy-MM-dd'T'HH:mm";

/** Interpret datetime-local values in the building's time zone, never the server's. */
export function parkingDateTimeToUtc(value: string): string | null {
  const local = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value);
  let date: Date;

  if (local) {
    const [, year, month, day, hour, minute] = local.map(Number);
    const wallTime = Date.UTC(year, month - 1, day, hour, minute);
    const dayMs = 24 * 60 * 60 * 1000;
    const offsets = new Set(
      [-dayMs, 0, dayMs].map((delta) =>
        tzOffset(PARKING_TIME_ZONE, new Date(wallTime + delta)),
      ),
    );
    const candidates = [...offsets]
      .map((offset) => wallTime - offset * 60 * 1000)
      .filter(
        (timestamp) =>
          format(new TZDate(timestamp, PARKING_TIME_ZONE), INPUT_FORMAT) ===
          value,
      );

    // Reject invalid/skipped times; choose the first occurrence of a repeated hour.
    // Sampling both sides of a DST change makes this independent of the host zone.
    if (candidates.length === 0) {
      return null;
    }
    date = new Date(Math.min(...candidates));
  } else {
    // Already-zoned timestamps represent an instant and must not be shifted again.
    if (!/T.*(?:Z|[+-]\d{2}:\d{2})$/i.test(value)) {
      return null;
    }
    date = new Date(value);
  }

  return Number.isNaN(date.getTime())
    ? null
    : new Date(date.getTime()).toISOString();
}

/** The same local value is used in datetime-local fields and parking email params. */
export function parkingDateTimeForInput(value: string): string {
  return format(new TZDate(value, PARKING_TIME_ZONE), INPUT_FORMAT);
}

export function formatParkingDateTime(value: string): string {
  return format(new TZDate(value, PARKING_TIME_ZONE), "PPpp", { locale: es });
}
