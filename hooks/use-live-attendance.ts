"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { mockLiveUsers } from "@/lib/tenant/mock-data";
import type { TenantConfig } from "@/lib/tenant/config";

export function useLiveAttendance(tenant: TenantConfig) {
  const [rows, setRows] = useState(mockLiveUsers);

  useEffect(() => {
    if (!tenant?.id) return;
    const supabase = createClient(tenant);
    const channel = supabase
      .channel(`attendance:${tenant.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "attendance", filter: `tenant_id=eq.${tenant.id}` },
        () => {}
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tenant]);

  return rows;
}
