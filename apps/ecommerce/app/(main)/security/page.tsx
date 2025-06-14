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
  Shield,
  Lock,
  Eye,
  CreditCard,
  Database,
  Globe,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";

const Security = () => {
  const securityFeatures = [
    {
      icon: Lock,
      title: "SSL Encryption",
      description:
        "All data transmitted between you and our servers is encrypted using 256-bit SSL technology",
    },
    {
      icon: CreditCard,
      title: "Secure Payments",
      description:
        "We never store your payment information. All transactions are processed by certified payment providers",
    },
    {
      icon: Database,
      title: "Data Protection",
      description:
        "Your personal information is stored securely and only used for order processing and customer service",
    },
    {
      icon: Eye,
      title: "Privacy Controls",
      description:
        "You have full control over your privacy settings and can opt out of marketing communications anytime",
    },
    {
      icon: Shield,
      title: "Fraud Protection",
      description:
        "Advanced fraud detection systems monitor all transactions for suspicious activity",
    },
    {
      icon: Globe,
      title: "GDPR Compliant",
      description:
        "We comply with international privacy regulations including GDPR and CCPA",
    },
  ];

  const securityTips = [
    {
      title: "Use Strong Passwords",
      description:
        "Create unique passwords with a mix of letters, numbers, and symbols",
      status: "recommended",
    },
    {
      title: "Enable Two-Factor Authentication",
      description: "Add an extra layer of security to your account with 2FA",
      status: "highly-recommended",
    },
    {
      title: "Keep Software Updated",
      description:
        "Always use the latest version of your browser and operating system",
      status: "recommended",
    },
    {
      title: "Verify Website URLs",
      description:
        "Always check that you're on the official website before entering personal information",
      status: "critical",
    },
    {
      title: "Monitor Your Accounts",
      description:
        "Regularly check your account activity and report any suspicious behavior",
      status: "recommended",
    },
    {
      title: "Use Secure Networks",
      description: "Avoid making purchases on public Wi-Fi networks",
      status: "highly-recommended",
    },
  ];

  const certifications = [
    {
      name: "PCI DSS Compliant",
      description: "Payment Card Industry Data Security Standard",
    },
    { name: "SSL Certificate", description: "Secure Sockets Layer encryption" },
    {
      name: "GDPR Compliant",
      description: "General Data Protection Regulation",
    },
    { name: "SOC 2 Type II", description: "System and Organization Controls" },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-primary to-primary/80 text-white py-16">
          <div className="container mx-auto px-4 text-center">
            <div className="w-20 h-20 bg-accent rounded-full flex items-center justify-center mx-auto mb-6">
              <Shield className="h-10 w-10 text-black" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Security Center
            </h1>
            <p className="text-xl mb-8 max-w-2xl mx-auto">
              Your security and privacy are our top priorities. Learn about our
              security measures and how you can protect your account.
            </p>
            <Badge className="bg-accent text-black text-lg px-4 py-2">
              Bank-Level Security
            </Badge>
          </div>
        </section>

        {/* Security Features */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">How We Protect You</h2>
              <p className="text-gray-600">
                Advanced security measures to keep your data safe
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {securityFeatures.map((feature, index) => (
                <Card
                  key={index}
                  className="text-center hover:shadow-lg transition-shadow"
                >
                  <CardHeader>
                    <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                      <feature.icon className="h-6 w-6 text-white" />
                    </div>
                    <CardTitle>{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>{feature.description}</CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Security Tips */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Protect Your Account</h2>
              <p className="text-gray-600">
                Best practices to keep your account secure
              </p>
            </div>

            <div className="max-w-4xl mx-auto space-y-4">
              {securityTips.map((tip, index) => (
                <Card key={index} className="p-6">
                  <div className="flex items-start space-x-4">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center mt-1 ${
                        tip.status === "critical"
                          ? "bg-red-100"
                          : tip.status === "highly-recommended"
                            ? "bg-orange-100"
                            : "bg-green-100"
                      }`}
                    >
                      {tip.status === "critical" ? (
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                      ) : (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="font-bold">{tip.title}</h3>
                        <Badge
                          variant={
                            tip.status === "critical"
                              ? "destructive"
                              : tip.status === "highly-recommended"
                                ? "default"
                                : "secondary"
                          }
                        >
                          {tip.status.replace("-", " ")}
                        </Badge>
                      </div>
                      <p className="text-gray-600">{tip.description}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Certifications */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">
                Security Certifications
              </h2>
              <p className="text-gray-600">
                We maintain the highest security standards
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {certifications.map((cert, index) => (
                <Card key={index} className="text-center p-6">
                  <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                    <Shield className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="font-bold mb-2">{cert.name}</h3>
                  <p className="text-sm text-gray-600">{cert.description}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Report Security Issues */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl font-bold mb-4">
                Report Security Issues
              </h2>
              <p className="text-gray-600 mb-8">
                If you discover a security vulnerability or have concerns about
                your account security, please contact us immediately.
              </p>

              <Card className="text-left">
                <CardHeader>
                  <CardTitle>Security Contact Information</CardTitle>
                  <CardDescription>
                    How to reach our security team
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="font-medium">Email:</p>
                    <p className="text-gray-600">security@stylist.com</p>
                  </div>
                  <div>
                    <p className="font-medium">Phone:</p>
                    <p className="text-gray-600">+1 (555) 123-SECURITY</p>
                  </div>
                  <div>
                    <p className="font-medium">Response Time:</p>
                    <p className="text-gray-600">
                      We aim to respond to security reports within 24 hours
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-primary text-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-4">Stay Secure</h2>
            <p className="text-xl mb-8 max-w-2xl mx-auto">
              Keep your account safe by following security best practices and
              staying informed about online safety
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/profile">
                <Button
                  size="lg"
                  className="bg-accent text-black hover:bg-accent/90"
                >
                  Update Security Settings
                </Button>
              </Link>
              <Link href="/help">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white text-white hover:bg-white hover:text-primary"
                >
                  Get Help
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Security;
