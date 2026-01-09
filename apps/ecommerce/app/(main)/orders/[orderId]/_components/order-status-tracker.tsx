"use client"

import {
  Clock,
  CheckCircle2,
  Package,
  Truck,
  MapPin,
  XCircle,
  RotateCcw,
  CreditCard,
} from "lucide-react"
import { Progress } from "@workspace/ui/components/progress"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { cn } from "@workspace/ui/lib/utils"

export type OrderStatusType =
  | "pending"
  | "payment_processing"
  | "confirmed"
  | "shipping_soon"
  | "shipped"
  | "out_for_delivery"
  | "delivered"
  | "cancelled"
  | "refund_requested"
  | "refunded"
  | "returned"

interface StatusStep {
  key: OrderStatusType
  label: string
  icon: React.ComponentType<{ className?: string }>
  isActive: boolean
  isCompleted: boolean
}

interface OrderStatusTrackerProps {
  status: string
  paymentMethod?: string
  className?: string
}

// Base status flow without payment_processing and shipping_soon
const BASE_STATUS_FLOW: OrderStatusType[] = [
  "pending",
  "confirmed",
  "shipped",
  "out_for_delivery",
  "delivered",
]

function getStatusFlow(paymentMethod?: string): OrderStatusType[] {
  const flow: OrderStatusType[] = ["pending"]

  // Only include payment_processing for online payments
  const isOnlinePayment = paymentMethod && paymentMethod !== "cash_on_delivery"
  if (isOnlinePayment) {
    flow.push("payment_processing")
  }

  // Add the rest of the flow (excluding shipping_soon)
  flow.push("confirmed", "shipped", "out_for_delivery", "delivered")

  return flow
}

const STATUS_LABELS: Record<OrderStatusType, string> = {
  pending: "Pending",
  payment_processing: "Payment Processing",
  confirmed: "Confirmed",
  shipping_soon: "Shipping Soon",
  shipped: "Shipped",
  out_for_delivery: "Out for Delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
  refund_requested: "Refund Requested",
  refunded: "Refunded",
  returned: "Returned",
}

const STATUS_ICONS: Record<OrderStatusType, React.ComponentType<{ className?: string }>> = {
  pending: Clock,
  payment_processing: CreditCard,
  confirmed: CheckCircle2,
  shipping_soon: Package,
  shipped: Truck,
  out_for_delivery: MapPin,
  delivered: CheckCircle2,
  cancelled: XCircle,
  refund_requested: RotateCcw,
  refunded: RotateCcw,
  returned: RotateCcw,
}

function getStatusSteps(currentStatus: string, paymentMethod?: string): StatusStep[] {
  const currentStatusKey = currentStatus as OrderStatusType
  const isErrorState = ["cancelled", "refund_requested", "refunded", "returned"].includes(
    currentStatus
  )

  if (isErrorState) {
    // For error states, show the error status only
    return [
      {
        key: currentStatusKey,
        label: STATUS_LABELS[currentStatusKey],
        icon: STATUS_ICONS[currentStatusKey],
        isActive: true,
        isCompleted: false,
      },
    ]
  }

  // Get the appropriate status flow based on payment method
  const statusFlow = getStatusFlow(paymentMethod)

  // For normal flow, show all steps up to current
  const currentIndex = statusFlow.indexOf(currentStatusKey)
  const activeIndex = currentIndex !== -1 ? currentIndex : 0

  return statusFlow.map((statusKey, index) => ({
    key: statusKey,
    label: STATUS_LABELS[statusKey],
    icon: STATUS_ICONS[statusKey],
    isActive: index === activeIndex,
    isCompleted: index < activeIndex,
  }))
}

function getProgressValue(status: string, paymentMethod?: string): number {
  const isErrorState = ["cancelled", "refund_requested", "refunded", "returned"].includes(status)
  if (isErrorState) {
    return 0
  }

  const statusFlow = getStatusFlow(paymentMethod)
  const currentIndex = statusFlow.indexOf(status as OrderStatusType)
  if (currentIndex === -1) return 0

  // Calculate progress percentage
  // For the last status (delivered), show 100%, otherwise show progress based on index
  if (currentIndex === statusFlow.length - 1) {
    return 100
  }

  // Show progress up to current step + partial progress for current step
  const baseProgress = (currentIndex / statusFlow.length) * 100
  return Math.min(baseProgress + 10, 95) // Add 10% for current step, cap at 95% until delivered
}

