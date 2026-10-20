"use client"

import { useEffect, useState } from "react"
import { useTheme } from "next-themes"
import { AlertTriangle, Clock, RotateCcw, Sparkles, Loader2 } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { captureEvent } from "@workspace/analytics/client"
import { cn } from "@/lib/utils"
import type { AiChatCreditInfo } from "@/actions/ai-conversation-actions"
import { CreditResetCountdown } from "@/components/ai/credit-reset-countdown"
import {
  useCheckoutCurrency,
  buildDashboardCheckoutHref,
} from "@/lib/billing/use-checkout-currency"

export type ChatNotice =
  | { kind: "rate_limit"; retryAfter: number }
  | { kind: "out_of_credits" }
  | { kind: "blocked" }
  | { kind: "error"; message: string }

/**
 * Classify a useChat onError into an actionable notice. The transport surfaces
 * the API's response body as the Error message, so we match on the known
 * preflight strings returned by `lib/server/ai-credits.ts`.
 */
export function classifyChatError(
  error: Error,
  rateLimitWindowSeconds: number
): ChatNotice {
  const msg = error.message || ""
  if (/insufficient ai credits/i.test(msg)) return { kind: "out_of_credits" }
  if (/temporarily reached the ai usage limit/i.test(msg))
    return { kind: "blocked" }
  if (/too many requests/i.test(msg))
    return { kind: "rate_limit", retryAfter: rateLimitWindowSeconds }
  if (/timed out/i.test(msg))
    return {
      kind: "error",
      message: "The request took too long. Please try again.",
    }
  return {
    kind: "error",
    message:
      "AI is temporarily unavailable. Please try again in a moment.",
  }
}

export function AiChatNotice({
  notice,
  creditInfo,
  onRetry,
  onDismiss,
}: {
  notice: ChatNotice
  creditInfo?: AiChatCreditInfo | null
  onRetry?: () => void
  onDismiss: () => void
}) {
  const [seconds, setSeconds] = useState(
    notice.kind === "rate_limit" ? notice.retryAfter : 0
  )
  const { resolvedTheme } = useTheme()
  const checkoutCurrency = useCheckoutCurrency()
  const [isRedirecting, setIsRedirecting] = useState(false)
  // Pro is the top paid plan we sell — only nudge free users to upgrade.
  const canUpgrade = !creditInfo || creditInfo.plan === "free"

  useEffect(() => {
    if (notice.kind !== "rate_limit") return
    setSeconds(notice.retryAfter)
    const t = setInterval(() => {
      setSeconds((s) => {
        if (s <= 1) {
          clearInterval(t)
          return 0
        }
        return s - 1
      })
    }, 1000)
    return () => clearInterval(t)
  }, [notice])

  const tone =
    notice.kind === "out_of_credits" || notice.kind === "blocked"
      ? "violet"
      : notice.kind === "rate_limit"
        ? "amber"
        : "rose"

  return (
    <div
      className={cn(
        "flex flex-col gap-2 rounded-xl border px-3 py-2.5 text-xs",
        tone === "violet" &&
          "border-violet-200 bg-violet-50 text-violet-800 dark:border-violet-900 dark:bg-violet-950/30 dark:text-violet-200",
        tone === "amber" &&
          "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200",
        tone === "rose" &&
          "border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-200"
      )}
    >
      {notice.kind === "out_of_credits" && (
        <>
          <div className="flex items-center gap-1.5 font-medium">
            <Sparkles className="size-3.5" />
            You&apos;ve used all your credits for today
          </div>
          <p className="opacity-80">
            <CreditResetCountdown resetAt={creditInfo?.resetAt ?? null} />
            {canUpgrade ? "." : " — you'll be able to continue then."}
          </p>
          {canUpgrade && (
            <Button
              size="sm"
              disabled={isRedirecting}
              className="mt-0.5 h-7 w-full gap-1.5 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white hover:from-violet-700 hover:to-fuchsia-700"
              onClick={() => {
                if (isRedirecting) return
                setIsRedirecting(true)
                captureEvent("upgrade_clicked", { source: "ai_chat_notice" })
                window.location.href = buildDashboardCheckoutHref({
                  theme: resolvedTheme,
                  currency: checkoutCurrency,
                })
              }}
            >
              {isRedirecting ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Sparkles className="size-3.5" />
              )}
              Upgrade to Pro for 250 daily credits
            </Button>
          )}
        </>
      )}

      {notice.kind === "blocked" && (
        <>
          <div className="flex items-center gap-1.5 font-medium">
            <AlertTriangle className="size-3.5" />
            AI usage temporarily paused
          </div>
          <p className="opacity-80">
            We detected unusually rapid requests. Please try again later.
          </p>
        </>
      )}

      {notice.kind === "rate_limit" && (
        <>
          <div className="flex items-center gap-1.5 font-medium">
            <Clock className="size-3.5" />
            {seconds > 0
              ? `Please wait ${seconds}s before sending again`
              : "You can send again now"}
          </div>
          {seconds === 0 && onRetry && (
            <Button
              size="sm"
              variant="outline"
              className="mt-0.5 h-7 w-full gap-1.5"
              onClick={() => {
                onRetry()
                onDismiss()
              }}
            >
              <RotateCcw className="size-3.5" />
              Retry
            </Button>
          )}
        </>
      )}

      {notice.kind === "error" && (
        <>
          <div className="flex items-center gap-1.5 font-medium">
            <AlertTriangle className="size-3.5" />
            {notice.message}
          </div>
          {onRetry && (
            <Button
              size="sm"
              variant="outline"
              className="mt-0.5 h-7 w-full gap-1.5"
              onClick={() => {
                onRetry()
                onDismiss()
              }}
            >
              <RotateCcw className="size-3.5" />
              Retry
            </Button>
          )}
        </>
      )}
    </div>
  )
}
