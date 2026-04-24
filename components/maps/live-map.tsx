"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useLiveLocations } from "@/hooks/use-live-locations";
import type { TenantConfig } from "@/lib/tenant/config";

export function LiveMap({ tenant }: { tenant: TenantConfig }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.LayerGroup | null>(null);
  const rows = useLiveLocations(tenant);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    mapRef.current = L.map(containerRef.current, { zoomControl: true, attributionControl: false }).setView([13.32609, 77.12623], 16);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19 }).addTo(mapRef.current);
    markersRef.current = L.layerGroup().addTo(mapRef.current);
  }, []);

  useEffect(() => {
    if (!mapRef.current || !markersRef.current) return;
    markersRef.current.clearLayers();

    const points: L.LatLngExpression[] = [];
    rows.forEach((row) => {
      if (typeof row.latitude !== "number" || typeof row.longitude !== "number") return;
      const color = row.status === "in" ? "#16a34a" : row.status === "recent" ? "#ca8a04" : "#dc2626";
      L.circleMarker([row.latitude, row.longitude], {
        radius: 9,
        color,
        fillColor: color,
        fillOpacity: 0.8,
        weight: 2
      })
        .bindPopup(`<strong>${row.name}</strong><br>${row.department}<br>${row.latitude.toFixed(5)}, ${row.longitude.toFixed(5)}`)
        .addTo(markersRef.current!);
      points.push([row.latitude, row.longitude]);
    });

    if (points.length) {
      mapRef.current.fitBounds(points, { padding: [30, 30] });
    }
  }, [rows]);

  return (
    <section className="frame p-6">
      <div className="section-title">Leaflet Map</div>
      <h2 className="text-lg font-semibold text-white">Live campus presence</h2>
      <div ref={containerRef} className="mt-5 h-[420px] overflow-hidden rounded-3xl border border-line bg-panelSoft" />
    </section>
  );
}
