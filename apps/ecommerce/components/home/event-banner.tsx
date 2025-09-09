import Link from "next/link";
import { Button } from "@workspace/ui/components/button";
import { Badge } from "@workspace/ui/components/badge";

interface EventBannerProps {
  title: string;
  subtitle?: string;
  description?: string;
  ctaText?: string;
  ctaLink?: string;
  badgeText?: string;
  badgeVariant?: "default" | "secondary" | "destructive" | "outline";
  backgroundImage?: string;
  backgroundColor?: string;
  textColor?: string;
  className?: string;
}

export default function EventBanner({
  title,
  subtitle,
  description,
  ctaText = "Shop Now",
  ctaLink = "/products",
  badgeText,
  badgeVariant = "destructive",
  backgroundImage,
  backgroundColor = "bg-gradient-to-r from-blue-600 to-purple-600",
  textColor = "text-white",
  className = "",
}: EventBannerProps) {
  return (
    <section className={`lg:py-8 py-5 container mx-auto ${className}`}>
      <div
        className={`relative overflow-hidden rounded-2xl ${backgroundColor} ${textColor}`}
        style={
          backgroundImage
            ? {
                backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url(${backgroundImage})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }
            : undefined
        }
      >
        <div className="relative z-10 px-8 py-12 md:px-12 md:py-16">
          <div className="max-w-2xl">
            {badgeText && (
              <Badge variant={badgeVariant} className="mb-4">
                {badgeText}
              </Badge>
            )}

            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
              {title}
            </h2>

            {subtitle && (
              <h3 className="text-xl md:text-2xl font-semibold mb-4 opacity-90">
                {subtitle}
              </h3>
            )}

            {description && (
              <p className="text-lg mb-8 opacity-80 leading-relaxed">
                {description}
              </p>
            )}

            <Button
              asChild
              size="lg"
              className="bg-white text-gray-900 hover:bg-gray-100 font-semibold"
            >
              <Link href={ctaLink}>{ctaText}</Link>
            </Button>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32"></div>
        <div className="absolute bottom-0 right-0 w-32 h-32 bg-white/10 rounded-full translate-y-16 translate-x-16"></div>
      </div>
    </section>
  );
}
