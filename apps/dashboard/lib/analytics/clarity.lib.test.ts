import { describe, expect, it } from "vitest";
import {
  DEFAULT_CLARITY_PROJECT_ID,
  type ClarityWindow,
  clarityProjectId,
  clarityTagSrc,
  enabledClarityProjectId,
  identifySeller,
  isClarityAllowedHere,
  isClarityHost,
  shouldLoadClarity,
} from "./clarity.lib";

const SELLER = "3f2b8c1e-9a4d-4b7e-8c21-5d6e7f809a1b";

function fakeWindow(hostname: string, framed = false): ClarityWindow {
  const win = { location: { hostname }, self: {} as unknown, top: {} as unknown } as ClarityWindow;
  win.self = win;
  win.top = framed ? {} : win;
  return win;
}

describe("clarityProjectId", () => {
  it("defaults to Tallaby's project and accepts a valid override", () => {
    expect(clarityProjectId(undefined)).toBe(DEFAULT_CLARITY_PROJECT_ID);
    expect(clarityProjectId("  ")).toBe(DEFAULT_CLARITY_PROJECT_ID);
    expect(clarityProjectId("abc123xyz")).toBe("abc123xyz");
  });
  it("rejects an override that is not a plain id", () => {
    expect(clarityProjectId("x\"><script>")).toBeNull();
    expect(clarityProjectId("../tag")).toBeNull();
  });
});

describe("shouldLoadClarity / enabledClarityProjectId", () => {
  const id = DEFAULT_CLARITY_PROJECT_ID;
  it("loads only in a production build on Vercel production", () => {
    expect(shouldLoadClarity({ nodeEnv: "production", vercelEnv: "production", projectId: id })).toBe(true);
    expect(shouldLoadClarity({ nodeEnv: "development", vercelEnv: "production", projectId: id })).toBe(false);
    expect(shouldLoadClarity({ nodeEnv: "production", vercelEnv: "preview", projectId: id })).toBe(false);
    expect(shouldLoadClarity({ nodeEnv: "production", vercelEnv: undefined, projectId: id })).toBe(false);
    expect(shouldLoadClarity({ nodeEnv: "production", vercelEnv: "production", projectId: null })).toBe(false);
  });
  it("reads the env", () => {
    expect(enabledClarityProjectId({ NODE_ENV: "production", VERCEL_ENV: "production" })).toBe(id);
    expect(enabledClarityProjectId({ NODE_ENV: "production", VERCEL_ENV: "preview" })).toBeNull();
    expect(enabledClarityProjectId({ NODE_ENV: "test" })).toBeNull();
  });
});

describe("isClarityHost / isClarityAllowedHere", () => {
  it("allows only dashboard.tallaby.com", () => {
    expect(isClarityHost("dashboard.tallaby.com")).toBe(true);
    expect(isClarityHost("DASHBOARD.tallaby.com:443")).toBe(true);
    expect(isClarityHost("localhost")).toBe(false);
    expect(isClarityHost("tallaby.com")).toBe(false);
    expect(isClarityHost("admin.tallaby.com")).toBe(false);
    expect(isClarityHost("tallaby-dashboard-git-main.vercel.app")).toBe(false);
    expect(isClarityHost(null)).toBe(false);
  });
  it("never runs inside a frame", () => {
    expect(isClarityAllowedHere(fakeWindow("dashboard.tallaby.com"))).toBe(true);
    expect(isClarityAllowedHere(fakeWindow("dashboard.tallaby.com", true))).toBe(false);
    expect(isClarityAllowedHere(null)).toBe(false);
  });
});

describe("identifySeller", () => {
  it("queues identify (id only) and the plan tag before the tag loads", () => {
    const win = fakeWindow("dashboard.tallaby.com");
    identifySeller(win, SELLER, "pro");
    expect(win.clarity?.q).toEqual([
      ["identify", SELLER],
      ["set", "plan", "pro"],
    ]);
  });
  it("sends nothing off the dashboard host, in a frame, or for a non-UUID id", () => {
    const local = fakeWindow("localhost");
    identifySeller(local, SELLER, "free");
    expect(local.clarity).toBeUndefined();
    const framed = fakeWindow("dashboard.tallaby.com", true);
    identifySeller(framed, SELLER, "free");
    expect(framed.clarity).toBeUndefined();
    const win = fakeWindow("dashboard.tallaby.com");
    identifySeller(win, "seller@example.com", "free");
    expect(win.clarity).toBeUndefined();
  });
  it("builds the tag URL", () => {
    expect(clarityTagSrc("zda9ar0rwv")).toBe("https://www.clarity.ms/tag/zda9ar0rwv");
  });
});
