import { describe, expect, it } from "vitest"
import { cairoDayStart } from "./day"

describe("cairoDayStart", () => {
  it("returns Cairo midnight in summer time (UTC+3)", () => {
    expect(cairoDayStart(new Date("2026-07-10T12:00:00Z")).toISOString()).toBe("2026-07-09T21:00:00.000Z")
  })

  it("returns Cairo midnight in winter time (UTC+2)", () => {
    expect(cairoDayStart(new Date("2026-12-10T12:00:00Z")).toISOString()).toBe("2026-12-09T22:00:00.000Z")
  })

  it("rolls to the next Cairo day just after Cairo midnight", () => {
    expect(cairoDayStart(new Date("2026-12-10T22:30:00Z")).toISOString()).toBe("2026-12-10T22:00:00.000Z")
  })
})
