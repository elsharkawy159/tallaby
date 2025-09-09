import { getCartItems } from "@/actions/cart";
import CartClient from "./cart.client";

export default async function Cart() {
  const cart = await getCartItems();
  return <CartClient initialData={cart as any} />;
}
