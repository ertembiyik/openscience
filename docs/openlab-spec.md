# Open Lab -- Distributed Research Platform Spec

## Vision

A Folding@Home for AI-powered research. Contributors install a CLI, authenticate with their own LLM subscription, and their machine starts working on research tasks coordinated by a central server. Scientists join via Telegram/Discord to answer questions when AI agents are unsure. GPU owners contribute compute for model training. All knowledge is public.

Cancer research is the first project. The platform generalizes to any field.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    CONVEX (Coordination Server)              │
│                                                             │
│  Tasks (DAG)  │  Knowledge Base  │  Tickets  │  Users      │
│  Findings     │  Dead Ends       │  Files    │  Projects   │
└────────┬──────────────┬─────────────────┬───────────────────┘
         │              │                 │
    ┌────▼────┐   ┌─────▼─────┐   ┌──────▼──────┐
    │  CLI    │   │  CLI      │   │  Telegram/  │
    │ Agent 1 │   │ Agent 2   │   │  Discord    │
    │         │   │           │   │  Bots       │
    │ pi-mono │   │ pi-mono   │   │             │
    │ +Claude │   │ +GPT-4    │   │ Scientists  │
    └─────────┘   └───────────┘   └─────────────┘
    Contributor A  Contributor B   Scientist Advisors
```

### Three Components

1. **CLI Agent** (`openlab`): Installed by contributors. Runs pi-mono locally with contributor's own LLM API key. Pulls tasks from Convex, executes them, pushes results back.

2. **Coordination Server** (Convex): Central brain. Stores tasks (DAG), knowledge base, tickets, contributor profiles, project config. Real-time sync. File storage for research artifacts.

3. **Engagement Bots** (v2): Telegram/Discord bots for scientist advisors. Route question tickets based on expertise and availability.

### Protocol-First Design

The Convex API **is** the protocol. Every mutation (`claimTask`, `completeTask`, `submitFinding`, `castVerifyVote`, etc.) and query is an HTTP endpoint. Any agent runtime that can make HTTP calls can participate — no SDK, no adapter, no integration layer required.

**The CLI is one client, not THE client.** Pi-mono is the first agent runtime we ship, but the Convex API doesn't know or care what's calling it. OpenClaw agents, Claude Code sessions, custom Python scripts, Telegram bots, browser dashboards — all are just Convex clients calling the same mutations with the same task context schema.

**A Convex URL is a coordination server.** Each deployment is identified by a single URL. Contributors point their agent at that URL and start working. In principle, anyone can deploy their own coordination server for any domain — not just science — and any agent that speaks the protocol can join.

**What this means for implementation:**
- Convex mutations accept structured data, not agent-runtime-specific formats. The task context schema is the contract.
- Auth is per-caller (contributor identity), not per-runtime (no "pi-mono auth" vs "OpenClaw auth").
- No assumptions about agent lifecycle in the server — the server doesn't care if an agent polls every 30 seconds or every 15 minutes, runs continuously or wakes on cron.
- The verification pipeline, scientific loop, and knowledge base are server-side logic. Agents are just workers that claim tasks, do work, and push results.

This isn't a future goal — it's how Convex works by construction. We name it here to stay intentional: keep the API surface generic, keep the intelligence in the task context, and let any agent participate.

---

## Core Concepts

### Projects

Projects are namespaced research efforts. Structure: `{field}/{subfield}/{problem}`

```
science/
├── oncology/
│   ├── neoantigen-immunogenicity/    ← our first project
│   ├── drug-combination-prediction/
│   └── cancer-cell-reprogramming/
├── climate/
│   └── ...
└── genomics/
    └── ...
```

During onboarding, contributors select which field(s) they want to contribute to.

### Tasks (Self-Contained Units of Work)

A task is the **atomic unit of delegation**. It carries everything an agent needs to execute it — context, role, and saved state. An agent claims a task, reads it, and has everything. No external lookups needed.

Tasks form a directed acyclic graph. A task can spawn subtasks, and results flow up.

```
T-001: Download IEDB dataset
  └── T-002: Profile IEDB data quality
       ├── T-003: Write data loader
       │    └── T-005: Run MHCflurry baseline
       └── T-004: Exploratory data analysis
