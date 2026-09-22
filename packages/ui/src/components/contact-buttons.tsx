import * as React from "react";
import { Mail, MessageCircle, Phone } from "lucide-react";
import type { VariantProps } from "class-variance-authority";

import { Button, buttonVariants } from "@workspace/ui/components/button";
import {
  buildMailtoUrl,
  buildTelUrl,
  buildWhatsAppUrl,
} from "@workspace/ui/lib/contact";

type ContactLinkProps = Omit<React.ComponentProps<"a">, "href"> &
  VariantProps<typeof buttonVariants> & {
    label?: string;
  };

interface WhatsAppButtonProps extends ContactLinkProps {
  phone: string | null | undefined;
  /** Pre-filled message text. */
  text?: string;
}

interface EmailButtonProps extends ContactLinkProps {
  email: string | null | undefined;
  subject?: string;
  body?: string;
}

interface CallButtonProps extends ContactLinkProps {
  phone: string | null | undefined;
}

function ContactLink({
  href,
  icon,
  label,
  variant = "outline",
  size = "sm",
  className,
  external,
  ...props
}: ContactLinkProps & {
  href: string;
  icon: React.ReactNode;
  external?: boolean;
}) {
  return (
    <Button variant={variant} size={size} className={className} asChild>
      <a
        href={href}
        {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        {...props}
      >
        {icon}
        {label}
      </a>
    </Button>
  );
}

function WhatsAppButton({
  phone,
  text,
  label = "WhatsApp",
  ...props
}: WhatsAppButtonProps) {
  const href = buildWhatsAppUrl(phone, text);
  if (!href) return null;

  return (
    <ContactLink
      href={href}
      external
      label={label}
      icon={<MessageCircle className="size-4 text-[#25D366]" />}
      {...props}
    />
  );
}

function EmailButton({
  email,
  subject,
  body,
  label = "Email",
  ...props
}: EmailButtonProps) {
  const href = buildMailtoUrl(email, { subject, body });
  if (!href) return null;

  return (
    <ContactLink
      href={href}
      label={label}
      icon={<Mail className="size-4" />}
      {...props}
    />
  );
}

function CallButton({ phone, label = "Call", ...props }: CallButtonProps) {
  const href = buildTelUrl(phone);
  if (!href) return null;

  return (
    <ContactLink
      href={href}
      label={label}
      icon={<Phone className="size-4" />}
      {...props}
    />
  );
}

export { WhatsAppButton, EmailButton, CallButton };
export type { WhatsAppButtonProps, EmailButtonProps, CallButtonProps };
