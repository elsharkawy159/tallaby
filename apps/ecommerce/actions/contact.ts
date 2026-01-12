"use server";

import { createClient } from "@/supabase/server";
import { getUser } from "./auth";
import type {
  ContactFormAuthenticatedData,
  ContactFormGuestData,
} from "@/lib/validations/contact-schema";

type ContactFormData = ContactFormAuthenticatedData | ContactFormGuestData;

type ActionResult = {
  success: boolean;
  message: string;
  errors?: Record<string, string[]>;
};

export async function submitContactForm(
  data: ContactFormData
): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const user = await getUser();

    // Extract user data if logged in
    const userId = user?.user?.id ?? null;
    const userEmail = user?.user?.email ?? null;
    const userMetadata = user?.user?.user_metadata ?? {};
    const userFullName =
      userMetadata.fullName ||
      userMetadata.full_name ||
      userMetadata.name ||
      (userMetadata.firstName && userMetadata.lastName
        ? `${userMetadata.firstName} ${userMetadata.lastName}`
        : "") ||
      "";
    const userPhone = user?.user?.phone || userMetadata.phone || null;

    // Prepare contact data based on user status
    const contactData: {
      user_id: string | null;
      full_name: string;
      email: string;
      phone: string | null;
      subject: string;
      message: string;
      request_call: boolean;
      is_replied: boolean;
    } = {
      user_id: userId,
      full_name: userId
        ? userFullName || ""
        : (data as ContactFormGuestData).fullName,
      email: userId ? userEmail || "" : (data as ContactFormGuestData).email,
      phone: userId ? userPhone : (data as ContactFormGuestData).phone || null,
      subject: data.subject,
      message: data.message,
      request_call: data.requestCall ?? false,
      is_replied: false,
    };

    // Insert into contacts table using Supabase client
    const { error: insertError } = await supabase
      .from("contacts")
      .insert([contactData]);

    if (insertError) {
      console.error("Error submitting contact form:", insertError);
      return {
        success: false,
        message: "Failed to submit contact form. Please try again.",
      };
    }

    return {
      success: true,
      message: "",
    };
  } catch (error) {
    console.error("Error submitting contact form:", error);
    return {
      success: false,
      message: "An unexpected error occurred. Please try again.",
    };
  }
}
