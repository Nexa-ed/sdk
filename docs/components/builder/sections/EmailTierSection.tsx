import Link from "next/link";
import type { EmailTier } from "../types";
import { SectionHeader, OptionCard } from "../primitives";

interface EmailTierSectionProps {
  emailTier: EmailTier;
  onChange: (tier: EmailTier) => void;
}

export function EmailTierSection({ emailTier, onChange }: EmailTierSectionProps) {
  return (
    <section>
      <SectionHeader label="Email Tier" />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <OptionCard
          title="Tier 1 · Nexa Subdomain"
          description="Fastest setup. Nexa manages the mail server. Students get addresses like name@yourschool.nexa-ed.com — no DNS required."
          badge="Default"
          selected={emailTier === "tier-1-nexa"}
          onClick={() => onChange("tier-1-nexa")}
        />
        <OptionCard
          title="Tier 2 · Self-hosted"
          description="Bring your own domain. Nexa provisions mailboxes on a self-hosted Stalwart mail server. Requires DNS setup and a verified domain."
          selected={emailTier === "tier-2-stalwart"}
          onClick={() => onChange("tier-2-stalwart")}
        />
        <OptionCard
          title="Tier 3 · Google Workspace"
          description="Use the school's existing Google Workspace account. Nexa provisions accounts via the Admin SDK with domain delegation."
          selected={emailTier === "tier-3-google"}
          onClick={() => onChange("tier-3-google")}
        />
      </div>
      <p className="mt-3 text-xs text-fd-muted-foreground">
        Tier 2 and Tier 3 require a{" "}
        <Link href="/docs/sdk/domain-setup" className="text-nexa-primary hover:underline">
          verified domain
        </Link>{" "}
        and a live API key.
      </p>
    </section>
  );
}
