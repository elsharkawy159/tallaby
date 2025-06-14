import { Users, Target, Award, Globe, Heart, Truck } from "lucide-react";
import Link from "next/link";
import { Button } from "@workspace/ui/components/button";
import { Badge } from "@workspace/ui/components/badge";

const About = () => {
  const stats = [
    { label: "Happy Customers", value: "500K+", icon: Users },
    { label: "Products Sold", value: "2M+", icon: Target },
    { label: "Partner Vendors", value: "10K+", icon: Award },
    { label: "Countries Served", value: "50+", icon: Globe },
  ];

  const values = [
    {
      icon: Heart,
      title: "Customer First",
      description:
        "Everything we do is centered around providing the best possible experience for our customers.",
    },
    {
      icon: Award,
      title: "Quality Assured",
      description:
        "We partner only with vendors who meet our strict quality standards and ethical practices.",
    },
    {
      icon: Truck,
      title: "Fast & Reliable",
      description:
        "Quick delivery, hassle-free returns, and reliable customer service you can count on.",
    },
    {
      icon: Globe,
      title: "Global Community",
      description:
        "Building a worldwide marketplace that connects customers with amazing products from everywhere.",
    },
  ];

  const team = [
    {
      name: "Sarah Johnson",
      role: "CEO & Founder",
      image:
        "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=300&h=300&fit=crop",
      bio: "15+ years in e-commerce, passionate about connecting people with great products.",
    },
    {
      name: "Michael Chen",
      role: "CTO",
      image:
        "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&h=300&fit=crop",
      bio: "Tech visionary focused on building scalable platforms for the future of retail.",
    },
    {
      name: "Emily Rodriguez",
      role: "Head of Operations",
      image:
        "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=300&h=300&fit=crop",
      bio: "Operations expert ensuring smooth experiences for customers and vendors alike.",
    },
    {
      name: "David Thompson",
      role: "Head of Marketing",
      image:
        "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=300&h=300&fit=crop",
      bio: "Creative strategist helping brands tell their stories and reach new audiences.",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-primary to-primary/80 text-white py-20">
          <div className="container mx-auto px-4 text-center">
            <Badge className="bg-accent text-black mb-4">Our Story</Badge>
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Connecting You to the World's
              <span className="block text-accent">Best Products</span>
            </h1>
            <p className="text-xl mb-8 max-w-3xl mx-auto">
              We're on a mission to create the most trusted and diverse
              marketplace where quality products meet exceptional customer
              service.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/products">
                <Button className="bg-accent text-black hover:bg-accent/90">
                  Shop Now
                </Button>
              </Link>
              <Link href="/become-seller">
                <Button
                  variant="outline"
                  className="border-white text-white hover:bg-white hover:text-primary"
                >
                  Become a Partner
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                    <stat.icon className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-3xl font-bold text-primary mb-2">
                    {stat.value}
                  </h3>
                  <p className="text-gray-600">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Our Story */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl font-bold mb-6">Our Journey</h2>
                <p className="text-gray-600 mb-6">
                  Founded in 2020, our platform started with a simple idea: what
                  if we could create a marketplace that truly puts customers
                  first while empowering vendors to reach new heights?
                </p>
                <p className="text-gray-600 mb-6">
                  Today, we're proud to serve over 500,000 happy customers
                  worldwide, working with more than 10,000 trusted vendors who
                  share our commitment to quality and exceptional service.
                </p>
                <p className="text-gray-600 mb-8">
                  Our platform continues to evolve, driven by feedback from our
                  community and our relentless pursuit of innovation in
                  e-commerce.
                </p>
                <Link href="/careers">
                  <Button>Join Our Team</Button>
                </Link>
              </div>
              <div className="relative">
                <img
                  src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=600&h=400&fit=crop"
                  alt="Our team working together"
                  className="rounded-lg shadow-lg"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Our Values */}
        <section className="py-20 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold mb-4">Our Values</h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                These core principles guide everything we do and shape the
                experience we create for our customers and partners.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {values.map((value, index) => (
                <div
                  key={index}
                  className="bg-white p-6 rounded-lg shadow-sm text-center"
                >
                  <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                    <value.icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-lg font-bold mb-3">{value.title}</h3>
                  <p className="text-gray-600 text-sm">{value.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Leadership Team */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold mb-4">Meet Our Leadership</h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Our diverse team of leaders brings together decades of
                experience in technology, retail, and customer service.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {team.map((member, index) => (
                <div key={index} className="text-center">
                  <img
                    src={member.image}
                    alt={member.name}
                    className="w-32 h-32 rounded-full mx-auto mb-4 object-cover"
                  />
                  <h3 className="text-lg font-bold mb-1">{member.name}</h3>
                  <p className="text-primary font-medium mb-3">{member.role}</p>
                  <p className="text-gray-600 text-sm">{member.bio}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-primary text-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-4">
              Ready to Start Your Journey?
            </h2>
            <p className="text-xl mb-8 max-w-2xl mx-auto">
              Whether you're looking to shop for amazing products or grow your
              business with us, we're here to help you succeed.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/products">
                <Button className="bg-accent text-black hover:bg-accent/90">
                  Start Shopping
                </Button>
              </Link>
              <Link href="/become-seller">
                <Button
                  variant="outline"
                  className="border-white text-white hover:bg-white hover:text-primary"
                >
                  Become a Vendor
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default About;
