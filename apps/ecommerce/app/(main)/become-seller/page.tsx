import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { Textarea } from "@workspace/ui/components/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import { Checkbox } from "@workspace/ui/components/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Badge } from "@workspace/ui/components/badge";
import {
  Users,
  TrendingUp,
  Globe,
  Shield,
  DollarSign,
  Headphones,
  Star,
  Package,
} from "lucide-react";
import Link from "next/link";

const BecomeSeller = () => {
  const benefits = [
    {
      icon: Users,
      title: "Reach Millions",
      description:
        "Access our customer base of over 500,000 active shoppers worldwide",
    },
    {
      icon: TrendingUp,
      title: "Grow Your Business",
      description:
        "Scale your sales with our powerful marketing tools and analytics",
    },
    {
      icon: Globe,
      title: "Global Market",
      description:
        "Sell internationally with our integrated shipping and logistics",
    },
    {
      icon: Shield,
      title: "Secure Platform",
      description:
        "Protected transactions with fraud protection and buyer safety",
    },
    {
      icon: DollarSign,
      title: "Competitive Fees",
      description:
        "Low selling fees with transparent pricing and no hidden costs",
    },
    {
      icon: Headphones,
      title: "24/7 Support",
      description: "Dedicated seller support team to help you succeed",
    },
  ];

  const stats = [
    { label: "Active Sellers", value: "10K+", description: "Trusted vendors" },
    {
      label: "Products Sold",
      value: "2M+",
      description: "Successfully delivered",
    },
    {
      label: "Customer Satisfaction",
      value: "98%",
      description: "Positive feedback",
    },
    {
      label: "Average Growth",
      value: "150%",
      description: "Sales increase in first year",
    },
  ];

  const testimonials = [
    {
      name: "Sarah Chen",
      business: "Chen's Boutique",
      image:
        "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop",
      rating: 5,
      text: "Joining this platform transformed my small boutique into a thriving online business. The support team is amazing!",
    },
    {
      name: "Michael Rodriguez",
      business: "TechGear Pro",
      image:
        "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop",
      rating: 5,
      text: "The analytics tools helped me understand my customers better and increase sales by 200% in just 6 months.",
    },
    {
      name: "Emma Thompson",
      business: "Handmade by Emma",
      image:
        "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop",
      rating: 5,
      text: "Perfect platform for artisans like me. Easy to use, great exposure, and the commission rates are very fair.",
    },
  ];

  const plans = [
    {
      name: "Starter",
      price: "Free",
      description: "Perfect for small businesses just getting started",
      features: [
        "Up to 100 products",
        "Basic analytics",
        "Standard support",
        "5% transaction fee",
      ],
      recommended: false,
    },
    {
      name: "Professional",
      price: "$29/month",
      description: "Best for growing businesses",
      features: [
        "Unlimited products",
        "Advanced analytics",
        "Priority support",
        "3% transaction fee",
        "Marketing tools",
        "Bulk operations",
      ],
      recommended: true,
    },
    {
      name: "Enterprise",
      price: "Custom",
      description: "For large businesses with custom needs",
      features: [
        "Everything in Professional",
        "Dedicated account manager",
        "Custom integrations",
        "2% transaction fee",
        "White-label options",
        "API access",
      ],
      recommended: false,
    },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-primary to-primary/80 text-white py-20">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <Badge className="bg-accent text-black mb-4">
                  Partner with Us
                </Badge>
                <h1 className="text-4xl md:text-6xl font-bold mb-6">
                  Turn Your Products Into
                  <span className="block text-accent">Profit</span>
                </h1>
                <p className="text-xl mb-8">
                  Join thousands of successful sellers on our platform. Reach
                  millions of customers, grow your business, and build your
                  brand with our comprehensive selling tools.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button
                    size="lg"
                    className="bg-accent text-black hover:bg-accent/90"
                  >
                    Start Selling Today
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-white text-white hover:bg-white hover:text-primary"
                  >
                    Learn More
                  </Button>
                </div>
              </div>
              <div className="relative">
                <img
                  src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=600&h=400&fit=crop"
                  alt="Successful seller"
                  className="rounded-lg shadow-2xl"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <h3 className="text-3xl md:text-4xl font-bold text-primary mb-2">
                    {stat.value}
                  </h3>
                  <p className="font-medium mb-1">{stat.label}</p>
                  <p className="text-sm text-gray-600">{stat.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Why Choose Our Platform?
              </h2>
              <p className="text-gray-600 text-lg max-w-2xl mx-auto">
                We provide everything you need to build and grow your online
                business successfully
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {benefits.map((benefit, index) => (
                <div key={index} className="text-center p-6">
                  <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                    <benefit.icon className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">{benefit.title}</h3>
                  <p className="text-gray-600">{benefit.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing Plans */}
        <section className="py-20 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Choose Your Plan
              </h2>
              <p className="text-gray-600 text-lg max-w-2xl mx-auto">
                Select the plan that best fits your business needs. You can
                always upgrade as you grow.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {plans.map((plan, index) => (
                <Card
                  key={index}
                  className={`relative ${plan.recommended ? "border-primary shadow-lg scale-105" : ""}`}
                >
                  {plan.recommended && (
                    <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-primary">
                      Most Popular
                    </Badge>
                  )}
                  <CardHeader className="text-center">
                    <CardTitle className="text-2xl">{plan.name}</CardTitle>
                    <div className="text-4xl font-bold text-primary my-4">
                      {plan.price}
                    </div>
                    <CardDescription>{plan.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3 mb-6">
                      {plan.features.map((feature, idx) => (
                        <li key={idx} className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-primary rounded-full"></div>
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Button
                      className={`w-full ${plan.recommended ? "bg-primary" : ""}`}
                    >
                      {plan.name === "Enterprise"
                        ? "Contact Sales"
                        : "Get Started"}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Success Stories
              </h2>
              <p className="text-gray-600 text-lg max-w-2xl mx-auto">
                Hear from our successful sellers who have grown their businesses
                with us
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {testimonials.map((testimonial, index) => (
                <Card key={index} className="text-center">
                  <CardHeader>
                    <img
                      src={testimonial.image}
                      alt={testimonial.name}
                      className="w-20 h-20 rounded-full mx-auto mb-4 object-cover"
                    />
                    <div className="flex justify-center mb-2">
                      {Array.from({ length: testimonial.rating }).map(
                        (_, i) => (
                          <Star
                            key={i}
                            className="h-5 w-5 text-yellow-400 fill-current"
                          />
                        )
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 mb-4 italic">
                      "{testimonial.text}"
                    </p>
                    <div>
                      <p className="font-bold">{testimonial.name}</p>
                      <p className="text-sm text-gray-600">
                        {testimonial.business}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Application Form */}
        <section className="py-20 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="max-w-2xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">
                  Ready to Get Started?
                </h2>
                <p className="text-gray-600 text-lg">
                  Fill out our application form and our team will review your
                  submission within 24 hours
                </p>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Seller Application</CardTitle>
                  <CardDescription>
                    Tell us about your business and products
                  </CardDescription>
                </CardHeader>
                <CardContent>
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
                        placeholder="john@business.com"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input id="phone" placeholder="+1 (555) 123-4567" />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="businessName">Business Name</Label>
                      <Input
                        id="businessName"
                        placeholder="Your Business LLC"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="website">Website (Optional)</Label>
                      <Input
                        id="website"
                        placeholder="https://yourbusiness.com"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="category">Product Category</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select your main category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="fashion">
                            Fashion & Apparel
                          </SelectItem>
                          <SelectItem value="electronics">
                            Electronics & Tech
                          </SelectItem>
                          <SelectItem value="home">Home & Garden</SelectItem>
                          <SelectItem value="sports">
                            Sports & Outdoors
                          </SelectItem>
                          <SelectItem value="beauty">
                            Beauty & Personal Care
                          </SelectItem>
                          <SelectItem value="toys">Toys & Games</SelectItem>
                          <SelectItem value="books">Books & Media</SelectItem>
                          <SelectItem value="automotive">Automotive</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Business Description</Label>
                      <Textarea
                        id="description"
                        placeholder="Tell us about your business, products, and what makes you unique..."
                        className="min-h-[100px]"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="experience">Selling Experience</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="How long have you been selling?" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="new">New to selling</SelectItem>
                          <SelectItem value="1year">
                            Less than 1 year
                          </SelectItem>
                          <SelectItem value="1-3years">1-3 years</SelectItem>
                          <SelectItem value="3-5years">3-5 years</SelectItem>
                          <SelectItem value="5plus">5+ years</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox id="terms" />
                      <Label htmlFor="terms" className="text-sm">
                        I agree to the{" "}
                        <Link
                          href="/terms"
                          className="text-primary hover:underline"
                        >
                          Terms of Service
                        </Link>{" "}
                        and
                        <Link
                          href="/privacy"
                          className="text-primary hover:underline"
                        >
                          {" "}
                          Privacy Policy
                        </Link>
                      </Label>
                    </div>

                    <Button type="submit" className="w-full" size="lg">
                      Submit Application
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default BecomeSeller;
