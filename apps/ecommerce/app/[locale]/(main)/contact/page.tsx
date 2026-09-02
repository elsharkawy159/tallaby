import { DynamicBreadcrumb } from "@/components/layout/dynamic-breadcrumb";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ContactFormWrapper } from "./contact-form-wrapper.client";
import { ContactMethodCard } from "./contact-method-card";
import { Mail, MessageCircle } from "lucide-react";

export const metadata: Metadata = {
  title: "Contact Us | Tallaby.com",
  description:
    "Get in touch with Tallaby.com customer support. We're here to help with orders, products, returns, and any questions. Multiple contact methods available.",
  openGraph: {
    title: "Contact Us | Tallaby.com",
    description:
      "Get in touch with Tallaby.com customer support. We're here to help with orders, products, returns, and any questions. Multiple contact methods available.",
    url: "https://www.tallaby.com/contact",
    siteName: "Tallaby.com",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Contact Tallaby.com",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Contact Us | Tallaby.com",
    description:
      "Get in touch with Tallaby.com customer support. We're here to help with orders, products, returns, and any questions.",
    images: ["/og-image.jpg"],
    site: "@tallaby",
  },
  alternates: {
    canonical: "https://www.tallaby.com/contact",
  },
};

export default async function Contact() {
  const t = await getTranslations("pages.contactPage");

  const contactMethods = [
    {
      icon: Mail,
      title: t("emailSupport"),
      description: t("emailSupportDescription"),
      value: t("emailSupportValue"),
      availability: t("emailSupportAvailability"),
      link: `mailto:${t("emailSupportValue")}`,
    },
    {
      icon: MessageCircle,
      title: t("liveChat"),
      description: t("liveChatDescription"),
      value: t("liveChatValue"),
      availability: t("liveChatAvailability"),
      link: "https://wa.me/201003272830",
      isExternal: true,
    },
  ];

  return (
    <>
      <DynamicBreadcrumb />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-gray-50 py-12">
          <div className="container text-center">
            <h1 className="text-4xl font-bold mb-4">{t("getInTouch")}</h1>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              {t("heroDescription")}
            </p>
          </div>
        </section>

        {/* Contact Methods */}
        <section className="py-16">
          <div className="container">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
              {contactMethods.map((method, index) => (
                <ContactMethodCard
                  key={index}
                  icon={method.icon}
                  title={method.title}
                  description={method.description}
                  value={method.value}
                  availability={method.availability}
                  link={method.link}
                  isExternal={method.isExternal}
                />
              ))}
            </div>

            <div className="grid grid-cols-1 gap-12">
              <ContactFormWrapper />
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