export function OrderStatusTracker({
  status,
  paymentMethod,
  className,
}: OrderStatusTrackerProps) {
  const steps = getStatusSteps(status, paymentMethod)
  const progressValue = getProgressValue(status, paymentMethod)
  const isErrorState = ["cancelled", "refund_requested", "refunded", "returned"].includes(status)
  const isCompleted = status === "delivered"

  return (
    <Card className={cn("rounded-xl md:rounded-2xl border overflow-hidden bg-white gap-2", className)}>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-sm md:text-xl font-bold text-gray-900">
          <Package className="h-4 w-4 md:h-5 md:w-5" />
          Order Status Tracking
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Progress Bar with Animation */}
        <div className="space-y-2">
          <div className="relative">
            <Progress
              value={progressValue}
              className={cn(
                "h-3 bg-gray-200",
                isErrorState && "bg-red-100",
                isCompleted && "bg-green-100"
              )}
            />
            {/* Infinite animation overlay for active progress */}
            {!isErrorState && !isCompleted && progressValue > 0 && progressValue < 100 && (
              <div className="absolute inset-0 overflow-hidden rounded-full pointer-events-none">
                <div className="h-full w-1/2 bg-gradient-to-r from-transparent via-white/50 to-transparent progress-shimmer" />
              </div>
            )}
          </div>
          <div className="flex justify-between items-center text-xs md:text-sm">
            <span className="text-gray-600">Progress</span>
            <span className="font-medium text-gray-900">{Math.round(progressValue)}%</span>
          </div>
        </div>

        {/* Status Steps */}
        <div className="flex flex-wrap lg:flex-row flex-col items-start lg:items-center lg:justify-between lg:gap-8 gap-4">
          {steps.map((step, index) => {
            const Icon = step.icon

            // Make Delivered step green (even if it's active) when order is delivered
            const isDeliveredStepAndCompleted = isCompleted && step.key === "delivered"

            return (
              <div key={step.key} className="flex lg:flex-col flex-row items-center lg:gap-1 gap-3">
                {/* Icon */}
                <div
                  className={cn(
                    "flex-shrink-0 w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center transition-all",
                    // Special green state for the delivered step when order is delivered
                    (step.isCompleted || isDeliveredStepAndCompleted) &&
                      "bg-green-100 text-green-600 border-2 border-green-300",
                    step.isActive &&
                      !step.isCompleted &&
                      !isDeliveredStepAndCompleted &&
                      "bg-blue-100 text-blue-600 border-2 border-blue-400 animate-pulse",
                    !step.isActive &&
                      !step.isCompleted &&
                      !isDeliveredStepAndCompleted &&
                      "bg-gray-100 text-gray-400 border-2 border-gray-200",
                    isErrorState && "bg-red-100 text-red-600 border-2 border-red-300"
                  )}
                >
                  <Icon className="w-5 h-5 md:w-6 md:h-6" />
                </div>

                {/* Label and Description */}
                <div className="flex-1 min-w-0 pt-2">
                  <div className="flex items-center gap-2 mb-1">
                    <h4
                      className={cn(
                        "text-sm font-semibold",
                        (step.isCompleted || isDeliveredStepAndCompleted) && "text-green-700",
                        step.isActive && !step.isCompleted && !isDeliveredStepAndCompleted && "text-blue-700",
                        !step.isActive && !step.isCompleted && !isDeliveredStepAndCompleted && "text-gray-500",
                        isErrorState && "text-red-700"
                      )}
                    >
                      {step.label}
                    </h4>
                    {(step.isCompleted || isDeliveredStepAndCompleted) && (
                      <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                    )}
                    {step.isActive && !step.isCompleted && !isDeliveredStepAndCompleted && !isErrorState && (
                      <div className="flex-shrink-0">
                        <div className="w-2 h-2 bg-blue-600 rounded-full animate-ping" />
                        <div className="w-2 h-2 bg-blue-600 rounded-full -mt-2" />
                      </div>
                    )}
                  </div>
                  {isErrorState && step.isActive && (
                    <p className="text-xs md:text-sm text-red-600">
                      This order has been {step.label.toLowerCase()}
                    </p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
