import { MapPin, ChevronDown } from "lucide-react";
import { createClient } from "@/supabase/server";
import { getAddresses } from "@/actions/customer";
import { AddressSelectorDialog } from "@/components/shared/address-dialog";
import { cn } from "@/lib/utils";
import type { User } from "@supabase/supabase-js";

interface DeliveryLocationProps {
  className?: string;
  user: User | null;
}

export const DeliveryLocation = async ({
  className,
  user,
}: DeliveryLocationProps) => {
  const addressesResult = await getAddresses();
  const addresses = addressesResult.success ? (addressesResult.data ?? []) : [];
  const defaultAddress = addresses.find((addr: any) => addr.isDefault) ?? null;

  // Use defaultAddress from provider or fallback to first address
  const currentAddress = defaultAddress || addresses[0];

  // If no address, prompt to add one
  if (!currentAddress) {
    return (
      <AddressSelectorDialog
        trigger={
          <button
            className={cn(
              "flex items-center gap-2 text-white hover:text-gray-200 transition-colors cursor-pointer",
              className
            )}
          >
            <MapPin className="md:size-5 size-4 flex-shrink-0" />
            <div className="flex flex-col items-start text-left">
              <div className="text-xs font-normal">
                Deliver to{" "}
                <span className="capitalize">
                  {user?.user_metadata?.full_name?.split(" ")[0] ||
                    user?.email?.split("@")[0] ||
                    "Guest"}
                </span>
              </div>
              <span className="md:text-sm text-xs font-semibold flex items-center gap-1">
                Add delivery address
                <ChevronDown className="size-3" />
              </span>
            </div>
          </button>
        }
      />
    );
  }

  // Show delivery location with address
  return (
    <AddressSelectorDialog
      trigger={
        <button
          className={cn(
            "flex items-center gap-2 text-white hover:text-gray-200 transition-colors cursor-pointer",
            className
          )}
        >
          <MapPin className="h-5 w-5 flex-shrink-0" />
          <div className="flex flex-col items-start text-left">
            <span className="text-xs font-normal">
              Deliver to{" "}
              {currentAddress.fullName.split(" ")[0] ||
                user?.user_metadata?.full_name?.split(" ")[0] ||
                "you"}
            </span>
            <span className="text-sm font-semibold flex items-center gap-1 truncate max-w-[150px]">
              {currentAddress.city || currentAddress.state || "Your location"}
              <ChevronDown className="h-3 w-3 flex-shrink-0" />
            </span>
          </div>
        </button>
      }
    />
  );
};
