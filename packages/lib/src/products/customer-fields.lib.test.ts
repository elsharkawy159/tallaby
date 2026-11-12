import { describe, expect, it } from "vitest";
import {
  CUSTOMER_FIELDS_MAX,
  CHOICE_OPTIONS_MAX,
  TEXT_MAX_LENGTH_DEFAULT,
  TEXT_MAX_LENGTH_LIMIT,
  IMAGE_MAX_FILES_LIMIT,
  customerFieldsSchema,
  parseCustomerFields,
  hasRequiredCustomerFields,
  validateCustomerInputs,
  recheckCustomerInputs,
  parseCustomerInputsSnapshot,
  previewExtrasPiastres,
  describeCustomerInputs,
  sameCustomerInputs,
  unitPriceWithExtras,
  customerUploadPrefix,
  isCustomerUploadPath,
  type CustomerField,
} from "./customer-fields.lib";

const label = (ar: string, en: string) => ({ ar, en });

const textField = (over: Partial<CustomerField> = {}): CustomerField =>
  ({ id: "name1", type: "text", label: label("الاسم", "Name"), required: true, extraPrice: null, maxLength: 20, ...over }) as CustomerField;
const imageField = (over: Partial<CustomerField> = {}): CustomerField =>
  ({ id: "photo1", type: "image", label: label("الصورة", "Photo"), required: false, extraPrice: 25, maxFiles: 2, ...over }) as CustomerField;
const choiceField = (over: Partial<CustomerField> = {}): CustomerField =>
  ({
    id: "print1",
    type: "choice",
    label: label("الطباعة", "Print"),
    required: true,
    options: [
      { id: "silver", label: label("فضي", "Silver"), extraPrice: null },
      { id: "gold", label: label("ذهبي", "Gold"), extraPrice: 30 },
    ],
    ...over,
  }) as CustomerField;

const STORE = "11111111-1111-4111-8111-111111111111";
const USER = "22222222-2222-4222-8222-222222222222";
const prefix = customerUploadPrefix(STORE, USER);
const file = (n: number, ext = "jpg") => `${prefix}${String(n).padStart(8, "0")}-aaaa-4aaa-8aaa-aaaaaaaaaaaa.${ext}`;

describe("customerFieldsSchema (definitions)", () => {
  it("accepts the three types with their settings", () => {
    const parsed = customerFieldsSchema.safeParse([textField(), imageField(), choiceField()]);
    expect(parsed.success).toBe(true);
  });

  it("fills the text default length", () => {
    const parsed = customerFieldsSchema.parse([{ ...textField(), maxLength: undefined }]);
    expect(parsed[0]).toMatchObject({ type: "text", maxLength: TEXT_MAX_LENGTH_DEFAULT });
  });

  it("caps the field count", () => {
    const many = Array.from({ length: CUSTOMER_FIELDS_MAX + 1 }, (_, i) => textField({ id: `f${i}xxxx` }));
    expect(customerFieldsSchema.safeParse(many).success).toBe(false);
    expect(customerFieldsSchema.safeParse(many.slice(0, CUSTOMER_FIELDS_MAX)).success).toBe(true);
  });

  it("refuses duplicate field or option ids", () => {
    expect(customerFieldsSchema.safeParse([textField(), textField()]).success).toBe(false);
    const dupOptions = choiceField({
      options: [
        { id: "a1", label: label("أ", "A"), extraPrice: null },
        { id: "a1", label: label("ب", "B"), extraPrice: null },
      ],
    } as Partial<CustomerField>);
    expect(customerFieldsSchema.safeParse([dupOptions]).success).toBe(false);
  });

  it("checks the limits of each type", () => {
    expect(customerFieldsSchema.safeParse([textField({ maxLength: TEXT_MAX_LENGTH_LIMIT + 1 } as Partial<CustomerField>)]).success).toBe(false);
    expect(customerFieldsSchema.safeParse([imageField({ maxFiles: IMAGE_MAX_FILES_LIMIT + 1 } as Partial<CustomerField>)]).success).toBe(false);
    expect(customerFieldsSchema.safeParse([imageField({ maxFiles: 0 } as Partial<CustomerField>)]).success).toBe(false);
    const one = choiceField({ options: [{ id: "a1", label: label("أ", "A"), extraPrice: null }] } as Partial<CustomerField>);
    expect(customerFieldsSchema.safeParse([one]).success).toBe(false);
    const tooMany = choiceField({
      options: Array.from({ length: CHOICE_OPTIONS_MAX + 1 }, (_, i) => ({ id: `o${i}`, label: label("أ", "A"), extraPrice: null })),
    } as Partial<CustomerField>);
    expect(customerFieldsSchema.safeParse([tooMany]).success).toBe(false);
  });

  it("needs both labels and a non-negative price with at most 2 decimals", () => {
    expect(customerFieldsSchema.safeParse([textField({ label: label("", "Name") })]).success).toBe(false);
    expect(customerFieldsSchema.safeParse([textField({ label: label("الاسم", "") })]).success).toBe(false);
    expect(customerFieldsSchema.safeParse([textField({ extraPrice: -1 } as Partial<CustomerField>)]).success).toBe(false);
    expect(customerFieldsSchema.safeParse([textField({ extraPrice: 1.005 } as Partial<CustomerField>)]).success).toBe(false);
    expect(customerFieldsSchema.safeParse([textField({ extraPrice: 12.5 } as Partial<CustomerField>)]).success).toBe(true);
  });

  it("reads stored JSON leniently: anything invalid is no fields", () => {
    expect(parseCustomerFields(null)).toEqual([]);
    expect(parseCustomerFields({ nope: 1 })).toEqual([]);
    expect(parseCustomerFields([textField()])).toHaveLength(1);
    expect(hasRequiredCustomerFields([imageField()])).toBe(false);
    expect(hasRequiredCustomerFields([imageField(), textField()])).toBe(true);
  });
});

