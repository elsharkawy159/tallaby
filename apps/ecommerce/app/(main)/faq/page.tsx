import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@workspace/ui/components/accordion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Badge } from "@workspace/ui/components/badge";
import {
  Search,
  MessageCircle,
  Phone,
  Mail,
  HelpCircle,
  Package,
  CreditCard,
  RotateCcw,
  User,
  Truck,
} from "lucide-react";
import Link from "next/link";

const FAQ = () => {
  const faqCategories = [
    {
      icon: Package,
      title: "Orders & Shipping",
      count: 12,
      questions: [
        {
          question: "How can I track my order?",
          answer:
            "You can track your order by logging into your account and visiting the 'My Orders' section. You'll also receive tracking information via email once your order ships.",
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
          question: "Can I change my shipping address after placing an order?",
          answer:
            "You can change your shipping address within 1 hour of placing your order if it hasn't been processed yet. Contact customer service immediately for assistance.",
        },
      ],
    },
    {
      icon: RotateCcw,
      title: "Returns & Exchanges",
      count: 8,
      questions: [
        {
          question: "What is your return policy?",
          answer:
            "We offer a 30-day return policy for most items. Items must be in original condition with tags attached. Some restrictions apply for certain categories like electronics and personal care items.",
        },
        {
          question: "How do I start a return?",
          answer:
            "Log into your account, go to 'My Orders', and select the item you want to return. Follow the prompts to generate a return label.",
        },
        {
          question: "How long does it take to process a refund?",
          answer:
            "Refunds are typically processed within 3-5 business days after we receive your return. It may take an additional 5-7 business days to appear on your statement.",
        },
        {
          question: "Can I exchange an item for a different size?",
          answer:
            "Yes, you can exchange items for different sizes within 30 days. The exchange process is similar to returns, and we'll ship the new size once we receive the original item.",
        },
      ],
    },
    {
      icon: CreditCard,
      title: "Payment & Billing",
      count: 6,
      questions: [
        {
          question: "What payment methods do you accept?",
          answer:
            "We accept all major credit cards (Visa, MasterCard, American Express), PayPal, Apple Pay, Google Pay, and bank transfers in select regions.",
        },
        {
          question: "Is it safe to enter my credit card information?",
          answer:
            "Yes, we use industry-standard SSL encryption to protect your payment information. We never store your credit card details on our servers.",
        },
        {
          question: "Can I save multiple payment methods?",
          answer:
            "Yes, you can save multiple payment methods in your account for faster checkout. All saved information is encrypted and secure.",
        },
        {
          question: "Do you offer payment plans?",
          answer:
            "We partner with select payment providers to offer installment plans for purchases over $100. Options will be shown at checkout if available.",
        },
      ],
    },
    {
      icon: User,
      title: "Account & Profile",
      count: 7,
      questions: [
        {
          question: "How do I create an account?",
          answer:
            "Click the 'Sign Up' button in the top right corner of our website. You'll need to provide your email address, create a password, and verify your email to complete registration.",
        },
        {
          question: "I forgot my password. How can I reset it?",
          answer:
            "Click on 'Forgot Password' on the login page, enter your email address, and we'll send you a reset link. Follow the instructions in the email to create a new password.",
        },
        {
          question: "Can I change my email address?",
          answer:
            "Yes, you can update your email address in your account settings. You'll need to verify the new email address before the change takes effect.",
        },
        {
          question: "How do I delete my account?",
          answer:
            "To delete your account, contact our customer service team. Please note that this action is permanent and cannot be undone.",
        },
      ],
    },
  ];

  const popularQuestions = [
    "How can I track my order?",
    "What is your return policy?",
    "How long does shipping take?",
    "What payment methods do you accept?",
    "Do you ship internationally?",
    "How do I start a return?",
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-primary to-primary/80 text-white py-16">
          <div className="container mx-auto px-4 text-center">
            <div className="w-20 h-20 bg-accent rounded-full flex items-center justify-center mx-auto mb-6">
              <HelpCircle className="h-10 w-10 text-black" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Frequently Asked Questions
            </h1>
            <p className="text-xl mb-8 max-w-2xl mx-auto">
              Find quick answers to common questions about our products,
              services, and policies
            </p>

            {/* Search Bar */}
            <div className="max-w-2xl mx-auto">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  placeholder="Search FAQs..."
                  className="pl-12 py-4 text-lg bg-white text-gray-900"
                />
                <Button className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-primary hover:bg-primary/90">
                  Search
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Popular Questions */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Popular Questions</h2>
              <p className="text-gray-600">
                Quick access to the most frequently asked questions
              </p>
            </div>

            <div className="flex flex-wrap justify-center gap-3 mb-12">
              {popularQuestions.map((question, index) => (
                <Badge
                  key={index}
                  variant="outline"
                  className="cursor-pointer hover:bg-primary hover:text-white transition-colors p-2"
                >
                  {question}
                </Badge>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ Categories */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Browse by Category</h2>
              <p className="text-gray-600">Find answers organized by topic</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {faqCategories.map((category, categoryIndex) => (
                <Card
                  key={categoryIndex}
                  className="hover:shadow-lg transition-shadow"
                >
                  <CardHeader>
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
                        <category.icon className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <CardTitle>{category.title}</CardTitle>
                        <Badge variant="secondary">
                          {category.count} questions
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Accordion type="single" collapsible className="space-y-2">
                      {category.questions.map((faq, faqIndex) => (
                        <AccordionItem
                          key={faqIndex}
                          value={`${categoryIndex}-${faqIndex}`}
                          className="border rounded-lg"
                        >
                          <AccordionTrigger className="px-4 py-3 text-left font-medium hover:text-primary">
                            {faq.question}
                          </AccordionTrigger>
                          <AccordionContent className="px-4 pb-3 text-gray-600">
                            {faq.answer}
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Still Need Help */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Still Need Help?</h2>
              <p className="text-gray-600">
                Our customer support team is here to assist you
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <Card className="text-center hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                    <MessageCircle className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle>Live Chat</CardTitle>
                  <CardDescription>
                    Chat with our support team in real-time
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4">
                    Mon-Fri 9AM-6PM EST
                  </p>
                  <Button className="w-full">Start Chat</Button>
                </CardContent>
              </Card>

              <Card className="text-center hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                    <Mail className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle>Email Support</CardTitle>
                  <CardDescription>Send us a detailed message</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4">
                    support@stylist.com
                  </p>
                  <Link href="/contact">
                    <Button variant="outline" className="w-full">
                      Send Email
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              <Card className="text-center hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                    <Phone className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle>Phone Support</CardTitle>
                  <CardDescription>
                    Call us for immediate assistance
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4">
                    +1 (555) 123-4567
                  </p>
                  <Button variant="outline" className="w-full">
                    Call Now
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Additional Resources */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Additional Resources</h2>
              <p className="text-gray-600">
                More ways to get the information you need
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Link href="/help">
                <Card className="hover:shadow-lg transition-shadow cursor-pointer text-center">
                  <CardContent className="p-6">
                    <HelpCircle className="h-8 w-8 text-primary mx-auto mb-3" />
                    <h3 className="font-bold mb-2">Help Center</h3>
                    <p className="text-sm text-gray-600">
                      Comprehensive help articles
                    </p>
                  </CardContent>
                </Card>
              </Link>

              <Link href="/returns">
                <Card className="hover:shadow-lg transition-shadow cursor-pointer text-center">
                  <CardContent className="p-6">
                    <RotateCcw className="h-8 w-8 text-primary mx-auto mb-3" />
                    <h3 className="font-bold mb-2">Return Policy</h3>
                    <p className="text-sm text-gray-600">
                      Detailed return guidelines
                    </p>
                  </CardContent>
                </Card>
              </Link>

              <Link href="/security">
                <Card className="hover:shadow-lg transition-shadow cursor-pointer text-center">
                  <CardContent className="p-6">
                    <Package className="h-8 w-8 text-primary mx-auto mb-3" />
                    <h3 className="font-bold mb-2">Security Center</h3>
                    <p className="text-sm text-gray-600">
                      Account security information
                    </p>
                  </CardContent>
                </Card>
              </Link>

              <Link href="/stores">
                <Card className="hover:shadow-lg transition-shadow cursor-pointer text-center">
                  <CardContent className="p-6">
                    <Truck className="h-8 w-8 text-primary mx-auto mb-3" />
                    <h3 className="font-bold mb-2">Store Locations</h3>
                    <p className="text-sm text-gray-600">
                      Find stores near you
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

export default FAQ;
