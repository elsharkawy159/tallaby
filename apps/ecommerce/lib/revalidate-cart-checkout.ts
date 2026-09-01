import { revalidatePath } from "next/cache";

export function revalidateCartCheckout() {
  revalidatePath("/cart");
  revalidatePath("/cart/checkout");
  revalidatePath("/cart/checkout/payment");
}