```

**Three dimensions of a task:**

#### 1. Role (what behavior the agent adopts)

```
type: "RESEARCH" | "VERIFY"
```

The role determines the agent's system prompt and available tools. RESEARCH agents produce findings. VERIFY agents check findings. That's it.

#### 2. Context (everything the agent needs to know)

```
context: {
  // The assignment
  title: string,              // "Review MHCflurry binding prediction accuracy"
  description: string,        // Detailed instructions
  skill?: string,             // "literature-review" — procedural checklist to follow

  // Knowledge snapshot (server assembles this at claim time)
  relevantFindings: Finding[],     // KB findings related to this task
  relevantDeadEnds: DeadEnd[],     // What didn't work (DO NOT REPEAT)
  parentResult?: string,           // Result from parent task (if subtask)
  dependencyResults: {             // Results from tasks this one depends on
    taskId: string,
    result: string,
  }[],

  // For VERIFY tasks: the finding to verify
  pendingFinding?: {
    findingId: string,
    title: string,
    confidence: string,
    source: string,
    implications: string,
    submittedBy: string,           // contributor name (not ID, for display)
  },

  // For re-research tasks: why the previous attempt was rejected
  rejectionContext?: {
    previousAttemptId: string,
    rejectionReasons: {
      verifier: string,            // contributor name
      reason: string,
    }[],
    attempt: number,               // which attempt this is (2, 3, ...)
  },

  // For hypothesis-testing tasks: the hypothesis to test
  hypothesis?: {
    id: string,
    statement: string,
    rationale: string,
    testPlan: string,              // becomes the task's primary instruction
    basedOn: string[],             // finding/hypothesis IDs that led here
  },

  // Project-level context
  projectDescription: string,      // what the project is about
}
```

The server **assembles context at claim time** — it pulls relevant findings, dead ends, dependency results, and packages them into the task. The agent never queries the KB separately.

**Pyramid summaries for context assembly.** As the knowledge base grows, stuffing all relevant findings into task context verbatim will blow up the context window. Instead, the server assembles findings as **pyramid summaries** — multi-level reversible summaries inspired by multi-resolution image formats (like map tile zoom levels).

Each finding in the KB is stored with summaries at multiple compression levels:

```
Level 0:  "MHCflurry AUC drops on rare alleles"              (1-line)
Level 1:  "MHCflurry shows strong AUC (>0.9) on common       (2-3 lines)
           HLA alleles but degrades significantly on rare
           alleles with limited training data"
Level 2:  Full finding with sources, methodology,             (full text)
           implications, and confidence rationale
```

When assembling task context, the server includes:
- **Level 0** for all relevant findings (agent gets the landscape)
- **Level 1** for findings directly related to the task's topic
- **Level 2** for findings the task explicitly depends on

The agent sees the compressed overview, identifies what matters, and can request full detail for specific findings via a `expandFinding(findingId)` query if needed. This keeps context tight while preserving access to the full KB.

Dead ends and hypotheses follow the same pattern — compressed by default, expandable on demand.

#### 3. Saved State (for suspension/resumption)

```
savedState?: {
  sessionSnapshot: string,         // Convex file storage ID (frozen pi-mono JSONL)
  suspendedOnTicket: Id<"tickets">,
  suspendedAt: number,
}
```

When an agent suspends (creates a ticket), the pi-mono session is frozen, uploaded to Convex file storage, and linked to the task. When the ticket resolves, the CLI downloads the snapshot, restores the session, and injects the ticket result. The agent continues exactly where it left off.

**Full task properties:**
- `id`: Unique identifier
- `projectId`: Which project this belongs to
- `parentId`: Parent task (null for root tasks)
- `type`: RESEARCH | VERIFY
- `priority`: P0 (critical) through P3 (nice to have)
- `status`: PENDING | ASSIGNED | SUSPENDED | COMPLETED | FAILED | BLOCKED
- `assignedTo`: Contributor ID (null if unassigned)
- `dependsOn`: Task IDs that must complete first
- `context`: Assembled context object (see above)
- `savedState`: Frozen session state (see above, null unless suspended)
- `result`: Structured result when completed
- `estimatedTokens`: Rough estimate of LLM tokens needed

Assignment strategy: **Priority-weighted random**. Higher priority tasks are more likely to be assigned. Tasks respect dependency ordering.

### Tickets (Unified Async System)

Everything an agent can't do locally becomes a ticket. This is the core abstraction.

Ticket types:
- **GPU_JOB**: Agent needs model training/inference on a GPU
- **SCIENTIST_QUESTION**: Agent needs human expert verification
- **HUMAN_TASK**: Agent needs Ertem (or project lead) to do something
- **DATA_ACCESS**: Agent needs a dataset it can't download
- **COMPUTE**: Agent needs resources beyond local machine

Ticket properties:
- `id`: Unique identifier
- `type`: One of the above
- `createdBy`: Task ID that created this ticket
- `priority`: URGENT | HIGH | NORMAL
- `question`: What's needed (human-readable)
- `context`: Relevant context for whoever resolves it
- `status`: OPEN | CLAIMED | RESOLVED | EXPIRED
- `resolvedBy`: Who resolved it (contributor ID or scientist ID)
- `result`: The answer/output
- `routingTags`: Expertise tags for routing (e.g., ["immunology", "MHC-binding"])

### Agent Suspension/Continuation

When an agent creates a ticket, it doesn't block. The session state is saved inside the task itself:

1. Agent reaches a suspension point (needs external input)
2. Agent's pi-mono session is frozen (JSONL snapshot) and uploaded to Convex file storage
3. The task's `savedState` is updated with `{sessionSnapshot, suspendedOnTicket, suspendedAt}`
4. Task status → SUSPENDED
5. Agent picks up a NEW task (fresh session)
6. When ticket resolves, Convex marks the task as resumable
7. CLI downloads the session snapshot, restores it, injects the ticket result
8. Agent continues from where it left off

This is coroutine-style concurrency for AI agents. Each contributor can have multiple suspended tasks. Everything needed to resume is inside the task — no external state to track.

Implementation:
- On suspension: freeze session → upload JSONL to Convex file storage → update `task.savedState`
- On resume: download JSONL → `SessionManager.open(localPath)` → `session.prompt(ticketResult)`
- Suspended tasks are self-contained: any contributor can resume them (not just the original one)

### Knowledge Base

All findings are stored in Convex and publicly readable.

Collections:
- **findings**: Validated facts with confidence tags, sources, implications
- **deadEnds**: What didn't work and why
- **openQuestions**: Unanswered questions with routing tags
- **toolEvals**: Tool evaluations (USE/SKIP/DEFER)
- **datasetEvals**: Dataset evaluations

Conflict detection: If two agents produce contradicting findings on the same topic, the system automatically flags the conflict and creates a SCIENTIST_QUESTION ticket for resolution.

### Agent Roles & Verification Pipeline

The database must be true. Nothing enters the knowledge base without independent verification by **3 separate agents** who all agree.

**Two roles only:**

| Role | What It Does | Writes To |
|------|-------------|-----------|
| **RESEARCH** | Produces new findings: literature review, data analysis, tool evaluation, code, experiments | Staging area (pendingFindings) |
| **VERIFY** | Independently checks a research finding: reproduces claims, checks sources, cross-references | Casts a PASS or FAIL vote on the finding |

Every task is either RESEARCH (produce something) or VERIFY (check something). That's it.

**Verification flow (3-of-3 unanimous agreement):**

```
Research Agent              Server (Convex)              3x Verify Agents
     │                           │                           │
     │  submitFinding(draft)     │                           │
     ├──────────────────────────►│                           │
     │                           │  → pendingFindings table  │
     │                           │  → auto-create 3 VERIFY   │
     │                           │    tasks (same finding)    │
     │                           ├──────────────────────────►│
     │                           │                           │
     │                           │  Verifier A claims task    │
     │                           │  Verifier B claims task    │
     │                           │  Verifier C claims task    │
     │                           │  (3 different contributors)│
     │                           │                           │
     │                           │  Each independently:       │
     │                           │  - checks sources          │
     │                           │  - reproduces claims       │
     │                           │  - cross-references KB     │
     │                           │  - casts PASS or FAIL      │
     │                           │                           │
     │                           │  IF 3/3 PASS:              │
     │                           │    → findings (KB)         │
     │                           │                           │
     │                           │  IF ANY FAIL:              │
     │                           │    → new RESEARCH task     │
     │                           │      with rejection context│
     │                           │    → loop restarts         │
     │                           ├──────────────────────────►│
     │                           │                           │
     │  (or different agent)     │                           │
     │  picks up re-research     │                           │
     │  task with context        │                           │
     │◄──────────────────────────┤                           │
