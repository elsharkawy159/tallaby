import { logout } from "@/actions/auth";
import { useSiteData } from "@/providers/site-data";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@workspace/ui/components/avatar";
import { Button } from "@workspace/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import { LogOut, Settings, User, CreditCard } from "lucide-react";
import Link from "next/link";

export const UserNav = () => {
  const { seller } = useSiteData();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  // Get seller data safely with better fallbacks
  const sellerData = seller?.success ? seller.data : null;
  const businessName = sellerData?.businessName || "Business";
  const displayName = sellerData?.displayName || businessName;
  const logoUrl = sellerData?.logoUrl;
  const avatarFallback = businessName.charAt(0).toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild className="!p-0">
        <Button variant="ghost" className="relative size-10 rounded-full">
          <Avatar className="h-10 w-10">
            <AvatarImage src={logoUrl || ""} alt={`${businessName} logo`} />
            <AvatarFallback className="bg-primary text-white font-semibold">
              {avatarFallback}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" forceMount>
        <DropdownMenuItem asChild>
          <Link href="/settings" className="flex items-center">
            <User className="mr-2 h-4 w-4" />
            <span>Profile</span>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <Link href="/financial" className="flex items-center">
            <CreditCard className="mr-2 h-4 w-4" />
            <span>Billing & Payments</span>
          </Link>
        </DropdownMenuItem>

        {/* <DropdownMenuItem asChild>
          <Link href="/settings" className="flex items-center">
            <Settings className="mr-2 h-4 w-4" />
            <span>Settings</span>
          </Link>
        </DropdownMenuItem> */}

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={handleLogout}
          className="text-red-600 focus:text-red-600"
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
