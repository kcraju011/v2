import { redirect } from "next/navigation";
import { getDefaultTenant } from "@/lib/tenant/config";

export default function AdminPage() {
  redirect(`/t/${getDefaultTenant().slug}/dashboard/admin`);
}
