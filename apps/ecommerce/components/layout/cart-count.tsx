import { getCartItems } from "@/actions/cart";

export const CartCount = async () => {
  const cartResult = await getCartItems();
  const itemCount = cartResult.success ? (cartResult.data?.itemCount ?? 0) : 0;
  if (itemCount === 0) return null;

  return (
    <span
      className={
        "absolute md:-top-1 -top-2 md:-right-1 -right-2 bg-red-500 text-white text-xs rounded-full size-5 flex items-center justify-center"
      }
    >
      {itemCount}
    </span>
  );
};
