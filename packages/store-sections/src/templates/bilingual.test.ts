/**
 * Everything the website builder creates exists in both languages: every
 * library design (chrome included), every code template (its pages, header
 * and footer) and every niche edition of a template. An English-default store
 * must never show template text in Arabic, so a text prop written in Arabic
 * needs its English (`translations.en`), and English must not hold Arabic.
 * Latin-only text with no Arabic is allowed only when it reads the same in
 * both languages (brand names, emails, social handles), listed below.
 */
import { describe, expect, it } from "vitest";
import type { SectionInstance } from "../config/schema";
import { DESIGNS, treeBuilder } from "../designs";
import { ELEMENT_DEFINITIONS } from "../elements/registry";
import { CODE_TEMPLATES } from "./catalog";
import { editionReadyLooks, editionsForLook, templateWithEdition } from "./editions";
import { codeTranslationDictionary, textScript } from "./fill-translations";
import { getElementDefinition } from "../elements/registry";
import type { TemplateDefinition } from "./types";

type Node = { type: string; props?: Record<string, unknown>; children?: readonly Node[] };

/** Text that reads the same in Arabic and English. */
const LANGUAGE_NEUTRAL = new Set([
  "VISA", "Mastercard", "Meeza", "InstaPay", "hello@example.com", "⁦hello@nawl.eg⁩",
  "NOVA", "ARC", "KITE", "LUMEN", "Kinetic", "HALO", "Vector",
  "Cairo Style", "Enterprise", "Scoop",
  "Dar Hekaya", "Kalimat", "Little Owl", "Nahdet", "Story Kite", "Bookling", "Al Fanous",
  "Dune Works", "Siwa Trail", "Nomad Co.", "Red Sea Gear", "Sinai Peak", "Oasis", "Camel Pack", "Rahhala", "Sahraa Mag", "Trip Notes",
  "Apex Helmets", "Ridgeline", "Nile Moto", "Torq Gear", "V60",
]);
/** Social handles (`@name`) are the same in both languages. */
const HANDLE = /^⁦?@[\w.]+⁩?$/;

type Problem = string;

function check(where: string, node: Node, problems: Problem[]) {
  const props = (node.props ?? {}) as Record<string, unknown> & { translations?: { en?: Record<string, unknown> } };
  for (const field of getElementDefinition(node.type)?.fields ?? []) {
    if (!field.translatable) continue;
    const ar = props[field.key];
    if (typeof ar !== "string" || !ar.trim()) continue;
    const en = props.translations?.en?.[field.key];
    if (typeof en === "string" && textScript(en) === "ar") problems.push(`${where} ${node.type}.${field.key}: English holds Arabic "${en}"`);
    else if (textScript(ar) === "ar" && en === undefined) problems.push(`${where} ${node.type}.${field.key}: no English for "${ar}"`);
    else if (textScript(ar) === "en" && en === undefined && !LANGUAGE_NEUTRAL.has(ar.trim()) && !HANDLE.test(ar.trim())) {
      problems.push(`${where} ${node.type}.${field.key}: no Arabic for "${ar}"`);
    }
  }
  for (const child of node.children ?? []) check(where, child, problems);
}

function checkTemplate(template: TemplateDefinition, label: string, problems: Problem[]) {
  const config = template.config();
  const chrome = [config.header, config.footer].filter((s): s is SectionInstance => s !== null);
  for (const section of chrome) for (const node of section.componentTree ?? []) check(`${label} chrome ${section.source ?? section.id}`, node, problems);
  for (const page of config.pages) {
    for (const section of page.content.sections) {
      for (const node of section.componentTree ?? []) check(`${label} /${page.slug} ${section.source ?? section.id}`, node, problems);
    }
    const name = template.pageNames[page.slug];
    if (!name?.ar || !name.en) problems.push(`${label} /${page.slug}: page name not in both languages`);
  }
}

describe("builder content is bilingual", () => {
  it("every library design has both languages", () => {
    const problems: Problem[] = [];
    for (const design of DESIGNS) check(design.id, design.tree(treeBuilder), problems);
    expect(problems).toEqual([]);
  });

  it("every code template (pages, header, footer, page names) has both languages", () => {
    const problems: Problem[] = [];
    for (const template of CODE_TEMPLATES) checkTemplate(template, template.key, problems);
    expect(problems).toEqual([]);
  }, 60_000);

  it("every niche edition of a template has both languages", () => {
    const problems: Problem[] = [];
    let built = 0;
    for (const look of editionReadyLooks()) {
      for (const edition of editionsForLook(look)) {
        const template = templateWithEdition(look, edition.niche);
        if (!template) continue;
        built += 1;
        checkTemplate(template, `${look}+${edition.niche}`, problems);
      }
    }
    expect(built).toBeGreaterThan(0);
    expect(problems).toEqual([]);
  }, 60_000);

  it("every element placeholder has its English for Fill missing translations", () => {
    const { placeholders } = codeTranslationDictionary();
    const missing: string[] = [];
    for (const definition of ELEMENT_DEFINITIONS) {
      for (const field of definition.fields) {
        const value = definition.defaultProps[field.key];
        if (field.translatable && typeof value === "string" && textScript(value) === "ar" && !placeholders.arToEn.get(value)) missing.push(`${definition.type}.${field.key}: ${value}`);
      }
    }
    expect(missing).toEqual([]);
  }, 60_000);
});
