import { Sidebar } from "./Sidebar";
import { getSidebarCounts } from "./sidebar.server";

export async function SidebarData() {
  const counts = await getSidebarCounts();

  return <Sidebar counts={counts} />;
}
