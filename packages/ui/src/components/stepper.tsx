"use client";

import * as React from "react";
import { Check, ChevronRight } from "lucide-react";
import { cn } from "../lib/utils";

export interface StepperStep {
  id: string;
  title: string;
  description?: string;
  icon?: React.ReactNode;
  status?: "pending" | "current" | "completed" | "error";
}

export interface StepperProps {
  steps: StepperStep[];
  currentStep: number;
  onStepClick?: (stepIndex: number) => void;
  variant?: "default" | "vertical" | "minimal";
  size?: "sm" | "md" | "lg";
  className?: string;
  showStepNumbers?: boolean;
  showStepDescriptions?: boolean;
  allowStepClick?: boolean;
}

export const Stepper = React.forwardRef<HTMLDivElement, StepperProps>(
  (
    {
      steps,
      currentStep,
      onStepClick,
      variant = "default",
      size = "md",
      className,
      showStepNumbers = true,
      showStepDescriptions = true,
      allowStepClick = true,
    },
    ref
  ) => {
    const getStepStatus = (stepIndex: number): StepperStep["status"] => {
      if (stepIndex < currentStep) return "completed";
      if (stepIndex === currentStep) return "current";
      return "pending";
    };

    const handleStepClick = (stepIndex: number) => {
      if (allowStepClick && onStepClick) {
        onStepClick(stepIndex);
      }
    };

    if (variant === "vertical") {
      return (
        <div ref={ref} className={cn("flex flex-col space-y-4", className)}>
          {steps.map((step, index) => {
            const status = getStepStatus(index);
            const isClickable = allowStepClick && onStepClick;

            return (
              <div
                key={step.id}
                className={cn(
                  "flex items-start space-x-4",
                  isClickable && "cursor-pointer",
                  isClickable && "hover:opacity-80 transition-opacity"
                )}
                onClick={() => handleStepClick(index)}
              >
                {/* Step indicator */}
                <div className="flex-shrink-0">
                  <div
                    className={cn(
                      "flex items-center justify-center rounded-full border-2 transition-all duration-200",
                      size === "sm" && "h-8 w-8",
                      size === "md" && "h-10 w-10",
                      size === "lg" && "h-12 w-12",
                      status === "completed" &&
                        "border-green-500 bg-green-500 text-white",
                      status === "current" &&
                        "border-blue-500 bg-blue-500 text-white",
                      status === "pending" &&
                        "border-gray-300 bg-white text-gray-400",
                      status === "error" &&
                        "border-red-500 bg-red-500 text-white"
                    )}
                  >
                    {status === "completed" ? (
                      <Check
                        className={cn(
                          size === "sm" && "h-4 w-4",
                          size === "md" && "h-5 w-5",
                          size === "lg" && "h-6 w-6"
                        )}
                      />
                    ) : showStepNumbers ? (
                      <span
                        className={cn(
                          "font-medium",
                          size === "sm" && "text-sm",
                          size === "md" && "text-base",
                          size === "lg" && "text-lg"
                        )}
                      >
                        {index + 1}
                      </span>
                    ) : (
                      step.icon
                    )}
                  </div>
                </div>

                {/* Step content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <h3
                      className={cn(
                        "font-medium transition-colors duration-200",
                        size === "sm" && "text-sm",
                        size === "md" && "text-base",
                        size === "lg" && "text-lg",
                        status === "completed" && "text-green-600",
                        status === "current" && "text-blue-600",
                        status === "pending" && "text-gray-500",
                        status === "error" && "text-red-600"
                      )}
                    >
                      {step.title}
                    </h3>
                  </div>
                  {showStepDescriptions && step.description && (
                    <p
                      className={cn(
                        "mt-1 text-xs transition-colors duration-200",
                        status === "completed" && "text-green-600",
                        status === "current" && "text-blue-600",
                        status === "pending" && "text-gray-500",
                        status === "error" && "text-red-600"
                      )}
                    >
                      {step.description}
                    </p>
                  )}
                </div>

                {/* Connector line */}
                {index < steps.length - 1 && (
                  <div
                    className={cn(
                      "absolute left-5 top-10 w-0.5 transition-colors duration-200",
                      size === "sm" && "top-8",
                      size === "md" && "top-10",
                      size === "lg" && "top-12",
                      status === "completed" ? "bg-green-500" : "bg-gray-300"
                    )}
                    style={{ height: "calc(100% + 1rem)" }}
                  />
                )}
              </div>
            );
          })}
        </div>
      );
    }

    if (variant === "minimal") {
      return (
        <div ref={ref} className={cn("flex items-center space-x-2", className)}>
          {steps.map((step, index) => {
            const status = getStepStatus(index);
            const isClickable = allowStepClick && onStepClick;

            return (
              <React.Fragment key={step.id}>
                {/* Step indicator */}
                <div
                  className={cn(
                    "flex items-center justify-center rounded-full transition-all duration-200",
                    size === "sm" && "h-6 w-6",
                    size === "md" && "h-8 w-8",
                    size === "lg" && "h-10 w-10",
                    status === "completed" && "bg-green-500 text-white",
                    status === "current" && "bg-blue-500 text-white",
                    status === "pending" && "bg-gray-200 text-gray-400",
                    status === "error" && "bg-red-500 text-white",
                    isClickable && "cursor-pointer hover:opacity-80"
                  )}
                  onClick={() => handleStepClick(index)}
                >
                  {status === "completed" ? (
                    <Check
                      className={cn(
                        size === "sm" && "h-3 w-3",
                        size === "md" && "h-4 w-4",
                        size === "lg" && "h-5 w-5"
                      )}
                    />
                  ) : (
                    <span
                      className={cn(
                        "font-medium",
                        size === "sm" && "text-xs",
                        size === "md" && "text-sm",
                        size === "lg" && "text-base"
                      )}
                    >
                      {index + 1}
                    </span>
                  )}
                </div>

                {/* Connector */}
                {index < steps.length - 1 && (
                  <ChevronRight
                    className={cn(
                      "text-gray-300",
                      size === "sm" && "h-4 w-4",
                      size === "md" && "h-5 w-5",
                      size === "lg" && "h-6 w-6"
                    )}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      );
    }

    // Default horizontal stepper
    return (
      <div ref={ref} className={cn("w-full", className)}>
        <div className="flex justify-between">
          {steps.map((step, index) => {
            const status = getStepStatus(index);
            const isClickable = allowStepClick && onStepClick;

            return (
              <div key={step.id} className="flex flex-col items-center flex-1">
                {/* Step indicator */}
                <div
                  className={cn(
                    "flex items-center justify-center rounded-full border-2 transition-all duration-200",
                    size === "sm" && "h-8 w-8",
                    size === "md" && "h-10 w-10",
                    size === "lg" && "h-12 w-12",
                    status === "completed" &&
                      "border-green-500 bg-green-500 text-white",
                    status === "current" &&
                      "border-blue-500 bg-blue-500 text-white",
                    status === "pending" &&
                      "border-gray-300 bg-white text-gray-400",
                    status === "error" &&
                      "border-red-500 bg-red-500 text-white",
                    isClickable && "cursor-pointer hover:opacity-80"
                  )}
                  onClick={() => handleStepClick(index)}
                >
                  {status === "completed" ? (
                    <Check
                      className={cn(
                        size === "sm" && "h-4 w-4",
                        size === "md" && "h-5 w-5",
                        size === "lg" && "h-6 w-6"
                      )}
                    />
                  ) : showStepNumbers ? (
                    <span
                      className={cn(
                        "font-medium",
                        size === "sm" && "text-sm",
                        size === "md" && "text-base",
                        size === "lg" && "text-lg"
                      )}
                    >
                      {index + 1}
                    </span>
                  ) : (
                    step.icon
                  )}
                </div>

                {/* Step content */}
                <div className="mt-3 text-center">
                  <h3
                    className={cn(
                      "font-medium transition-colors duration-200",
                      size === "sm" && "text-sm",
                      size === "md" && "text-base",
                      size === "lg" && "text-lg",
                      status === "completed" && "text-green-600",
                      status === "current" && "text-blue-600",
                      status === "pending" && "text-gray-500",
                      status === "error" && "text-red-600"
                    )}
                  >
                    {step.title}
                  </h3>
                  {showStepDescriptions && step.description && (
                    <p
                      className={cn(
                        "mt-1 text-xs transition-colors duration-200",
                        status === "completed" && "text-green-600",
                        status === "current" && "text-blue-600",
                        status === "pending" && "text-gray-500",
                        status === "error" && "text-red-600"
                      )}
                    >
                      {step.description}
                    </p>
                  )}
                </div>

                {/* Connector line */}
                {index < steps.length - 1 && (
                  <div
                    className={cn(
                      "absolute top-5 h-0.5 transition-colors duration-200",
                      size === "sm" && "top-4",
                      size === "md" && "top-5",
                      size === "lg" && "top-6",
                      status === "completed" ? "bg-green-500" : "bg-gray-300"
                    )}
                    style={{
                      left: `calc(${((index + 1) / steps.length) * 100}% - 1rem)`,
                      right: `calc(${((steps.length - index - 1) / steps.length) * 100}% - 1rem)`,
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }
);

Stepper.displayName = "Stepper";

// Progress stepper variant
export interface ProgressStepperProps {
  steps: StepperStep[];
  currentStep: number;
  className?: string;
  showProgress?: boolean;
  showStepLabels?: boolean;
}

export const ProgressStepper = React.forwardRef<
  HTMLDivElement,
  ProgressStepperProps
>(
  (
    {
      steps,
      currentStep,
      className,
      showProgress = true,
      showStepLabels = true,
    },
    ref
  ) => {
    const progress = ((currentStep + 1) / steps.length) * 100;

    return (
      <div ref={ref} className={cn("w-full space-y-4", className)}>
        {/* Progress bar */}
        {showProgress && (
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}

        {/* Step labels */}
        {showStepLabels && (
          <div className="flex justify-between text-sm text-gray-600">
            <span>
              Step {currentStep + 1} of {steps.length}
            </span>
            <span>{Math.round(progress)}% complete</span>
          </div>
        )}

        {/* Current step info */}
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900">
            {steps[currentStep]?.title}
          </h3>
          {steps[currentStep]?.description && (
            <p className="mt-1 text-sm text-gray-600">
              {steps[currentStep].description}
            </p>
          )}
        </div>
      </div>
    );
  }
);

ProgressStepper.displayName = "ProgressStepper";
