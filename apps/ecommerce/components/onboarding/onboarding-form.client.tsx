"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@workspace/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@workspace/ui/components/form";
import { Input } from "@workspace/ui/components/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import { Checkbox } from "@workspace/ui/components/checkbox";

import {
  sellerApplicationSchema,
  sellerApplicationDefaults,
  type SellerApplicationFormData,
} from "@/app/(main)/become-seller/_components/become-seller.dto";
import { submitSellerApplication } from "@/app/(main)/become-seller/_components/become-seller.server";
import {
  BUSINESS_TYPE_OPTIONS,
  COUNTRY_OPTIONS,
} from "@/app/(main)/become-seller/_components/become-seller.types";
import { useAuthDialog } from "@/hooks/use-auth-dialog";

interface OnboardingFormClientProps {
  user: any;
}

export function OnboardingFormClient({ user }: OnboardingFormClientProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const { open: openAuthDialog } = useAuthDialog();

  const form = useForm<SellerApplicationFormData>({
    resolver: zodResolver(sellerApplicationSchema),
    defaultValues: sellerApplicationDefaults,
    mode: "onChange",
  });

  const handleSubmit = (data: SellerApplicationFormData) => {
    if (!user) {
      toast.error("You must be logged in to create a seller account");
      openAuthDialog("signin");
      return;
    }

    startTransition(async () => {
      try {
        const result = await submitSellerApplication(data);

        if (result.success) {
          toast.success(result.message);
          form.reset();
          // Redirect to home page after successful submission
          router.push("/");
          router.refresh();
        } else {
          toast.error(result.message);

          // Set server-side field errors
          if (result.errors) {
            Object.entries(result.errors).forEach(([field, messages]) => {
              form.setError(field as keyof SellerApplicationFormData, {
                type: "server",
                message: messages[0],
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

  if (!user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Authentication Required</CardTitle>
          <CardDescription>
            You must be logged in to create a seller account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <Button onClick={() => openAuthDialog("signin")}>
              Sign In to Continue
            </Button>
            <p className="text-sm text-center text-gray-600">
              Don't have an account?{" "}
              <Link
                href="/signup"
                className="font-semibold text-primary hover:text-primary/80"
              >
                Sign up
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Seller Application Form</CardTitle>
        <CardDescription>
          Fill out the required information to create your vendor account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-6"
          >
            {/* Business Information */}
            <FormField
              control={form.control}
              name="businessName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Business Name <span className="text-red-600">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Enter your business name" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="businessType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Business Type <span className="text-red-600">*</span>
                  </FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your business type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {BUSINESS_TYPE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="supportEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Support Email <span className="text-red-600">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="email"
                      placeholder="Enter your business email"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Legal Address Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Legal Address</h3>

              <FormField
                control={form.control}
                name="addressLine1"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Address Line 1 <span className="text-red-600">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Street address" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        City <span className="text-red-600">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Enter city" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="state"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        State/Province <span className="text-red-600">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Enter state/province" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="postalCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Postal/ZIP Code <span className="text-red-600">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Enter postal code" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Country <span className="text-red-600">*</span>
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select country" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {COUNTRY_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Terms and Conditions */}
            <FormField
              control={form.control}
              name="acceptTerms"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel className="text-sm">
                      I agree to the{" "}
                      <Link
                        href="/terms"
                        className="text-primary hover:underline"
                        target="_blank"
                      >
                        Terms of Service
                      </Link>{" "}
                      and{" "}
                      <Link
                        href="/privacy"
                        className="text-primary hover:underline"
                        target="_blank"
                      >
                        Privacy Policy
                      </Link>
                    </FormLabel>
                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={isPending || !form.formState.isValid}
            >
              {isPending
                ? "Creating Seller Account..."
                : "Create Seller Account"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
