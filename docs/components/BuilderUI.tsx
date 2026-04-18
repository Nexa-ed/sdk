"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import {
  type BuilderState,
  type Feature,
  DEFAULTS,
  buildCommand,
  stateToParams,
  paramsToState,
} from "./builder/types";
import { BuilderPanel } from "./builder/BuilderPanel";
import { AuthSection } from "./builder/sections/AuthSection";
import { FeaturesSection } from "./builder/sections/FeaturesSection";
import { EmailTierSection } from "./builder/sections/EmailTierSection";
import { UISection } from "./builder/sections/UISection";
import { GitSection } from "./builder/sections/GitSection";
import { PackageManagerSection } from "./builder/sections/PackageManagerSection";
import { PreviewSection } from "./builder/sections/PreviewSection";
import { NextStepsSection } from "./builder/sections/NextStepsSection";

export default function BuilderUI() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [state, setState] = useState<BuilderState>(() => paramsToState(searchParams));
  const [copied, setCopied] = useState(false);
  const [shared, setShared] = useState(false);

  // Sync URL on state change (debounced 300 ms)
  const syncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    syncTimerRef.current = setTimeout(() => {
      const p = stateToParams(state);
      const qs = p.toString();
      router.replace(qs ? `?${qs}` : "?", { scroll: false });
    }, 300);
    return () => {
      if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    };
  }, [state, router]);

  const command = buildCommand(state);

  const toggleFeature = useCallback((f: Feature) => {
    setState((prev) => {
      const has = prev.features.includes(f);
      const next = has ? prev.features.filter((x) => x !== f) : [...prev.features, f];
      return { ...prev, features: next };
    });
  }, []);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(command.replace(/\\\n\s+/g, " ")).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }, [command]);

  const handleShare = useCallback(() => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setShared(true);
      setTimeout(() => setShared(false), 1500);
    });
  }, []);

  const handleReset = useCallback(() => setState(DEFAULTS), []);

  const hasEmail = state.features.includes("emailProvisioning");

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <BuilderPanel
        state={state}
        command={command}
        copied={copied}
        shared={shared}
        onNameChange={(name) => setState((p) => ({ ...p, name }))}
        onCopy={handleCopy}
        onShare={handleShare}
        onReset={handleReset}
      />

      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-4xl space-y-14 px-6 py-10">
          <AuthSection
            auth={state.auth}
            onChange={(auth) => setState((p) => ({ ...p, auth }))}
          />
          <FeaturesSection
            features={state.features}
            onToggle={toggleFeature}
          />
          {hasEmail && (
            <EmailTierSection
              emailTier={state.emailTier}
              onChange={(emailTier) => setState((p) => ({ ...p, emailTier }))}
            />
          )}
          <UISection
            ui={state.ui}
            pm={state.pm}
            onChange={(ui) => setState((p) => ({ ...p, ui }))}
          />
          <GitSection
            git={state.git}
            onChange={(git) => setState((p) => ({ ...p, git }))}
          />
          <PackageManagerSection
            pm={state.pm}
            onChange={(pm) => setState((p) => ({ ...p, pm }))}
          />
          <PreviewSection state={state} />
          <NextStepsSection name={state.name} pm={state.pm} ui={state.ui} />
        </div>
      </main>
    </div>
  );
}
