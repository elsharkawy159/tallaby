"use client";

import React, { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Button } from "@workspace/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Badge } from "@workspace/ui/components/badge";
import { Progress } from "@workspace/ui/components/progress";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@workspace/ui/components/form";
import { TextInput } from "@workspace/ui/components/inputs/text-input";
import { SelectInput } from "@workspace/ui/components/inputs/select-input";

import { LogOut, Edit, Trash2, Building, Star } from "lucide-react";

import {
  profileFormSchema,
  addressFormSchema,
  securityFormSchema,
  addressFormDefaults,
  securityFormDefaults,
  type ProfileFormData,
  type AddressFormData,
  type SecurityFormData,
} from "./profile.dto";

import {
  updateUserProfile,
  createAddress,
  updateAddress,
  deleteAddress,
  //   updatePassword,
  createWishlist,
} from "./profile.server";

import {
  profileTabs,
  countryOptions,
  twoFactorMethodOptions,
  formatUserName,
  calculateProfileCompletion,
  languageOptions,
  getAddressTypeBadgeColor,
  getAddressTypeLabel,
  formatPhoneNumber,
  formatAddress,
} from "./profile.lib";

import type { UserAddress } from "./profile.types";
import { Input } from "@workspace/ui/components/input";
import { Switch } from "@workspace/ui/components/switch";
import { Select, SelectItem } from "@workspace/ui/components/select";
import { useAuth } from "@/providers/auth-provider";
import { useQueryClient } from "@tanstack/react-query";
import { AvatarUploader } from "@/components/shared/avatar-uploader";
import { useAddress } from "@/providers/address-provider";

