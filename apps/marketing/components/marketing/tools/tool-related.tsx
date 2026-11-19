import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { BidiText } from "@/components/marketing/pages/content-blocks";
import { ForwardArrow } from "@/components/marketing/site/direction-icons";
import { Container, Section, SectionHeading } from "@/components/marketing/site/layout-primitives";
import { TOOL_RELATED, type ToolSlug } from "@/lib/marketing/tools.lib";

/** "Related pages" under a tool: a sibling tool, pricing and a solution (`TOOL_RELATED`), as plain crawlable links. */
export async function ToolRelated({ slug }: { slug: ToolSlug }) {
  const t = await getTranslations(`toolPages.${slug}`);
  const items = t.raw("related") as { title: string; body: string }[];
  return (
    <Section>
      <Container>
        <SectionHeading title={t("relatedTitle")} centered />
        <div className="grid gap-3.5 min-[641px]:grid-cols-2 min-[1081px]:grid-cols-4">
          {items.map((item, i) => (
            <Link
              key={TOOL_RELATED[slug][i]}
              href={TOOL_RELATED[slug][i]!}
              className="flex flex-col gap-2 rounded-[22px] border border-line bg-white p-5 text-inherit transition-colors duration-200 hover:border-teal-300 hover:no-underline"
            >
              <b className="flex items-center justify-between gap-2 text-base text-teal-900">
                <BidiText text={item.title} />
                <ForwardArrow className="flex-none text-teal-500" />
              </b>
              <p className="text-sm text-ink-500">
                <BidiText text={item.body} />
              </p>
            </Link>
          ))}
        </div>
      </Container>
    </Section>
  );
}
