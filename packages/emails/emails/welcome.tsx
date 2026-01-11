import { WelcomeEmail } from "../src/index.js";

export default function Welcome() {
  return WelcomeEmail({
    customerName: "Omar",
    discountCode: "WELCOME10",
    discountPercent: 10,
  });
}
