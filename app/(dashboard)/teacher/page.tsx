import { redirect } from "next/navigation";
import { getDefaultTenant } from "@/lib/tenant/config";

export default function TeacherPage() {
  redirect(`/t/${getDefaultTenant().slug}/dashboard/teacher`);
}