describe("validateCustomerInputs (customer values)", () => {
  const fields = [textField(), imageField(), choiceField()];

  it("refuses a missing required field", () => {
    const result = validateCustomerInputs(fields, [{ fieldId: "print1", optionId: "gold" }], { uploadPrefix: prefix });
    expect(result).toEqual({ ok: false, errors: [{ fieldId: "name1", code: "required" }] });
  });

  it("treats whitespace as empty and trims", () => {
    const result = validateCustomerInputs([textField()], [{ fieldId: "name1", text: "  " }], { uploadPrefix: prefix });
    expect(result.ok).toBe(false);
    const ok = validateCustomerInputs([textField()], [{ fieldId: "name1", text: "  Omar  " }], { uploadPrefix: prefix });
    expect(ok.ok && ok.snapshot?.lines[0]?.text).toBe("Omar");
  });

  it("refuses text above the max length", () => {
    const result = validateCustomerInputs([textField()], [{ fieldId: "name1", text: "x".repeat(21) }], { uploadPrefix: prefix });
    expect(result).toEqual({ ok: false, errors: [{ fieldId: "name1", code: "tooLong" }] });
  });

  it("refuses an option that does not exist", () => {
    const result = validateCustomerInputs([choiceField()], [{ fieldId: "print1", optionId: "bronze" }], { uploadPrefix: prefix });
    expect(result).toEqual({ ok: false, errors: [{ fieldId: "print1", code: "invalidOption" }] });
  });

  it("refuses too many files, foreign paths and duplicates", () => {
    expect(validateCustomerInputs([imageField()], [{ fieldId: "photo1", files: [file(1), file(2), file(3)] }], { uploadPrefix: prefix })).toEqual({
      ok: false,
      errors: [{ fieldId: "photo1", code: "tooManyFiles" }],
    });
    const foreign = `${customerUploadPrefix(STORE, "33333333-3333-4333-8333-333333333333")}00000001-aaaa-4aaa-8aaa-aaaaaaaaaaaa.jpg`;
    expect(validateCustomerInputs([imageField()], [{ fieldId: "photo1", files: [foreign] }], { uploadPrefix: prefix })).toEqual({
      ok: false,
      errors: [{ fieldId: "photo1", code: "invalidFile" }],
    });
    expect(validateCustomerInputs([imageField()], [{ fieldId: "photo1", files: [file(1), file(1)] }], { uploadPrefix: prefix }).ok).toBe(false);
    expect(validateCustomerInputs([imageField()], [{ fieldId: "photo1", files: [file(1, "gif")] }], { uploadPrefix: prefix }).ok).toBe(false);
  });

  it("refuses unknown fields and repeated field ids", () => {
    expect(validateCustomerInputs([textField()], [{ fieldId: "name1", text: "a" }, { fieldId: "zzz", text: "b" }], { uploadPrefix: prefix }).ok).toBe(false);
    expect(validateCustomerInputs([textField()], [{ fieldId: "name1", text: "a" }, { fieldId: "name1", text: "b" }], { uploadPrefix: prefix }).ok).toBe(false);
  });

  it("no fields and no values: no snapshot", () => {
    expect(validateCustomerInputs([], [], { uploadPrefix: prefix })).toEqual({ ok: true, snapshot: null, extrasPiastres: 0 });
    expect(validateCustomerInputs([imageField()], [], { uploadPrefix: prefix })).toEqual({ ok: true, snapshot: null, extrasPiastres: 0 });
  });

  it("adds the extras of filled fields only, in piastres", () => {
    const fieldsWithText = [textField({ extraPrice: 10.5 } as Partial<CustomerField>), imageField(), choiceField()];
    const withoutPhoto = validateCustomerInputs(fieldsWithText, [{ fieldId: "name1", text: "Omar" }, { fieldId: "print1", optionId: "silver" }], { uploadPrefix: prefix });
    expect(withoutPhoto.ok && withoutPhoto.extrasPiastres).toBe(1050);
    const all = validateCustomerInputs(
      fieldsWithText,
      [{ fieldId: "name1", text: "Omar" }, { fieldId: "photo1", files: [file(1)] }, { fieldId: "print1", optionId: "gold" }],
      { uploadPrefix: prefix },
    );
    expect(all.ok && all.extrasPiastres).toBe(1050 + 2500 + 3000);
    expect(all.ok && all.snapshot?.lines.map((line) => line.extraPiastres)).toEqual([1050, 2500, 3000]);
    // The snapshot keeps both labels for the order.
    expect(all.ok && all.snapshot?.lines[2]).toMatchObject({ type: "choice", option: { id: "gold", label: { ar: "ذهبي", en: "Gold" } } });
  });

  it("strips control characters from text", () => {
    const result = validateCustomerInputs([textField()], [{ fieldId: "name1", text: "a\u0000b\nc" }], { uploadPrefix: prefix });
    expect(result.ok && result.snapshot?.lines[0]?.text).toBe("ab\nc");
  });
});

