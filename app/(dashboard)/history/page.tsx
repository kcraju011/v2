import { redirect } from "next/navigation";
import { getDefaultTenant } from "@/lib/tenant/config";

export default function HistoryPage() {
  redirect(`/t/${getDefaultTenant().slug}/dashboard/history`);
}
