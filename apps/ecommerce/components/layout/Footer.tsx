import { Mail, MapPin, Phone } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Logo } from "../logo";
import { getTranslations } from "next-intl/server";
import { InstallAppButton } from "../install-app-button";
import { TALLABY_CONTACT_EMAIL } from "@/lib/contact";
import { SocialBrandLinks } from "./social-brand-icons";
import { PaymentMethodIcons } from "./payment-method-icons";

const Footer = async () => {
  const t = await getTranslations("footer");
  return (
    <footer className="relative bg-primary text-white overflow-hidden">
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/80 to-primary" />

      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(120,119,198,0.1),transparent_50%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(120,119,198,0.05),transparent_50%)] pointer-events-none" />

      <div className="relative z-10 container mx-auto px-4 py-16 lg:pb-10 pb-26 mt-10">
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
                  href={`https://wa.me/201003272830`}
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
                  href={`mailto:${TALLABY_CONTACT_EMAIL}`}
                  className="hover:text-white transition-colors"
                >
                  {TALLABY_CONTACT_EMAIL}
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
                { href: "/affiliate", label: t("affiliateProgram") },
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
                { href: "/payment", label: t("paymentMethods") },
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

          {/* Legal */}
          <div>
            <h4 className="font-semibold mb-6 text-white relative">
              {t("legal")}
              <div className="absolute -bottom-2 start-0 w-8 h-0.5 bg-gradient-to-r from-accent to-accent/50 rounded-full" />
            </h4>

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

        <div className="my-8 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between w-full">
              <div>
                <h5 className="sr-only">
                  {t("connect")}
                </h5>
                <SocialBrandLinks />
              </div>

              <div>
                <h5 className="sr-only">
                  {t("weAccept")}
                </h5>
                <PaymentMethodIcons />
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
