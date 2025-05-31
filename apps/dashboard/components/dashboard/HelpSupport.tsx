import {
  Menu,
  HelpCircle,
  MessageSquare,
  FileText,
  Video,
  Mail,
  Phone,
  Search,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@workspace/ui/components/accordion";


const faqs = [
  {
    question: "How do I add a new product to my store?",
    answer:
      "To add a new product, go to Products Management, click 'Add Product', fill in the required details including title, price, description, and upload product images. Don't forget to set your inventory quantity and shipping details.",
  },
  {
    question: "How can I track my sales performance?",
    answer:
      "Visit the Analytics Dashboard to view comprehensive sales data, including total revenue, order counts, and performance trends. You can also access detailed reports in the Reports & Analytics section.",
  },
  {
    question: "What payment methods are supported?",
    answer:
      "We support all major payment methods including credit cards (Visa, MasterCard, American Express), PayPal, Apple Pay, Google Pay, and bank transfers depending on your region.",
  },
  {
    question: "How do I set up shipping rates?",
    answer:
      "Go to Shipping & Logistics, click 'Add Carrier' or 'Shipping Settings' to configure your shipping zones, rates, and delivery options. You can set flat rates, weight-based pricing, or free shipping thresholds.",
  },
  {
    question: "Can I customize my store appearance?",
    answer:
      "Yes! In Profile Settings, you can customize your store name, logo, description, and business information. For advanced customization, contact our support team for additional options.",
  },
];

const quickLinks = [
  {
    title: "Getting Started Guide",
    icon: FileText,
    description: "Complete setup guide for new sellers",
  },
  {
    title: "Product Management",
    icon: FileText,
    description: "Learn how to manage your inventory",
  },
  {
    title: "Order Processing",
    icon: FileText,
    description: "Handle orders from start to finish",
  },
  {
    title: "Marketing Tools",
    icon: FileText,
    description: "Promote your products effectively",
  },
  {
    title: "Payment Setup",
    icon: FileText,
    description: "Configure payment methods",
  },
  {
    title: "Shipping Configuration",
    icon: FileText,
    description: "Set up shipping options",
  },
];

const videoTutorials = [
  { title: "Dashboard Overview", duration: "5:30", views: "12.5k" },
  { title: "Adding Your First Product", duration: "8:15", views: "9.8k" },
  { title: "Managing Orders", duration: "6:45", views: "7.2k" },
  { title: "Setting Up Promotions", duration: "4:20", views: "5.1k" },
];

export const HelpSupport = () => {
  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Help & Support</h1>
            <p className="text-gray-600 mt-1">
              Find answers and get help with your seller dashboard
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button className="bg-green-600 hover:bg-green-700">
            <MessageSquare className="h-4 w-4 mr-2" />
            Live Chat
          </Button>
          <Button variant="outline">
            <Mail className="h-4 w-4 mr-2" />
            Contact Support
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <Card className="mb-8">
        <CardContent className="p-6">
          <div className="text-center mb-4">
            <h2 className="text-xl font-semibold mb-2">How can we help you?</h2>
            <p className="text-gray-600">
              Search our knowledge base or browse common topics
            </p>
          </div>
          <div className="relative max-w-2xl mx-auto">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <Input
              placeholder="Search for help articles, guides, or FAQs..."
              className="pl-10 py-3 text-lg"
            />
          </div>
        </CardContent>
      </Card>

      {/* Quick Help Options */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
          <CardContent className="p-6 text-center">
            <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <HelpCircle className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="font-semibold mb-2">Browse FAQs</h3>
            <p className="text-gray-600 text-sm">
              Find quick answers to common questions
            </p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
          <CardContent className="p-6 text-center">
            <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Video className="h-8 w-8 text-purple-600" />
            </div>
            <h3 className="font-semibold mb-2">Video Tutorials</h3>
            <p className="text-gray-600 text-sm">
              Watch step-by-step video guides
            </p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
          <CardContent className="p-6 text-center">
            <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Phone className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="font-semibold mb-2">Contact Support</h3>
            <p className="text-gray-600 text-sm">
              Get personalized help from our team
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Quick Links */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Links</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {quickLinks.map((link) => (
                <div
                  key={link.title}
                  className="flex items-center p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <link.icon className="h-5 w-5 text-gray-600 mr-3" />
                  <div>
                    <p className="font-medium">{link.title}</p>
                    <p className="text-sm text-gray-600">{link.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Video Tutorials */}
        <Card>
          <CardHeader>
            <CardTitle>Video Tutorials</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {videoTutorials.map((video) => (
                <div
                  key={video.title}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <div className="flex items-center">
                    <div className="bg-red-100 p-2 rounded mr-3">
                      <Video className="h-4 w-4 text-red-600" />
                    </div>
                    <div>
                      <p className="font-medium">{video.title}</p>
                      <p className="text-sm text-gray-600">
                        {video.views} views
                      </p>
                    </div>
                  </div>
                  <span className="text-sm text-gray-500">
                    {video.duration}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* FAQs */}
      <Card>
        <CardHeader>
          <CardTitle>Frequently Asked Questions</CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-left">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-gray-600">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>

      {/* Contact Information */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Still Need Help?</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                <MessageSquare className="h-6 w-6 text-blue-600" />
              </div>
              <h4 className="font-semibold mb-2">Live Chat</h4>
              <p className="text-gray-600 text-sm mb-3">
                Available 24/7 for instant support
              </p>
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                Start Chat
              </Button>
            </div>

            <div className="text-center">
              <div className="bg-green-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                <Mail className="h-6 w-6 text-green-600" />
              </div>
              <h4 className="font-semibold mb-2">Email Support</h4>
              <p className="text-gray-600 text-sm mb-3">
                Response within 24 hours
              </p>
              <Button size="sm" variant="outline">
                Send Email
              </Button>
            </div>

            <div className="text-center">
              <div className="bg-purple-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                <Phone className="h-6 w-6 text-purple-600" />
              </div>
              <h4 className="font-semibold mb-2">Phone Support</h4>
              <p className="text-gray-600 text-sm mb-3">Mon-Fri, 9AM-6PM EST</p>
              <Button size="sm" variant="outline">
                Call Now
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
