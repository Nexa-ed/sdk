import { SectionHeader, OptionCard } from "../primitives";

interface GitSectionProps {
  git: boolean;
  onChange: (git: boolean) => void;
}

export function GitSection({ git, onChange }: GitSectionProps) {
  return (
    <section>
      <SectionHeader label="Git Repository" isNew />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <OptionCard
          title="Initialize Git"
          description="Runs git init, stages all files, and creates an initial commit after scaffolding. You land in a clean working tree ready to push."
          badge="Default"
          isNew
          selected={git === true}
          onClick={() => onChange(true)}
        />
        <OptionCard
          title="Skip Git"
          description="No git repository is created. Useful when adding the scaffolded files into an existing repo or when you prefer to set up version control yourself."
          isNew
          selected={git === false}
          onClick={() => onChange(false)}
        />
      </div>
    </section>
  );
}
