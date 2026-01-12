import {
  Facebook,
  Instagram,
  Mail,
  ArrowRight,
  MapPin,
  Phone,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Logo } from "../logo";
import { getTranslations } from "next-intl/server";
import { InstallAppButton } from "../install-app-button";

const Footer = async () => {
  const t = await getTranslations("footer");
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
                {t("description")}
              </p>
            </div>

            {/* Contact Info */}
            <div className="space-y-3 text-sm text-gray-300">
              <div className="flex items-center gap-3">
                <MapPin className="h-4 w-4 text-accent flex-shrink-0" />
                <span>{t("address")}</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-accent flex-shrink-0" />
                <a
                  href={`https://wa.me/201013626248`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors"
                >
                  {t("phone")}
                </a>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-accent flex-shrink-0" />
                <a
                  href={`mailto:${t("email")}`}
                  className="hover:text-white transition-colors"
                >
                  {t("email")}
                </a>
              </div>
            </div>

            {/* Install App Button */}
            <div className="mt-6">
              <InstallAppButton />
            </div>
          </div>

          {/* Company Links */}
          <div>
            <h4 className="font-semibold mb-6 text-white relative">
              {t("company")}
              <div className="absolute -bottom-2 start-0 w-8 h-0.5 bg-gradient-to-r from-accent to-accent/50 rounded-full" />
            </h4>
            <ul className="space-y-3 text-sm">
              {[
                { href: "/about", label: t("aboutUs") },
                { href: "/contact", label: t("contactUs") },
                { href: "/stores", label: t("storeLocator") },
                { href: "/careers", label: t("careers") },
                { href: "/press", label: t("pressMedia") },
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
              {t("support")}
              <div className="absolute -bottom-2 start-0 w-8 h-0.5 bg-gradient-to-r from-accent to-accent/50 rounded-full" />
            </h4>
            <ul className="space-y-3 text-sm">
              {[
                { href: "/help", label: t("helpCenter") },
                { href: "/returns", label: t("returnsExchanges") },
                { href: "/shipping", label: t("shippingInfo") },
                { href: "/size-guide", label: t("sizeGuide") },
                { href: "/faq", label: t("faq") },
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
              {t("connect")}
              <div className="absolute -bottom-2 start-0 w-8 h-0.5 bg-gradient-to-r from-accent to-accent/50 rounded-full" />
            </h4>

            {/* Social Media */}
            <div className="flex flex-wrap gap-3 mb-6">
              {[
                {
                  icon: Facebook,
                  href: "https://www.facebook.com/profile.php?id=100070155523046",
                  label: "Facebook",
                },
                {
                  icon: Instagram,
                  href: "https://www.instagram.com/tallabycommerce/",
                  label: "Instagram",
                },
              ].map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-slate-800 hover:bg-gradient-to-r hover:from-accent hover:to-accent/80 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 group"
                  aria-label={social.label}
                >
                  <social.icon className="h-5 w-5 text-gray-300 group-hover:text-white transition-colors" />
                </a>
              ))}
            </div>

            {/* Payment Methods */}
            <div className="mb-6">
              <h5 className="text-sm font-medium mb-3 text-white">
                {t("weAccept")}
              </h5>
              <div className="flex gap-2 flex-wrap">
                {[t("wallet"), t("instapay")].map((payment) => (
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
                { href: "/privacy", label: t("privacyPolicy") },
                { href: "/terms", label: t("termsOfService") },
                { href: "/cookies", label: t("cookiePolicy") },
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
              {t("copyright", { year: new Date().getFullYear() })}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
