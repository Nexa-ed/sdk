# create-nexaed-app

## 0.2.0-beta.3

### Minor Changes

- e8c8739: ---

### Patch Changes

- 10bb2ff: adjsutments to teh name?

## 0.2.0

### Minor Changes

#### Interactive CLI

- `create-nexaed-app` — interactive CLI scaffolder for bootstrapping a new Nexa-powered school app
- Uses `@clack/prompts` for a clean, guided setup experience
- Prompts: project name, framework (Next.js), Convex project URL, Clerk keys, email tier, domain

#### Templates

- `next-convex` — Next.js + Convex starter template with `@nexa-ed/next`, `@nexa-ed/react`, and `@nexa-ed/convex` pre-wired
- Template includes: `createNexa()` config, `[...nexa]/route.ts` catch-all handler, `NexaProvider` in layout, and example Convex schema spread

#### Scaffold Engine

- `scaffold(projectName, template, answers)` — copies template, replaces env placeholders, and installs dependencies with the detected package manager (npm / pnpm / yarn / bun)

---

## 0.2.0-beta.2

### Patch Changes

- 8adccda: patch added readme docs

## 0.2.0-beta.1

### Minor Changes

- 6a67afc: from the sdk list

## 0.2.0-beta.0

### Minor Changes

- 3997bcf: initital package
