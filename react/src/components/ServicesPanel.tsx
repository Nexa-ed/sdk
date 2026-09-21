"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Loader2, AlertCircle, RefreshCw, ChevronDown, ChevronUp, Package } from "lucide-react";
import { useNexaContext } from "../context";
import type { TenantService, ServiceUsageResult } from "@nexa-ed/sdk";

export interface ServicesPanelProps {
  /** Called after the service list is fetched. */
  onServicesLoaded?: (services: TenantService[]) => void;
}

const statusColors: Record<string, string> = {
  active: "bg-green-100 text-green-700",
  inactive: "bg-gray-100 text-gray-600",
  pending: "bg-yellow-100 text-yellow-700",
};

export function ServicesPanel({ onServicesLoaded }: ServicesPanelProps) {
  const { basePath } = useNexaContext();

  const [services, setServices] = useState<TenantService[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [usageById, setUsageById] = useState<Record<string, ServiceUsageResult>>({});
  const [usageLoadingId, setUsageLoadingId] = useState<string | null>(null);
  const [usageErrorById, setUsageErrorById] = useState<Record<string, string>>({});

  const fetchServices = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`${basePath}/services`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error ?? data?.message ?? "Failed to load services");
      }
      const list: TenantService[] = data.services ?? [];
      setServices(list);
      onServicesLoaded?.(list);
    } catch (err: any) {
      setError(err.message ?? "Failed to load services");
    } finally {
      setIsLoading(false);
    }
  }, [basePath, onServicesLoaded]);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  const toggleExpand = async (service: TenantService) => {
    const isOpen = expandedId === service.serviceId;
    setExpandedId(isOpen ? null : service.serviceId);
    if (isOpen || usageById[service.serviceId]) return;

    setUsageLoadingId(service.serviceId);
    setUsageErrorById((prev) => ({ ...prev, [service.serviceId]: "" }));
    try {
      const res = await fetch(`${basePath}/services/${encodeURIComponent(service.serviceId)}/usage`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error ?? data?.message ?? "Failed to load usage");
      }
      setUsageById((prev) => ({ ...prev, [service.serviceId]: data }));
    } catch (err: any) {
      setUsageErrorById((prev) => ({ ...prev, [service.serviceId]: err.message ?? "Failed to load usage" }));
    } finally {
      setUsageLoadingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="rounded-lg border bg-white shadow-sm flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        <span className="ml-2 text-gray-500">Loading services…</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold">Services</h3>
          <p className="text-sm text-gray-500 mt-1">
            Platform services enabled for your school.
          </p>
        </div>
        <button
          onClick={fetchServices}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-gray-300 text-sm font-medium hover:bg-gray-50 transition-colors"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {!error && services.length === 0 && (
        <div className="rounded-lg border bg-white shadow-sm p-8 text-center text-sm text-gray-500">
          No services are enabled for this school yet.
        </div>
      )}

      <div className="space-y-3">
        {services.map((service) => {
          const isOpen = expandedId === service.serviceId;
          const usage = usageById[service.serviceId];
          const usageError = usageErrorById[service.serviceId];

          return (
            <div key={service.serviceId} className="rounded-lg border bg-white shadow-sm overflow-hidden">
              <button
                onClick={() => toggleExpand(service)}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="mt-0.5 shrink-0 rounded-md bg-gray-100 p-2">
                    <Package className="h-4 w-4 text-gray-500" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">{service.name}</span>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                          statusColors[service.status] ?? "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {service.status}
                      </span>
                    </div>
                    {service.description && (
                      <p className="text-sm text-gray-500 mt-0.5 truncate">{service.description}</p>
                    )}
                    {service.subscription?.tier && (
                      <p className="text-xs text-gray-400 mt-1">Tier: {service.subscription.tier}</p>
                    )}
                  </div>
                </div>
                {isOpen ? (
                  <ChevronUp className="h-4 w-4 text-gray-400 shrink-0" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-gray-400 shrink-0" />
                )}
              </button>

              {isOpen && (
                <div className="border-t px-4 py-4 space-y-3 bg-gray-50">
                  {service.features.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                        Features
                      </p>
                      <ul className="text-sm text-gray-700 list-disc list-inside space-y-0.5">
                        {service.features.map((feature) => (
                          <li key={feature}>{feature}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {service.availableTiers && service.availableTiers.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                        Available Tiers
                      </p>
                      <p className="text-sm text-gray-700">{service.availableTiers.join(", ")}</p>
                    </div>
                  )}

                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                      Usage
                    </p>
                    {usageLoadingId === service.serviceId ? (
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        Loading usage…
                      </div>
                    ) : usageError ? (
                      <p className="text-sm text-red-600">{usageError}</p>
                    ) : usage?.usage ? (
                      <pre className="text-xs bg-white border rounded-md p-3 overflow-x-auto">
                        {JSON.stringify(usage.usage, null, 2)}
                      </pre>
                    ) : (
                      <p className="text-sm text-gray-500">No usage data available.</p>
                    )}
                  </div>

                  {service.documentation && (
                    <a
                      href={service.documentation}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-block text-sm text-blue-600 hover:underline"
                    >
                      View documentation
                    </a>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
