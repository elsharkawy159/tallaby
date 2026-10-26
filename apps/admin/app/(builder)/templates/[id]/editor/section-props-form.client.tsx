// Disabled 2026-10-27: storefront templates and the section library come from the codebase only
// (owner; @workspace/store-sections). The templates, template_versions and library_sections tables
// were dropped (0109). The original code is kept below, commented out, for reference.
export {};

// "use client";
//
// import { useMemo, useRef, useState } from "react";
// import { ImageUp, LoaderCircle, RotateCcw } from "lucide-react";
// import { libraryFieldsOf, LOCALIZED_EXTRAS, type LibraryField } from "@workspace/store-sections/library-fields";
// import { PHOTO_SLOT_RE, PRODUCT_SORTS, PRODUCT_SOURCES, resolvePhotoSlot } from "@workspace/store-sections/render";
// import type { TemplateLibraryRow } from "@workspace/lib/admin/server";
// import { Button } from "@workspace/ui/components/button";
// import { Input } from "@workspace/ui/components/input";
// import { Label } from "@workspace/ui/components/label";
// import { Textarea } from "@workspace/ui/components/textarea";
// import { fieldText, withFieldText, type TemplateFieldValue, type TemplateFieldValues } from "./template-sections.lib";
//
// type Localized = { ar: string; en: string };
//
// const TYPE_NAMES: Record<string, string> = {
//   heading: "Heading",
//   paragraph: "Text",
//   text: "Text",
//   badge: "Badge",
//   button: "Button",
//   textLink: "Link",
//   linkBlock: "Link",
//   listItem: "List item",
//   accordionItem: "Question",
//   blockQuote: "Quote",
//   image: "Image",
//   video: "Video",
//   videoItem: "Video",
//   productList: "Products",
//   categoryList: "Categories",
//   postList: "Blog posts",
// };
//
// const asLocalized = (value: unknown): Localized | null =>
//   value && typeof value === "object" && "ar" in value ? (value as Localized) : typeof value === "string" ? { ar: value, en: value } : null;
//
// /** The field's title: its layer name, else its type, with the field name for reference. */
// function fieldTitle(field: LibraryField): string {
//   const label = field.label?.en || field.label?.ar;
//   return label && field.type !== "button" ? label : (TYPE_NAMES[field.type] ?? field.type);
// }
//
// export type SectionPropsFormProps = {
//   row: TemplateLibraryRow;
//   values: TemplateFieldValues;
//   /** The template's industry: the stock photos of photo slots. */
//   industry: string;
//   /** Links the template's pages and the store's system pages offer. */
//   links: readonly string[];
//   /** What the saved values name that this library section no longer has. */
//   missing: readonly string[];
//   onChange: (values: TemplateFieldValues) => void;
//   /** Uploads one image into library-media; its public URL, or null on failure (already reported). */
//   uploadImage: (file: File) => Promise<string | null>;
// };
//
// /**
//  * The values of one template section (owner, 2026-10-26): every field of its
//  * library section that a template can fill (copy in Arabic and English,
//  * photos, links, product lists, videos), with the library's own value as the
//  * starting point and a reset per field. Fields inside a data list's card are
//  * filled from store data and not shown. Structure and styles are the library
//  * section's (Admin › Sections).
//  */
// export function SectionPropsForm({ row, values, industry, links, missing, onChange, uploadImage }: SectionPropsFormProps) {
//   const fields = useMemo(() => libraryFieldsOf(row.tree).filter((field) => !field.bound && field.kind !== "form"), [row.tree]);
//   const set = (key: string, value: TemplateFieldValue | undefined) => {
//     const next = { ...values };
//     if (value === undefined) delete next[key];
//     else next[key] = value;
//     onChange(next);
//   };
//   const listId = `template-links-${row.key}`;
//
//   return (
//     <div className="space-y-4">
//       {missing.length > 0 && (
//         <div className="rounded-md border border-amber-300 bg-amber-50 p-2 text-xs text-amber-900">
//           <p>Some saved values no longer match this library section and are not shown: {missing.join(", ")}.</p>
//           <Button
//             type="button"
//             variant="link"
//             className="h-auto p-0 text-xs"
//             onClick={() => onChange(Object.fromEntries(Object.entries(values).filter(([key]) => !missing.some((m) => m.includes(`"${key}"`)))))}
//           >
//             Drop them
//           </Button>
//         </div>
//       )}
//       {fields.length === 0 && <p className="text-sm text-muted-foreground">This section has nothing a template fills: it shows the store’s own data.</p>}
//       <datalist id={listId}>
//         {links.map((href) => (
//           <option key={href} value={href} />
//         ))}
//       </datalist>
//       {fields.map((field) => (
//         <fieldset key={field.field} className="space-y-2 rounded-md border p-3">
//           <legend className="flex w-full items-center gap-2 px-1 text-xs font-medium">
//             <span>{fieldTitle(field)}</span>
//             <span className="font-mono text-[10px] text-muted-foreground">{field.field}</span>
//           </legend>
//           {field.kind === "text" && (
//             <CopyInputs
//               id={`${row.key}-${field.field}`}
//               value={values[field.field]}
//               original={asLocalized(field.original)}
//               multiline={field.type === "paragraph" || field.type === "text" || field.type === "blockQuote"}
//               onChange={(value) => set(field.field, value)}
//             />
//           )}
//           {field.kind === "image" && (
//             <ImageInput
//               value={values[field.field]}
//               original={typeof field.original === "string" ? field.original : ""}
//               industry={industry}
//               onChange={(value) => set(field.field, value)}
//               uploadImage={uploadImage}
//             />
//           )}
//           {field.kind === "video" && (
//             <TextInput label="YouTube link" value={values[field.field]} original={String(field.original ?? "")} onChange={(value) => set(field.field, value)} />
//           )}
//           {field.kind === "link" && (
//             <TextInput label="Link" list={listId} value={values[field.field]} original={String(field.original ?? "")} onChange={(value) => set(field.field, value)} />
//           )}
//           {field.kind === "list" && <ListInputs field={field} values={values} set={set} />}
//           {field.extras
//             .filter((extra) => field.kind !== "list")
//             .map((extra) => {
//               const key = `${field.field}.${extra}`;
//               return LOCALIZED_EXTRAS.has(extra) ? (
//                 <div key={extra} className="space-y-1">
//                   <p className="text-xs text-muted-foreground">{extra === "alt" ? "Image description" : "Title"}</p>
//                   <CopyInputs id={`${row.key}-${key}`} value={values[key]} original={asLocalized(field.extraOriginals[extra])} onChange={(value) => set(key, value)} />
//                 </div>
//               ) : (
//                 <TextInput key={extra} label="Link" list={listId} value={values[key]} original={String(field.extraOriginals[extra] ?? "")} onChange={(value) => set(key, value)} />
//               );
//             })}
//         </fieldset>
//       ))}
//     </div>
//   );
// }
//
// function ResetButton({ onClick }: { onClick: () => void }) {
//   return (
//     <Button type="button" variant="ghost" size="icon" className="size-6 shrink-0" onClick={onClick} aria-label="Use the library section’s value" title="Use the library section’s value">
//       <RotateCcw className="size-3" />
//     </Button>
//   );
// }
//
// /** Copy in both languages; empty value = the library's copy. */
// function CopyInputs({
//   id,
//   value,
//   original,
//   multiline = false,
//   onChange,
// }: {
//   id: string;
//   value: TemplateFieldValue | undefined;
//   original: Localized | null;
//   multiline?: boolean;
//   onChange: (value: TemplateFieldValue | undefined) => void;
// }) {
//   const Control = multiline ? Textarea : Input;
//   return (
//     <div className="space-y-1.5">
//       {(["ar", "en"] as const).map((locale) => (
//         <div key={locale} className="flex items-start gap-1.5">
//           <Label htmlFor={`${id}-${locale}`} className="mt-2 w-6 shrink-0 text-[10px] uppercase text-muted-foreground">
//             {locale}
//           </Label>
//           <Control
//             id={`${id}-${locale}`}
//             dir={locale === "ar" ? "rtl" : "ltr"}
//             rows={multiline ? 2 : undefined}
//             maxLength={2000}
//             className="min-w-0 flex-1 text-sm"
//             value={fieldText(value, locale) ?? original?.[locale] ?? ""}
//             onChange={(event) => onChange(withFieldText(value, locale, event.target.value, original))}
//           />
//         </div>
//       ))}
//       {value !== undefined && (
//         <div className="flex justify-end">
//           <ResetButton onClick={() => onChange(undefined)} />
//         </div>
//       )}
//     </div>
//   );
// }
//
// function TextInput({
//   label,
//   value,
//   original,
//   list,
//   onChange,
// }: {
//   label: string;
//   value: TemplateFieldValue | undefined;
//   original: string;
//   list?: string;
//   onChange: (value: TemplateFieldValue | undefined) => void;
// }) {
//   return (
//     <div className="flex items-center gap-1.5">
//       <span className="w-12 shrink-0 text-[10px] text-muted-foreground">{label}</span>
//       <Input
//         dir="ltr"
//         list={list}
//         maxLength={2048}
//         className="min-w-0 flex-1 text-sm"
//         value={typeof value === "string" ? value : original}
//         onChange={(event) => onChange(event.target.value)}
//       />
//       {value !== undefined && <ResetButton onClick={() => onChange(undefined)} />}
//     </div>
//   );
// }
//
// function ImageInput({
//   value,
//   original,
//   industry,
//   onChange,
//   uploadImage,
// }: {
//   value: TemplateFieldValue | undefined;
//   original: string;
//   industry: string;
//   onChange: (value: TemplateFieldValue | undefined) => void;
//   uploadImage: (file: File) => Promise<string | null>;
// }) {
//   const input = useRef<HTMLInputElement>(null);
//   const [busy, setBusy] = useState(false);
//   const own = typeof value === "string" ? value : null;
//   const stock = PHOTO_SLOT_RE.test(original);
//   const shown = own ?? resolvePhotoSlot(original, industry);
//   return (
//     <div className="space-y-2">
//       <div className="flex items-center gap-2">
//         {shown ? (
//           // eslint-disable-next-line @next/next/no-img-element -- admin preview of an arbitrary template image
//           <img src={shown} alt="" className="size-14 shrink-0 rounded border object-cover" />
//         ) : (
//           <div className="size-14 shrink-0 rounded border bg-muted" />
//         )}
//         <div className="min-w-0 flex-1 space-y-1">
//           <p className="truncate text-[11px] text-muted-foreground">{own ? "This template’s photo" : stock ? "Stock photo for the industry" : "The library section’s photo"}</p>
//           <div className="flex gap-1">
//             <Button type="button" variant="outline" size="sm" className="h-7 text-xs" disabled={busy} onClick={() => input.current?.click()}>
//               {busy ? <LoaderCircle className="size-3 animate-spin" /> : <ImageUp className="size-3" />}
//               Upload
//             </Button>
//             {own && (
//               <Button type="button" variant="ghost" size="sm" className="h-7 text-xs" onClick={() => onChange(undefined)}>
//                 {stock ? "Use stock photo" : "Reset"}
//               </Button>
//             )}
//           </div>
//         </div>
//         <input
//           ref={input}
//           type="file"
//           accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
//           className="hidden"
//           onChange={async (event) => {
//             const file = event.target.files?.[0];
//             event.target.value = "";
//             if (!file) return;
//             setBusy(true);
//             const url = await uploadImage(file);
//             setBusy(false);
//             if (url) onChange(url);
//           }}
//         />
//       </div>
//       <Input
//         dir="ltr"
//         placeholder="https://…"
//         maxLength={2048}
//         className="text-xs"
//         value={own ?? ""}
//         onChange={(event) => onChange(event.target.value ? event.target.value : undefined)}
//       />
//     </div>
//   );
// }
//
// function ListInputs({ field, values, set }: { field: LibraryField; values: TemplateFieldValues; set: (key: string, value: TemplateFieldValue | undefined) => void }) {
//   const products = field.type === "productList";
//   const source = values[field.field] === undefined ? field.original : values[field.field];
//   const sort = values[`${field.field}.sort`] === undefined ? field.extraOriginals.sort : values[`${field.field}.sort`];
//   const limit = values[`${field.field}.limit`] === undefined ? field.extraOriginals.limit : values[`${field.field}.limit`];
//   const select = "h-8 w-full rounded-md border bg-background px-2 text-sm";
//   return (
//     <div className="grid grid-cols-3 gap-2">
//       {products && (
//         <>
//           <label className="space-y-1 text-[10px] text-muted-foreground">
//             Show
//             <select className={select} value={typeof source === "string" ? source : "all"} onChange={(event) => set(field.field, event.target.value)}>
//               {PRODUCT_SOURCES.filter((s) => s !== "related" && s !== "selected" && s !== "category").map((s) => (
//                 <option key={s} value={s}>
//                   {s}
//                 </option>
//               ))}
//             </select>
//           </label>
//           <label className="space-y-1 text-[10px] text-muted-foreground">
//             Sort
//             <select className={select} value={typeof sort === "string" ? sort : "default"} onChange={(event) => set(`${field.field}.sort`, event.target.value)}>
//               {PRODUCT_SORTS.map((s) => (
//                 <option key={s} value={s}>
//                   {s}
//                 </option>
//               ))}
//             </select>
//           </label>
//         </>
//       )}
//       <label className="space-y-1 text-[10px] text-muted-foreground">
//         How many
//         <Input
//           type="number"
//           min={1}
//           max={48}
//           className="h-8 text-sm"
//           value={typeof limit === "number" ? limit : ""}
//           onChange={(event) => {
//             const n = Number(event.target.value);
//             set(`${field.field}.limit`, event.target.value === "" ? undefined : Number.isInteger(n) && n > 0 ? Math.min(n, 48) : undefined);
//           }}
//         />
//       </label>
//     </div>
//   );
// }
//
