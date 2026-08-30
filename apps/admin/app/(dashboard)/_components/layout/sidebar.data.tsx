import Sidebar from "./sidebar";
import { getSidebarCounts } from "./sidebar.server";

export default async function SidebarData() {
  const counts = await getSidebarCounts();

  return <Sidebar counts={counts} />;
}
