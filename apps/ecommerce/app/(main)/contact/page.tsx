import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { Textarea } from "@workspace/ui/components/textarea";
import { DynamicBreadcrumb } from "@/components/layout/dynamic-breadcrumb";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Us | Tallaby.com",
  description:
    "Get in touch with Tallaby.com customer support. We're here to help with orders, products, returns, and any questions. Multiple contact methods available.",
  openGraph: {
    title: "Contact Us | Tallaby.com",
    description:
      "Get in touch with Tallaby.com customer support. We're here to help with orders, products, returns, and any questions. Multiple contact methods available.",
    url: "https://www.tallaby.com/contact",
    siteName: "Tallaby.com",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Contact Tallaby.com",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Contact Us | Tallaby.com",
    description:
      "Get in touch with Tallaby.com customer support. We're here to help with orders, products, returns, and any questions.",
    images: ["/og-image.jpg"],
    site: "@tallaby",
  },
  alternates: {
    canonical: "https://www.tallaby.com/contact",
  },
};
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  MessageCircle,
  Headphones,
} from "lucide-react";

const Contact = () => {
  const contactMethods = [
    {
      icon: Phone,
      title: "Phone Support",
      description: "Speak with our customer service team",
      value: "+1 (555) 123-4567",
      availability: "Mon-Fri 9AM-6PM EST",
    },
    {
      icon: Mail,
      title: "Email Support",
      description: "Send us a detailed message",
      value: "support@tallaby.com",
      availability: "Response within 24 hours",
    },
    {
      icon: MessageCircle,
      title: "Live Chat",
      description: "Chat with us in real-time",
      value: "Available on website",
      availability: "Mon-Fri 9AM-6PM EST",
    },
    {
      icon: Headphones,
      title: "Help Center",
      description: "Browse our knowledge base",
      value: "Self-service articles",
      availability: "Available 24/7",
    },
  ];

  const offices = [
    {
      city: "New York",
      address: "123 Fifth Avenue, Suite 100",
      state: "New York, NY 10011",
      phone: "+1 (555) 123-4567",
      hours: "Mon-Fri 9AM-6PM EST",
    },
    {
      city: "Los Angeles",
      address: "456 Sunset Boulevard, Floor 5",
      state: "Los Angeles, CA 90028",
      phone: "+1 (555) 987-6543",
      hours: "Mon-Fri 9AM-6PM PST",
    },
    {
      city: "Chicago",
      address: "789 Michigan Avenue, Suite 200",
      state: "Chicago, IL 60611",
      phone: "+1 (555) 456-7890",
      hours: "Mon-Fri 9AM-6PM CST",
    },
  ];

  return (
    <>
      <DynamicBreadcrumb />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-gray-50 py-12">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl font-bold mb-4">Get in Touch</h1>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              We're here to help! Reach out to us through any of the channels
              below and we'll get back to you as soon as possible.
            </p>
          </div>
        </section>

        {/* Contact Methods */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
              {contactMethods.map((method, index) => (
                <Card
                  key={index}
                  className="text-center hover:shadow-lg transition-shadow"
                >
                  <CardHeader>
                    <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center mx-auto mb-3">
                      <method.icon className="h-6 w-6 text-white" />
                    </div>
                    <CardTitle className="text-lg">{method.title}</CardTitle>
                    <CardDescription>{method.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="font-medium text-primary mb-1">
                      {method.value}
                    </p>
                    <p className="text-sm text-gray-600">
                      {method.availability}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              {/* Contact Form */}
              <div>
                <h2 className="text-2xl font-bold mb-6">Send us a Message</h2>
                <form className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input id="firstName" placeholder="John" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input id="lastName" placeholder="Doe" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="john@example.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number (Optional)</Label>
                    <Input id="phone" placeholder="+1 (555) 123-4567" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="subject">Subject</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a topic" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="general">General Inquiry</SelectItem>
                        <SelectItem value="order">Order Support</SelectItem>
                        <SelectItem value="product">
                          Product Question
                        </SelectItem>
                        <SelectItem value="returns">
                          Returns & Refunds
                        </SelectItem>
                        <SelectItem value="technical">
                          Technical Issue
                        </SelectItem>
                        <SelectItem value="partnership">
                          Partnership Inquiry
                        </SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message">Message</Label>
                    <Textarea
                      id="message"
                      placeholder="Tell us how we can help you..."
                      className="min-h-[120px]"
                    />
                  </div>

                  <Button type="submit" className="w-full">
                    Send Message
                  </Button>
                </form>
              </div>

              {/* Office Locations */}
              <div>
                <h2 className="text-2xl font-bold mb-6">Our Offices</h2>
                <div className="space-y-6">
                  {offices.map((office, index) => (
                    <Card key={index}>
                      <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                          <MapPin className="h-5 w-5 text-primary" />
                          <span>{office.city}</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <p className="text-gray-600">{office.address}</p>
                        <p className="text-gray-600">{office.state}</p>
                        <div className="flex items-center space-x-2 text-sm">
                          <Phone className="h-4 w-4 text-primary" />
                          <span>{office.phone}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm">
                          <Clock className="h-4 w-4 text-primary" />
                          <span>{office.hours}</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* FAQ Quick Links */}
                <div className="mt-8">
                  <h3 className="text-lg font-bold mb-4">Quick Links</h3>
                  <div className="space-y-2">
                    <Button variant="outline" className="w-full justify-start">
                      Order Tracking & Status
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      Returns & Refunds
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      Shipping Information
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      Account Help
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-2xl font-bold mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-gray-600 mb-8">
              Can't find what you're looking for? Check out our comprehensive
              FAQ section.
            </p>
            <Button size="lg">Visit Help Center</Button>
          </div>
        </section>
      </main>
    </>
  );
};

export default Contact;
