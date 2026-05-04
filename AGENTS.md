# AGENTS.md — Code Quality Contract for `chatz`

This file is the **binding contract** for every contributor — human or AI agent — working on this repository. Read it before you write a single line of code. Violations are not "warnings"; they are blockers.

---

## 1. The Prime Directive

> **Every line of code MUST pass the configured linter, formatter, and TypeScript checker — with zero suppressions, zero ignores, and zero escape hatches.**

If your code does not pass, **you fix the code**. You do not silence the tool.

---

## 2. Shared Configuration (Single Source of Truth)

All quality tooling lives in `packages/` and is consumed by every app via workspace dependencies.

```
packages/
├── typescript-config/
│   ├── base.json          ← strict TS defaults (target ES2022, strict: true, noUncheckedIndexedAccess, etc.)
│   ├── fastify.json       ← Node.js / Fastify preset (NodeNext modules, @types/node)
│   └── svelte.json        ← SvelteKit preset (ESNext modules, bundler resolution, DOM libs)
└── eslint-config/
    ├── base.js            ← strict typed-linting + ban on suppression directives
    ├── fastify.js         ← Node-globals + Fastify-aware promise rules
    └── svelte.js          ← Svelte parser + browser globals + Svelte recommended flat config
```

**App tsconfigs MUST extend exclusively from `@chatz/typescript-config/*`.**
**App eslint configs MUST import exclusively from `@chatz/eslint-config/*`.**

Do not duplicate, copy-paste, or fork these configs into an app. If a rule needs to change, change it in `packages/` so every app gets it.

---

## 3. The Tools

| Tool | Role | Command (root) | Command (per-app) |
|---|---|---|---|
| **TypeScript** | Type checker | `pnpm check-types` | `pnpm --filter <app> check-types` |
| **ESLint 9** (flat config) | Linter | `pnpm lint` | `pnpm --filter <app> lint` |
| **Prettier 3** (+ `prettier-plugin-svelte`) | Formatter | `pnpm format` / `pnpm format:check` | `pnpm --filter <app> format` |
| **Turbo** | Task runner | `pnpm <task>` | — |

All three MUST pass before any commit, PR, or merge. CI will reject anything that doesn't.

---

## 4. The Forbidden List (Zero-Tolerance)

The following are **banned** in source code under `apps/*/src/**` and `packages/*/src/**`:

### 4.1 TypeScript suppressions
- `// @ts-ignore`
- `// @ts-expect-error`
- `// @ts-nocheck`

ESLint will fail the build if it sees any of these. The rule (`@typescript-eslint/ban-ts-comment`) is configured with `minimumDescriptionLength: 9999`, which means **no description is long enough to satisfy it**. This is intentional.

### 4.2 ESLint suppressions
- `// eslint-disable`
- `// eslint-disable-next-line`
- `// eslint-disable-line`
- `/* eslint-disable */`
- File-level disables in source files

**If you genuinely cannot satisfy a rule, you do not silence it inline. You change the rule in `packages/eslint-config/` so the change is visible, reviewed, and applies uniformly.**

### 4.3 Type-system escape hatches
- `as any`
- `as unknown as <T>` (double-assertion laundering)
- `: any` annotations
- `// @ts-expect-error` (already covered above, restated for emphasis)

The base config sets `@typescript-eslint/no-explicit-any: error` and the full set of `no-unsafe-*` rules to `error`. Untyped values do not cross module boundaries in this repo. Period.

### 4.4 Pre-existing failures
- Disabling tests to make CI green
- Deleting failing assertions to make tests pass
- Commenting out broken code instead of fixing it

---

## 5. The Override Clause (Neo-Only)

There is **exactly one** way to relax any of the rules above:

> The repo owner — Neo — may add a rule override to `packages/eslint-config/*.js` (or, in extreme cases, an inline override in source) **and sign it with the literal text `It's Neo.` in a comment immediately above the override**.

Example (and the **only** acceptable form for an inline override):

```ts
// It's Neo.
// Reason: <one sentence rationale>.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const escape: any = legacyApi();
```

**Rules for the override clause:**

1. **Only Neo may add this signature.** Any other contributor — human, agent, or otherwise — adding `It's Neo.` to bypass a rule is committing a policy violation, full stop. Code review MUST reject any PR by a non-Neo author containing this signature.
2. **The signature is not transferable.** "Neo said it was OK" in Slack/PR description does not count. The signature must appear in code, in the same commit as the override, authored by Neo.
3. **Each signature is scoped to one override.** One signature unlocks one suppression. You cannot sign once and then add suppressions elsewhere.
4. **Prefer config-level overrides over inline overrides.** If Neo decides a rule is wrong for the codebase, the right move is to change `packages/eslint-config/` (still signed), not to scatter inline disables.
5. **Pre-existing config-file comments and `@type` JSDoc in `packages/eslint-config/*.js` are NOT suppressions** — they are documentation and do not require a signature. The signature applies only to actual rule disables / type-checker bypasses.

If you are not Neo and you find yourself wanting to add `It's Neo.`, **stop**. Fix the underlying code instead. If the code genuinely cannot be fixed, open an issue and tag Neo.

---

## 6. The Workflow

### 6.1 Before you write code
1. Make sure your editor runs ESLint + Prettier on save against the workspace's `eslint.config.js` and root `.prettierrc.json`.
2. Make sure your editor uses the workspace's TypeScript version (`./apps/<app>/node_modules/typescript`).

### 6.2 While you write code
- Resolve every red squiggle from your TS server. Do not commit code with editor-visible type errors.
- Run `pnpm --filter <app> check-types` before you push.

### 6.3 Before you push
Run, in order:

```sh
pnpm format          # auto-format everything
pnpm lint            # zero errors required
pnpm check-types     # zero errors required
pnpm build           # zero errors required
```

If any step fails, fix the source. Do not skip, ignore, or work around.

### 6.4 Adding a new app
1. Add the app under `apps/<name>/`.
2. Its `tsconfig.json` MUST `extends` one of `@chatz/typescript-config/{base,fastify,svelte}.json`.
3. Its `eslint.config.js` MUST `import` from one of `@chatz/eslint-config/{base,fastify,svelte}`.
4. Add `@chatz/typescript-config` and `@chatz/eslint-config` (and `eslint`) to the app's `devDependencies` as `workspace:*`.
5. Add `lint`, `check-types`, `format`, and `format:check` scripts to the app's `package.json`.
6. Verify `pnpm lint && pnpm check-types && pnpm build` from the repo root succeeds.

### 6.5 Adding a new shared config preset
1. Add the new preset file to `packages/typescript-config/` or `packages/eslint-config/`.
2. Update the package's `exports` (for ESLint) or `files` (for tsconfig) in `package.json`.
3. Update Section 2 of this AGENTS.md to document the new preset.
4. Update consumer apps to use it.

---

## 7. Why This Document Exists

Suppression directives are silent technical debt. They compound, they spread, and within six months a codebase that started "strict" is riddled with `@ts-ignore`s no one understands. This repo will not become that codebase.

If a rule is wrong, change the rule (in `packages/`, signed by Neo). If the code is wrong, fix the code. There is no third option.

**Welcome to chatz. Now write good code.**
