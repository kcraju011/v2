import { redirect } from "next/navigation";
import { getDefaultTenant } from "@/lib/tenant/config";

export default function AnalyticsPage() {
  redirect(`/t/${getDefaultTenant().slug}/dashboard/analytics`);
}
