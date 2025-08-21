"use client";

import * as React from "react";
import { cn } from "@workspace/ui/lib/utils";
import { Label } from "@workspace/ui/components/label";
import { AlertCircle, CheckCircle, Info } from "lucide-react";

export interface BaseFieldProps {
  name: string;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  error?: string;
  helpText?: string;
  warningText?: string;
  successText?: string;
  description?: string;
  showCharacterCount?: boolean;
  characterCount?: number;
  maxLength?: number;
  children: React.ReactNode;
  hidden?: boolean;
}

export const BaseField = React.forwardRef<HTMLDivElement, BaseFieldProps>(
  (
    {
      name,
      label,
      required = false,
      className,
      error,
      helpText,
      warningText,
      successText,
      description,
      showCharacterCount = false,
      characterCount = 0,
      maxLength,
      children,
      hidden = false,
      ...props
    },
    ref
  ) => {
    const getStatusIcon = () => {
      if (error) return <AlertCircle className="h-4 w-4 text-red-500" />;
      if (successText)
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      if (warningText)
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      if (helpText) return <Info className="h-4 w-4 text-blue-500" />;
      return null;
    };

    if (hidden) return null;

    return (
      <div ref={ref} className={cn("space-y-2", className)} {...props}>
        {label && (
          <div className="flex items-center justify-between">
            <Label htmlFor={name} className="text-sm font-medium">
              {label}
              {required && <span className="text-red-500 ml-0.5">*</span>}
            </Label>
            {showCharacterCount && maxLength && (
              <span
                className={cn(
                  "text-xs",
                  characterCount > maxLength ? "text-red-500" : "text-gray-500"
                )}
              >
                {characterCount}/{maxLength}
              </span>
            )}
          </div>
        )}

        {children}

        <div className="flex items-start gap-2">
          {getStatusIcon()}
          <div className="flex-1 space-y-1">
            {error && <p className="text-sm text-red-500">{error}</p>}
            {successText && (
              <p className="text-sm text-green-600">{successText}</p>
            )}
            {warningText && (
              <p className="text-sm text-yellow-600">{warningText}</p>
            )}
            {helpText && !error && !successText && !warningText && (
              <p className="text-sm text-gray-500">{helpText}</p>
            )}
            {description &&
              !error &&
              !successText &&
              !warningText &&
              !helpText && (
                <p className="text-sm text-gray-500">{description}</p>
              )}
          </div>
        </div>
      </div>
    );
  }
);

BaseField.displayName = "BaseField";
