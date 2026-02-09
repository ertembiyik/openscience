# Task: Implement Open Science Convex Backend (Phase 1)

You are implementing the Convex coordination server for Open Science, a distributed AI research platform. Work ONLY in `packages/convex/`.

## What Exists

- `convex/schema.ts` -- initial schema (needs rework to match spec)
- `src/index.ts` -- placeholder re-export
- `package.json` with convex dependency
- `AGENTS.md` with architecture overview

## Source of Truth

Read `docs/openscience-spec.md` FIRST. The "Convex Schema" section (starting ~line 600) defines every table, field, and index. The "Key Mutations" and "Key Queries" sections define the exact API surface. DO NOT deviate from the spec.

## Step 1: Rewrite Schema

The current schema.ts is a rough draft. Rewrite it to match the spec exactly. The spec defines these tables:

- `projects` -- slug, name, description, field, isPublic, createdBy
- `tasks` -- the big one: projectId, parentId, type (RESEARCH|VERIFY), priority (0-3 number), status (PENDING|ASSIGNED|SUSPENDED|COMPLETED|FAILED|BLOCKED), dependsOn (array of task IDs), assignedTo, context (object with all the nested fields from spec), savedState (optional object with sessionSnapshot/suspendedOnTicket/suspendedAt), result, estimatedTokens, createdAt, completedAt
- `pendingFindings` -- verification staging area with votes array, attempt tracking, status
- `findings` -- verified KB entries with findingId, title, confidence, source, implications, conflictsWith
- `deadEnds` -- deadEndId, what, whyFailed, iterationsSpent, lesson
- `tickets` -- type (GPU_JOB|SCIENTIST_QUESTION|HUMAN_TASK|DATA_ACCESS|COMPUTE), priority (URGENT|HIGH|NORMAL), question, context, routingTags array, status, result
- `hypotheses` -- hypothesisId, statement, rationale, testPlan, basedOn array, status, testTaskId, result
- `labNotebooks` -- taskId, projectId, entries array (type+content+timestamp), createdAt
- `users` (contributors) -- displayName, llmProvider, capabilities array, projects array, tasksCompleted, tokensContributed, joinedAt

Key: For complex nested objects in Convex (like task context, pendingFindings votes), use `v.any()` for the top-level field and add a TypeScript type comment. Convex doesn't support deeply nested validators well -- store complex objects as `v.any()` or `v.string()` (JSON). Use proper validators for simple unions and scalars.

Add indexes: tasks need by_project, by_status, by_assignedTo. pendingFindings need by_project, by_status. findings need by_project. tickets need by_status, by_project. hypotheses need by_project, by_status.

## Step 2: Implement Mutations

Create these files in `convex/`:

### `convex/tasks.ts`
- `claimTask(contributorId, capabilities)` -- find highest-priority PENDING task whose dependencies are met, assign to contributor, assemble context (pull relevant findings, dead ends, dependency results from DB), return self-contained task. Enforce: can't claim your own VERIFY task (different-contributor rule).
- `completeTask(taskId, result)` -- mark COMPLETED, update contributor stats, if this was a VERIFY task then call internal vote-casting logic.
- `createTask(projectId, taskData)` -- create a new task in PENDING status.

### `convex/findings.ts`
- `submitFinding(projectId, finding, submittedByTask, submittedBy)` -- create pendingFinding with status PENDING_VERIFICATION, auto-create 3 VERIFY tasks (each gets the finding baked into context.pendingFinding).
- `castVerifyVote(pendingFindingId, verifierId, verdict, notes)` -- add vote to pendingFinding.votes. Enforce different-contributor rule (no verifier matches submitter or other verifiers). If 3/3 PASS: promote to findings table, update status to VERIFIED. If ANY FAIL: set status to REJECTED, auto-create new RESEARCH task with rejectionContext containing all rejection reasons.
- `recordDeadEnd(projectId, deadEnd, taskId)` -- insert into deadEnds. No verification needed.

### `convex/hypotheses.ts`
- `submitHypothesis(projectId, hypothesis, taskId, userId)` -- validate testability (statement is specific, testPlan exists, no overlap with existing hypotheses or dead ends), store in hypotheses table, auto-create RESEARCH task to test it (hypothesis baked into context.hypothesis).
- `resolveHypothesis(hypothesisId, verdict, result)` -- update status to SUPPORTED/REFUTED/ABANDONED, store result.

### `convex/tickets.ts`
- `createTicket(taskId, ticketData)` -- create ticket, link to task.
- `resolveTicket(ticketId, result, resolvedBy)` -- mark resolved, this makes the suspended task resumable.

### `convex/tasks.ts` (additional)
- `suspendTask(taskId, savedState)` -- set status to SUSPENDED, store savedState (sessionSnapshot file ID, ticket ID, timestamp).
- `getResumableTasks(contributorId)` -- find SUSPENDED tasks assigned to this contributor whose linked ticket is RESOLVED.

### `convex/labNotebooks.ts`
- `appendEntry(taskId, projectId, entry)` -- append to entries array (or create notebook if first entry).
- `getNotebook(taskId)` -- return the notebook for a task.

### `convex/users.ts`
- `register(displayName, llmProvider, capabilities)` -- create user, return ID.
- `getOrCreate(machineId, displayName)` -- idempotent registration.

## Step 3: Implement Queries

### `convex/queries.ts` (or split per domain)
- `getDashboard(projectId)` -- active tasks count, recent findings, contributor count, hypothesis stats.
- `getFindings(projectId)` -- verified findings for KB browser.
- `getDeadEnds(projectId)` -- all dead ends.
- `getTaskTree(projectId)` -- all tasks for DAG visualization.
- `getPendingFindings(projectId)` -- findings awaiting verification.
- `getHypotheses(projectId, status?)` -- hypothesis tree.
- `getOpenTickets(routingTags?)` -- tickets needing attention.
- `getAvailableTasks(projectId?)` -- PENDING tasks for CLI to display.

## Step 4: Seed Data Script

Create `convex/seed.ts` -- an internal mutation that:
1. Creates the first project (oncology/neoantigen-immunogenicity) from `seed/oncology-neoantigen-immunogenicity/project.md`
2. Creates a few initial tasks from `seed/oncology-neoantigen-immunogenicity/tasks/backlog.md`
3. Can be called once via `npx convex run seed:default`

## Step 5: Update Exports

Update `src/index.ts` to re-export the generated API types so other packages can import them:
```typescript
export { api } from "../convex/_generated/api";
export type { Id, Doc } from "../convex/_generated/dataModel";
```

## Conventions

- Use `mutation`, `query`, `internalMutation` from `convex/server`
- Use `v` from `convex/values` for validators
- All timestamps are `Date.now()` (milliseconds)
- IDs use Convex's built-in `Id<"tableName">` type
- For the `context` field on tasks: store as `v.any()` and define a TypeScript interface separately
- Convex functions are the public API -- name them clearly (e.g., `tasks:claim`, `findings:submit`)
- Run `npx convex dev` to test -- it will type-check and deploy to a dev instance

## Do NOT

- Do not touch anything outside `packages/convex/`
- Do not add authentication yet (Phase 1 uses contributor IDs directly)
- Do not implement the suggestions/scientists tables (that's Phase 3+)
- Do not implement file storage upload/download (Phase 2 suspension)
- Do not create a web UI
