import { getCartItems } from "@/actions/cart";

export const CartCount = async () => {
  const cartResult = await getCartItems();
  const itemCount = cartResult.success ? (cartResult.data?.itemCount ?? 0) : 0;
  if (itemCount === 0) return null;

  return (
    <span
      className={
        "absolute md:-top-1 -top-1.5 md:-right-1 -right-1 bg-red-500 text-white md:text-xs text-[10px] rounded-full md:size-5 size-4 flex items-center justify-center"
      }
    >
      {itemCount}
    </span>
  );
};
