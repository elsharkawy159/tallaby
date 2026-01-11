import { render } from "@react-email/render";
import { Resend } from "resend";
import type { ReactElement } from "react";

const adminMail =
  `${process.env.EMAIL_FROM_NAME} <${process.env.EMAIL_FROM}>` ||
  "Tallaby <info@tallaby.com>";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendEmail({
  to,
  subject,
  content,
}: {
  to: string;
  subject: string;
  content: ReactElement;
}): Promise<void> {
  try {
    const html = await render(content);

    const response = await resend.emails.send({
      from: adminMail,
      to: to,
      subject: subject,
      html: html,
    });
    console.log("Email sent successfully", response);
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
}
