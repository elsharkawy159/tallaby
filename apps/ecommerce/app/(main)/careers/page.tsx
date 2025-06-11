import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@workspace/ui/components/button";
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
  Heart,
  Globe,
  MapPin,
  Clock,
  DollarSign,
  Briefcase,
} from "lucide-react";
import Link from "next/link";

const Careers = () => {
  const benefits = [
    {
      icon: Heart,
      title: "Health & Wellness",
      description:
        "Comprehensive health insurance, dental, vision, and mental health support",
    },
    {
      icon: TrendingUp,
      title: "Career Growth",
      description:
        "Professional development opportunities, mentorship programs, and skill training",
    },
    {
      icon: DollarSign,
      title: "Competitive Pay",
      description:
        "Competitive salaries, performance bonuses, and equity opportunities",
    },
    {
      icon: Clock,
      title: "Work-Life Balance",
      description:
        "Flexible hours, remote work options, and generous paid time off",
    },
    {
      icon: Users,
      title: "Great Team",
      description:
        "Collaborative culture, team events, and supportive work environment",
    },
    {
      icon: Globe,
      title: "Global Impact",
      description:
        "Work on products that reach millions of customers worldwide",
    },
  ];

  const openPositions = [
    {
      title: "Senior Frontend Developer",
      department: "Engineering",
      location: "New York, NY",
      type: "Full-time",
      remote: true,
      description:
        "Join our engineering team to build amazing user experiences for our e-commerce platform.",
      requirements: [
        "5+ years React experience",
        "TypeScript proficiency",
        "E-commerce background",
      ],
    },
    {
      title: "Product Manager",
      department: "Product",
      location: "San Francisco, CA",
      type: "Full-time",
      remote: false,
      description:
        "Lead product strategy and development for our core shopping experience.",
      requirements: [
        "3+ years product management",
        "E-commerce experience",
        "Data-driven approach",
      ],
    },
    {
      title: "UX Designer",
      department: "Design",
      location: "Los Angeles, CA",
      type: "Full-time",
      remote: true,
      description:
        "Design intuitive and beautiful experiences for our millions of users.",
      requirements: [
        "Portfolio of UX work",
        "Figma proficiency",
        "User research experience",
      ],
    },
    {
      title: "Customer Success Manager",
      department: "Customer Success",
      location: "Chicago, IL",
      type: "Full-time",
      remote: true,
      description:
        "Help our enterprise customers succeed and grow their business with our platform.",
      requirements: [
        "Customer success experience",
        "SaaS background",
        "Strong communication skills",
      ],
    },
    {
      title: "Data Scientist",
      department: "Data & Analytics",
      location: "Boston, MA",
      type: "Full-time",
      remote: false,
      description:
        "Use data to drive insights and improve our recommendation algorithms.",
      requirements: [
        "PhD or Masters in relevant field",
        "Python/R proficiency",
        "ML/AI experience",
      ],
    },
    {
      title: "Marketing Specialist",
      department: "Marketing",
      location: "Austin, TX",
      type: "Contract",
      remote: true,
      description:
        "Drive growth through digital marketing campaigns and brand partnerships.",
      requirements: [
        "Digital marketing experience",
        "Campaign management",
        "Analytics tools",
      ],
    },
  ];

  const companyValues = [
    {
      title: "Customer Obsession",
      description: "We put our customers at the center of everything we do",
    },
    {
      title: "Innovation",
      description: "We constantly push the boundaries of what's possible",
    },
    {
      title: "Integrity",
      description: "We do the right thing, even when no one is watching",
    },
    {
      title: "Collaboration",
      description: "We achieve more together than we ever could alone",
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
                  We're Hiring
                </Badge>
                <h1 className="text-4xl md:text-6xl font-bold mb-6">
                  Build the Future of
                  <span className="block text-accent">E-Commerce</span>
                </h1>
                <p className="text-xl mb-8">
                  Join our mission to create the world's most trusted and
                  innovative shopping platform. Help millions of customers
                  discover amazing products while growing your career.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button
                    size="lg"
                    className="bg-accent text-black hover:bg-accent/90"
                  >
                    View Open Positions
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-white text-white hover:bg-white hover:text-primary"
                  >
                    Learn About Our Culture
                  </Button>
                </div>
              </div>
              <div className="relative">
                <img
                  src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=600&h=400&fit=crop"
                  alt="Team collaboration"
                  className="rounded-lg shadow-2xl"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Company Values */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Our Values</h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                These core values guide how we work together and serve our
                customers
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {companyValues.map((value, index) => (
                <div key={index} className="text-center">
                  <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                    <Heart className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-lg font-bold mb-3">{value.title}</h3>
                  <p className="text-gray-600 text-sm">{value.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Benefits */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Why Work With Us?</h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                We offer comprehensive benefits and a supportive environment
                where you can thrive
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {benefits.map((benefit, index) => (
                <Card
                  key={index}
                  className="text-center hover:shadow-lg transition-shadow"
                >
                  <CardHeader>
                    <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                      <benefit.icon className="h-6 w-6 text-white" />
                    </div>
                    <CardTitle>{benefit.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>{benefit.description}</CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Open Positions */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Open Positions</h2>
              <p className="text-gray-600">
                Join our team and help shape the future of e-commerce
              </p>
            </div>

            <div className="space-y-6 max-w-4xl mx-auto">
              {openPositions.map((position, index) => (
                <Card key={index} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-bold">
                            {position.title}
                          </h3>
                          <Badge variant="secondary">
                            {position.department}
                          </Badge>
                          {position.remote && (
                            <Badge variant="outline">Remote OK</Badge>
                          )}
                        </div>

                        <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                          <div className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {position.location}
                          </div>
                          <div className="flex items-center gap-1">
                            <Briefcase className="h-4 w-4" />
                            {position.type}
                          </div>
                        </div>

                        <p className="text-gray-600 mb-3">
                          {position.description}
                        </p>

                        <div>
                          <p className="text-sm font-medium mb-1">
                            Requirements:
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {position.requirements.map((req, reqIndex) => (
                              <Badge
                                key={reqIndex}
                                variant="outline"
                                className="text-xs"
                              >
                                {req}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="lg:ml-6">
                        <Button>Apply Now</Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Team Culture */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl font-bold mb-6">Our Culture</h2>
                <p className="text-gray-600 mb-6">
                  We believe that great work happens when people feel empowered,
                  supported, and inspired. Our culture is built on trust,
                  collaboration, and continuous learning.
                </p>
                <p className="text-gray-600 mb-8">
                  From flexible work arrangements to professional development
                  opportunities, we're committed to helping our team members
                  thrive both personally and professionally.
                </p>
                <Button>Learn More About Our Culture</Button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <img
                  src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=300&h=200&fit=crop"
                  alt="Team meeting"
                  className="rounded-lg"
                />
                <img
                  src="https://images.unsplash.com/photo-1556761175-b413da4baf72?w=300&h=200&fit=crop"
                  alt="Office space"
                  className="rounded-lg"
                />
                <img
                  src="https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=300&h=200&fit=crop"
                  alt="Team collaboration"
                  className="rounded-lg"
                />
                <img
                  src="https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=300&h=200&fit=crop"
                  alt="Team discussion"
                  className="rounded-lg"
                />
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-primary text-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to Join Our Team?</h2>
            <p className="text-xl mb-8 max-w-2xl mx-auto">
              Don't see a position that fits? We're always looking for talented
              people to join our mission.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                className="bg-accent text-black hover:bg-accent/90"
              >
                Send Us Your Resume
              </Button>
              <Link href="/contact">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white text-white hover:bg-white hover:text-primary"
                >
                  Contact HR
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Careers;
