"use client"

import { Sparkles, Zap, Infinity as InfinityIcon } from "lucide-react"
import { motion } from "framer-motion"
import { Link } from "@/i18n/navigation"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/popover"
import { Button } from "@workspace/ui/components/button"
import { cn } from "@/lib/utils"
import type { AiChatCreditInfo } from "@/actions/ai-conversation-actions"
import { CreditResetCountdown } from "@/components/ai/credit-reset-countdown"

/**
 * Always-visible credit badge in the chat header. Pulses when the user is low
 * (< 20% remaining) and surfaces an upgrade CTA in a popover for non-enterprise
 * plans. Enterprise/unlimited shows an infinity marker instead of a count.
 */
export function AiCreditBadge({ info }: { info: AiChatCreditInfo | null }) {
  if (!info) {
    return (
      <span className="inline-flex h-6 items-center gap-1 rounded-full border bg-muted/40 px-2 text-[11px] text-muted-foreground">
        <Sparkles className="size-3 animate-pulse opacity-60" />
        …
      </span>
    )
  }

  const { unlimited, creditsRemaining, isLow, isOutOfCredits, planLabel } = info
  // Only free users have a higher tier to move to — Pro is the top paid plan
  // we sell, so never nudge an existing Pro (or above) subscriber to "upgrade".
  const canUpgrade = info.plan === "free"

  const badge = (
    <span
      className={cn(
        "inline-flex h-6 cursor-pointer items-center gap-1 rounded-full border px-2 text-[11px] font-medium transition-colors",
        isOutOfCredits
          ? "border-rose-300 bg-rose-50 text-rose-600 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300"
          : isLow
            ? "border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300"
            : "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-900 dark:bg-violet-950/30 dark:text-violet-300"
      )}
    >
      {unlimited ? (
        <InfinityIcon className="size-3" />
      ) : (
        <Zap className={cn("size-3", isLow && !isOutOfCredits && "animate-pulse")} />
      )}
      {unlimited ? "Unlimited" : `${creditsRemaining} credits`}
    </span>
  )

  const trigger =
    isLow || isOutOfCredits ? (
      <motion.span
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 1.6, repeat: Infinity }}
      >
        {badge}
      </motion.span>
    ) : (
      badge
    )

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button type="button" aria-label="AI credits">
          {trigger}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-64 space-y-3">
        <div className="space-y-1">
          <p className="text-sm font-semibold">{planLabel} plan</p>
          <p className="text-xs text-muted-foreground">
            {unlimited
              ? "You have unlimited AI credits."
              : isOutOfCredits
                ? "You've used all your AI credits for today."
                : `${creditsRemaining} of ${info.dailyCredits} daily credits remaining.`}
          </p>
        </div>
        {!unlimited && (
          <CreditResetCountdown
            resetAt={info.resetAt}
            className="rounded-md bg-muted/50 px-2 py-1.5 text-[11px] text-muted-foreground"
          />
        )}
        {canUpgrade && (
          <Button
            asChild
            size="sm"
            className="w-full gap-1.5 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white hover:from-violet-700 hover:to-fuchsia-700"
          >
            <Link href="/billing">
              <Sparkles className="size-3.5" />
              Upgrade to Pro for more credits
            </Link>
          </Button>
        )}
      </PopoverContent>
    </Popover>
  )
}