```

**Rules:**
- Each of the 3 VERIFY tasks MUST be claimed by a **different contributor** than the researcher AND different from each other. The server enforces this — no two verifiers can share a `userId`, and none can match the submitter.
- Verification is **independent**: each verifier works without seeing the other verifiers' verdicts. They only see the pending finding and its sources.
- **All 3 must PASS** for the finding to enter the KB. This is unanimous agreement.
- **If any verifier FAILs**: the finding is rejected, a new RESEARCH task is auto-created with the rejection reason as context ("Verifier B rejected: source X does not support claim Y"). The original researcher or a different agent picks this up and either fixes the finding or abandons it.
- The re-research → re-verify loop continues until 3/3 agree or the finding is abandoned (recorded as dead end).
- If a verifier is unsure, they can escalate to a SCIENTIST_QUESTION ticket instead of guessing.
- Dead ends skip verification — they're inherently "what didn't work" and don't need to be true in the same sense.
- Verification tasks are high priority — they block knowledge from entering the KB.

**pendingFindings table:**
```typescript
{
  projectId: Id<"projects">,
  findingId: string,            // "PF-001" (pending)
  title: string,
  confidence: "HIGH" | "MEDIUM" | "LOW",
  source: string,
  implications: string,
  submittedByTask: Id<"tasks">,
  submittedBy: Id<"users">,
  submittedAt: number,
  attempt: number,              // 1, 2, 3... (increments on re-research)
  previousAttemptId?: Id<"pendingFindings">,  // links to prior rejected version
  verifyTaskIds: Id<"tasks">[],  // 3 auto-created VERIFY tasks
  votes: {
    verifier: Id<"users">,
    verdict: "PASS" | "FAIL",
    notes: string,
    votedAt: number,
  }[],
  status: "PENDING_VERIFICATION" | "VERIFIED" | "REJECTED" | "RE_RESEARCHING",
  resolvedAt?: number,
  rejectionContext?: string,     // aggregated rejection reasons for re-research
}
```

### Hypothesis Generation & Scientific Loop

Inspired by [OpenAI/Ginkgo's autonomous lab](https://openai.com/index/gpt-5-lowers-protein-synthesis-cost/) (Feb 2026), where GPT-5 ran 36,000 experiments in a closed loop — analyzing results, generating hypotheses, designing next experiments, validating designs, executing, and feeding results back. Their system achieved 40% cost reduction in protein synthesis in just 3 rounds.

Our system doesn't have a physical lab, but the cognitive loop is the same. We add **hypothesis generation** as a first-class concept — RESEARCH tasks don't just produce findings, they can also produce **hypotheses** that spawn new RESEARCH tasks to test them.

**The scientific loop:**

```
                    ┌─────────────────────────────────┐
                    │                                 │
                    ▼                                 │
             ┌─────────────┐                         │
             │  RESEARCH   │                         │
             │  task       │                         │
             └──────┬──────┘                         │
                    │                                 │
          ┌─────────┼─────────┐                      │
          ▼         ▼         ▼                      │
     findings  hypotheses  dead ends                 │
          │         │                                │
          ▼         ▼                                │
     3x VERIFY   new RESEARCH tasks                  │
          │      (to test each hypothesis)           │
          ▼         │                                │
     KB entry       ▼                                │
              results feed back ─────────────────────┘
              (as dependencyResults in
               next hypothesis-testing task)
