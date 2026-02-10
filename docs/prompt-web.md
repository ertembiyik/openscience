# Task: Implement Open Lab Public Dashboard (Phase 1 Scaffold)

You are implementing the public dashboard for Open Lab, a distributed AI research platform. Work ONLY in `apps/web/`.

## What Exists

- Next.js 16 app with App Router, Tailwind CSS 4, TypeScript
- Default create-next-app page.tsx (needs full replacement)
- `AGENTS.md` with architecture overview
- No Convex client installed yet

## Source of Truth

Read `docs/openlab-spec.md` FIRST. The "Public Dashboard" section (~line 878) lists what the dashboard shows. For Phase 1, we're building the scaffold with mock data -- Convex integration comes when the backend agent finishes.

## Step 1: Install Convex Client

Add convex dependency and the shared package:
```bash
cd apps/web && bun add convex @openlab/convex
```

Create `src/lib/convex.ts`:
- ConvexProvider setup for Next.js App Router
- Export a client-side provider component (ConvexClientProvider)
- Use environment variable `NEXT_PUBLIC_CONVEX_URL` for the deployment URL

Create `src/app/ConvexClientProvider.tsx`:
- "use client" component wrapping ConvexProvider
- Accept children, provide ConvexReactClient

Update `src/app/layout.tsx` to wrap with ConvexClientProvider.

## Step 2: Design System Foundation

Create a minimal design system. The dashboard should look like a research command center -- clean, data-dense, dark-mode-first.

Color palette:
- Background: zinc-950 (dark) / white (light)
- Cards: zinc-900 (dark) / zinc-50 (light)
- Accent: emerald-500 (verified/pass), amber-500 (pending), red-500 (failed/rejected)
- Text: zinc-100 (dark) / zinc-900 (light)

Create `src/components/ui/` with basic components:
- `Card.tsx` -- simple card container with header and body
- `Badge.tsx` -- status badges (verified, pending, rejected, etc.)
- `StatCard.tsx` -- number + label for dashboard stats
- `Skeleton.tsx` -- loading placeholder

## Step 3: Landing/Dashboard Page

Replace `src/app/page.tsx` with the main dashboard:

Layout:
1. **Header** -- "Open Lab" logo/title, dark mode toggle, link to GitHub
2. **Stats row** -- 4 StatCards: Active Projects, Tasks Completed, Verified Findings, Contributors
3. **Two-column layout below**:
   - Left: Recent Findings feed (verified findings, most recent first)
   - Right: Active Tasks summary + Pending Verification count

For Phase 1, use mock data objects at the top of the file or in a `src/lib/mock-data.ts` file. Structure the mock data to match the Convex schema exactly so swapping to real queries is trivial.

Mock data should include:
- 1 project (oncology/neoantigen-immunogenicity)
- ~5 tasks in various states (PENDING, ASSIGNED, COMPLETED)
- ~3 verified findings
- ~2 pending findings
- 2 hypotheses (1 testing, 1 supported)
- 3 contributors

## Step 4: Project Detail Page

Create `src/app/projects/[slug]/page.tsx`:

Layout:
1. **Project header** -- name, description, field
2. **Tabs**: Overview | Knowledge Base | Tasks | Hypotheses
3. **Overview tab** (default):
   - Stats: tasks total/completed, findings verified, hypotheses tested
   - Recent activity feed
4. **Knowledge Base tab**:
   - List of verified findings with confidence badge, source, date
   - Dead ends section (collapsed by default)
5. **Tasks tab**:
   - Table/list of tasks with status, role, priority, assignee
   - Filter by status and role
6. **Hypotheses tab**:
   - List of hypotheses with status badge (proposed/testing/supported/refuted)
   - Show which findings they're based on

All using mock data for now.

## Step 5: Additional Pages

### `src/app/kb/page.tsx` -- Knowledge Base Browser
- All verified findings across projects
- Search/filter by project, confidence level
- Each finding shows: title, confidence badge, source, date, project

### `src/app/tasks/page.tsx` -- Task Explorer
- All tasks across projects
- Filter by status, role, project
- Show task DAG as a simple indented list (parent-child relationships)

### `src/app/contributors/page.tsx` -- Contributor Leaderboard
- Table: name, tasks completed, findings contributed, joined date
- Sort by tasks completed

## Step 6: Shared Layout

Update `src/app/layout.tsx`:
- Sidebar navigation: Dashboard, Projects, Knowledge Base, Tasks, Contributors
- Responsive: sidebar collapses to hamburger on mobile
- Dark mode by default, toggle in header
- Use system font stack, clean typography

## Step 7: Convex Hook Helpers

Create `src/lib/hooks.ts` with typed Convex query hooks (using `useQuery` from convex/react):
- `useProject(slug)` -- get project by slug
- `useDashboard(projectId)` -- get dashboard stats
- `useFindings(projectId)` -- get verified findings
- `useTasks(projectId)` -- get tasks
- `useHypotheses(projectId)` -- get hypotheses
- `useContributors()` -- get all contributors

For Phase 1, these hooks should have a fallback to mock data when Convex isn't connected (check if NEXT_PUBLIC_CONVEX_URL is set). This way the dashboard works standalone.

## Design Principles

- Server components by default, client components only for interactivity
- Dark mode first -- research tools are used late at night
- Data-dense but not cluttered -- scientists want information, not whitespace
- Fast -- no heavy animations, minimal JS
- Accessible -- proper ARIA labels, keyboard navigation
- Mobile-friendly but desktop-optimized (most users are on laptops)

## Conventions

- Use Tailwind CSS 4 (already installed)
- No additional UI libraries (no shadcn, no radix) -- keep it minimal with Tailwind
- Components in `src/components/`
- Pages in `src/app/`
- Utilities in `src/lib/`
- Types in `src/types/`

## Do NOT

- Do not touch anything outside `apps/web/`
- Do not implement authentication or login (everything is public)
- Do not implement the "Suggest a Problem" form (Phase 3)
- Do not implement real-time subscriptions yet -- mock data is fine for Phase 1
- Do not use any UI component libraries -- just Tailwind
- Do not over-design -- functional and clean beats fancy
