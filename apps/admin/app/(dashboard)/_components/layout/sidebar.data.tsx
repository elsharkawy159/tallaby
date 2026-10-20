import Sidebar from "./sidebar";
import { getCurrentAdminUser } from "@/lib/auth/admin-auth";
import { getSidebarCounts } from "./sidebar.server";

export default async function SidebarData() {
  // Both are React.cache-wrapped; the layout already loaded the user.
  const [counts, admin] = await Promise.all([getSidebarCounts(), getCurrentAdminUser()]);
  const user = { name: admin.fullName?.trim() || admin.email.split("@")[0] || "Admin", email: admin.email };

  return <Sidebar counts={counts} user={user} />;
}
