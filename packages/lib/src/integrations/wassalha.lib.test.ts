import { describe, expect, it } from "vitest";
import { toEgyptPostRow, itemsWeightKg } from "../shipping/egypt-post.lib";
import { readWassalhaSettings, wassalhaSheetDefaults, wassalhaSettingsSchema } from "./wassalha.lib";

const settings = {
  postId: "1017575",
  merchantName: "Omar Store",
  warehouseName: "Nasr City",
  senderName: "Omar",
  hasPod: true,
  volume: "medium",
  note: "اتصل قبل التوصيل",
};

describe("wassalha settings", () => {
  it("accepts complete settings and refuses unknown or missing fields", () => {
    expect(wassalhaSettingsSchema.safeParse(settings).success).toBe(true);
    expect(wassalhaSettingsSchema.safeParse({ ...settings, volume: "Medium" }).success).toBe(false);
    expect(wassalhaSettingsSchema.safeParse({ ...settings, postId: "1 2" }).success).toBe(false);
    expect(wassalhaSettingsSchema.safeParse({ ...settings, apiKey: "x" }).success).toBe(false);
    expect(readWassalhaSettings({ merchantName: "x" })).toBeNull();
  });

  it("prints the store's account on every row, 998 g when no weight, POD and the note", () => {
    const parsed = readWassalhaSettings(settings)!;
    const result = toEgyptPostRow(
      {
        orderId: "o1",
        orderNumber: "TLB-1",
        totalAmount: 450,
        paymentStatus: "pending",
        customerName: "Sara",
        phone: "+20 115 237 2358",
        addressLine1: "10 Tahrir St",
        governorate: "Giza",
        items: [{ productName: "Bag", quantity: 1 }],
        sellerNames: [],
        deliveryInstructions: "Floor 3",
      },
      0,
      wassalhaSheetDefaults(parsed),
    );
    expect(result.row).toMatchObject({
      Total_Weight: 998,
      Package_volume: "medium",
      COD_Value: 450,
      Mobile_No: "01152372358",
      City: "GIZA",
      Merchant_Name: "Omar Store",
      Warehouse_Name: "Nasr City",
      SellerName: "Omar",
      HasPOD: "TRUE",
      Post_Id: "1017575",
      Item_Special_Notes: "Floor 3 — اتصل قبل التوصيل",
    });
  });
});

describe("itemsWeightKg", () => {
  it("sums product weights in grams or kg, times quantity", () => {
    expect(itemsWeightKg([{ quantity: 2, weight: 300, weightUnit: "g" }, { quantity: 1, weight: 1.2, weightUnit: "kg" }])).toBe(1.8);
  });
  it("is null when no product has a weight", () => {
    expect(itemsWeightKg([{ quantity: 1 }, { quantity: 2, weight: "" }])).toBeNull();
  });
});