```

**Hypotheses are structured:**

```typescript
hypothesis: {
  id: string,                    // "H-001"
  statement: string,             // "Adding Boltz-2 structural features will improve AUC by >0.05"
  rationale: string,             // Why the agent thinks this is worth testing
  testPlan: string,              // How to test it (becomes the description of spawned task)
  basedOn: string[],             // Finding IDs or previous hypothesis results that led here
  status: "PROPOSED" | "TESTING" | "SUPPORTED" | "REFUTED" | "ABANDONED",
  testTaskId?: Id<"tasks">,      // The RESEARCH task spawned to test this
  result?: string,               // What the test found
  createdByTask: Id<"tasks">,
  createdAt: number,
}
```

**How it works:**

1. A RESEARCH task analyzes data/literature and produces both **findings** (facts) and **hypotheses** (testable predictions).
2. Findings go through the 3x VERIFY pipeline as before.
3. Hypotheses are stored in the `hypotheses` table and auto-spawn new RESEARCH tasks to test them. The spawned task's context includes the hypothesis statement, rationale, and test plan.
4. When the test task completes, its result flows back as `dependencyResults` — the system can then generate **new hypotheses** based on what it learned.
5. This creates a self-sustaining research loop: data → hypothesis → test → results → new hypothesis → ...

**Validation (from OpenAI/Ginkgo's Pydantic pattern):**

Before a hypothesis spawns a task, it passes through validation:
- Is the statement testable with available tools/data? (not "cure cancer" but "MHCflurry AUC on IEDB subset > 0.85")
- Is there a clear test plan?
- Does it overlap with an existing hypothesis or dead end?
- Is the estimated token cost reasonable?

Invalid hypotheses are logged but don't spawn tasks. This prevents the system from generating unbounded work.

**Lab notebook (audit trail):**

Every RESEARCH task produces a structured reasoning trace alongside its outputs:

```typescript
labNotebook: {
  taskId: Id<"tasks">,
  entries: {
    timestamp: number,
    type: "OBSERVATION" | "REASONING" | "HYPOTHESIS" | "RESULT" | "DECISION",
    content: string,
  }[],
}
```

This is the equivalent of OpenAI's "human-readable lab notebook entries documenting analysis and rationale." It makes the agent's reasoning transparent and reviewable — critical for debugging when a research direction goes wrong.

### Contributor Profiles

- `id`: Unique identifier
- `displayName`: Public name
- `llmProvider`: Which LLM they use (anthropic, openai, etc.)
- `capabilities`: What they can contribute (cpu, gpu, gpu_type)
- `projects`: Which projects they're contributing to
- `tasksCompleted`: Count
- `tokensContributed`: Rough estimate
- `joinedAt`: When they joined

Note: active task and suspended sessions are tracked on the tasks themselves (via `assignedTo` and `savedState`), not on the contributor profile. This keeps tasks self-contained.

### Scientist Advisor Profiles (v2)

- `id`: Unique identifier
- `name`: Real name
- `expertise`: Tags (e.g., ["immunology", "MHC-I", "neoantigen"])
- `contactMethods`: [{type: "telegram", handle: "@drsmith"}, ...]
- `availability`: Questions per week they're willing to answer
- `questionsAnswered`: Count
- `verified`: Boolean (manual verification for now)

### Problem Suggestions (Web Dashboard)

Scientists and domain experts can suggest new research problems via the public dashboard. Maintainers curate what gets activated.

**Flow:**

```
Scientist                    Dashboard                   Maintainer
    │                            │                           │
    │  "Suggest a Problem"       │                           │
    │  form on dashboard         │                           │
    ├───────────────────────────►│                           │
    │                            │  → suggestions table      │
    │                            │    status: PROPOSED        │
    │                            │                           │
    │                            │  Notification to           │
    │                            │  maintainers               │
    │                            ├──────────────────────────►│
    │                            │                           │
    │                            │  Review: approve/reject    │
    │                            │◄──────────────────────────┤
    │                            │                           │
    │                            │  IF APPROVED:              │
    │                            │    Create project +        │
    │                            │    seed root tasks         │
    │                            │    Notify scientist        │
    │                            │                           │
    │                            │  IF REJECTED:              │
    │                            │    Mark rejected +         │
    │                            │    reason (public)         │
