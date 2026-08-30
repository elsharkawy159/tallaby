import { Sidebar } from "./Sidebar";
import { getSidebarCounts } from "./sidebar.server";

interface SidebarDataProps {
  isOpen?: boolean;
  onToggle?: () => void;
}

export async function SidebarData({ isOpen, onToggle }: SidebarDataProps) {
  const counts = await getSidebarCounts();

  return <Sidebar counts={counts} isOpen={isOpen} onToggle={onToggle} />;
}
