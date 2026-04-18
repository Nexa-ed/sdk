import type { Auth } from "../types";
import { SectionHeader, OptionCard } from "../primitives";

interface AuthSectionProps {
  auth: Auth;
  onChange: (auth: Auth) => void;
}

export function AuthSection({ auth, onChange }: AuthSectionProps) {
  return (
    <section>
      <SectionHeader label="Auth Provider" />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <OptionCard
          title="WorkOS"
          description="Enterprise-grade auth with SSO, SCIM directory sync, and 1M MAU free. Ideal for schools with existing directory providers (Google, Okta, Azure AD)."
          badge="Recommended"
          isNew
          selected={auth === "workos"}
          onClick={() => onChange("workos")}
        />
        <OptionCard
          title="Clerk"
          description="Zero-config auth with pre-built components, session management, and webhooks. Great DX for new projects."
          selected={auth === "clerk"}
          onClick={() => onChange("clerk")}
        />
        <OptionCard
          title="NextAuth"
          description="Flexible, bring-your-own auth via next-auth v5 (Auth.js). Supports any OAuth provider or credentials flow."
          selected={auth === "nextauth"}
          onClick={() => onChange("nextauth")}
        />
        <OptionCard
          title="No Auth"
          description="Skip auth setup entirely. You manage authentication yourself or add it later."
          selected={auth === "none"}
          onClick={() => onChange("none")}
        />
      </div>
    </section>
  );
}
