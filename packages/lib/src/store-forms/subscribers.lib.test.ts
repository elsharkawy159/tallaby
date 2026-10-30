import { describe, expect, it } from "vitest";
import { FORM_TEMPLATES } from "./form-templates.lib";
import {
  isSignUpForm,
  parseSubscriberFilter,
  parseSubscriberPage,
  subscriberExportRow,
  subscriberSearchPattern,
  subscriberStatusOf,
  type StoreSubscriber,
} from "./subscribers.lib";

describe("isSignUpForm", () => {
  it("recognises the newsletter template and no other ready-made form", () => {
    const signUps = FORM_TEMPLATES.filter((t) => isSignUpForm(t.fields)).map((t) => t.id);
    expect(signUps).toEqual(["newsletter"]);
  });

  it("needs an email field and no long-text field", () => {
    expect(isSignUpForm([{ type: "email" }])).toBe(true);
    expect(isSignUpForm([{ type: "email" }, { type: "phone" }, { type: "checkbox" }])).toBe(true);
    expect(isSignUpForm([{ type: "phone" }])).toBe(false);
    expect(isSignUpForm([{ type: "email" }, { type: "textarea" }])).toBe(false);
  });
});

describe("subscriber status", () => {
  it("archived means unsubscribed", () => {
    expect(subscriberStatusOf("archived")).toBe("unsubscribed");
    expect(subscriberStatusOf("new")).toBe("subscribed");
    expect(subscriberStatusOf("read")).toBe("subscribed");
  });

  it("defaults the filter to subscribed", () => {
    expect(parseSubscriberFilter("all")).toBe("all");
    expect(parseSubscriberFilter("unsubscribed")).toBe("unsubscribed");
    expect(parseSubscriberFilter("x")).toBe("subscribed");
    expect(parseSubscriberFilter(undefined)).toBe("subscribed");
  });
});

describe("parseSubscriberPage", () => {
  it("reads a positive page, else 1", () => {
    expect(parseSubscriberPage("3")).toBe(3);
    expect(parseSubscriberPage("0")).toBe(1);
    expect(parseSubscriberPage("-2")).toBe(1);
    expect(parseSubscriberPage("abc")).toBe(1);
    expect(parseSubscriberPage(undefined)).toBe(1);
  });
});

describe("subscriberSearchPattern", () => {
  it("lower-cases and escapes LIKE wildcards", () => {
    expect(subscriberSearchPattern("  Mona ")).toBe("%mona%");
    expect(subscriberSearchPattern("50%_off\\")).toBe("%50\\%\\_off\\\\%");
    expect(subscriberSearchPattern("   ")).toBeNull();
    expect(subscriberSearchPattern(null)).toBeNull();
  });
});

describe("subscriberExportRow", () => {
  it("writes the export columns with Cairo times", () => {
    const subscriber: StoreSubscriber = {
      id: "1",
      identity: "a@x.com",
      email: "a@x.com",
      name: "Mona",
      phone: null,
      formName: "Newsletter sign-up",
      status: "subscribed",
      signups: 2,
      firstAt: "2026-10-01T10:00:00Z",
      lastAt: "2026-10-30 12:05:00+00",
    };
    expect(subscriberExportRow(subscriber, "Subscribed")).toEqual({
      email: "a@x.com",
      name: "Mona",
      phone: "",
      status: "Subscribed",
      form: "Newsletter sign-up",
      signedUp: "2026-10-01 13:00",
      lastSignUp: "2026-10-30 14:05",
    });
  });
});
