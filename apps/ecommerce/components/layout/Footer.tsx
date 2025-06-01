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
                <Link href="/about" className="hover:text-secondary">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-secondary">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link href="/stores" className="hover:text-secondary">
                  Stores
                </Link>
              </li>
              <li>
                <Link href="/help" className="hover:text-secondary">
                  Size Guide
                </Link>
              </li>
              <li>
                <Link href="/categories" className="hover:text-secondary">
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
                <Link href="/returns" className="hover:text-secondary">
                  Return Policy
                </Link>
              </li>
              <li>
                <Link href="/help" className="hover:text-secondary">
                  Language and User Info
                </Link>
              </li>
              <li>
                <Link href="/help" className="hover:text-secondary">
                  Help and Contact Us
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-secondary">
                  Terms and Conditions
                </Link>
              </li>
              <li>
                <Link href="/security" className="hover:text-secondary">
                  Security Center
                </Link>
              </li>
              <li>
                <Link href="/faq" className="hover:text-secondary">
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
                <Link href="/careers" className="hover:text-secondary">
                  Careers
                </Link>
              </li>
              <li>
                <Link href="/become-seller" className="hover:text-secondary">
                  Influencer Program
                </Link>
              </li>
              <li>
                <Link href="/become-seller" className="hover:text-secondary">
                  Become a Partner
                </Link>
              </li>
            </ul>
          </div>

          {/* Follow Us Section */}
          <div>
            <h3 className="font-semibold mb-4">Follow Us On</h3>
            <div className="flex space-x-4 mb-6">
              <a href="#" className="hover:text-secondary">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="hover:text-secondary">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" className="hover:text-secondary">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="hover:text-secondary">
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
