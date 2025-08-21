import { Button } from "@workspace/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/tabs";
import { Separator } from "@workspace/ui/components/separator";
import { Badge } from "@workspace/ui/components/badge";
import { Switch } from "@workspace/ui/components/switch";
import { Label } from "@workspace/ui/components/label";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@workspace/ui/components/avatar";
import { Input } from "@workspace/ui/components/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import {
  Save,
  Users,
  Store,
  Bell,
  Globe,
  CreditCard,
  Lock,
} from "lucide-react";
import * as z from "zod";

// General settings validation schema
const generalSettingsSchema = z.object({
  siteName: z.string().min(2, "Site name is required"),
  siteDescription: z.string().optional(),
  contactEmail: z.string().email("Must be a valid email address"),
  contactPhone: z.string().optional(),
  defaultCurrency: z.string().min(1, "Currency is required"),
  defaultLanguage: z.string().min(1, "Language is required"),
  timeZone: z.string().min(1, "Time zone is required"),
  logoUrl: z.string().optional(),
  faviconUrl: z.string().optional(),
});

// User settings validation schema
const userSettingsSchema = z
  .object({
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    email: z.string().email("Must be a valid email address"),
    role: z.string().min(1, "Role is required"),
    currentPassword: z.string().optional(),
    newPassword: z.string().optional(),
    confirmPassword: z.string().optional(),
  })
  .refine(
    (data) => !data.newPassword || data.newPassword === data.confirmPassword,
    {
      message: "Passwords don&apos;t match",
      path: ["confirmPassword"],
    }
  )
  .refine((data) => !data.newPassword || data.currentPassword, {
    message: "Current password is required to set a new password",
    path: ["currentPassword"],
  });

// Mock user data
const currentUser = {
  firstName: "Admin",
  lastName: "User",
  email: "admin@example.com",
  role: "admin",
  avatarUrl: null,
};

