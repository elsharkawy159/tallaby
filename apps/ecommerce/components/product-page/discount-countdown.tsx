"use client"

import { useState, useEffect } from "react"
import { Clock } from "lucide-react"
import { useTranslations } from "next-intl"

interface DiscountCountdownProps {
  /** The vendor-set discount expiry moment. Once reached, the countdown hides itself. */
  endDate: Date
}

interface TimeLeft {
  days: number
  hours: number
  minutes: number
  seconds: number
}

const calculateTimeLeft = (endDate: Date): TimeLeft => {
  const now = new Date().getTime()
  const distance = endDate.getTime() - now

  if (distance < 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0 }
  }

  return {
    days: Math.floor(distance / (1000 * 60 * 60 * 24)),
    hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
    minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
    seconds: Math.floor((distance % (1000 * 60)) / 1000),
  }
}

const isExpired = (timeLeft: TimeLeft): boolean => {
  return timeLeft.days === 0 && timeLeft.hours === 0 &&
         timeLeft.minutes === 0 && timeLeft.seconds === 0
}

const INITIAL_TIME_LEFT: TimeLeft = { days: 0, hours: 0, minutes: 0, seconds: 0 }

export const DiscountCountdown = ({ endDate }: DiscountCountdownProps) => {
  const t = useTranslations("product")
  // Seeded with zeros (not endDate math) so server and client render the same
  // markup on first paint; the real countdown is filled in once mounted.
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(INITIAL_TIME_LEFT)
  const [expired, setExpired] = useState<boolean>(false)

  useEffect(() => {
    const initial = calculateTimeLeft(endDate)
    setTimeLeft(initial)
    setExpired(isExpired(initial))

    if (isExpired(initial)) return

    const timer = setInterval(() => {
      const newTimeLeft = calculateTimeLeft(endDate)
      setTimeLeft(newTimeLeft)

      if (isExpired(newTimeLeft)) {
        setExpired(true)
        clearInterval(timer)
      }
    }, 1000)

    return () => clearInterval(timer)
  }, [endDate])

  if (expired) return null

  const timeBlocks = [
    { value: timeLeft.days, label: t("days") },
    { value: timeLeft.hours, label: t("hours") },
    { value: timeLeft.minutes, label: t("minutes") },
    { value: timeLeft.seconds, label: t("seconds") },
  ]

  // Compact, single row: sits in the price ticket's stub.
  return (
    <div className="flex flex-wrap items-center gap-x-2.5 gap-y-2 text-sm">
      <span className="flex items-center gap-1.5 font-semibold text-[#9a5800]">
        <Clock className="h-4 w-4 shrink-0" aria-hidden />
        {t("discountEndsIn")}
      </span>
      <span className="flex items-center gap-1" role="timer">
        {timeBlocks.map((block) => (
          <span
            key={block.label}
            className="flex items-baseline gap-0.5 rounded-md bg-white px-1.5 py-1 shadow-sm"
          >
            <span className="font-bold tabular-nums text-gray-900">
              {String(block.value).padStart(2, "0")}
            </span>
            <span className="text-[10px] text-gray-500">{block.label}</span>
          </span>
        ))}
      </span>
    </div>
  )
}
