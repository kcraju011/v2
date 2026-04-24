import { redirect } from "next/navigation";
import { getDefaultTenant } from "@/lib/tenant/config";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  void children;
  redirect(`/t/${getDefaultTenant().slug}/dashboard/teacher`);
}
