"use client";

import { useMemo, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import Image from "next/image";

import { Button } from "@workspace/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@workspace/ui/components/form";
import { Input } from "@workspace/ui/components/input";
import { Textarea } from "@workspace/ui/components/textarea";
import { Separator } from "@workspace/ui/components/separator";
import { Label } from "@workspace/ui/components/label";
import { ImageUpload } from "@/components/inputs/image-upload";
import { getPublicUrl } from "@/lib/utils";

import type { SellerSettingsInitialData } from "./seller-settings.types";
import {
  sellerProfileSchema,
  type SellerProfileForm,
} from "./seller-settings.schema";
import {
  handleUpdateSellerProfile,
  handleUploadDocument,
} from "./seller-settings.server";

interface SellerSettingsFormProps {
  initialData: SellerSettingsInitialData;
}

export function SellerSettingsForm({ initialData }: SellerSettingsFormProps) {
  const [isPending, startTransition] = useTransition();

  const defaults: SellerProfileForm = useMemo(
    () => ({
      businessName: initialData.profile.businessName ?? "",
      displayName: initialData.profile.displayName ?? "",
      description: initialData.profile.description ?? "",
      logoUrl: initialData.profile.logoUrl ?? "",
      bannerUrl: initialData.profile.bannerUrl ?? "",
      supportEmail: initialData.profile.supportEmail ?? "",
      supportPhone: initialData.profile.supportPhone ?? "",
      returnPolicy: initialData.profile.returnPolicy ?? "",
      shippingPolicy: initialData.profile.shippingPolicy ?? "",
    }),
    [initialData.profile]
  );

  const form = useForm<SellerProfileForm>({
    resolver: zodResolver(sellerProfileSchema),
    defaultValues: defaults,
    mode: "onChange",
  });

  const handleSubmit = (values: SellerProfileForm) => {
    startTransition(async () => {
      const res = await handleUpdateSellerProfile(values);
      if (res.success) {
        toast.success(res.message);
      } else {
        toast.error(res.message);
        if ((res as any).errors) {
          const errors = (res as any).errors as Record<string, string[]>;
          Object.entries(errors).forEach(([field, messages]) => {
            form.setError(field as any, {
              type: "server",
              message: messages[0],
            });
          });
        }
      }
    });
  };

  return (
    <div className="p-6">
      <Form {...form}>
        <form
          className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          onSubmit={form.handleSubmit(handleSubmit)}
        >
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                  {initialData.profile.user?.firstName?.[0] ?? "U"}
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">
                    {initialData.profile.user?.email}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {initialData.profile.user?.phone}
                  </p>
                </div>
              </div>

              <FormField
                control={form.control}
                name="displayName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Display Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Your store display name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="supportEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Support Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="support@example.com"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="supportPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Support Phone</FormLabel>
                    <FormControl>
                      <Input placeholder="+1 555 000 0000" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-3">
                <Button type="submit" disabled={isPending} className="flex-1">
                  {isPending ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Store Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="businessName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Business Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Your legal business name"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Store Description</FormLabel>
                    <FormControl>
                      <Textarea
                        rows={4}
                        placeholder="Brief description about your store"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="logoUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Logo</FormLabel>
                      <div className="space-y-2">
                        <ImageUpload
                          form={form as any}
                          value={field.value ? [field.value] : []}
                          onChange={(paths) => field.onChange(paths[0] ?? "")}
                          bucket="sellers"
                          maxImages={1}
                        />
                        {field.value ? (
                          <div className="relative w-24 h-24">
                            <Image
                              src={getPublicUrl(field.value, "sellers")}
                              alt="Logo"
                              fill
                              className="object-cover rounded"
                            />
                          </div>
                        ) : null}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="bannerUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Banner</FormLabel>
                      <div className="space-y-2">
                        <ImageUpload
                          form={form as any}
                          value={field.value ? [field.value] : []}
                          onChange={(paths) => field.onChange(paths[0] ?? "")}
                          bucket="sellers"
                          maxImages={1}
                        />
                        {field.value ? (
                          <div className="relative w-full h-32">
                            <Image
                              src={getPublicUrl(field.value, "sellers")}
                              alt="Banner"
                              fill
                              className="object-cover rounded"
                            />
                          </div>
                        ) : null}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Separator />

              <FormField
                control={form.control}
                name="returnPolicy"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Return Policy</FormLabel>
                    <FormControl>
                      <Textarea
                        rows={4}
                        placeholder="Your return policy"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="shippingPolicy"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Shipping Policy</FormLabel>
                    <FormControl>
                      <Textarea
                        rows={4}
                        placeholder="Your shipping policy"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-3">
                <Button type="submit" disabled={isPending} className="flex-1">
                  {isPending ? "Updating..." : "Update Store"}
                </Button>
              </div>
            </CardContent>
          </Card>

          <DocumentsSection initial={initialData} />
        </form>
      </Form>
    </div>
  );
}

function DocumentsSection({ initial }: { initial: SellerSettingsInitialData }) {
  const [isPending, startTransition] = useTransition();
  const upload = (payload: {
    documentType: string;
    fileUrl: string;
    expiryDate?: string | null;
  }) => {
    startTransition(async () => {
      const res = await handleUploadDocument(payload);
      if (res.success) toast.success(res.message);
      else toast.error(res.message);
    });
  };

  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle>Documents</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <Label>Upload Document</Label>
            <p className="text-sm text-muted-foreground mb-2">
              Accepted: business license, ID, tax certificate
            </p>
            <SimpleDocumentUploader
              onUploaded={(fileUrl) =>
                upload({ documentType: "general", fileUrl })
              }
            />
          </div>
          <div className="space-y-3">
            <Label>Quick actions</Label>
            <SimpleDocumentUploader
              label="Business License"
              onUploaded={(fileUrl) =>
                upload({ documentType: "business_license", fileUrl })
              }
            />
            <SimpleDocumentUploader
              label="Tax Certificate"
              onUploaded={(fileUrl) =>
                upload({ documentType: "tax_certificate", fileUrl })
              }
            />
          </div>
        </div>

        <Separator />

        <div className="space-y-3">
          <h3 className="text-lg font-semibold">Uploaded Documents</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {initial.documents.map((doc) => (
              <div key={doc.id} className="border rounded-lg p-4 space-y-2">
                <p className="text-sm font-medium">{doc.documentType}</p>
                <p className="text-xs text-muted-foreground">
                  Status: {doc.status}
                </p>
                <div className="relative w-full h-40 bg-gray-50 rounded overflow-hidden">
                  <Image
                    src={getPublicUrl(doc.fileUrl, "sellers")}
                    alt={doc.documentType}
                    fill
                    className="object-contain"
                  />
                </div>
                {doc.expiryDate ? (
                  <p className="text-xs text-muted-foreground">
                    Expires: {new Date(doc.expiryDate).toLocaleDateString()}
                  </p>
                ) : null}
              </div>
            ))}
            {initial.documents.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No documents uploaded yet.
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function SimpleDocumentUploader({
  label = "Upload",
  onUploaded,
}: {
  label?: string;
  onUploaded: (fileUrl: string) => void;
}) {
  // Reuse ImageUpload but restrict to 1 image and emit immediately on change
  const form = useForm<{ file: string }>({ defaultValues: { file: "" } });
  return (
    <div className="space-y-2">
      <Label className="text-sm">{label}</Label>
      <ImageUpload
        form={form as any}
        value={[]}
        onChange={(paths) => {
          const path = paths[0];
          if (path) onUploaded(path);
        }}
        bucket="sellers"
        maxImages={1}
      />
    </div>
  );
}
