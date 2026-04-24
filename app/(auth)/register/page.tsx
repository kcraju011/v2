import { redirect } from "next/navigation";
import { getDefaultTenant } from "@/lib/tenant/config";

export default function RegisterPage() {
  redirect(`/t/${getDefaultTenant().slug}/register`);
}
