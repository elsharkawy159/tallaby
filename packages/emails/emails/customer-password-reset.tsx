import { PasswordResetEmail } from "../src/index.js";

export default function CustomerPasswordReset() {
  return PasswordResetEmail({
    locale: "ar",
    email: "customer@example.com",
    actionUrl: "https://tallaby.com/auth/reset?token=XXXX",
  });
}
