"use client";

import React, { useRef, useState } from "react";
import { Upload, X, FileImage } from "lucide-react";
import { cn } from "../../lib/utils";
import { Input } from "../input";
import { Button } from "../button";

export interface FileInputProps {
  value?: File | null;
  onChange?: (file: File | null) => void;
  accept?: string;
  maxSize?: number; // in bytes
  className?: string;
  disabled?: boolean;
  placeholder?: string;
  label?: string;
  error?: string;
  showPreview?: boolean;
  previewClassName?: string;
}

export function FileInput({
  value,
  onChange,
  accept = "image/*",
  maxSize = 5 * 1024 * 1024, // 5MB default
  className,
  disabled = false,
  placeholder = "Choose file or drag and drop",
  label,
  error,
  showPreview = true,
  previewClassName,
}: FileInputProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Handle file selection
  const handleFileSelect = (file: File) => {
    if (file.size > maxSize) {
      alert(
        `File size must be less than ${Math.round(maxSize / 1024 / 1024)}MB`
      );
      return;
    }

    if (
      accept &&
      !accept.split(",").some((type) => {
        if (type.includes("/*")) {
          return file.type.startsWith(type.split("/")[0] || "");
        }
        return file.type === type;
      })
    ) {
      alert(`File type not supported. Accepted types: ${accept}`);
      return;
    }

    onChange?.(file);

    // Create preview URL
    if (showPreview) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  // Handle drag events
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (disabled) return;

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFileSelect(files[0]);
    }
  };

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      handleFileSelect(files[0]);
    }
  };

  // Clear file
  const clearFile = () => {
    onChange?.(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Get current value for display
  const getCurrentValue = () => {
    if (value instanceof File) {
      return value.name;
    }
    return null;
  };

  const currentValue = getCurrentValue();

  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </label>
      )}

      <div className="space-y-4">
        {/* File Upload Area */}
        <div
          className={cn(
            "relative border-2 border-dashed rounded-lg p-6 transition-colors",
            dragActive
              ? "border-primary bg-primary/5"
              : "border-gray-300 dark:border-gray-600",
            disabled && "opacity-50 cursor-not-allowed",
            error && "border-red-500"
          )}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            onChange={handleInputChange}
            disabled={disabled}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />

          <div className="text-center">
            <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {placeholder}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
              Max size: {Math.round(maxSize / 1024 / 1024)}MB
            </p>
          </div>
        </div>

        {/* Current File Display */}
        {currentValue && (
          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="flex items-center space-x-2">
              <FileImage className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-700 dark:text-gray-300 truncate">
                {currentValue}
              </span>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={clearFile}
              disabled={disabled}
              className="h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Preview */}
        {showPreview && previewUrl && (
          <div className={cn("space-y-2", previewClassName)}>
            <label className="text-xs text-gray-500 dark:text-gray-400">
              Preview:
            </label>
            <div className="relative inline-block">
              <img
                src={previewUrl}
                alt="Preview"
                className="max-w-full max-h-48 rounded-lg border"
                onError={() => setPreviewUrl(null)}
              />
            </div>
          </div>
        )}

        {error && (
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        )}
      </div>
    </div>
  );
}
