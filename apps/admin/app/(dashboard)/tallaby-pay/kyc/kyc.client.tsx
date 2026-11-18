"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { LoaderCircle } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { ActionButton } from "../tallaby-pay.client";
import { rejectTallabyPayKycAction, verifyTallabyPayKycAction } from "../tallaby-pay.server";

/** Verify (one click, logged) or Reject (reason, emailed to the seller) one identity. */
export function KycActions({ sellerId, legalName, canVerify }: { sellerId: string; legalName: string; canVerify: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const verify = () =>
    startTransition(async () => {
      const result = await verifyTallabyPayKycAction({ sellerId });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success(result.message);
      router.refresh();
    });

  return (
    <div className="flex flex-wrap justify-end gap-2">
      {canVerify && (
        <Button size="sm" onClick={verify} disabled={pending}>
          {pending && <LoaderCircle className="size-4 animate-spin" aria-hidden />}
          Verify
        </Button>
      )}
      <ActionButton
        label={canVerify ? "Reject" : "Revoke"}
        title={canVerify ? `Reject ${legalName}?` : `Revoke ${legalName}?`}
        description={
          <p>
            The seller can&apos;t ask for new withdrawals until they send their details again and you verify them. They get your
            reason by email. Open withdrawals are not touched: reject them in Withdrawals.
          </p>
        }
        fields={[{ name: "reason", label: "Reason", multiline: true, placeholder: "For example: the name doesn't match the ID number" }]}
        confirm={canVerify ? "Reject" : "Revoke"}
        destructive
        run={(v) => rejectTallabyPayKycAction({ sellerId, reason: v.reason ?? "" })}
      />
    </div>
  );
}