```

**Suggestion form fields:**
- `field`: Research field (e.g., "oncology", "genomics", "climate")
- `subfield`: Specific area (e.g., "neoantigen prediction", "protein folding")
- `problem`: What needs to be solved (free text, 1-3 paragraphs)
- `whyItMatters`: Impact statement
- `existingWork`: Known papers, tools, datasets (optional)
- `suggestedBy`: Scientist profile ID (must be registered)

**suggestions table:**
```typescript
{
  field: string,
  subfield: string,
  problem: string,
  whyItMatters: string,
  existingWork?: string,
  suggestedBy: Id<"scientists">,
  status: "PROPOSED" | "UNDER_REVIEW" | "APPROVED" | "REJECTED",
  reviewedBy?: Id<"users">,     // maintainer
  reviewNotes?: string,
  projectId?: Id<"projects">,   // set when approved and project created
  createdAt: number,
  reviewedAt?: number,
}
```

**Scientist-delegated tasks:** Once a problem is approved and becomes a project, the suggesting scientist can also submit specific research tasks through the dashboard. These appear as root tasks in the project's task DAG, tagged with the scientist's ID so agents know who to route questions back to. Scientists can track progress on their suggested problems in real-time via the dashboard.

---

## CLI Agent (`openlab`)

### Install & Setup

```bash
# Install globally
bun add -g openlab

# First run: interactive setup wizard
openlab

# Wizard flow:
# 1. Welcome + mission statement
# 2. Pick LLM provider (Anthropic, OpenAI, Google, etc.)
# 3. Enter API key (stored locally in ~/.openlab/auth.json)
# 4. Select project(s) to contribute to
# 5. Optional: configure GPU availability
# 6. Start contributing!
```

### Runtime Architecture

```typescript
// Simplified agent loop
while (true) {
  // 1. Check for resumable tasks (suspended tasks whose tickets resolved)
  const resumable = await convex.getResumableTasks(contributorId);
  if (resumable.length > 0) {
    const task = resumable[0];
    // Download frozen session from Convex file storage
    const snapshot = await convex.downloadFile(task.savedState.sessionSnapshot);
    await writeFile(`.sessions/${task.id}/session.jsonl`, snapshot);
    const session = SessionManager.open(`.sessions/${task.id}/`);
    // Inject ticket result and continue
    const ticketResult = await convex.getTicketResult(task.savedState.suspendedOnTicket);
    await session.prompt(ticketResult);
    await convex.completeTask(task.id, extractResult(session));
    continue;
  }

  // 2. Claim new task from server (task arrives with full context)
  const task = await convex.claimTask(contributorId, capabilities);
  if (!task) {
    await sleep(30_000); // No tasks available
    continue;
  }

  // 3. Task is self-contained — role determines system prompt, context is inline
  const systemPrompt = task.type === "RESEARCH"
    ? RESEARCH_SYSTEM_PROMPT
    : VERIFY_SYSTEM_PROMPT;

  const session = createAgentSession({
    sessionManager: SessionManager.create(cwd, `.sessions/${task.id}/`),
    settingsManager: SettingsManager.inMemory({
      compaction: { enabled: true, keepRecentTokens: 40000 },
    }),
    systemPrompt,
    customTools: [
      ...bioinformaticsTools,
      ...labTools(convex),   // Tools that write to Convex
      suspendTool(convex),   // Tool to create tickets and suspend
    ],
  });

  // 4. Run task — context is already inside task, no external lookups
  await session.prompt(JSON.stringify(task.context));

  // 5. Push result to Convex
  await convex.completeTask(task.id, extractResult(session));
}
```

The CLI is **stateless and generic**. It doesn't know about cancer research or any domain. It claims a task, reads the role (RESEARCH or VERIFY), sets the corresponding system prompt, feeds in the context, and lets the agent work. All intelligence is in the task.

### Sandboxing

Agent workspace is restricted to `~/.openlab/workspace/`. The agent cannot:
- Read files outside the workspace
- Execute commands that affect the host system
- Access network resources beyond approved APIs (IEDB, PubMed, Convex)

Pi-mono's tool system enforces this: `createBashTool(workspaceDir)`, `createReadTool(workspaceDir)`, etc. are scoped to the workspace directory.

### Suspend Tool

A custom pi-mono tool that agents call when they need external input. On suspension, the session is frozen and stored inside the task's `savedState`:

```typescript
pi.registerTool({
  name: "suspend",
  description: "Create a ticket for external help and suspend this task. Use when you need GPU compute, scientist verification, data access, or any resource you can't access locally.",
  parameters: Type.Object({
    type: Type.Union([
      Type.Literal("GPU_JOB"),
      Type.Literal("SCIENTIST_QUESTION"),
      Type.Literal("HUMAN_TASK"),
      Type.Literal("DATA_ACCESS"),
    ]),
    question: Type.String(),
    context: Type.String(),
    routingTags: Type.Array(Type.String()),
  }),
  execute: async (_id, params) => {
    const ticket = await convex.createTicket(params);
    // Freeze session → upload to Convex → save reference in task.savedState
    const sessionData = await readFile(`.sessions/${currentTaskId}/session.jsonl`);
    const snapshotId = await convex.uploadFile(sessionData);
    await convex.suspendTask(currentTaskId, {
      sessionSnapshot: snapshotId,
      suspendedOnTicket: ticket.id,
      suspendedAt: Date.now(),
    });
    // Signal the outer loop to move on to the next task
    throw new SuspensionSignal(ticket.id);
  },
});
```

---

## Convex Schema

### Tables

```typescript
// projects
{
  slug: string,           // "oncology/neoantigen-immunogenicity"
  name: string,           // "Neoantigen Immunogenicity Prediction"
  description: string,
  field: string,          // "oncology"
  createdBy: Id<"users">,
  isPublic: boolean,
}