describe("previewExtrasPiastres (live price)", () => {
  it("counts only filled fields and the chosen option", () => {
    const fields = [textField({ extraPrice: 5 } as Partial<CustomerField>), imageField(), choiceField()];
    expect(previewExtrasPiastres(fields, [])).toBe(0);
    expect(previewExtrasPiastres(fields, [{ fieldId: "name1", text: " " }])).toBe(0);
    expect(previewExtrasPiastres(fields, [{ fieldId: "name1", text: "a" }, { fieldId: "print1", optionId: "gold" }])).toBe(3500);
    expect(previewExtrasPiastres(fields, [{ fieldId: "photo1", files: ["x"] }])).toBe(2500);
  });
});

describe("unit price with extras", () => {
  it("adds in integer piastres", () => {
    expect(unitPriceWithExtras(199.99, 3000)).toBe(229.99);
    expect(unitPriceWithExtras(0.1, 20)).toBe(0.3);
    // Quantity applies to the whole unit: 3 × 229.99
    expect(Math.round(unitPriceWithExtras(199.99, 3000) * 100) * 3).toBe(68997);
  });
});

describe("cart line identity", () => {
  const fields = [textField(), choiceField()];
  const make = (text: string, optionId: string) => {
    const result = validateCustomerInputs(fields, [{ fieldId: "print1", optionId }, { fieldId: "name1", text }], { uploadPrefix: prefix });
    if (!result.ok) throw new Error("invalid");
    return result.snapshot;
  };

  it("identical inputs merge, whatever the order sent", () => {
    const a = make("Omar", "gold");
    const b = validateCustomerInputs(fields, [{ fieldId: "name1", text: " Omar " }, { fieldId: "print1", optionId: "gold" }], { uploadPrefix: prefix });
    expect(b.ok && sameCustomerInputs(a, b.snapshot)).toBe(true);
  });

  it("different inputs stay separate lines", () => {
    expect(sameCustomerInputs(make("Omar", "gold"), make("Omar", "silver"))).toBe(false);
    expect(sameCustomerInputs(make("Omar", "gold"), make("Ali", "gold"))).toBe(false);
    expect(sameCustomerInputs(make("Omar", "gold"), null)).toBe(false);
    expect(sameCustomerInputs(null, null)).toBe(true);
  });
});

