"use client";

import * as React from "react";
import { useForm, FormProvider, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@workspace/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import {
  Loader2,
  Save,
  X,
  AlertCircle,
  CheckCircle,
  Info,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { cn } from "@workspace/ui/lib/utils";
import { Alert, AlertDescription } from "@workspace/ui/components/alert";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@workspace/ui/components/collapsible";

interface FormWrapperProps<T extends z.ZodType> {
  schema: T;
  defaultValues?: Partial<z.infer<T>>;
  onSubmit: SubmitHandler<z.infer<T>>;
  onCancel?: () => void;
  title?: string;
  description?: string;
  submitText?: string;
  cancelText?: string;
  isLoading?: boolean;
  className?: string;
  children: React.ReactNode;
  showCard?: boolean;
  submitButtonProps?: React.ComponentProps<typeof Button>;
  cancelButtonProps?: React.ComponentProps<typeof Button>;
  showResetButton?: boolean;
  resetText?: string;
  onReset?: () => void;
  showFormState?: boolean;
  showValidationErrors?: boolean;
  autoSave?: boolean;
  autoSaveInterval?: number;
  onAutoSave?: (data: z.infer<T>) => void;
  layout?: "vertical" | "horizontal" | "grid";
  gridCols?: 1 | 2 | 3 | 4;
  spacing?: "sm" | "md" | "lg";
  showProgress?: boolean;
  progressSteps?: string[];
  currentStep?: number;
  onStepChange?: (step: number) => void;
  error?: string;
  success?: string;
  warning?: string;
  info?: string;
}

export function FormWrapper<T extends z.ZodType>({
  schema,
  defaultValues,
  onSubmit,
  onCancel,
  title,
  description,
  submitText = "Save",
  cancelText = "Cancel",
  isLoading = false,
  className,
  children,
  showCard = true,
  submitButtonProps,
  cancelButtonProps,
  showResetButton = false,
  resetText = "Reset",
  onReset,
  showFormState = false,
  showValidationErrors = true,
  autoSave = false,
  autoSaveInterval = 30000, // 30 seconds
  onAutoSave,
  layout = "vertical",
  gridCols = 2,
  spacing = "md",
  showProgress = false,
  progressSteps = [],
  currentStep = 1,
  onStepChange,
  error,
  success,
  warning,
  info,
}: FormWrapperProps<T>) {
  const methods = useForm<z.infer<T>>({
    resolver: zodResolver(schema),
    defaultValues: defaultValues as z.infer<T>,
    mode: "onChange",
  });

  const {
    handleSubmit,
    formState: { errors, isSubmitting, isDirty, isValid, dirtyFields },
    reset,
    watch,
  } = methods;

  // Auto-save functionality
  React.useEffect(() => {
    if (!autoSave || !onAutoSave) return;

    const subscription = watch((data) => {
      if (isDirty && isValid) {
        const timeoutId = setTimeout(() => {
          onAutoSave(data as z.infer<T>);
        }, autoSaveInterval);

        return () => clearTimeout(timeoutId);
      }
    });

    return () => subscription.unsubscribe();
  }, [watch, isDirty, isValid, autoSave, onAutoSave, autoSaveInterval]);

  const handleFormSubmit = async (data: z.infer<T>) => {
    try {
      await onSubmit(data);
      // Optionally reset form after successful submission
      // reset();
    } catch (error) {
      console.error("Form submission error:", error);
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      reset();
    }
  };

  const handleReset = () => {
    reset();
    onReset?.();
  };

  const getStatusIcon = () => {
    if (error) return <AlertCircle className="h-4 w-4 text-red-500" />;
    if (success) return <CheckCircle className="h-4 w-4 text-green-500" />;
    if (warning) return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    if (info) return <Info className="h-4 w-4 text-blue-500" />;
    return null;
  };

  const getStatusMessage = () => {
    if (error) return error;
    if (success) return success;
    if (warning) return warning;
    if (info) return info;
    return null;
  };

  const getStatusVariant = () => {
    if (error) return "destructive";
    if (success) return "default";
    if (warning) return "default";
    if (info) return "default";
    return "default";
  };

  const formContent = (
    <FormProvider {...methods}>
      <form
        onSubmit={handleSubmit(handleFormSubmit)}
        className={cn(
          "space-y-6",
          layout === "horizontal" && "grid grid-cols-1 md:grid-cols-2 gap-6",
          layout === "grid" &&
            `grid grid-cols-1 md:grid-cols-${gridCols} gap-${spacing}`,
          className
        )}
      >
        {/* Progress Steps */}
        {showProgress && progressSteps.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">
                Step {currentStep} of {progressSteps.length}
              </h3>
              <div className="flex gap-2">
                {progressSteps.map((step, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => onStepChange?.(index + 1)}
                    disabled={index + 1 > currentStep}
                    className={cn(
                      "px-3 py-1 text-sm rounded",
                      index + 1 === currentStep
                        ? "bg-primary text-primary-foreground"
                        : index + 1 < currentStep
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-500"
                    )}
                  >
                    {index + 1}
                  </button>
                ))}
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${(currentStep / progressSteps.length) * 100}%`,
                }}
              />
            </div>
          </div>
        )}

        {/* Status Messages */}
        {getStatusMessage() && (
          <Alert variant={getStatusVariant()}>
            {getStatusIcon()}
            <AlertDescription>{getStatusMessage()}</AlertDescription>
          </Alert>
        )}

        {/* Form State Display */}
        {showFormState && (
          <Collapsible>
            <CollapsibleTrigger asChild>
              <Button variant="outline" size="sm" className="w-full">
                <Info className="h-4 w-4 mr-2" />
                Form State
                <ChevronDown className="h-4 w-4 ml-auto" />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-2 p-4 bg-gray-50 rounded-md">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Is Dirty:</span>{" "}
                  {isDirty ? "Yes" : "No"}
                </div>
                <div>
                  <span className="font-medium">Is Valid:</span>{" "}
                  {isValid ? "Yes" : "No"}
                </div>
                <div>
                  <span className="font-medium">Is Submitting:</span>{" "}
                  {isSubmitting ? "Yes" : "No"}
                </div>
                <div>
                  <span className="font-medium">Error Count:</span>{" "}
                  {Object.keys(errors).length}
                </div>
              </div>
              {Object.keys(dirtyFields).length > 0 && (
                <div>
                  <span className="font-medium text-sm">Dirty Fields:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {Object.keys(dirtyFields).map((field) => (
                      <span
                        key={field}
                        className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded"
                      >
                        {field}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </CollapsibleContent>
          </Collapsible>
        )}

        {children}

        <div className="flex justify-end gap-3">
          {showResetButton && (
            <Button
              type="button"
              variant="outline"
              onClick={handleReset}
              disabled={isSubmitting || isLoading}
            >
              <X className="h-4 w-4 mr-2" />
              {resetText}
            </Button>
          )}
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isSubmitting || isLoading}
              {...cancelButtonProps}
            >
              <X className="h-4 w-4 mr-2" />
              {cancelText}
            </Button>
          )}
          <Button
            type="submit"
            disabled={isSubmitting || isLoading || !isValid}
            {...submitButtonProps}
          >
            {(isSubmitting || isLoading) && (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            )}
            <Save className="h-4 w-4 mr-2" />
            {submitText}
          </Button>
        </div>
      </form>
    </FormProvider>
  );

  if (showCard) {
    return (
      <Card>
        {(title || description) && (
          <CardHeader>
            {title && <CardTitle>{title}</CardTitle>}
            {description && <CardDescription>{description}</CardDescription>}
          </CardHeader>
        )}
        <CardContent>{formContent}</CardContent>
      </Card>
    );
  }

  return formContent;
}

// Helper hook for form validation
export function useFormValidation<T extends z.ZodType>(schema: T) {
  return useForm<z.infer<T>>({
    resolver: zodResolver(schema),
    mode: "onChange",
  });
}

// Helper component for form sections
interface FormSectionProps {
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  collapsible?: boolean;
  defaultOpen?: boolean;
  icon?: React.ReactNode;
}

export function FormSection({
  title,
  description,
  children,
  className,
  collapsible = false,
  defaultOpen = true,
  icon,
}: FormSectionProps) {
  const [isOpen, setIsOpen] = React.useState(defaultOpen);

  if (collapsible) {
    return (
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <div className={cn("space-y-4", className)}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-start p-0 h-auto">
              <div className="flex items-center gap-2">
                {icon}
                <div className="text-left">
                  {title && <h3 className="text-lg font-medium">{title}</h3>}
                  {description && (
                    <p className="text-sm text-gray-500">{description}</p>
                  )}
                </div>
                {isOpen ? (
                  <ChevronDown className="h-4 w-4 ml-auto" />
                ) : (
                  <ChevronRight className="h-4 w-4 ml-auto" />
                )}
              </div>
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-4 pl-6">
            {children}
          </CollapsibleContent>
        </div>
      </Collapsible>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {(title || description) && (
        <div className="space-y-2">
          {title && (
            <div className="flex items-center gap-2">
              {icon}
              <h3 className="text-lg font-medium">{title}</h3>
            </div>
          )}
          {description && (
            <p className="text-sm text-gray-500">{description}</p>
          )}
        </div>
      )}
      <div className="space-y-4">{children}</div>
    </div>
  );
}

// Helper component for form grid layout
interface FormGridProps {
  children: React.ReactNode;
  cols?: 1 | 2 | 3 | 4;
  gap?: "sm" | "md" | "lg";
  className?: string;
  responsive?: boolean;
}

export function FormGrid({
  children,
  cols = 2,
  gap = "md",
  className,
  responsive = true,
}: FormGridProps) {
  const gridCols = {
    1: "grid-cols-1",
    2: responsive ? "grid-cols-1 md:grid-cols-2" : "grid-cols-2",
    3: responsive ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" : "grid-cols-3",
    4: responsive ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-4" : "grid-cols-4",
  };

  const gridGap = {
    sm: "gap-3",
    md: "gap-4",
    lg: "gap-6",
  };

  return (
    <div className={cn("grid", gridCols[cols], gridGap[gap], className)}>
      {children}
    </div>
  );
}

// Helper component for form field groups
interface FormFieldGroupProps {
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  required?: boolean;
  error?: string;
}

export function FormFieldGroup({
  title,
  description,
  children,
  className,
  required = false,
  error,
}: FormFieldGroupProps) {
  return (
    <div className={cn("space-y-3", className)}>
      {(title || description) && (
        <div className="space-y-1">
          {title && (
            <h4 className="text-sm font-medium">
              {title}
              {required && <span className="text-red-500 ml-1">*</span>}
            </h4>
          )}
          {description && (
            <p className="text-xs text-gray-500">{description}</p>
          )}
        </div>
      )}
      <div className="space-y-3">{children}</div>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

// Helper component for form actions
interface FormActionsProps {
  children: React.ReactNode;
  className?: string;
  align?: "left" | "center" | "right";
}

export function FormActions({
  children,
  className,
  align = "right",
}: FormActionsProps) {
  const alignClasses = {
    left: "justify-start",
    center: "justify-center",
    right: "justify-end",
  };

  return (
    <div className={cn("flex gap-3", alignClasses[align], className)}>
      {children}
    </div>
  );
}
