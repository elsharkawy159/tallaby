import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { LucideIcon } from "lucide-react";
import Link from "next/link";

interface ContactMethodCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  value: string;
  availability: string;
  link?: string;
  isExternal?: boolean;
}

export function ContactMethodCard({
  icon: Icon,
  title,
  description,
  value,
  availability,
  link,
  isExternal,
}: ContactMethodCardProps) {
  const cardContent = (
    <Card
      className={`text-center hover:shadow-lg transition-shadow ${
        link ? "cursor-pointer" : ""
      }`}
    >
      <CardHeader>
        <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center mx-auto mb-3">
          <Icon className="h-6 w-6 text-white" />
        </div>
        <CardTitle className="text-lg">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="font-medium text-primary mb-1">{value}</p>
        <p className="text-sm text-gray-600">{availability}</p>
      </CardContent>
    </Card>
  );

  if (!link) {
    return cardContent;
  }

  return (
    <Link
      href={link}
      target={isExternal ? "_blank" : "_self"}
      rel={isExternal ? "noopener noreferrer" : undefined}
      className="block"
    >
      {cardContent}
    </Link>
  );
}