describe("recheckCustomerInputs (checkout)", () => {
  const fields = [textField(), choiceField()];
  const added = validateCustomerInputs(fields, [{ fieldId: "name1", text: "Omar" }, { fieldId: "print1", optionId: "gold" }], { uploadPrefix: prefix });
  const stored = added.ok ? added.snapshot : null;

  it("passes when nothing changed", () => {
    expect(recheckCustomerInputs(fields, stored)).toMatchObject({ ok: true, extrasPiastres: 3000 });
  });

  it("fails when an extra price changed", () => {
    const pricier = [textField(), choiceField({ options: [{ id: "silver", label: label("فضي", "Silver"), extraPrice: null }, { id: "gold", label: label("ذهبي", "Gold"), extraPrice: 40 }] } as Partial<CustomerField>)];
    expect(recheckCustomerInputs(pricier, stored).ok).toBe(false);
  });

  it("fails when a required field was added or an option removed", () => {
    expect(recheckCustomerInputs([...fields, textField({ id: "extra1" })], stored).ok).toBe(false);
    const noGold = [textField(), choiceField({ options: [{ id: "silver", label: label("فضي", "Silver"), extraPrice: null }, { id: "bronze", label: label("برونز", "Bronze"), extraPrice: null }] } as Partial<CustomerField>)];
    expect(recheckCustomerInputs(noGold, stored).ok).toBe(false);
  });

  it("a line without inputs passes only while no field is required", () => {
    expect(recheckCustomerInputs([imageField()], null)).toMatchObject({ ok: true, snapshot: null });
    expect(recheckCustomerInputs(fields, null).ok).toBe(false);
  });

  it("a renamed label is not a change: the fresh labels are kept", () => {
    const renamed = [textField({ label: label("اسمك", "Your name") }), choiceField()];
    const result = recheckCustomerInputs(renamed, stored);
    expect(result.ok && result.snapshot?.lines[0]?.label.en).toBe("Your name");
  });

  it("describes a snapshot as plain text, photos as a count", () => {
    const withPhoto = validateCustomerInputs(
      [textField(), imageField()],
      [{ fieldId: "name1", text: "Omar" }, { fieldId: "photo1", files: [file(1), file(2)] }],
      { uploadPrefix: prefix },
    );
    const snapshot = withPhoto.ok ? withPhoto.snapshot : null;
    expect(describeCustomerInputs(snapshot, "en", (n) => `${n} images attached`)).toEqual([
      { label: "Name", value: "Omar" },
      { label: "Photo", value: "2 images attached" },
    ]);
    expect(describeCustomerInputs(stored, "ar", () => "")[1]).toEqual({ label: "الطباعة", value: "ذهبي" });
  });

  it("reads stored snapshots leniently", () => {
    expect(parseCustomerInputsSnapshot(null)).toBeNull();
    expect(parseCustomerInputsSnapshot({ lines: "x" })).toBeNull();
    expect(parseCustomerInputsSnapshot(stored)).toEqual(stored);
  });
});

describe("upload paths", () => {
  it("are under the store and the visitor", () => {
    expect(prefix).toBe(`${STORE}/${USER}/`);
    expect(isCustomerUploadPath(file(1), prefix)).toBe(true);
    expect(isCustomerUploadPath(`${prefix}../x.jpg`, prefix)).toBe(false);
    expect(isCustomerUploadPath(file(1), customerUploadPrefix(null, USER))).toBe(false);
    expect(customerUploadPrefix(null, USER)).toBe(`market/${USER}/`);
  });
});
