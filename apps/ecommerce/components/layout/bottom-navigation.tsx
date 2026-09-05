import { cn } from "@/lib/utils";
import { BottomNavClient } from "./bottom-navigation.client";
import { AuthLink } from "./auth-link";
import { getBottomNavigationItems } from "./header.lib";

export const BottomNavigation = async () => {
  const items = await getBottomNavigationItems();

  return (
    <div
      className={cn(
        "md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50",
      )}
    >
      <div className="container mx-auto">
        <nav className="flex items-center justify-around py-2">
          <BottomNavClient items={items} />
          <AuthLink variant="mobile" />
        </nav>
      </div>
    </div>
  );
};
