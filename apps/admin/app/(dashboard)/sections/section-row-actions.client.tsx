"use client";

import Link from "next/link";
import { Button } from "@workspace/ui/components/button";
import { ReasonActionButton } from "../_components/dialogs/reason-action.client";
import { DuplicateSectionButton, SectionDetailsButton, type SectionDetails } from "./new-section-dialog.client";
import { deleteSectionAction, setSectionHiddenAction } from "./sections.server";

/** Edit (section editor), Details, Duplicate, Hide/Show and Delete for one library section. */
export function SectionRowActions({ section, isHidden, categories }: { section: SectionDetails; isHidden: boolean; categories: readonly string[] }) {
  const name = section.name.en || section.key;
  return (
    <div className="flex flex-wrap justify-end gap-2">
      <Button asChild size="sm">
        <Link href={`/sections/${section.id}/editor`}>Edit</Link>
      </Button>
      <SectionDetailsButton section={section} categories={categories} />
      <DuplicateSectionButton section={section} categories={categories} />
      <ReasonActionButton
        label={isHidden ? "Show" : "Hide"}
        title={isHidden ? `Show ${name} to sellers?` : `Hide ${name} from sellers?`}
        description={
          isHidden
            ? "It comes back in sellers' Add › Sections (once it has been published)."
            : "Sellers no longer see it in Add › Sections. Stores that already use it keep their copy."
        }
        confirmLabel={isHidden ? "Show" : "Hide"}
        payload={{ id: section.id, hidden: !isHidden }}
        action={setSectionHiddenAction}
      />
      <ReasonActionButton
        label="Delete"
        title={`Delete ${name}?`}
        description="It disappears from the library here and from sellers' Add › Sections. Stores that already use it keep their copy. Its key stays taken."
        confirmLabel="Delete"
        destructive
        payload={{ id: section.id }}
        action={deleteSectionAction}
      />
    </div>
  );
}
