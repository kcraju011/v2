"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { TenantConfig } from "@/lib/tenant/config";
import { getLiveAttendance, type LiveAttendanceRow } from "@/lib/supabase/api";

export function useLiveAttendance(tenant: TenantConfig) {
  const [rows, setRows] = useState<LiveAttendanceRow[]>([]);

  useEffect(() => {
    if (!tenant?.id) return;
    const supabase = createClient();
    let active = true;

    const loadRows = async () => {
      const data = await getLiveAttendance(supabase, tenant.id);
      if (active) {
        setRows(data);
      }
    };

    void loadRows();

    const channel = supabase
      .channel(`attendance:${tenant.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "attendance", filter: `tenant_id=eq.${tenant.id}` },
        () => {
          void loadRows();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "sessions", filter: `tenant_id=eq.${tenant.id}` },
        () => {
          void loadRows();
        }
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [tenant.id]);

  return rows;
}