// tasks (self-contained unit of work)
{
  projectId: Id<"projects">,
  parentId?: Id<"tasks">,
  type: "RESEARCH" | "VERIFY",
  priority: number,       // 0-3, lower = higher priority
  status: "PENDING" | "ASSIGNED" | "SUSPENDED" | "COMPLETED" | "FAILED" | "BLOCKED",
  dependsOn: Id<"tasks">[],
  assignedTo?: Id<"users">,
  estimatedTokens?: number,
  createdAt: number,
  completedAt?: number,

  // --- Context (assembled by server at claim time) ---
  context: {
    title: string,
    description: string,
    skill?: string,
    relevantFindings: { findingId: string, title: string, confidence: string, source: string }[],
    relevantDeadEnds: { deadEndId: string, what: string, whyFailed: string }[],
    parentResult?: string,
    dependencyResults: { taskId: string, result: string }[],
    pendingFinding?: {                    // VERIFY tasks only
      findingId: string, title: string, confidence: string,
      source: string, implications: string, submittedBy: string,
    },
    rejectionContext?: {                  // re-research tasks only
      previousAttemptId: string,
      rejectionReasons: { verifier: string, reason: string }[],
      attempt: number,
    },
    hypothesis?: {                        // hypothesis-testing tasks
      id: string, statement: string, rationale: string,
      testPlan: string, basedOn: string[],
    },
    projectDescription: string,
  },

  // --- Saved State (for suspension/resumption) ---
  savedState?: {
    sessionSnapshot: Id<"_storage">,      // Convex file storage (frozen pi-mono JSONL)
    suspendedOnTicket: Id<"tickets">,
    suspendedAt: number,
  },

  // --- Result ---
  result?: string,        // Structured result JSON
}

// tickets
{
  type: "GPU_JOB" | "SCIENTIST_QUESTION" | "HUMAN_TASK" | "DATA_ACCESS" | "COMPUTE",
  createdByTask: Id<"tasks">,
  priority: "URGENT" | "HIGH" | "NORMAL",
  question: string,
  context: string,
  routingTags: string[],
  status: "OPEN" | "CLAIMED" | "RESOLVED" | "EXPIRED",
  claimedBy?: Id<"users">,
  result?: string,
  createdAt: number,
  resolvedAt?: number,
}

// findings
{
  projectId: Id<"projects">,
  findingId: string,      // "F-001"
  title: string,
  confidence: "HIGH" | "MEDIUM" | "LOW",
  source: string,
  implications: string,
  createdByTask: Id<"tasks">,
  createdBy: Id<"users">,
  createdAt: number,
  conflictsWith?: Id<"findings">[],
}

// deadEnds
{
  projectId: Id<"projects">,
  deadEndId: string,      // "DE-001"
  what: string,
  whyFailed: string,
  iterationsSpent: number,
  lesson: string,
  createdByTask: Id<"tasks">,
  createdAt: number,
}

// users (contributors)
{
  displayName: string,
  llmProvider: string,
  capabilities: string[], // ["cpu", "gpu_a100", etc.]
  projects: Id<"projects">[],
  tasksCompleted: number,
  tokensContributed: number,
  joinedAt: number,
}

// pendingFindings (verification staging area — 3-of-3 unanimous)
{
  projectId: Id<"projects">,
  findingId: string,            // "PF-001"
  title: string,
  confidence: "HIGH" | "MEDIUM" | "LOW",
  source: string,
  implications: string,
  submittedByTask: Id<"tasks">,
  submittedBy: Id<"users">,
  submittedAt: number,
  attempt: number,              // 1, 2, 3... (increments on re-research)
  previousAttemptId?: Id<"pendingFindings">,
  verifyTaskIds: Id<"tasks">[],  // 3 auto-created VERIFY tasks
  votes: {
    verifier: Id<"users">,
    verdict: "PASS" | "FAIL",
    notes: string,
    votedAt: number,
  }[],
  status: "PENDING_VERIFICATION" | "VERIFIED" | "REJECTED" | "RE_RESEARCHING",
  resolvedAt?: number,
  rejectionContext?: string,     // aggregated rejection reasons for re-research task
}

