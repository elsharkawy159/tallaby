"use client";

import { useAuthUser } from "@/lib/auth/use-auth-user";
import { ContactForm } from "./contact.chunks";

/**
 * Resolves the viewer on the client so /contact stays a prerendered page.
 *
 * ContactForm picks its schema and default values once, at mount, from
 * whether the viewer is signed in — so it is only mounted after the auth
 * lookup settles rather than being remounted underneath a half-filled form.
 */
export function ContactFormWrapper() {
  const { user, isLoading } = useAuthUser();

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto w-full animate-pulse space-y-6" aria-hidden>
        <div className="h-8 w-48 rounded-md bg-muted" />
        <div className="h-10 rounded-md bg-muted" />
        <div className="h-10 rounded-md bg-muted" />
        <div className="h-10 rounded-md bg-muted" />
        <div className="h-32 rounded-md bg-muted" />
        <div className="h-10 w-32 rounded-md bg-muted" />
      </div>
    );
  }

  return <ContactForm user={user} />;
}
