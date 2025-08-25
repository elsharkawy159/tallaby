import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { DynamicBreadcrumb } from "@/components/layout/dynamic-breadcrumb";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@workspace/ui/components/accordion";
import { Badge } from "@workspace/ui/components/badge";
import {
  Search,
  MessageCircle,
  Phone,
  Mail,
  Book,
  ShoppingCart,
  Package,
  CreditCard,
  RotateCcw,
  User,
  Shield,
} from "lucide-react";
import Link from "next/link";

const Help = () => {
  const popularTopics = [
    {
      icon: Package,
      title: "Order & Shipping",
      description: "Track orders, shipping info, and delivery",
      articles: 24,
      link: "/help/orders",
    },
    {
      icon: RotateCcw,
      title: "Returns & Refunds",
      description: "Return policies, refund process, and exchanges",
      articles: 18,
      link: "/help/returns",
    },
    {
      icon: User,
      title: "Account & Profile",
      description: "Manage your account, password, and preferences",
      articles: 15,
      link: "/help/account",
    },
    {
      icon: CreditCard,
      title: "Payment & Billing",
      description: "Payment methods, billing issues, and invoices",
      articles: 12,
      link: "/help/payment",
    },
    {
      icon: ShoppingCart,
      title: "Shopping & Products",
      description: "Product questions, availability, and recommendations",
      articles: 20,
      link: "/help/shopping",
    },
    {
      icon: Book,
      title: "Getting Started",
      description: "New to our platform? Start here for basics",
      articles: 10,
      link: "/help/getting-started",
    },
  ];

  const faqs = [
    {
      question: "How can I track my order?",
      answer:
        "You can track your order by logging into your account and visiting the 'My Orders' section. You'll also receive tracking information via email once your order ships.",
    },
    {
      question: "What is your return policy?",
      answer:
        "We offer a 30-day return policy for most items. Items must be in original condition with tags attached. Some restrictions apply for certain categories like electronics and personal care items.",
    },
    {
      question: "How long does shipping take?",
      answer:
        "Standard shipping takes 5-7 business days, express shipping takes 2-3 business days, and overnight shipping delivers the next business day. Delivery times may vary based on your location.",
    },
    {
      question: "Do you ship internationally?",
      answer:
        "Yes, we ship to over 50 countries worldwide. International shipping costs and delivery times vary by destination. Some restrictions may apply for certain products.",
    },
    {
      question: "How can I change or cancel my order?",
      answer:
        "Orders can be modified or cancelled within 1 hour of placement if they haven't been processed yet. Contact customer service immediately for assistance with order changes.",
    },
    {
      question: "What payment methods do you accept?",
      answer:
        "We accept all major credit cards (Visa, MasterCard, American Express), PayPal, Apple Pay, Google Pay, and bank transfers in select regions.",
    },
    {
      question: "How do I create an account?",
      answer:
        "Click the 'Sign Up' button in the top right corner of our website. You'll need to provide your email address, create a password, and verify your email to complete registration.",
    },
    {
      question: "Is my personal information secure?",
      answer:
        "Yes, we use industry-standard SSL encryption to protect your personal and payment information. We never store your credit card details on our servers.",
    },
  ];

  const contactOptions = [
    {
      icon: MessageCircle,
      title: "Live Chat",
      description: "Chat with our support team in real-time",
      availability: "Mon-Fri 9AM-6PM EST",
      action: "Start Chat",
    },
    {
      icon: Phone,
      title: "Phone Support",
      description: "Call us for immediate assistance",
      availability: "+1 (555) 123-4567",
      action: "Call Now",
    },
    {
      icon: Mail,
      title: "Email Support",
      description: "Send us a detailed message",
      availability: "support@stylist.com",
      action: "Send Email",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <DynamicBreadcrumb />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-primary to-primary/80 text-white py-16">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              How Can We Help You?
            </h1>
            <p className="text-xl mb-8 max-w-2xl mx-auto">
              Find answers to your questions, get support, and learn more about
              our services
            </p>

            {/* Search Bar */}
            <div className="max-w-2xl mx-auto">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  placeholder="Search for help articles, FAQs, and more..."
                  className="pl-12 py-4 text-lg bg-white text-gray-900"
                />
                <Button className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-primary hover:bg-primary/90">
                  Search
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Popular Topics */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Popular Help Topics</h2>
              <p className="text-gray-600">
                Quick access to the most common questions and issues
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {popularTopics.map((topic, index) => (
                <Link key={index} href={topic.link}>
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
                    <CardHeader>
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center group-hover:bg-primary/80 transition-colors">
                          <topic.icon className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <CardTitle className="group-hover:text-primary transition-colors">
                            {topic.title}
                          </CardTitle>
                          <Badge variant="secondary">
                            {topic.articles} articles
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <CardDescription>{topic.description}</CardDescription>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">
                Frequently Asked Questions
              </h2>
              <p className="text-gray-600">
                Find quick answers to common questions
              </p>
            </div>

            <div className="max-w-4xl mx-auto">
              <Accordion type="single" collapsible className="space-y-4">
                {faqs.map((faq, index) => (
                  <AccordionItem
                    key={index}
                    value={`item-${index}`}
                    className="bg-white border rounded-lg"
                  >
                    <AccordionTrigger className="px-6 py-4 text-left font-medium hover:text-primary">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="px-6 pb-4 text-gray-600">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>

            <div className="text-center mt-8">
              <Button variant="outline" size="lg">
                View All FAQs
              </Button>
            </div>
          </div>
        </section>

        {/* Contact Support */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Still Need Help?</h2>
              <p className="text-gray-600">
                Our customer support team is here to assist you
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              {contactOptions.map((option, index) => (
                <Card
                  key={index}
                  className="text-center hover:shadow-lg transition-shadow"
                >
                  <CardHeader>
                    <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                      <option.icon className="h-8 w-8 text-white" />
                    </div>
                    <CardTitle>{option.title}</CardTitle>
                    <CardDescription>{option.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 mb-4">
                      {option.availability}
                    </p>
                    <Button className="w-full">{option.action}</Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Additional Resources */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Additional Resources</h2>
              <p className="text-gray-600">
                More ways to get the help you need
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Link href="/terms">
                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardContent className="p-6 text-center">
                    <Book className="h-8 w-8 text-primary mx-auto mb-3" />
                    <h3 className="font-bold mb-2">Terms & Conditions</h3>
                    <p className="text-sm text-gray-600">
                      Read our terms of service
                    </p>
                  </CardContent>
                </Card>
              </Link>

              <Link href="/privacy">
                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardContent className="p-6 text-center">
                    <Shield className="h-8 w-8 text-primary mx-auto mb-3" />
                    <h3 className="font-bold mb-2">Privacy Policy</h3>
                    <p className="text-sm text-gray-600">
                      How we protect your data
                    </p>
                  </CardContent>
                </Card>
              </Link>

              <Link href="/returns">
                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardContent className="p-6 text-center">
                    <RotateCcw className="h-8 w-8 text-primary mx-auto mb-3" />
                    <h3 className="font-bold mb-2">Return Policy</h3>
                    <p className="text-sm text-gray-600">
                      Return and refund guidelines
                    </p>
                  </CardContent>
                </Card>
              </Link>

              <Link href="/security">
                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardContent className="p-6 text-center">
                    <Shield className="h-8 w-8 text-primary mx-auto mb-3" />
                    <h3 className="font-bold mb-2">Security Center</h3>
                    <p className="text-sm text-gray-600">
                      Keep your account safe
                    </p>
                  </CardContent>
                </Card>
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Help;
