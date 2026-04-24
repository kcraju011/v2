import { redirect } from "next/navigation";
import { getDefaultTenant } from "@/lib/tenant/config";

export default function LoginPage() {
  redirect(`/t/${getDefaultTenant().slug}/login`);
}
