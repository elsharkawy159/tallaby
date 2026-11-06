import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { LanguageSwitcher } from "@/components/layout/language-switcher.client";
import { ACCOUNT_DELETION_DAYS, ACCOUNT_DELETION_SUPPORT_EMAIL } from "@workspace/lib/account-deletion";

/**
 * How to delete a Tallaby account (ROADMAP.md F-82). Public (the session
 * middleware lets /account-deletion through): Google Play's listing links here
 * as the account deletion URL, so it must open signed out. The request itself
 * is made from Settings › Delete my account, or by email.
 */
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("accountDeletion.page");
  return { title: t("metaTitle"), description: t("metaDescription") };
}

export default async function AccountDeletionPage() {
  const t = await getTranslations("accountDeletion.page");
  const email = ACCOUNT_DELETION_SUPPORT_EMAIL;

  return (
    <div className="seller-shell min-h-dvh bg-background text-(--s-body)">
      <main className="mx-auto flex w-full max-w-[720px] flex-col gap-7 px-4 py-8 sm:px-6 sm:py-12">
        <div className="flex items-center justify-between gap-3">
          <Link href="/" aria-label="Tallaby" className="flex h-10 w-fit items-center">
            <Image src="/logo-word.png" alt="Tallaby" width={120} height={30} priority className="h-[30px] w-auto dark:brightness-0 dark:invert" />
          </Link>
          <LanguageSwitcher className="h-10 w-auto gap-1.5 rounded-[10px] px-3 py-0 font-montserrat text-[13px] font-semibold text-(--s-muted) hover:bg-(--s-hover) hover:text-(--s-ink) [&_svg]:size-4" />
        </div>

        <header className="flex flex-col gap-2">
          <h1 className="text-[26px] font-extrabold leading-tight text-(--s-ink) sm:text-[30px]">{t("title")}</h1>
          <p className="text-[15px] leading-7">{t("intro", { days: ACCOUNT_DELETION_DAYS })}</p>
        </header>

        <section className="flex flex-col gap-3" aria-labelledby="how">
          <h2 id="how" className="text-[18px] font-bold text-(--s-ink)">{t("how.title")}</h2>
          <ol className="list-decimal space-y-2 ps-5 text-[15px] leading-7">
            <li>
              {t("how.app")}{" "}
              <Link href="/settings#delete-account" className="font-semibold text-(--s-primary) underline underline-offset-2">
                {t("how.appLink")}
              </Link>
            </li>
            <li>
              {t("how.email")}{" "}
              <a href={`mailto:${email}?subject=${encodeURIComponent("Delete my Tallaby account")}`} className="font-montserrat font-semibold text-(--s-primary) underline underline-offset-2" dir="ltr">
                {email}
              </a>
            </li>
          </ol>
          <p className="text-[14px] leading-6 text-(--s-subtle)">{t("how.cancel", { days: ACCOUNT_DELETION_DAYS })}</p>
        </section>

        <section className="flex flex-col gap-3" aria-labelledby="deleted">
          <h2 id="deleted" className="text-[18px] font-bold text-(--s-ink)">{t("deleted.title")}</h2>
          <ul className="list-disc space-y-2 ps-5 text-[15px] leading-7">
            <li>{t("deleted.account")}</li>
            <li>{t("deleted.stores")}</li>
            <li>{t("deleted.orders")}</li>
            <li>{t("deleted.files")}</li>
          </ul>
        </section>

        <section className="flex flex-col gap-3" aria-labelledby="kept">
          <h2 id="kept" className="text-[18px] font-bold text-(--s-ink)">{t("kept.title")}</h2>
          <ul className="list-disc space-y-2 ps-5 text-[15px] leading-7">
            <li>{t("kept.request")}</li>
            <li>{t("kept.backups")}</li>
            <li>{t("kept.wallet")}</li>
          </ul>
        </section>

        <footer className="border-t border-(--s-line) pt-5 text-[13px] text-(--s-subtle)">
          <a href="https://tallaby.com/privacy" className="underline underline-offset-2">{t("privacy")}</a>
        </footer>
      </main>
    </div>
  );
}
