/**
 * The content pages every library-built template has (about, contact, FAQ),
 * from library designs: a page header, then the page's own section. Each
 * template passes its `lib` (its `fromLibrary` bound to its key), its copy
 * and its photo. No React here.
 */
import type { Design, DesignText } from "../designs/builder";
import type { LibraryPatch } from "./_library";

export type Lib = (id: string, patch?: LibraryPatch) => Design;

/** The library page header, renamed for one page. */
export function pageHeader(lib: Lib, as: string, title: DesignText, text: DesignText): Design {
  return lib("page-header", { as, text: { "من نحن": title, "فريق صغير يختار منتجات نشتريها نحن أنفسنا.": text } });
}

/** The store's story beside one photo (`about-classic`). */
export function aboutStory(
  lib: Lib,
  o: { photo: string; alt: DesignText; eyebrow: DesignText; title: DesignText; text: DesignText; more: DesignText; button: DesignText; href: string },
): Design {
  return lib("about-classic", {
    person: [undefined, undefined, o.photo],
    text: {
      "صورة المتجر": o.alt,
      "حكايتنا": o.eyebrow,
      "بدأنا بسؤال واحد: هل سيدوم؟": o.title,
      "فتحنا متجرنا بعد أن تعبنا من منتجات لا تعيش. كل ما نبيعه نجربه نحن أولًا.": o.text,
      "اليوم نشحن لكل المحافظات ونرد على كل رسالة بأنفسنا.": o.more,
      "تعرّف علينا": o.button,
    },
    links: { "/about": o.href },
  });
}

/** Contact: the page header and the contact form. */
export function contactPage(lib: Lib, o: { title: DesignText; text: DesignText; heading: DesignText }): Design[] {
  return [pageHeader(lib, "contact-header", o.title, o.text), lib("contact-form", { text: { "ابعتلنا وهنرجعلك": o.heading } })];
}

/** FAQ: the page header and the two-column questions, with the template's last question. */
export function faqPage(lib: Lib, o: { text: DesignText; question: DesignText; answer: DesignText }): Design[] {
  return [
    pageHeader(lib, "faq-header", { ar: "الأسئلة الشائعة", en: "FAQ" }, o.text),
    lib("faq-columns", {
      text: {
        "ما سياسة الاسترجاع؟": o.question,
        "يمكنك إرجاع أي منتج غير مستخدم خلال ١٤ يومًا في علبته الأصلية.": o.answer,
      },
    }),
  ];
}
