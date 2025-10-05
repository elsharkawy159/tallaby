import {
  Facebook,
  Instagram,
  Twitter,
  Youtube,
  Mail,
  ArrowRight,
  MapPin,
  Phone,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Logo } from "./header.chunks";

const Footer = () => {
  return (
    <footer className="relative bg-primary text-white overflow-hidden">
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/80 to-primary" />

      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(120,119,198,0.1),transparent_50%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(120,119,198,0.05),transparent_50%)] pointer-events-none" />

      <div className="relative z-10 container mx-auto px-4 py-16">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 lg:gap-8 mb-12">
          {/* Brand Column */}
          <div className="lg:col-span-2">
            <div className="mb-6">
              <div className="mb-4">
                <Logo />
              </div>
              <p className="text-gray-300 text-sm leading-relaxed mb-6 max-w-sm">
                Your ultimate destination for fashion-forward styles. We curate
                the latest trends and timeless pieces to help you express your
                unique style.
              </p>
            </div>

            {/* Contact Info */}
            <div className="space-y-3 text-sm text-gray-300">
              <div className="flex items-center gap-3">
                <MapPin className="h-4 w-4 text-accent flex-shrink-0" />
                <span>123 Fashion Street, Style City, SC 12345</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-accent flex-shrink-0" />
                <span>+1 (555) 123-STYLE</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-accent flex-shrink-0" />
                <span>hello@tallaby.com</span>
              </div>
            </div>
          </div>

          {/* Company Links */}
          <div>
            <h4 className="font-semibold mb-6 text-white relative">
              Company
              <div className="absolute -bottom-2 left-0 w-8 h-0.5 bg-gradient-to-r from-accent to-accent/50 rounded-full" />
            </h4>
            <ul className="space-y-3 text-sm">
              {[
                { href: "/about", label: "About Us" },
                { href: "/contact", label: "Contact Us" },
                { href: "/stores", label: "Store Locator" },
                { href: "/careers", label: "Careers" },
                { href: "/press", label: "Press & Media" },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-gray-300 hover:text-white transition-colors duration-200 inline-block"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h4 className="font-semibold mb-6 text-white relative">
              Support
              <div className="absolute -bottom-2 left-0 w-8 h-0.5 bg-gradient-to-r from-accent to-accent/50 rounded-full" />
            </h4>
            <ul className="space-y-3 text-sm">
              {[
                { href: "/help", label: "Help Center" },
                { href: "/returns", label: "Returns & Exchanges" },
                { href: "/shipping", label: "Shipping Info" },
                { href: "/size-guide", label: "Size Guide" },
                { href: "/faq", label: "FAQ" },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-gray-300 hover:text-white transition-colors duration-200 inline-block"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Social & Legal */}
          <div>
            <h4 className="font-semibold mb-6 text-white relative">
              Connect
              <div className="absolute -bottom-2 left-0 w-8 h-0.5 bg-gradient-to-r from-accent to-accent/50 rounded-full" />
            </h4>

            {/* Social Media */}
            <div className="flex flex-wrap gap-3 mb-6">
              {[
                { icon: Facebook, href: "#", label: "Facebook" },
                { icon: Instagram, href: "#", label: "Instagram" },
                { icon: Twitter, href: "#", label: "Twitter" },
                { icon: Youtube, href: "#", label: "YouTube" },
              ].map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  className="w-10 h-10 bg-slate-800 hover:bg-gradient-to-r hover:from-accent hover:to-accent/80 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 group"
                  aria-label={social.label}
                >
                  <social.icon className="h-5 w-5 text-gray-300 group-hover:text-white transition-colors" />
                </a>
              ))}
            </div>

            {/* Payment Methods */}
            <div className="mb-6">
              <h5 className="text-sm font-medium mb-3 text-white">We Accept</h5>
              <div className="flex gap-2 flex-wrap">
                {["VISA", "MC", "AMEX", "PP"].map((payment) => (
                  <div
                    key={payment}
                    className="bg-white text-slate-900 px-3 py-1.5 rounded-md text-xs font-bold shadow-sm"
                  >
                    {payment}
                  </div>
                ))}
              </div>
            </div>

            {/* Legal Links */}
            <ul className="space-y-2 text-xs">
              {[
                { href: "/privacy", label: "Privacy Policy" },
                { href: "/terms", label: "Terms of Service" },
                { href: "/cookies", label: "Cookie Policy" },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-gray-400 hover:text-gray-200 transition-colors duration-200"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-700 pt-8">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-gray-400 text-sm text-center sm:text-left">
              © 2024 tallaby.com, Inc. All rights reserved.
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 text-xs text-gray-400">
              <span>Made with ❤️ for fashion lovers</span>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <span>All systems operational</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
