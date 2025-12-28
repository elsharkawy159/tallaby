import Link from "next/link";
import { Button } from "@workspace/ui/components/button";
import { cn } from "@/lib/utils";
import type { User } from "@supabase/supabase-js";

export const BecomeSellerButton = ({
  className,
  user,
}: {
  className?: string;
  user: User | null;
}) => {
  // Hide button if user is already a seller
  if (user?.user_metadata?.is_seller === true) {
    return null;
  }

  return (
    <Button asChild className={cn("text-sm", className)} size="sm">
      <Link href={"/become-seller"}>Become a Partner</Link>
    </Button>
  );
};
