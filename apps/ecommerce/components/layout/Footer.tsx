import { Facebook, Instagram, Twitter, Youtube } from "lucide-react";
import Link from "next/link";

const Footer = () => {
  return (
    <footer className="bg-primary text-white mt-16">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Stylist Column */}
          <div>
            <h3 className="font-semibold mb-4">Stylist</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/about" className="hover:text-accent">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-accent">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link href="/stores" className="hover:text-accent">
                  Stores
                </Link>
              </li>
              <li>
                <Link href="/help" className="hover:text-accent">
                  Size Guide
                </Link>
              </li>
              <li>
                <Link href="/categories" className="hover:text-accent">
                  Categories
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Service Column */}
          <div>
            <h3 className="font-semibold mb-4">Customer Service</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/returns" className="hover:text-accent">
                  Return Policy
                </Link>
              </li>
              <li>
                <Link href="/help" className="hover:text-accent">
                  Language and User Info
                </Link>
              </li>
              <li>
                <Link href="/help" className="hover:text-accent">
                  Help and Contact Us
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-accent">
                  Terms and Conditions
                </Link>
              </li>
              <li>
                <Link href="/security" className="hover:text-accent">
                  Security Center
                </Link>
              </li>
              <li>
                <Link href="/faq" className="hover:text-accent">
                  FAQ
                </Link>
              </li>
            </ul>
          </div>

          {/* Work With Us Column */}
          <div>
            <h3 className="font-semibold mb-4">Work With Us</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/careers" className="hover:text-accent">
                  Careers
                </Link>
              </li>
              <li>
                <Link href="/become-seller" className="hover:text-accent">
                  Influencer Program
                </Link>
              </li>
              <li>
                <Link href="/become-seller" className="hover:text-accent">
                  Become a Partner
                </Link>
              </li>
            </ul>
          </div>

          {/* Follow Us Section */}
          <div>
            <h3 className="font-semibold mb-4">Follow Us On</h3>
            <div className="flex space-x-4 mb-6">
              <a href="#" className="hover:text-accent">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="hover:text-accent">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" className="hover:text-accent">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="hover:text-accent">
                <Youtube className="h-5 w-5" />
              </a>
            </div>

            <div>
              <h4 className="font-semibold mb-2">We Accept</h4>
              <div className="flex space-x-2">
                <div className="bg-white text-black px-2 py-1 rounded text-xs font-bold">
                  VISA
                </div>
                <div className="bg-white text-black px-2 py-1 rounded text-xs font-bold">
                  MC
                </div>
                <div className="bg-white text-black px-2 py-1 rounded text-xs font-bold">
                  PP
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-white/20 mt-8 pt-8 text-center text-sm">
          <p>&copy;2024 Stylist.com, Inc.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
