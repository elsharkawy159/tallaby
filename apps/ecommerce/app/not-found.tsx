"use client";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@workspace/ui/components/button";
import { ArrowLeft, Home, Search, Package } from "lucide-react";
import Link from "next/link";

const NotFound = () => {
  const popularLinks = [
    { name: "All Products", href: "/products", icon: Package },
    { name: "Categories", href: "/categories", icon: Search },
    { name: "Help Center", href: "/help", icon: Search },
    { name: "Contact Us", href: "/contact", icon: Search },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 container mx-auto px-4 py-16">
        <div className="text-center max-w-2xl mx-auto">
          {/* 404 Illustration */}
          <div className="mb-8">
            <div className="text-8xl md:text-9xl font-bold text-primary/20 mb-4">
              404
            </div>
            <div className="relative">
              <img
                src="https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop"
                alt="Page not found"
                className="rounded-lg shadow-lg mx-auto"
              />
            </div>
          </div>

          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            Oops! Page Not Found
          </h1>

          <p className="text-gray-600 text-lg mb-8">
            The page you're looking for doesn't exist or has been moved. Don't
            worry, let's get you back on track!
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link href="/">
              <Button size="lg" className="w-full sm:w-auto">
                <Home className="h-5 w-5 mr-2" />
                Go to Homepage
              </Button>
            </Link>
            <Button
              variant="outline"
              size="lg"
              onClick={() => window.history.back()}
              className="w-full sm:w-auto"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Go Back
            </Button>
          </div>

          {/* Popular Links */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4">Popular Pages</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {popularLinks.map((link, index) => (
                <Link key={index} href={link.href}>
                  <Button
                    variant="ghost"
                    className="w-full justify-start hover:bg-white hover:shadow-sm"
                  >
                    <link.icon className="h-4 w-4 mr-2" />
                    {link.name}
                  </Button>
                </Link>
              ))}
            </div>
          </div>

          {/* Search Suggestion */}
          <div className="mt-8 p-6 border rounded-lg">
            <h3 className="font-bold mb-2">Looking for something specific?</h3>
            <p className="text-gray-600 mb-4">
              Try using our search feature to find exactly what you need.
            </p>
            <Link href="/products">
              <Button variant="outline">
                <Search className="h-4 w-4 mr-2" />
                Search Products
              </Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
};

export default NotFound;
