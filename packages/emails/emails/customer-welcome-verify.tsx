import { WelcomeVerifyEmail } from "../src/index.js";

export default function CustomerWelcomeVerify() {
  return WelcomeVerifyEmail({
    locale: "ar",
    name: "عمر",
    email: "customer@example.com",
    actionUrl: "https://tallaby.com/auth/confirm?token=XXXX",
  });
}
