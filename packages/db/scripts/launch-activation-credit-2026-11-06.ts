/**
 * One-off, owner-approved (2026-11-06): after the USD switch, activate every
 * existing seller who isn't activated (F-68/F-76: no top-up, never a positive
 * balance, not Pro) with a small admin credit, so their published stores and
 * orders come back. New sellers still activate by topping up.
 *
 * Goes only through postStoreWalletEntry (CLAUDE.md rule 7): type `adjustment`,
 * reference `admin` / `launch-activation-2026-11-06:<sellerId>`, so a re-run
 * never credits anyone twice (unique claim). One transaction per seller.
 *
 * Usage (from the repo root):
 *   DATABASE_URL=... npx tsx packages/db/scripts/launch-activation-credit-2026-11-06.ts plan
 *   DATABASE_URL=... npx tsx packages/db/scripts/launch-activation-credit-2026-11-06.ts run
 */
const AMOUNT = "0.10"; // USD
const REF_PREFIX = "launch-activation-2026-11-06";

async function main() {
  const mode = process.argv[2];
  if (mode !== "plan" && mode !== "run") throw new Error("mode must be plan or run");
  const ref = (process.env.DATABASE_URL ?? "").match(/postgres\.([a-z]{20})/)?.[1] ?? "";
  if (!ref.startsWith("sakwqw")) throw new Error("refusing: not the production project");

  const { db, sql } = await import("../src/index");
  const { postStoreWalletEntryOnce } = await import("../src/wallet/store-wallet");

  const [settings] = (await db.execute(sql`select usd_live from billing_settings`)) as unknown as { usd_live: boolean }[];
  if (!settings?.usd_live) throw new Error("refusing: USD switch is not live");

  const rows = (await db.execute(sql`
    select se.id, se.display_name,
      coalesce((select w.status::text from seller_wallet w where w.seller_id = se.id), 'none') as wallet_status,
      (select count(*)::int from stores st where st.seller_id = se.id and st.site_status = 'published') as published
    from sellers se
    where not exists(select 1 from seller_wallet_top_ups t where t.seller_id = se.id and t.status = 'succeeded')
      and not exists(select 1 from wallet_transactions w where w.seller_id = se.id and w.type = 'top_up')
      and coalesce((select balance from seller_wallet w where w.seller_id = se.id), 0) <= 0
      and not exists(select 1 from wallet_transactions w where w.seller_id = se.id and w.currency = 'USD' and w.balance_after > 0)
      and not (se.plan = 'pro' and coalesce(se.plan_expires_at, now()) >= now())
    order by published desc, se.display_name`)) as unknown as { id: string; display_name: string; wallet_status: string; published: number }[];

  const eligible = rows.filter((r) => r.wallet_status === "active" || r.wallet_status === "none");
  const skipped = rows.filter((r) => !eligible.includes(r));
  console.log(`not activated: ${rows.length} | to credit: ${eligible.length} x $${AMOUNT} = $${(eligible.length * Number(AMOUNT)).toFixed(2)} | skipped (wallet not active): ${skipped.length}`);
  for (const s of skipped) console.log("  skip", s.display_name, s.wallet_status);
  if (mode === "plan") {
    for (const r of eligible) console.log("  ", r.published ? "published" : "         ", r.display_name);
    process.exit(0);
  }

  let done = 0, already = 0;
  for (const r of eligible) {
    const res = await db.transaction((tx) =>
      postStoreWalletEntryOnce(tx, {
        sellerId: r.id,
        type: "adjustment",
        amount: AMOUNT,
        currency: "USD",
        referenceType: "admin",
        referenceId: `${REF_PREFIX}:${r.id}`,
        description: "Tallaby launch credit",
        metadata: { source: "launch_activation", reason: "Activate existing sellers at the USD switch (owner, 2026-11-06)" },
      }),
    );
    if (res) done++; else already++;
  }
  console.log(`credited: ${done} | already credited: ${already}`);
  process.exit(0);
}

main().catch((e) => {
  console.error("FAILED:", e instanceof Error ? e.message : e);
  process.exit(1);
});
