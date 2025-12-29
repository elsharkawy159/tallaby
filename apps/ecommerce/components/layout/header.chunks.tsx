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

  return (
    <Button asChild className={cn("text-sm", className)} size="sm">
      <Link
        href={
          user?.user_metadata?.is_seller
            ? "https://dashboard.tallaby.com/"
            : "/onboarding"
        }
        target={user?.user_metadata?.is_seller ? "_blank" : "_self"}
      >
        {user?.user_metadata?.is_seller ? "View Dashboard" : "Start Selling"}
      </Link>
    </Button>
  );
};
