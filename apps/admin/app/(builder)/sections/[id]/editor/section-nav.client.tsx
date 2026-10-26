// Disabled 2026-10-27: storefront templates and the section library come from the codebase only
// (owner; @workspace/store-sections). The templates, template_versions and library_sections tables
// were dropped (0109). The original code is kept below, commented out, for reference.
export {};

// "use client";
//
// import { useMemo, useState } from "react";
// import { Search } from "lucide-react";
// import { Badge } from "@workspace/ui/components/badge";
// import { Input } from "@workspace/ui/components/input";
// import { cn } from "@workspace/ui/lib/utils";
//
// export type SectionNavItem = {
//   id: string;
//   key: string;
//   category: string;
//   name: { ar: string; en: string };
//   hidden: boolean;
//   /** Never published (version 0). */
//   unpublished: boolean;
//   hasDraft: boolean;
// };
//
// /**
//  * Add › Sections in the section editor: every library section (hidden ones
//  * too), grouped by category and searchable, each opening its own editor. A
//  * full page load, so the editor's unsaved-changes guard still applies.
//  */
// export function SectionNav({ items, currentId }: { items: SectionNavItem[]; currentId: string }) {
//   const [query, setQuery] = useState("");
//   const groups = useMemo(() => {
//     const q = query.trim().toLowerCase();
//     const shown = q ? items.filter((s) => `${s.key} ${s.name.en} ${s.name.ar} ${s.category}`.toLowerCase().includes(q)) : items;
//     const out = new Map<string, SectionNavItem[]>();
//     for (const item of shown) out.set(item.category, [...(out.get(item.category) ?? []), item]);
//     return [...out].sort(([a], [b]) => a.localeCompare(b));
//   }, [items, query]);
//
//   return (
//     <div className="flex min-h-0 flex-1 flex-col">
//       <div className="relative m-3 mb-2">
//         <Search className="pointer-events-none absolute start-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
//         <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={`Search ${items.length} sections`} className="ps-8" aria-label="Search sections" />
//       </div>
//       <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-3 pb-3">
//         {groups.map(([category, list]) => (
//           <section key={category}>
//             <h3 className="mb-1 text-xs font-medium capitalize text-muted-foreground">
//               {category.replace(/-/g, " ")} <span className="font-normal">({list.length})</span>
//             </h3>
//             <ul className="space-y-1">
//               {list.map((item) => {
//                 const current = item.id === currentId;
//                 return (
//                   <li key={item.id}>
//                     <a
//                       href={`/sections/${item.id}/editor`}
//                       aria-current={current ? "page" : undefined}
//                       className={cn(
//                         "flex items-center gap-2 rounded-md border px-2 py-1.5 text-xs",
//                         current ? "border-primary bg-primary/5" : "hover:border-primary/50 hover:bg-muted",
//                       )}
//                     >
//                       <span className="min-w-0 flex-1">
//                         <span className="block truncate font-medium">{item.name.en || item.name.ar || item.key}</span>
//                         <span className="block truncate font-mono text-[10px] text-muted-foreground">{item.key}</span>
//                       </span>
//                       {item.unpublished ? (
//                         <Badge variant="outline" className="h-4 px-1 text-[9px]">
//                           new
//                         </Badge>
//                       ) : item.hasDraft ? (
//                         <Badge variant="outline" className="h-4 border-amber-400 px-1 text-[9px] text-amber-700">
//                           draft
//                         </Badge>
//                       ) : null}
//                       {item.hidden && (
//                         <Badge variant="secondary" className="h-4 px-1 text-[9px]">
//                           hidden
//                         </Badge>
//                       )}
//                     </a>
//                   </li>
//                 );
//               })}
//             </ul>
//           </section>
//         ))}
//         {groups.length === 0 && <p className="text-sm text-muted-foreground">No section matches.</p>}
//       </div>
//     </div>
//   );
// }
//
