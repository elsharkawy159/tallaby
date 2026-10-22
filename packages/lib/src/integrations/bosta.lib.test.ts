import { describe, expect, it, vi } from "vitest";
import {
  BOSTA_DEFAULT_BASE_URL,
  bostaBaseUrl,
  bostaCityFor,
  bostaPhone,
  bostaRequest,
  bostaTrackingUrl,
  buildBostaDelivery,
  defaultPickupLocation,
  parseCreatedDelivery,
  parsePickupLocations,
  validateBostaConnectInput,
  type BostaOrderInput,
} from "./bosta.lib";

const KEY = "a61c617b007f82b2fdd32c86903148f2fbbdf567ce488e577ec5500679c09ccd";

const order: BostaOrderInput = {
  orderNumber: "TB-1001",
  cod: 349.995,
  receiverName: "Mona Ahmed Ali",
  phone: "+20 100 123 4567",
  email: "mona@example.com",
  addressLine1: "12 Abbas El Akkad St",
  addressLine2: "Floor 3",
  area: "Nasr City",
  state: "القاهرة",
  deliveryInstructions: "Call before arriving",
  itemsCount: 2,
  itemsSummary: "2x Mug",
  allowOpenPackage: true,
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

describe("connect input", () => {
  it("accepts a key, or an empty key to keep the saved one", () => {
    expect(validateBostaConnectInput({ apiKey: ` ${KEY} `, allowOpenPackage: true })).toEqual({
      success: true,
      data: { apiKey: KEY, allowOpenPackage: true },
    });
    expect(validateBostaConnectInput({})).toEqual({ success: true, data: { apiKey: "", allowOpenPackage: false } });
  });

  it("refuses keys with spaces, markup or the wrong length", () => {
    for (const apiKey of ["short", "abc def ghi jkl mno pqr stu", `<script>${KEY}`, 42]) {
      expect(validateBostaConnectInput({ apiKey }).success).toBe(false);
    }
  });
});

describe("base URL", () => {
  it("only allows Bosta hosts over https", () => {
    expect(bostaBaseUrl(undefined)).toBe(BOSTA_DEFAULT_BASE_URL);
    expect(bostaBaseUrl("https://stg-app.bosta.co/api/v2/")).toBe("https://stg-app.bosta.co/api/v2");
    expect(bostaBaseUrl("https://evil.example/api/v2")).toBe(BOSTA_DEFAULT_BASE_URL);
    expect(bostaBaseUrl("http://app.bosta.co/api/v2")).toBe(BOSTA_DEFAULT_BASE_URL);
  });
});

describe("mapping", () => {
  it("maps governorates (any spelling) to Bosta cities", () => {
    expect(bostaCityFor("Cairo")).toBe("Cairo");
    expect(bostaCityFor("الإسكندرية")).toBe("Alexandria");
    expect(bostaCityFor("Al Qalyubiya")).toBe("Qalyubia");
    expect(bostaCityFor("")).toBeNull();
  });

  it("normalises Egyptian mobiles", () => {
    expect(bostaPhone("+20 100 123 4567")).toBe("01001234567");
    expect(bostaPhone("00201001234567")).toBe("01001234567");
    expect(bostaPhone("01551234567")).toBe("01551234567");
    expect(bostaPhone("0223456789")).toBeNull();
    expect(bostaPhone(null)).toBeNull();
  });

  it("builds the delivery body", () => {
    const result = buildBostaDelivery(order);
    expect(result).toEqual({
      success: true,
      data: {
        type: 10,
        specs: { packageDetails: { itemsCount: 2, description: "2x Mug" } },
        cod: 350,
        dropOffAddress: { city: "Cairo", firstLine: "12 Abbas El Akkad St", secondLine: "Floor 3, Nasr City" },
        receiver: { firstName: "Mona", lastName: "Ahmed Ali", phone: "01001234567", email: "mona@example.com" },
        businessReference: "TB-1001",
        notes: "Call before arriving",
        allowToOpenPackage: true,
      },
    });
  });

  it("sends no COD for prepaid orders and omits empty fields", () => {
    const result = buildBostaDelivery({
      ...order,
      cod: 0,
      receiverName: "Mona",
      email: "not-an-email",
      addressLine2: null,
      area: null,
      deliveryInstructions: null,
    });
    expect(result.success && result.data).toMatchObject({ cod: 0, receiver: { firstName: "Mona", phone: "01001234567" } });
    expect(result.success && result.data.receiver).not.toHaveProperty("lastName");
    expect(result.success && result.data.receiver).not.toHaveProperty("email");
    expect(result.success && result.data.dropOffAddress).not.toHaveProperty("secondLine");
    expect(result.success && result.data).not.toHaveProperty("notes");
  });

  it("refuses orders Bosta cannot deliver", () => {
    expect(buildBostaDelivery({ ...order, phone: "123" })).toEqual({ success: false, error: "invalid_phone" });
    expect(buildBostaDelivery({ ...order, state: "Riyadh" })).toEqual({ success: false, error: "unsupported_city" });
    expect(buildBostaDelivery({ ...order, addressLine1: "  " })).toEqual({ success: false, error: "missing_address" });
  });
});

describe("responses", () => {
  it("reads pickup locations in both shapes", () => {
    const list = [
      { _id: "a", locationName: "Warehouse" },
      { _id: "b", locationName: "Shop", isDefault: true },
    ];
    expect(defaultPickupLocation(parsePickupLocations(list)!)?.name).toBe("Shop");
    expect(parsePickupLocations({ list: [] })).toEqual([]);
    expect(parsePickupLocations("nope")).toBeNull();
  });

  it("reads the tracking number and builds a safe tracking link", () => {
    expect(parseCreatedDelivery({ _id: "x1", trackingNumber: 123456789 })).toEqual({ id: "x1", trackingNumber: "123456789" });
    expect(parseCreatedDelivery({ trackingNumber: "<b>" })).toBeNull();
    expect(bostaTrackingUrl("123456789")).toBe("https://bosta.co/tracking-shipments?shipment-number=123456789");
    expect(bostaTrackingUrl("1 2")).toBeNull();
  });
});

describe("client", () => {
  it("sends the raw key and the body, and returns data", async () => {
    const fetchImpl = vi.fn(async () => jsonResponse({ success: true, data: { trackingNumber: "987654" } }));
    const result = await bostaRequest(KEY, "POST", "deliveries?apiVersion=1", { cod: 1 }, { fetchImpl, baseUrl: BOSTA_DEFAULT_BASE_URL });
    expect(result).toEqual({ ok: true, data: { trackingNumber: "987654" } });
    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://app.bosta.co/api/v2/deliveries?apiVersion=1");
    expect((init.headers as Record<string, string>).Authorization).toBe(KEY);
    expect(init.body).toBe(JSON.stringify({ cod: 1 }));
  });

  it("maps failures, including success:false with HTTP 200", async () => {
    const call = (response: Response) => bostaRequest(KEY, "GET", "pickup-locations", undefined, { fetchImpl: async () => response });
    expect(await call(jsonResponse({ success: false, message: "Unauthorized" }, 401))).toEqual({
      ok: false,
      error: "auth",
      message: "Unauthorized",
    });
    expect(await call(jsonResponse({ success: false, message: "City is not valid" }))).toEqual({
      ok: false,
      error: "rejected",
      message: "City is not valid",
    });
    expect((await call(jsonResponse({}, 429))).ok).toBe(false);
    expect(
      await bostaRequest(KEY, "GET", "x", undefined, {
        fetchImpl: async () => {
          throw new Error("offline");
        },
      }),
    ).toEqual({ ok: false, error: "unreachable" });
  });

  it("never sends an invalid key", async () => {
    const fetchImpl = vi.fn();
    expect(await bostaRequest("bad key", "GET", "x", undefined, { fetchImpl })).toEqual({ ok: false, error: "auth" });
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});
