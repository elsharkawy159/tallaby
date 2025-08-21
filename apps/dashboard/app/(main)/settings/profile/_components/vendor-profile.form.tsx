"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { Textarea } from "@workspace/ui/components/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Badge } from "@workspace/ui/components/badge";
import { Separator } from "@workspace/ui/components/separator";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@workspace/ui/components/avatar";
import { Camera, Save, Loader2, Building2, Star, Wallet } from "lucide-react";
import {
  vendorProfileSchema,
  type VendorProfileData,
} from "@/lib/validations/vendor-schemas";
import { updateVendorProfile } from "@/actions/vendor";
import type { VendorProfile } from "@/actions/vendor";

interface VendorProfileFormProps {
  profile: VendorProfile;
}

export function VendorProfileForm({ profile }: VendorProfileFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const form = useForm<VendorProfileData>({
    resolver: zodResolver(vendorProfileSchema),
    defaultValues: {
      businessName: profile.businessName || "",
      displayName: profile.displayName || "",
      description: profile.description || "",
      businessType: profile.businessType || "",
      registrationNumber: profile.registrationNumber || "",
      supportEmail: profile.supportEmail || "",
      supportPhone: profile.supportPhone || "",
      returnPolicy: profile.returnPolicy || "",
      shippingPolicy: profile.shippingPolicy || "",
      legalAddress: profile.legalAddress || {
        street: "",
        city: "",
        state: "",
        postalCode: "",
        country: "",
      },
    },
  });

  const handleLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = async (data: VendorProfileData) => {
    setIsLoading(true);
    try {
      const result = await updateVendorProfile(profile.id, data);

      if (result.success) {
        toast.success(result.message);
        // Reset form dirty state
        form.reset(data);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("An error occurred while updating your profile");
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatCurrency = (amount: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(parseFloat(amount));
  };

  return (
    <div className="space-y-6">
      {/* Profile Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Profile Overview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Avatar className="h-20 w-20">
                <AvatarImage
                  src={logoPreview || profile.logoUrl || undefined}
                  alt={profile.businessName}
                />
                <AvatarFallback className="text-lg bg-blue-100 text-blue-600">
                  <Building2 className="h-8 w-8" />
                </AvatarFallback>
              </Avatar>
              <label
                htmlFor="logo-upload"
                className="absolute -bottom-2 -right-2 bg-blue-600 text-white rounded-full p-2 cursor-pointer hover:bg-blue-700 transition-colors"
              >
                <Camera className="h-4 w-4" />
                <input
                  id="logo-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleLogoChange}
                  className="hidden"
                />
              </label>
            </div>

            <div className="flex-1">
              <h3 className="text-xl font-semibold text-gray-900">
                {profile.businessName}
              </h3>
              <p className="text-gray-600">{profile.displayName}</p>
              <div className="flex items-center space-x-4 mt-2">
                <Badge variant={profile.isVerified ? "default" : "secondary"}>
                  {profile.isVerified ? "Verified" : "Pending Verification"}
                </Badge>
                <Badge variant="outline">{profile.status}</Badge>
              </div>
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg mx-auto mb-2">
                <Star className="h-6 w-6 text-blue-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {profile.storeRating ? profile.storeRating.toFixed(1) : "N/A"}
              </p>
              <p className="text-sm text-gray-600">Store Rating</p>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg mx-auto mb-2">
                <Building2 className="h-6 w-6 text-green-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {profile.productCount}
              </p>
              <p className="text-sm text-gray-600">Products</p>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-lg mx-auto mb-2">
                <Wallet className="h-6 w-6 text-purple-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(profile.walletBalance)}
              </p>
              <p className="text-sm text-gray-600">Wallet Balance</p>
            </div>
          </div>

          <div className="text-sm text-gray-600">
            <p>Member since {formatDate(profile.joinDate || "")}</p>
            <p>Commission rate: {profile.commissionRate}%</p>
          </div>
        </CardContent>
      </Card>

      {/* Business Information Form */}
      <Card>
        <CardHeader>
          <CardTitle>Business Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="businessName">Business Name *</Label>
                <Input
                  id="businessName"
                  {...form.register("businessName")}
                  placeholder="Enter your business name"
                />
                {form.formState.errors.businessName && (
                  <p className="text-sm text-red-600">
                    {form.formState.errors.businessName.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="displayName">Display Name *</Label>
                <Input
                  id="displayName"
                  {...form.register("displayName")}
                  placeholder="Enter your display name"
                />
                {form.formState.errors.displayName && (
                  <p className="text-sm text-red-600">
                    {form.formState.errors.displayName.message}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Business Description</Label>
              <Textarea
                id="description"
                {...form.register("description")}
                placeholder="Describe your business and what you offer"
                rows={3}
              />
              {form.formState.errors.description && (
                <p className="text-sm text-red-600">
                  {form.formState.errors.description.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="businessType">Business Type *</Label>
                <Input
                  id="businessType"
                  {...form.register("businessType")}
                  placeholder="e.g., LLC, Corporation, Sole Proprietorship"
                />
                {form.formState.errors.businessType && (
                  <p className="text-sm text-red-600">
                    {form.formState.errors.businessType.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="registrationNumber">Registration Number</Label>
                <Input
                  id="registrationNumber"
                  {...form.register("registrationNumber")}
                  placeholder="Business registration number"
                />
                {form.formState.errors.registrationNumber && (
                  <p className="text-sm text-red-600">
                    {form.formState.errors.registrationNumber.message}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="supportEmail">Support Email *</Label>
                <Input
                  id="supportEmail"
                  {...form.register("supportEmail")}
                  type="email"
                  placeholder="support@yourbusiness.com"
                />
                {form.formState.errors.supportEmail && (
                  <p className="text-sm text-red-600">
                    {form.formState.errors.supportEmail.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="supportPhone">Support Phone</Label>
                <Input
                  id="supportPhone"
                  {...form.register("supportPhone")}
                  placeholder="+1 (555) 123-4567"
                />
                {form.formState.errors.supportPhone && (
                  <p className="text-sm text-red-600">
                    {form.formState.errors.supportPhone.message}
                  </p>
                )}
              </div>
            </div>

            {/* Legal Address */}
            <div className="space-y-4">
              <Label>Legal Address *</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Input
                    {...form.register("legalAddress.street")}
                    placeholder="Street Address"
                  />
                  {form.formState.errors.legalAddress?.street && (
                    <p className="text-sm text-red-600">
                      {form.formState.errors.legalAddress.street.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Input
                    {...form.register("legalAddress.city")}
                    placeholder="City"
                  />
                  {form.formState.errors.legalAddress?.city && (
                    <p className="text-sm text-red-600">
                      {form.formState.errors.legalAddress.city.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Input
                    {...form.register("legalAddress.state")}
                    placeholder="State/Province"
                  />
                  {form.formState.errors.legalAddress?.state && (
                    <p className="text-sm text-red-600">
                      {form.formState.errors.legalAddress.state.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Input
                    {...form.register("legalAddress.postalCode")}
                    placeholder="Postal Code"
                  />
                  {form.formState.errors.legalAddress?.postalCode && (
                    <p className="text-sm text-red-600">
                      {form.formState.errors.legalAddress.postalCode.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Input
                    {...form.register("legalAddress.country")}
                    placeholder="Country"
                  />
                  {form.formState.errors.legalAddress?.country && (
                    <p className="text-sm text-red-600">
                      {form.formState.errors.legalAddress.country.message}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="returnPolicy">Return Policy</Label>
                <Textarea
                  id="returnPolicy"
                  {...form.register("returnPolicy")}
                  placeholder="Describe your return policy"
                  rows={3}
                />
                {form.formState.errors.returnPolicy && (
                  <p className="text-sm text-red-600">
                    {form.formState.errors.returnPolicy.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="shippingPolicy">Shipping Policy</Label>
                <Textarea
                  id="shippingPolicy"
                  {...form.register("shippingPolicy")}
                  placeholder="Describe your shipping policy"
                  rows={3}
                />
                {form.formState.errors.shippingPolicy && (
                  <p className="text-sm text-red-600">
                    {form.formState.errors.shippingPolicy.message}
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={isLoading || !form.formState.isDirty}
                className="min-w-[120px]"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