export default function SettingsPage() {
  // Function to handle general settings form submission
  const handleGeneralSettingsSubmit = async (
    data: z.infer<typeof generalSettingsSchema>
  ) => {
    console.log("General settings submitted:", data);
    // In a real app, you would send this data to your API
  };

  // Function to handle user settings form submission
  const handleUserSettingsSubmit = async (
    data: z.infer<typeof userSettingsSchema>
  ) => {
    console.log("User settings submitted:", data);
    // In a real app, you would send this data to your API
  };

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5 lg:w-auto">
          <TabsTrigger value="general" className="flex items-center">
            <Store className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">General</span>
          </TabsTrigger>
          <TabsTrigger value="account" className="flex items-center">
            <Users className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Account</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center">
            <Bell className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Notifications</span>
          </TabsTrigger>
          <TabsTrigger value="regional" className="flex items-center">
            <Globe className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Regional</span>
          </TabsTrigger>
          <TabsTrigger value="payments" className="flex items-center">
            <CreditCard className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Payments</span>
          </TabsTrigger>
        </TabsList>

        {/* General Settings Tab */}
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>
                Manage your store's general settings and information
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* <FormWrapper
                schema={generalSettingsSchema}
                defaultValues={{
                  siteName: "E-Commerce Store",
                  siteDescription: "Your one-stop shop for all your needs",
                  contactEmail: "contact@example.com",
                  contactPhone: "+1 (555) 123-4567",
                  defaultCurrency: "USD",
                  defaultLanguage: "en",
                  timeZone: "America/New_York",
                  logoUrl: "",
                  faviconUrl: "",
                }}
                onSubmit={handleGeneralSettingsSubmit}
                submitText="Save Changes"
              >
                <div className="grid gap-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormInputField
                      control={control}
                      name="siteName"
                      label="Site Name"
                      placeholder="Your store name"
                    />
                    <FormInputField
                      control={control}
                      name="siteDescription"
                      label="Site Description"
                      placeholder="Brief description of your store"
                    />
                  </div>
                  
                  <Separator />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormInputField
                      control={control}
                      name="contactEmail"
                      label="Contact Email"
                      placeholder="contact@example.com"
                    />
                    <FormInputField
                      control={control}
                      name="contactPhone"
                      label="Contact Phone"
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                  
                  <Separator />
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <FormInputField
                      control={control}
                      name="defaultCurrency"
                      label="Default Currency"
                      type="select"
                      options={[
                        { label: "USD - US Dollar", value: "USD" },
                        { label: "EUR - Euro", value: "EUR" },
                        { label: "GBP - British Pound", value: "GBP" },
                        { label: "JPY - Japanese Yen", value: "JPY" },
                        { label: "CAD - Canadian Dollar", value: "CAD" },
                      ]}
                    />
                    <FormInputField
                      control={control}
                      name="defaultLanguage"
                      label="Default Language"
                      type="select"
                      options={[
                        { label: "English", value: "en" },
                        { label: "Spanish", value: "es" },
                        { label: "French", value: "fr" },
                        { label: "German", value: "de" },
                        { label: "Japanese", value: "ja" },
                      ]}
                    />
                    <FormInputField
                      control={control}
                      name="timeZone"
                      label="Time Zone"
                      type="select"
                      options={[
                        { label: "UTC (GMT)", value: "UTC" },
                        { label: "America/New_York (EST/EDT)", value: "America/New_York" },
                        { label: "America/Los_Angeles (PST/PDT)", value: "America/Los_Angeles" },
                        { label: "Europe/London (GMT/BST)", value: "Europe/London" },
                        { label: "Europe/Paris (CET/CEST)", value: "Europe/Paris" },
                        { label: "Asia/Tokyo (JST)", value: "Asia/Tokyo" },
                      ]}
                    />
                  </div>
                  
                  <Separator />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormInputField
                      control={control}
                      name="logoUrl"
                      label="Logo URL"
                      placeholder="https://example.com/logo.png"
                    />
                    <FormInputField
                      control={control}
                      name="faviconUrl"
                      label="Favicon URL"
                      placeholder="https://example.com/favicon.ico"
                    />
                  </div>
                </div>
              </FormWrapper> */}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Account Settings Tab */}
        <TabsContent value="account">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>
                  Update your account profile information
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col md:flex-row gap-8">
                  <div className="flex flex-col items-center gap-4">
                    <Avatar className="h-24 w-24">
                      <AvatarImage src={currentUser.avatarUrl || ""} />
                      <AvatarFallback className="text-2xl">
                        {currentUser.firstName.charAt(0)}
                        {currentUser.lastName.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <Button variant="outline" size="sm">
                      Change Avatar
                    </Button>
                  </div>

                  <div className="flex-1">
                    {/* <FormWrapper
                      schema={userSettingsSchema}
                      defaultValues={{
                        firstName: currentUser.firstName,
                        lastName: currentUser.lastName,
                        email: currentUser.email,
                        role: currentUser.role,
                        currentPassword: "",
                        newPassword: "",
                        confirmPassword: "",
                      }}
                      onSubmit={handleUserSettingsSubmit}
                      submitText="Update Profile"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormInputField
                          control={control}
                          name="firstName"
                          label="First Name"
                          placeholder="John"
                        />
                        <FormInputField
                          control={control}
                          name="lastName"
                          label="Last Name"
                          placeholder="Doe"
                        />
                        <FormInputField
                          control={control}
                          name="email"
                          label="Email Address"
                          placeholder="john.doe@example.com"
                        />
                        <FormInputField
                          control={control}
                          name="role"
                          label="Role"
                          type="select"
                          options={[
                            { label: "Admin", value: "admin" },
                            { label: "Manager", value: "manager" },
                            { label: "Editor", value: "editor" },
                            { label: "Viewer", value: "viewer" },
                          ]}
                          disabled
                        />
                      </div>
                    </FormWrapper> */}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Change Password</CardTitle>
                <CardDescription>Update your account password</CardDescription>
              </CardHeader>
              <CardContent>
                <form className="grid gap-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="current-password">Current Password</Label>
                      <Input
                        id="current-password"
                        type="password"
                        placeholder="••••••••"
                      />
                    </div>
                    <div></div> {/* Empty div for grid alignment */}
                    <div className="space-y-2">
                      <Label htmlFor="new-password">New Password</Label>
                      <Input
                        id="new-password"
                        type="password"
                        placeholder="••••••••"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirm-password">
                        Confirm New Password
                      </Label>
                      <Input
                        id="confirm-password"
                        type="password"
                        placeholder="••••••••"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button>
                      <Lock className="h-4 w-4 mr-2" />
                      Update Password
                    </Button>
                  </div>
                </form>
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
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h3 className="text-lg font-medium">2FA Status</h3>
                    <p className="text-sm text-gray-500">
                      Two-factor authentication is currently disabled.
                    </p>
                  </div>
                  <Button variant="outline">Enable 2FA</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Notifications Settings Tab */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
              <CardDescription>
                Manage how you receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Email Notifications</h3>
                <div className="grid gap-4">
                  <div className="flex items-center justify-between border-b pb-4">
                    <div>
                      <Label htmlFor="email-orders" className="font-medium">
                        Order Updates
                      </Label>
                      <p className="text-sm text-gray-500">
                        Receive email notifications about new orders and status
                        changes
                      </p>
                    </div>
                    <Switch id="email-orders" defaultChecked />
                  </div>
                  <div className="flex items-center justify-between border-b pb-4">
                    <div>
                      <Label htmlFor="email-products" className="font-medium">
                        Product Alerts
                      </Label>
                      <p className="text-sm text-gray-500">
                        Receive email notifications about low stock and price
                        changes
                      </p>
                    </div>
                    <Switch id="email-products" defaultChecked />
                  </div>
                  <div className="flex items-center justify-between border-b pb-4">
                    <div>
                      <Label htmlFor="email-customers" className="font-medium">
                        Customer Activity
                      </Label>
                      <p className="text-sm text-gray-500">
                        Receive email notifications about new customers and
                        reviews
                      </p>
                    </div>
                    <Switch id="email-customers" defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="email-marketing" className="font-medium">
                        Marketing Campaigns
                      </Label>
                      <p className="text-sm text-gray-500">
                        Receive email notifications about marketing campaigns
                        and promotions
                      </p>
                    </div>
                    <Switch id="email-marketing" />
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Push Notifications</h3>
                <div className="grid gap-4">
                  <div className="flex items-center justify-between border-b pb-4">
                    <div>
                      <Label htmlFor="push-orders" className="font-medium">
                        Order Updates
                      </Label>
                      <p className="text-sm text-gray-500">
                        Receive push notifications about new orders and status
                        changes
                      </p>
                    </div>
                    <Switch id="push-orders" defaultChecked />
                  </div>
                  <div className="flex items-center justify-between border-b pb-4">
                    <div>
                      <Label htmlFor="push-products" className="font-medium">
                        Product Alerts
                      </Label>
                      <p className="text-sm text-gray-500">
                        Receive push notifications about low stock and price
                        changes
                      </p>
                    </div>
                    <Switch id="push-products" />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="push-customers" className="font-medium">
                        Customer Activity
                      </Label>
                      <p className="text-sm text-gray-500">
                        Receive push notifications about new customers and
                        reviews
                      </p>
                    </div>
                    <Switch id="push-customers" />
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button>
                <Save className="h-4 w-4 mr-2" />
                Save Notification Settings
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Regional Settings Tab */}
        <TabsContent value="regional">
          <Card>
            <CardHeader>
              <CardTitle>Regional Settings</CardTitle>
              <CardDescription>
                Configure localization and regional preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="currency">Default Currency</Label>
                  <Select defaultValue="USD">
                    <SelectTrigger id="currency">
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD - US Dollar</SelectItem>
                      <SelectItem value="EUR">EUR - Euro</SelectItem>
                      <SelectItem value="GBP">GBP - British Pound</SelectItem>
                      <SelectItem value="JPY">JPY - Japanese Yen</SelectItem>
                      <SelectItem value="CAD">CAD - Canadian Dollar</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="language">Default Language</Label>
                  <Select defaultValue="en">
                    <SelectTrigger id="language">
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Spanish</SelectItem>
                      <SelectItem value="fr">French</SelectItem>
                      <SelectItem value="de">German</SelectItem>
                      <SelectItem value="ja">Japanese</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date-format">Date Format</Label>
                  <Select defaultValue="MM/DD/YYYY">
                    <SelectTrigger id="date-format">
                      <SelectValue placeholder="Select date format" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                      <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                      <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="time-format">Time Format</Label>
                  <Select defaultValue="12">
                    <SelectTrigger id="time-format">
                      <SelectValue placeholder="Select time format" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="12">12-hour (AM/PM)</SelectItem>
                      <SelectItem value="24">24-hour</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Tax Settings</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b pb-4">
                    <div>
                      <Label
                        htmlFor="prices-include-tax"
                        className="font-medium"
                      >
                        Show Prices with Tax
                      </Label>
                      <p className="text-sm text-gray-500">
                        Display product prices including tax
                      </p>
                    </div>
                    <Switch id="prices-include-tax" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tax-calculation">Tax Calculation</Label>
                    <Select defaultValue="shipping">
                      <SelectTrigger id="tax-calculation">
                        <SelectValue placeholder="Select tax calculation method" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="shipping">
                          Based on Shipping Address
                        </SelectItem>
                        <SelectItem value="billing">
                          Based on Billing Address
                        </SelectItem>
                        <SelectItem value="store">
                          Based on Store Address
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Shipping Settings</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b pb-4">
                    <div>
                      <Label
                        htmlFor="shipping-domestic-only"
                        className="font-medium"
                      >
                        Domestic Shipping Only
                      </Label>
                      <p className="text-sm text-gray-500">
                        Restrict shipping to domestic addresses only
                      </p>
                    </div>
                    <Switch id="shipping-domestic-only" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="weight-unit">Weight Unit</Label>
                    <Select defaultValue="kg">
                      <SelectTrigger id="weight-unit">
                        <SelectValue placeholder="Select weight unit" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="kg">Kilograms (kg)</SelectItem>
                        <SelectItem value="g">Grams (g)</SelectItem>
                        <SelectItem value="lb">Pounds (lb)</SelectItem>
                        <SelectItem value="oz">Ounces (oz)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dimension-unit">Dimension Unit</Label>
                    <Select defaultValue="cm">
                      <SelectTrigger id="dimension-unit">
                        <SelectValue placeholder="Select dimension unit" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cm">Centimeters (cm)</SelectItem>
                        <SelectItem value="m">Meters (m)</SelectItem>
                        <SelectItem value="in">Inches (in)</SelectItem>
                        <SelectItem value="ft">Feet (ft)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button>
                <Save className="h-4 w-4 mr-2" />
                Save Regional Settings
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Payment Settings Tab */}
        <TabsContent value="payments">
          <Card>
            <CardHeader>
              <CardTitle>Payment Settings</CardTitle>
              <CardDescription>
                Configure payment methods and processing options
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Payment Providers</h3>
                <div className="space-y-4">
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <img
                          src="/api/placeholder/120/40"
                          alt="Stripe"
                          className="h-8"
                        />
                        <Badge
                          variant="outline"
                          className="bg-green-50 text-green-700 border-green-200"
                        >
                          Active
                        </Badge>
                      </div>
                      <Button variant="outline" size="sm">
                        Configure
                      </Button>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">API Key Status:</span>
                        <span className="font-medium text-green-600">
                          Verified
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Webhook Status:</span>
                        <span className="font-medium text-green-600">
                          Configured
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Account Type:</span>
                        <span className="font-medium">Live</span>
                      </div>
                    </div>
                  </div>

                  <div className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <img
                          src="/api/placeholder/120/40"
                          alt="PayPal"
                          className="h-8"
                        />
                        <Badge
                          variant="outline"
                          className="bg-amber-50 text-amber-700 border-amber-200"
                        >
                          Needs Setup
                        </Badge>
                      </div>
                      <Button variant="outline" size="sm">
                        Set Up
                      </Button>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">API Key Status:</span>
                        <span className="font-medium text-amber-600">
                          Missing
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Webhook Status:</span>
                        <span className="font-medium text-gray-400">
                          Not Configured
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Account Type:</span>
                        <span className="font-medium">N/A</span>
                      </div>
                    </div>
                  </div>

                  <div className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <img
                          src="/api/placeholder/120/40"
                          alt="Bank Transfer"
                          className="h-8"
                        />
                        <Badge
                          variant="outline"
                          className="bg-gray-50 text-gray-700 border-gray-200"
                        >
                          Inactive
                        </Badge>
                      </div>
                      <Button variant="outline" size="sm">
                        Enable
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Processing Options</h3>
                <div className="grid gap-4">
                  <div className="flex items-center justify-between border-b pb-4">
                    <div>
                      <Label htmlFor="capture-payment" className="font-medium">
                        Auto-Capture Payments
                      </Label>
                      <p className="text-sm text-gray-500">
                        Automatically capture authorized payments
                      </p>
                    </div>
                    <Switch id="capture-payment" defaultChecked />
                  </div>

                  <div className="flex items-center justify-between border-b pb-4">
                    <div>
                      <Label htmlFor="test-mode" className="font-medium">
                        Test Mode
                      </Label>
                      <p className="text-sm text-gray-500">
                        Process payments in test mode (no real charges)
                      </p>
                    </div>
                    <Switch id="test-mode" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="payment-action">Payment Action</Label>
                    <Select defaultValue="capture">
                      <SelectTrigger id="payment-action">
                        <SelectValue placeholder="Select payment action" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="capture">
                          Authorize and Capture
                        </SelectItem>
                        <SelectItem value="authorize">
                          Authorize Only
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-medium">
                  Available Payment Methods
                </h3>
                <div className="grid gap-4">
                  <div className="flex items-center justify-between border-b pb-4">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="credit-card" className="font-medium">
                        Credit/Debit Cards
                      </Label>
                    </div>
                    <Switch id="credit-card" defaultChecked />
                  </div>

                  <div className="flex items-center justify-between border-b pb-4">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="paypal" className="font-medium">
                        PayPal
                      </Label>
                    </div>
                    <Switch id="paypal" />
                  </div>

                  <div className="flex items-center justify-between border-b pb-4">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="apple-pay" className="font-medium">
                        Apple Pay
                      </Label>
                    </div>
                    <Switch id="apple-pay" defaultChecked />
                  </div>

                  <div className="flex items-center justify-between border-b pb-4">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="google-pay" className="font-medium">
                        Google Pay
                      </Label>
                    </div>
                    <Switch id="google-pay" defaultChecked />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="bank-transfer" className="font-medium">
                        Bank Transfer
                      </Label>
                    </div>
                    <Switch id="bank-transfer" />
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button>
                <Save className="h-4 w-4 mr-2" />
                Save Payment Settings
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </>
  );
}