export function ProfileSidebar() {
  const { user, logout, isSigningOut } = useAuth();
  const { addresses } = useAddress();
  const pathname = usePathname();
  console.log("user", user);
  const { percentage, missingFields } = calculateProfileCompletion(
    user,
    addresses as UserAddress[]
  );

  // Check if user is verified (Supabase auth user structure)
  const isVerified = user?.user_metadata?.email_verified ? true : false;

  return (
    <div className="space-y-6">
      {/* Profile Card */}
      <Card>
        <CardContent>
          <div className="flex items-center space-x-4 mb-4">
            <AvatarUploader user={user} size="xl" className="h-16 w-16" />
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <h3 className="font-semibold">{formatUserName(user)}</h3>
                {isVerified && (
                  <span title="Verified">
                    {/* Blue star icon for verified */}
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 text-blue-500"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M10 2.5l2.39 4.84 5.34.78-3.87 3.77.91 5.32L10 14.27l-4.77 2.51.91-5.32-3.87-3.77 5.34-.78L10 2.5z" />
                    </svg>
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>
          </div>

          {/* Profile Completion */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Profile Completion</span>
              <span>{percentage}%</span>
            </div>
            <Progress value={percentage} className="h-2" />
            {missingFields.length > 0 ? (
              <p className="text-xs text-muted-foreground">
                To complete your profile:{" "}
                {missingFields
                  .map((field) => {
                    // Optionally, you can map field keys to more user-friendly labels here
                    switch (field) {
                      case "fullName":
                        return "First Name";
                      case "lastName":
                        return "Last Name";
                      case "phone":
                        return "Phone Number";
                      case "email":
                        return "Email";
                      case "address":
                        return "Address";
                      case "avatar":
                        return "Profile Picture";
                      // Add more mappings as needed
                      default:
                        // Capitalize first letter
                        return field.charAt(0).toUpperCase() + field.slice(1);
                    }
                  })
                  .join(", ")}
              </p>
            ) : (
              <p className="text-xs text-green-600">
                Your profile is 100% complete!
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <Card className="py-2">
        <CardContent className="p-0">
          <nav className="space-y-1">
            {profileTabs.map((tab) => {
              const isActive =
                pathname === tab.href ||
                (tab.id === "profile" && pathname === "/profile");

              return (
                <Link
                  key={tab.id}
                  href={tab.href}
                  className={`flex items-center rounded-xl space-x-3 px-4 py-3 text-sm transition-colors ${
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <tab.icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </Link>
              );
            })}

            {/* Sign Out */}
            <div className="border-t">
              <Button
                variant="ghost"
                className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50 px-4 py-3"
                onClick={() => logout()}
                disabled={isSigningOut}
              >
                <LogOut className="h-4 w-4 mr-3" />
                {isSigningOut ? "Signing out..." : "Sign Out"}
              </Button>
            </div>
          </nav>
        </CardContent>
      </Card>
    </div>
  );
}

// Profile Form Component
interface ProfileFormProps {}

export function ProfileForm() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isPending, startTransition] = useTransition();

  console.log("user", user);

  // Extract user data with proper fallbacks for Supabase auth user structure
  const getUserData = () => {
    if (!user)
      return {
        fullName: "",
        phone: "",
        timezone: "Africa/Cairo",
        preferredLanguage: "en",
        defaultCurrency: "EGP",
        receiveMarketingEmails: true,
      };

    // Handle Supabase auth user structure (primary structure)
    if (user.user_metadata) {
      const metadata = user.user_metadata;
      // Support multiple OAuth provider formats
      const fullName =
        metadata.fullName ||
        metadata.full_name ||
        metadata.name ||
        (metadata.firstName && metadata.lastName
          ? `${metadata.firstName} ${metadata.lastName}`
          : "") ||
        "";

      return {
        fullName,
        phone: user.phone || metadata.phone || "",
        timezone: metadata.timezone || "Africa/Cairo",
        preferredLanguage: metadata.preferredLanguage || "en",
        defaultCurrency: metadata.defaultCurrency || "EGP",
        receiveMarketingEmails: metadata.receiveMarketingEmails ?? true,
      };
    }

    // Handle database user structure (fallback) - cast to any to avoid type errors
    const dbUser = user as any;
    return {
      fullName: dbUser.fullName || "",
      phone: dbUser.phone || "",
      timezone: dbUser.timezone || "Africa/Cairo",
      preferredLanguage: dbUser.preferredLanguage || "en",
      defaultCurrency: dbUser.defaultCurrency || "EGP",
      receiveMarketingEmails: dbUser.receiveMarketingEmails ?? true,
    };
  };

  const userData = getUserData();

  // Setup form with react-hook-form (always call hooks at the top)
  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: userData,
  });

  // Update form values when user data changes
  React.useEffect(() => {
    if (user) {
      const newUserData = getUserData();
      form.reset(newUserData);
    }
  }, [user, form]);

  // Return loading state if no user data (after all hooks are called)
  if (!user) {
    return (
      <Card>
        <CardHeader>
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-48 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-64"></div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="h-10 bg-gray-200 rounded"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
            </div>
            <div className="h-10 bg-gray-200 rounded"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Handle form submission with useTransition
  const handleSubmit = (data: ProfileFormData) => {
    startTransition(async () => {
      try {
        const result = await updateUserProfile(data);

        if (result.success) {
          toast.success(result.message || "Profile updated successfully");

          // Invalidate user queries to refresh data
          await queryClient.invalidateQueries({
            queryKey: ["user"],
            refetchType: "active",
          });

          // Update form with new data
          const newUserData = getUserData();
          form.reset(newUserData);
        } else {
          toast.error(result.message || "Failed to update profile");

          // Set server-side field errors
          if (result.errors) {
            Object.entries(result.errors).forEach(([field, messages]) => {
              form.setError(field as keyof ProfileFormData, {
                type: "server",
                message: messages[0], // Show first error message
              });
            });
          }
        }
      } catch (error) {
        console.error("Form submission error:", error);
        toast.error("Something went wrong. Please try again.");
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Personal Information</CardTitle>
        <CardDescription>
          Update your personal details and preferences
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-6"
          >
            <TextInput
              form={form}
              label="Full Name"
              placeholder="Enter your full name"
              name="fullName"
            />

            <TextInput
              label="Phone Number"
              placeholder="Enter your phone number"
              name="phone"
              form={form}
            />
            {/* <FormField
                control={form.control}
                name="timezone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Timezone</FormLabel>
                    <FormControl>
                      <SelectInput
                        placeholder="Select your timezone"
                        options={timezoneOptions}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              /> */}

            <FormField
              control={form.control}
              name="preferredLanguage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Language</FormLabel>
                  <FormControl>
                    <SelectInput
                      placeholder="Select your language"
                      options={languageOptions}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* <FormField
                control={form.control}
                name="defaultCurrency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Default Currency</FormLabel>
                    <FormControl>
                      <SelectInput
                        placeholder="Select your currency"
                        options={currencyOptions}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              /> */}

            <FormField
              control={form.control}
              name="receiveMarketingEmails"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">
                      Marketing Emails
                    </FormLabel>
                    <FormDescription>
                      Receive emails about new products and special offers
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <Button
              type="submit"
              disabled={isPending}
              className="w-full md:w-auto"
            >
              {isPending ? "Updating..." : "Update Profile"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

// Address Card Component
interface AddressCardProps {
  address: UserAddress;
  onEdit: (address: UserAddress) => void;
  onDelete: (addressId: string) => void;
}

export function AddressCard({ address, onEdit, onDelete }: AddressCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this address?")) return;

    setIsDeleting(true);
    try {
      const result = await deleteAddress(address.id);
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error("Failed to delete address");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Card
      className={`relative ${address.isDefault ? "ring-2 ring-primary" : ""}`}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge
                variant="secondary"
                className={getAddressTypeBadgeColor(address.addressType)}
              >
                {getAddressTypeLabel(address.addressType)}
              </Badge>
              {address.isDefault && (
                <Badge variant="default">
                  <Star className="h-3 w-3 mr-1" />
                  Default
                </Badge>
              )}
              {address.isBusinessAddress && (
                <Badge variant="outline">
                  <Building className="h-3 w-3 mr-1" />
                  Business
                </Badge>
              )}
            </div>

            <h4 className="font-semibold">{address.fullName}</h4>
            <p className="text-sm text-muted-foreground">
              {formatPhoneNumber(address.phone)}
            </p>

            {address.company && (
              <p className="text-sm text-muted-foreground">{address.company}</p>
            )}

            <p className="text-sm mt-2">{formatAddress(address)}</p>

            {address.deliveryInstructions && (
              <p className="text-xs text-muted-foreground mt-2">
                Instructions: {address.deliveryInstructions}
              </p>
            )}
          </div>

          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => onEdit(address)}>
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDelete}
              disabled={isDeleting}
              className="text-red-500 hover:text-red-600"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Address Form Component
interface AddressFormProps {
  address?: UserAddress;
  onSuccess: () => void;
  onCancel: () => void;
}

export function AddressForm({
  address,
  onSuccess,
  onCancel,
}: AddressFormProps) {
  const [isPending, startTransition] = useTransition();
  const isEditing = !!address;

  const form = useForm<AddressFormData>({
    resolver: zodResolver(addressFormSchema),
    defaultValues: isEditing
      ? {
          addressType: address.addressType,
          fullName: address.fullName,
          phone: address.phone,
          company: address.company || "",
          addressLine1: address.addressLine1,
          addressLine2: address.addressLine2 || "",
          city: address.city,
          state: address.state,
          postalCode: address.postalCode,
          country: address.country,
          isDefault: address.isDefault,
          isBusinessAddress: address.isBusinessAddress,
          deliveryInstructions: address.deliveryInstructions || "",
          accessCode: address.accessCode || "",
        }
      : addressFormDefaults,
  });

  const handleSubmit = (data: AddressFormData) => {
    startTransition(async () => {
      try {
        const result = isEditing
          ? await updateAddress(address.id, data)
          : await createAddress(data);

        if (result.success) {
          toast.success(result.message);
          onSuccess();
        } else {
          toast.error(result.message);

          if (result.errors) {
            Object.entries(result.errors).forEach(([field, messages]) => {
              form.setError(field as keyof AddressFormData, {
                type: "server",
                message: messages[0],
              });
            });
          }
        }
      } catch (error) {
        toast.error("Something went wrong. Please try again.");
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEditing ? "Edit Address" : "Add New Address"}</CardTitle>
        <CardDescription>
          {isEditing
            ? "Update your address information"
            : "Add a new shipping or billing address"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-6"
          >
            <FormField
              control={form.control}
              name="addressType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address Type</FormLabel>
                  <FormControl>
                    <SelectInput
                      placeholder="Select address type"
                      options={[
                        { value: "billing", label: "Billing Address" },
                        { value: "shipping", label: "Shipping Address" },
                        { value: "both", label: "Billing & Shipping" },
                      ]}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <TextInput
                placeholder="Enter full name"
                name="fullName"
                form={form}
              />

              <TextInput
                placeholder="Enter phone number"
                name="phone"
                form={form}
              />
            </div>

            <TextInput
              placeholder="Enter company name"
              name="company"
              form={form}
            />

            <TextInput
              placeholder="Street address"
              name="addressLine1"
              form={form}
            />

            <TextInput
              placeholder="Apartment, suite, etc."
              name="addressLine2"
              form={form}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <TextInput placeholder="Enter city" name="city" form={form} />

              <TextInput placeholder="Enter state" name="state" form={form} />

              <TextInput
                placeholder="Enter postal code"
                name="postalCode"
                form={form}
              />
            </div>

            <FormField
              control={form.control}
              name="country"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Country</FormLabel>
                  <FormControl>
                    <SelectInput
                      placeholder="Select country"
                      options={countryOptions}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <TextInput
              placeholder="Special delivery instructions"
              name="deliveryInstructions"
              form={form}
            />

            <TextInput
              placeholder="Building or gate access code"
              name="accessCode"
              form={form}
            />

            <div className="flex flex-col gap-4">
              <FormField
                control={form.control}
                name="isDefault"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel>Default Address</FormLabel>
                      <FormDescription>
                        Use this as your default address for orders
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isBusinessAddress"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel>Business Address</FormLabel>
                      <FormDescription>
                        This is a business or commercial address
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <div className="flex gap-4">
              <Button type="submit" disabled={isPending}>
                {isPending
                  ? "Saving..."
                  : isEditing
                    ? "Update Address"
                    : "Add Address"}
              </Button>
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

// Security Form Component

export function SecurityForm() {
  const { user } = useAuth();
  const [isPending, startTransition] = useTransition();

  // Extract security-related user data with proper fallbacks
  const getSecurityData = () => {
    if (!user)
      return {
        hasTwoFactorAuth: false,
        twoFactorMethod: "",
      };

    // Handle database user structure (new structure) - cast to any to avoid type errors
    const dbUser = user as any;
    return {
      hasTwoFactorAuth: dbUser.hasTwoFactorAuth || false,
      twoFactorMethod: dbUser.twoFactorMethod || "",
    };
  };

  const securityData = getSecurityData();

  const form = useForm<SecurityFormData>({
    resolver: zodResolver(securityFormSchema),
    defaultValues: {
      ...securityFormDefaults,
      hasTwoFactorAuth: securityData.hasTwoFactorAuth,
      twoFactorMethod: securityData.twoFactorMethod,
    },
  });

  const handleSubmit = (data: SecurityFormData) => {
    // startTransition(async () => {
    //   try {
    //     const result = await updatePassword(data);
    //     if (result.success) {
    //       toast.success(result.message);
    //       form.reset({
    //         ...securityFormDefaults,
    //         hasTwoFactorAuth: data.hasTwoFactorAuth,
    //         twoFactorMethod: data.twoFactorMethod,
    //       });
    //     } else {
    //       toast.error(result.message);
    //       if (result.errors) {
    //         Object.entries(result.errors).forEach(([field, messages]) => {
    //           form.setError(field as keyof SecurityFormData, {
    //             type: "server",
    //             message: messages[0],
    //           });
    //         });
    //       }
    //     }
    //   } catch (error) {
    //     toast.error("Something went wrong. Please try again.");
    //   }
    // });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
          <CardDescription>
            Update your password to keep your account secure
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleSubmit)}
              className="space-y-6"
            >
              <FormField
                control={form.control}
                name="currentPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Current Password</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter your current password"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Password</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter your new password" {...field} />
                    </FormControl>
                    <FormDescription>
                      Password must be at least 8 characters with uppercase,
                      lowercase, number, and special character
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm New Password</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Confirm your new password"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" disabled={isPending}>
                {isPending ? "Updating Password..." : "Update Password"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Two-Factor Authentication</CardTitle>
          <CardDescription>
            Add an extra layer of security to your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <div className="space-y-6">
              <FormField
                control={form.control}
                name="hasTwoFactorAuth"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel>Enable Two-Factor Authentication</FormLabel>
                      <FormDescription>
                        Require a second form of authentication when signing in
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {form.watch("hasTwoFactorAuth") && (
                <FormField
                  control={form.control}
                  name="twoFactorMethod"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Authentication Method</FormLabel>
                      <FormControl>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          {twoFactorMethodOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
