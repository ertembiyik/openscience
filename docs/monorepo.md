# Monorepo Guide

How this repo is structured and how to work in it without breaking things.

## Stack

- **Bun** -- package manager, runtime, script runner. Replaces npm/pnpm/yarn entirely.
- **Turbo Repo** -- orchestrates tasks across workspaces (dev, build, lint, typecheck).
- **TypeScript** -- everything is TypeScript.

## Workspace Layout

```
openlab/
├── package.json          # Root. Declares workspaces, root scripts, shared devDeps.
├── turbo.json            # Turbo task config (dev, build, lint, typecheck).
├── bun.lock              # Single lockfile for all workspaces.
├── apps/
│   ├── cli/              # @openlab/cli   -- Commander.js agent runner
│   └── web/              # @openlab/web   -- Next.js dashboard
└── packages/
    └── convex/           # @openlab/convex -- Convex coordination server
```

The root `package.json` declares:
```json
"workspaces": ["apps/*", "packages/*"]
```

This tells Bun to treat every directory under `apps/` and `packages/` as a workspace. Each workspace has its own `package.json` with its own name, scripts, and dependencies.

## Package Names and Scope

All packages use the `@openlab` scope:
- `@openlab/cli`
- `@openlab/web`
- `@openlab/convex`

These names are defined in each workspace's `package.json` `"name"` field.

## How Local Dependencies Work

To import one workspace from another, add it as a dependency with `"*"` as the version:

```json
// apps/cli/package.json
{
  "dependencies": {
    "@openlab/convex": "*"
  }
}
```

Then import normally in code:
```typescript
import { api } from '@openlab/convex';
```

The `"*"` version tells Bun this is a local workspace reference, not an npm package. Bun symlinks it automatically -- no publishing, no build step needed for dev.

The consuming package resolves to whatever the workspace's `"main"` or `"exports"` field points to. For `@openlab/convex`, that's `src/index.ts`.

## Installing Dependencies

**Always run `bun install` from the repo root.** Bun discovers all workspaces, links local packages, and installs external dependencies into a shared `node_modules` with hoisting.

To add a dependency to a specific workspace:
```bash
# Add to a specific workspace
bun add <package> --cwd apps/cli

# Add as dev dependency
bun add -d <package> --cwd packages/convex
```

**Never** `cd` into a workspace and run `bun install` there. Always operate from root or use `--cwd`.

## Turbo Tasks

`turbo.json` defines how tasks run across workspaces:

```json
{
  "tasks": {
    "dev":       { "cache": false, "persistent": true },
    "build":     { "outputs": ["dist/**", ".next/**"], "dependsOn": ["^build"] },
    "lint":      { "dependsOn": ["^build"] },
    "typecheck": { "dependsOn": ["^build"] }
  }
}
```

### Key concepts:

- **`dev`** -- runs all workspace `dev` scripts in parallel. `persistent: true` keeps them alive. `cache: false` because dev servers aren't cacheable.
- **`build`** -- builds in dependency order. `"dependsOn": ["^build"]` means "build my dependencies first." Turbo caches outputs (`dist/`, `.next/`) so unchanged packages skip rebuilds.
- **`lint` / `typecheck`** -- also depend on `^build` so types from dependencies are available.

### Running tasks:

```bash
# Run all dev servers (from repo root)
bun dev

# Build everything in dependency order
bun build

# Run a task for a specific workspace only
bunx turbo build --filter=@openlab/cli

# Run a task for a workspace and its dependencies
bunx turbo typecheck --filter=@openlab/web...
```

The `--filter` flag is how you scope turbo commands. Turbo is smart: `--filter=@openlab/cli` will also build `@openlab/convex` first if CLI depends on it.

## What Each Workspace's `dev` Script Does

| Workspace | `dev` command | What it runs |
|-----------|--------------|--------------|
| `@openlab/cli` | `bun run --watch src/index.ts` | Bun with file watcher |
| `@openlab/web` | `next dev` | Next.js dev server |
| `@openlab/convex` | `convex dev` | Convex hot-reload server |

`bun dev` at root starts all three in parallel via Turbo.

## Rules for Agents

### DO:

1. **Run `bun install` from the repo root** when adding or changing dependencies.
2. **Use `--cwd` to add deps to a specific workspace**: `bun add foo --cwd apps/cli`.
3. **Use `bunx turbo --filter=@openlab/foo` to scope commands** to a single workspace.
4. **Reference local packages with `"*"` version** in `package.json` dependencies.
5. **Check `turbo.json`** before adding new task types. If a new script needs orchestration, add it there.
6. **Keep workspace `package.json` files self-contained** -- each declares its own scripts, dependencies, and metadata.

### DON'T:

1. **Don't install from inside a workspace directory.** Always install from root.
2. **Don't add dependencies to the root `package.json`** unless they're truly shared dev tools (like `turbo` and `typescript`). App-specific deps go in the app's `package.json`.
3. **Don't duplicate dependencies across workspaces unnecessarily.** If something is only used by CLI, it goes in `apps/cli/package.json`.
4. **Don't bypass turbo to run workspace scripts directly** (e.g., `cd apps/web && bun run build`). Use `bunx turbo build --filter=@openlab/web` so dependency ordering and caching work.
5. **Don't create new top-level directories for packages.** New apps go in `apps/`, new shared packages go in `packages/`.
6. **Don't modify `bun.lock` manually.** It's auto-generated by `bun install`.
7. **Don't add workspace-specific turbo config** unless there's a real reason. The root `turbo.json` covers everything.

## Adding a New Workspace

1. Create the directory under `apps/` or `packages/`.
2. Add a `package.json` with a `"name"` using the `@openlab/` scope.
3. Add the scripts turbo expects (`dev`, `build`, etc.) as needed.
4. Run `bun install` from root to link it.
5. If other workspaces need it, add `"@openlab/new-thing": "*"` to their deps and `bun install` again.

## Troubleshooting

- **"Module not found" for a local package** -- run `bun install` from root. The symlink may be stale.
- **Types not resolving from a dependency** -- make sure the dependency's `build` ran first. Use `bunx turbo typecheck --filter=@openlab/your-app...` to include deps.
- **Turbo cache giving stale results** -- `bunx turbo build --force` to bypass cache.
- **Lock file conflicts** -- delete `bun.lock` and `node_modules`, then `bun install` fresh from root.
