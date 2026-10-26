import { describe, expect, it, vi } from "vitest";

import {
  BOSTA_API_BASE,
  createBostaDelivery,
  findBostaDeliveryByReference,
  getBostaDelivery,
  listBostaPickupLocations,
  printBostaAwbs,
  terminateBostaDelivery,
} from "./bosta.client.server";
import type { BostaCreateDeliveryRequest } from "./bosta.types";

const KEY = "bosta_secret_key_1234567890";

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
}

function fakeFetch(response: Response | Error) {
  return vi.fn(async (_url: string | URL | Request, _init?: RequestInit) => {
    if (response instanceof Error) throw response;
    return response;
  });
}

describe("Bosta client", () => {
  it("lists pickup locations with the key in the Authorization header", async () => {
    const fetchImpl = fakeFetch(
      json({
        success: true,
        data: {
          list: [
            { _id: "loc1", locationName: "Main", isDefault: true, address: { firstLine: "el-mohandseen", district: "Dokki", city: { name: "Giza" } } },
            { _id: "loc2", locationName: "Second" },
          ],
        },
      }),
    );
    const result = await listBostaPickupLocations(KEY, { fetchImpl });
    expect(result).toEqual({
      ok: true,
      data: [
        { _id: "loc1", locationName: "Main", isDefault: true, addressLine: "el-mohandseen, Dokki, Giza" },
        { _id: "loc2", locationName: "Second", isDefault: false, addressLine: "" },
      ],
    });
    const [url, init] = fetchImpl.mock.calls[0]!;
    expect(url).toBe(`${BOSTA_API_BASE}/pickup-locations`);
    expect((init!.headers as Record<string, string>).Authorization).toBe(KEY);
  });

  it("maps Bosta errors and never leaks the key", async () => {
    const fetchImpl = fakeFetch(json({ success: false, message: `Invalid key ${KEY}`, errorCode: "1028" }, 401));
    const result = await listBostaPickupLocations(KEY, { fetchImpl });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toMatchObject({ reason: "invalid_key", status: 401, errorCode: 1028 });
    expect(result.error.message).not.toContain(KEY);
  });

  it("reports timeouts and network failures", async () => {
    const timeout = Object.assign(new Error("timeout"), { name: "TimeoutError" });
    const timedOut = await getBostaDelivery(KEY, "123", { fetchImpl: fakeFetch(timeout) });
    expect(!timedOut.ok && timedOut.error.reason).toBe("timeout");
    const failed = await getBostaDelivery(KEY, "123", { fetchImpl: fakeFetch(new TypeError("fetch failed")) });
    expect(!failed.ok && failed.error.reason).toBe("network");
  });

  it("creates a delivery and reads the tracking number", async () => {
    const fetchImpl = fakeFetch(
      json({ success: true, data: { _id: "abc", trackingNumber: "5108002", businessReference: "TLB-1", state: { code: 10, value: "Pickup requested" } } }),
    );
    const body = { type: 10, cod: 100 } as BostaCreateDeliveryRequest;
    const result = await createBostaDelivery(KEY, body, { fetchImpl });
    expect(result).toEqual({
      ok: true,
      data: { _id: "abc", trackingNumber: "5108002", businessReference: "TLB-1", state: { code: 10, value: "Pickup requested" } },
    });
    const [url, init] = fetchImpl.mock.calls[0]!;
    expect(url).toBe(`${BOSTA_API_BASE}/deliveries?apiVersion=1`);
    expect(init!.method).toBe("POST");
    expect(JSON.parse(init!.body as string)).toEqual(body);
  });

  it("treats success:false with HTTP 200 as an error", async () => {
    const fetchImpl = fakeFetch(json({ success: false, message: "District not found", errorCode: 3003 }));
    const result = await createBostaDelivery(KEY, { type: 10, cod: 0 } as BostaCreateDeliveryRequest, { fetchImpl });
    expect(!result.ok && result.error.reason).toBe("district_not_found");
  });

  it("reads a delivery's state and numeric tracking numbers", async () => {
    const fetchImpl = fakeFetch(json({ success: true, data: { _id: "abc", trackingNumber: 48089608, state: { code: 45, value: "Delivered" }, cod: 50 } }));
    const result = await getBostaDelivery(KEY, " 48089608 ", { fetchImpl });
    expect(result).toEqual({ ok: true, data: { _id: "abc", trackingNumber: "48089608", state: { code: 45, value: "Delivered" }, cod: 50 } });
    expect(fetchImpl.mock.calls[0]![0]).toBe(`${BOSTA_API_BASE}/deliveries/business/48089608`);
  });

  it("finds a delivery by business reference", async () => {
    const fetchImpl = fakeFetch(
      json({ success: true, data: { deliveries: [{ _id: "x", trackingNumber: "1", businessReference: "TLB-2", state: { code: 10 } }] } }),
    );
    expect(await findBostaDeliveryByReference(KEY, "TLB-2", { fetchImpl })).toEqual({
      ok: true,
      data: { _id: "x", trackingNumber: "1", businessReference: "TLB-2", state: { code: 10 } },
    });
    const none = await findBostaDeliveryByReference(KEY, "TLB-3", { fetchImpl: fakeFetch(json({ success: true, data: { deliveries: [] } })) });
    expect(none).toEqual({ ok: true, data: null });
  });

  it("terminates with DELETE", async () => {
    const fetchImpl = fakeFetch(json({ success: true, data: { _id: "x" } }));
    expect(await terminateBostaDelivery(KEY, "5108002", { fetchImpl })).toEqual({ ok: true, data: null });
    expect(fetchImpl.mock.calls[0]![1]!.method).toBe("DELETE");
  });

  it("prints labels from a PDF or a base64 body and caps the count", async () => {
    const pdf = new Response(new Uint8Array([37, 80, 68, 70]), { headers: { "content-type": "application/pdf" } });
    expect(await printBostaAwbs(KEY, ["1", "1", "2"], { type: "A6", lang: "ar" }, { fetchImpl: fakeFetch(pdf) })).toEqual({ ok: true, data: "JVBERg==" });

    const base64 = "JVBERi0".padEnd(120, "A");
    const wrapped = await printBostaAwbs(KEY, ["1"], { type: "A4", lang: "en" }, { fetchImpl: fakeFetch(json({ success: true, data: base64 })) });
    expect(wrapped).toEqual({ ok: true, data: base64 });

    const tooMany = await printBostaAwbs(KEY, Array.from({ length: 51 }, (_, i) => String(i)), { type: "A4", lang: "ar" });
    expect(tooMany.ok).toBe(false);
  });
});
