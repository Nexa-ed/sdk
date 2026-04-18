import type { Feature } from "../types";
import { SectionHeader, OptionCard } from "../primitives";

interface FeaturesSectionProps {
  features: Feature[];
  onToggle: (feature: Feature) => void;
}

export function FeaturesSection({ features, onToggle }: FeaturesSectionProps) {
  return (
    <section>
      <SectionHeader label="Features" />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <OptionCard
          title="File Processing"
          description="Upload PDFs, stream real-time OCR progress via SSE, and retrieve structured student academic records. Powered by Google Document AI."
          selected={features.includes("fileProcessing")}
          onClick={() => onToggle("fileProcessing")}
        />
        <OptionCard
          title="Payments"
          description="Paystack-backed enrollment fees with automatic surcharge calculation, webhook forwarding, and per-tenant configuration."
          selected={features.includes("payments")}
          onClick={() => onToggle("payments")}
        />
        <OptionCard
          title="Convex Backend"
          description="Schema fragments, reactive queries, and webhook handlers that sync Nexa events into your Convex backend in real-time."
          selected={features.includes("convex")}
          onClick={() => onToggle("convex")}
        />
        <OptionCard
          title="Student Email Provisioning"
          description="Provision school email accounts on your own domain, via Google Workspace, or on a Nexa subdomain. Bulk-create 500 accounts in one call."
          selected={features.includes("emailProvisioning")}
          onClick={() => onToggle("emailProvisioning")}
        />
      </div>
    </section>
  );
}