// suggestions (problem proposals from scientists)
{
  field: string,
  subfield: string,
  problem: string,
  whyItMatters: string,
  existingWork?: string,
  suggestedBy: Id<"scientists">,
  status: "PROPOSED" | "UNDER_REVIEW" | "APPROVED" | "REJECTED",
  reviewedBy?: Id<"users">,
  reviewNotes?: string,
  projectId?: Id<"projects">,
  createdAt: number,
  reviewedAt?: number,
}

// hypotheses (scientific loop)
{
  projectId: Id<"projects">,
  hypothesisId: string,          // "H-001"
  statement: string,             // testable prediction
  rationale: string,             // why it's worth testing
  testPlan: string,              // how to test (becomes spawned task description)
  basedOn: string[],             // finding/hypothesis IDs that led here
  status: "PROPOSED" | "TESTING" | "SUPPORTED" | "REFUTED" | "ABANDONED",
  testTaskId?: Id<"tasks">,      // spawned RESEARCH task
  result?: string,
  createdByTask: Id<"tasks">,
  createdBy: Id<"users">,
  createdAt: number,
  resolvedAt?: number,
}

// labNotebooks (audit trail)
{
  taskId: Id<"tasks">,
  projectId: Id<"projects">,
  entries: {
    timestamp: number,
    type: "OBSERVATION" | "REASONING" | "HYPOTHESIS" | "RESULT" | "DECISION",
    content: string,
  }[],
  createdAt: number,
}

// scientists (v2)
{
  name: string,
  expertise: string[],
  contactMethods: { type: string, handle: string }[],
  questionsPerWeek: number,
  questionsAnswered: number,
  verified: boolean,
}
```

### Key Mutations

```typescript
// Claim next available task — server assembles context into the task at claim time
// Returns a self-contained task with role, context, and (if resuming) saved state
claimTask(contributorId, capabilities) → task | null

// Complete a task with result
completeTask(taskId, result) → void

// Suspend a task — save frozen session in task.savedState
suspendTask(taskId, savedState: { sessionSnapshot, suspendedOnTicket, suspendedAt }) → void

// Resolve a ticket (makes the suspended task resumable)
resolveTicket(ticketId, result) → void

// Get resumable tasks (suspended tasks whose tickets are now resolved)
getResumableTasks(contributorId) → task[]

// Record dead end (skips verification)
recordDeadEnd(projectId, deadEnd) → deadEndId

// Submit hypothesis (validates testability, auto-spawns RESEARCH task if valid)
submitHypothesis(projectId, hypothesis) → hypothesisId | validationError

// Resolve hypothesis (mark as SUPPORTED/REFUTED based on test task result)
resolveHypothesis(hypothesisId, verdict: "SUPPORTED" | "REFUTED" | "ABANDONED", result) → void

// Append lab notebook entry (audit trail for agent reasoning)
appendLabNotebook(taskId, entry: { type, content }) → void

// Submit finding for verification (goes to pendingFindings, auto-creates 3 VERIFY tasks)
// Each VERIFY task gets the finding baked into its context
submitFinding(projectId, finding) → pendingFindingId

// Cast a vote on a pending finding (PASS or FAIL, enforces different-contributor rule)
// If 3/3 PASS → promotes to findings (KB). If any FAIL → auto-creates re-research task
// with rejection reasons baked into the new task's context.rejectionContext
castVerifyVote(pendingFindingId, verdict: "PASS" | "FAIL", notes) → void

// Submit a problem suggestion (scientists only)
submitSuggestion(suggestion) → suggestionId

// Approve or reject a suggestion (maintainers only)
reviewSuggestion(suggestionId, verdict: "APPROVED" | "REJECTED", notes) → projectId?
```

### Key Queries

```typescript
// Dashboard: active agents, tasks in progress, recent findings
getDashboard(projectId) → { activeAgents, tasksInProgress, recentFindings, stats }

// Public knowledge base
getFindings(projectId, filters?) → findings[]
getDeadEnds(projectId) → deadEnds[]

// Expand a finding to full detail (Level 2 pyramid summary)
// Used by agents when Level 0/1 context isn't enough
expandFinding(findingId) → finding (full text with sources, methodology, implications)

// Task tree for a project
getTaskTree(projectId) → DAG of tasks

// Open tickets (for scientists/humans)
getOpenTickets(routingTags?) → tickets[]

// Pending findings awaiting verification
getPendingFindings(projectId) → pendingFindings[]

// Hypothesis tree (shows scientific loop progress)
getHypotheses(projectId, status?) → hypotheses[]

// Lab notebook for a task (audit trail)
getLabNotebook(taskId) → labNotebook

// Problem suggestions (for maintainer review)
getSuggestions(status?) → suggestions[]

