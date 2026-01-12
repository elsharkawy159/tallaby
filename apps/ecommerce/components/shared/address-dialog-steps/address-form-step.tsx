"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

import { Button } from "@workspace/ui/components/button";
import { Form } from "@workspace/ui/components/form";
import { Card, CardContent } from "@workspace/ui/components/card";
import { Separator } from "@workspace/ui/components/separator";

import { TextInput } from "@workspace/ui/components/inputs/text-input";
import { TextareaInput } from "@workspace/ui/components/inputs/textarea-input";
import { SwitchInput } from "@workspace/ui/components/inputs/switch-input";

import {
  addressSchema,
  addressDefaults,
  type AddressData,
} from "../../address/address.schema";
import { addAddress, updateAddress } from "@/actions/customer";

interface AddressFormStepProps {
  address?: AddressData | null;
  selectedLocation?: {
    latitude: number;
    longitude: number;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    area?: string;
    street?: string;
    building?: string;
    postalCode?: string;
  } | null;
  onSuccess?: (address: AddressData) => void;
  onCancel?: () => void;
}

export const AddressFormStep = ({
  address,
  selectedLocation,
  onSuccess,
  onCancel,
}: AddressFormStepProps) => {
  const t = useTranslations("addresses");
  const [isPending, startTransition] = useTransition();

  const form = useForm<AddressData>({
    resolver: zodResolver(addressSchema) as any,
    defaultValues: {
      ...addressDefaults,
      ...address,
      // Pre-fill with selected location data
      ...(selectedLocation && {
        latitude: selectedLocation.latitude,
        longitude: selectedLocation.longitude,
        addressLine1:
          selectedLocation.address ||
          [
            selectedLocation.building,
            selectedLocation.street,
            selectedLocation.area,
          ]
            .filter(Boolean)
            .join(", ") ||
          address?.addressLine1 ||
          "",
        city: selectedLocation.city || address?.city || "",
        state: selectedLocation.state || address?.state || "",
        country: selectedLocation.country || address?.country || "Egypt",
        postalCode: selectedLocation.postalCode || address?.postalCode || "",
      }),
    },
  });

  const handleSubmit = (data: AddressData) => {
    startTransition(async () => {
      try {
        const isEditing = !!data.id;
        const result = isEditing
          ? await updateAddress(data.id!, data)
          : await addAddress(data);

        if (result.success) {
          form.reset();
          onSuccess?.(result.data as AddressData);
        } else {
          toast.error(result.error || t("failedToSaveAddress"));

          // Set server-side field errors if available
          if (result && typeof result === "object" && "error" in result) {
            const error = (result as any).error;
            if (error && typeof error === "object") {
              Object.entries(error).forEach(([field, messages]) => {
                form.setError(field as keyof AddressData, {
                  type: "server",
                  message: Array.isArray(messages)
                    ? (messages[0] as string)
                    : String(messages),
                });
              });
            }
          }
        }
      } catch (error) {
        console.error("Form submission error:", error);
        toast.error(t("failedToSaveAddress"));
      }
    });
  };

  return (
    <Card className="pb-0 pt-5">
      <CardContent className="px-0">
        <Form {...form}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            className="space-y-4"
          >
            <div className="space-y-3 px-6">
              <h3 className="font-semibold text-sm">{t("personalInformation")}</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <TextInput
                  form={form as any}
                  name="fullName"
                  label={t("fullName")}
                  placeholder={t("enterFullName")}
                  required
                />

                <TextInput
                  form={form as any}
                  name="phone"
                  label={t("phoneNumber")}
                  placeholder={t("enterPhoneNumber")}
                  type="tel"
                  required
                />
              </div>
            </div>

            <Separator />

            <div className="space-y-3 px-6">
              <h3 className="font-semibold text-sm">{t("addressInformation")}</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <TextInput
                  form={form as any}
                  name="addressLine1"
                  label={t("addressLine1")}
                  placeholder={t("addressLine1Placeholder")}
                  required
                />

                <TextInput
                  form={form as any}
                  name="addressLine2"
                  label={t("buildingFloorOptional")}
                  placeholder={t("buildingFloorPlaceholder")}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <TextInput
                  form={form as any}
                  name="city"
                  label={t("city")}
                  placeholder={t("enterCity")}
                  required
                />

                <TextInput
                  form={form as any}
                  name="state"
                  label={t("stateProvince")}
                  placeholder={t("enterStateProvince")}
                  required
                />

                <TextInput
                  form={form as any}
                  name="postalCode"
                  label={t("postalCode")}
                  placeholder={t("enterPostalCode")}
                  required
                />
              </div>
            </div>

            <Separator />

            <div className="space-y-3 px-6">
              <SwitchInput
                name="isBusinessAddress"
                label={t("isBusinessAddress")}
                labelPosition="right"
                className="space-y-0"
              />

              {form.watch("isBusinessAddress") && (
                <TextInput
                  form={form as any}
                  name="company"
                  label={t("companyName")}
                  placeholder={t("enterCompanyName")}
                  required
                />
              )}
            </div>

            <Separator />

            <div className="space-y-3 px-6">
              <TextareaInput
                form={form as any}
                name="deliveryInstructions"
                label={t("specialInstructions")}
                placeholder={t("specialInstructionsPlaceholder")}
                showCharacterCount={true}
              />
            </div>

            <div className="px-6 py-3 border-t bg-white">
              <div className="gap-3 flex">
                {onCancel && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onCancel}
                    disabled={isPending}
                    className="flex-1"
                  >
                    {t("cancel")}
                  </Button>
                )}

                <Button
                  type="button"
                  onClick={() => {
                    form.handleSubmit(handleSubmit as any)();
                  }}
                  disabled={isPending}
                  className="flex-1"
                >
                  {isPending
                    ? address?.id
                      ? t("updating")
                      : t("creating")
                    : address?.id
                      ? t("updateAddress")
                      : t("saveAddress")}
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};
