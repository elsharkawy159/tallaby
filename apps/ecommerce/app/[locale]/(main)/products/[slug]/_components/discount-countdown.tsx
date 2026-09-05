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

  return (
    <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-lg p-4 mb-4">
      <div className="flex items-center gap-2 mb-3">
        <Clock className="h-4 w-4 text-red-600" />
        <span className="text-sm font-medium text-red-700">
          {t("discountAvailableUntil")}
        </span>
      </div>
      <div className="flex gap-2 justify-center">
        {timeBlocks.map((block, index) => (
          <div key={block.label} className="flex items-center gap-2">
            <div className="flex flex-col items-center">
              <div className="bg-white border border-red-200 rounded-md px-3 py-2 min-w-[50px] text-center shadow-sm">
                <span className="text-xl font-bold text-gray-900">
                  {String(block.value).padStart(2, "0")}
                </span>
              </div>
              <span className="text-xs text-gray-600 mt-1">{block.label}</span>
            </div>
            {index < timeBlocks.length - 1 && (
              <span className="text-xl font-bold text-red-400 mb-5">:</span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