// Scientist's suggested problems and their progress
getScientistProjects(scientistId) → [{suggestion, project, taskTree}]
```

---

## Public Dashboard

Web app (likely Next.js or similar) showing:
- Active contributors and what they're working on
- Task tree with status visualization (DAG view)
- Recent findings feed (verified findings only)
- Pending findings awaiting verification (with verification status)
- **Hypothesis tree**: active scientific loops, what's being tested, what was supported/refuted
- **Lab notebooks**: browsable audit trail of agent reasoning per task
- Knowledge base browser (findings, dead-ends, open questions)
- Open tickets that need human attention
- Project stats (tasks completed, tokens contributed, findings count, hypotheses tested)
- **"Suggest a Problem" form** for registered scientists to propose new research problems
- **Suggestion queue** for maintainers to review/approve/reject proposals
- **Scientist dashboard**: track progress on problems they suggested, submit follow-up tasks

---

## Extensibility

The platform is designed to be extensible at every layer:

### Pi-mono Extensions
Custom tools are TypeScript files. Adding new capabilities (new APIs, new databases, new compute backends) is just adding a new extension:

```
lab/extensions/
├── bioinformatics.ts     # IEDB, PubMed, BLAST
├── lab-tools.ts          # KB tools (write to Convex)
├── suspend.ts            # Ticket creation + suspension
├── gpu-tools.ts          # GPU job submission (future)
└── custom/               # Project-specific extensions
```

### Skills
New research workflows are markdown files. Anyone can contribute skills:

```
lab/skills/
├── literature-review.md
├── run-experiment.md
├── protein-structure-prediction.md  # future
└── clinical-trial-analysis.md       # future
```

### Ticket Resolvers
New ways to resolve tickets can be plugged in:
- Telegram bot (v2)
- Discord bot (v2)
- Email integration (v2)
- GPU cluster integration (v2)
- Mechanical Turk / human-in-the-loop (v2)

### Projects
New research projects are just Convex records with their own task trees and knowledge bases. The CLI auto-discovers available projects during onboarding.

---

## Implementation Phases

### Phase 1: Core Platform (MVP)
- [ ] Convex backend: schema, mutations, queries
- [ ] CLI agent: install, auth wizard, task pull/push loop
- [ ] Pi-mono integration: session management, custom tools
- [ ] Knowledge base: findings, dead-ends synced to Convex
- [ ] **Verification pipeline**: pendingFindings → 3 VERIFY tasks → unanimous PASS → KB
- [ ] **Rejection loop**: any FAIL → auto re-research task with rejection context
- [ ] **Different-contributor enforcement**: server rejects self-verification + duplicate verifiers
- [ ] **Hypothesis generation**: RESEARCH tasks can spawn hypotheses → auto-create test tasks
- [ ] **Hypothesis validation**: testability check before spawning tasks (Pydantic-style)
- [ ] **Lab notebooks**: structured reasoning audit trail per task
- [ ] **Scientific loop**: results feed back as context to next hypothesis-testing task
- [ ] Task DAG: create, assign, complete, dependency resolution
- [ ] Seed cancer research project with our 18 existing tasks

### Phase 2: Suspension/Continuation
- [ ] Suspend tool: agents can create tickets and freeze
- [ ] Session freezing: pi-mono session snapshot + metadata in Convex
- [ ] Session restore: resume frozen session with ticket result
- [ ] Multi-session: contributor runs multiple tasks, switching on suspension

### Phase 3: Public Dashboard
- [ ] Web app showing live project state
- [ ] Task tree visualization
- [ ] Findings feed (verified) + pending verification queue
- [ ] Contributor leaderboard / stats
- [ ] Knowledge base browser
- [ ] **"Suggest a Problem" form** for scientists
- [ ] **Suggestion review queue** for maintainers (approve/reject)
- [ ] **Scientist dashboard**: track suggested problems, submit follow-up tasks

### Phase 4: Scientist Network
- [ ] Telegram bot for scientist advisors
- [ ] Question ticket routing based on expertise
- [ ] Scientist onboarding (expertise tags, availability settings)
- [ ] Rate limiting (questions per day/week/month)

### Phase 5: GPU Network
- [ ] GPU job tickets
- [ ] GPU contributor agent (picks up compute tickets)
- [ ] Job result delivery back to requesting agent
- [ ] Monitoring and cost tracking

---

## Security Model

### Contributor Machines
- Agent sandboxed to `~/.openlab/workspace/`
- No access to host filesystem, SSH keys, etc.
- Network restricted to approved APIs + Convex
- API keys stored locally, never sent to server

### Server (Convex)
- Auth via Convex built-in auth (or custom JWT)
- Rate limiting per contributor
- Findings validated before storage (format check, not content)
- File uploads scanned for size limits

### Trust Model
- Contributors trusted to run honest agents (can verify via result quality)
- **No finding enters the KB without independent verification** by a different contributor
- Scientists verified manually initially, automated later
- All data public (no secrets to leak)
- Worst case of malicious contributor: wasted tokens, bad pending findings (caught by verification pipeline before entering KB)
- Problem suggestions require maintainer approval before becoming active projects
