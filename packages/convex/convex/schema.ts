import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  projects: defineTable({
    slug: v.string(),
    name: v.string(),
    description: v.string(),
    field: v.string(),
    isPublic: v.boolean(),
    createdBy: v.optional(v.id("users")),
  }).index("by_slug", ["slug"]),

  tasks: defineTable({
    projectId: v.id("projects"),
    parentId: v.optional(v.id("tasks")),
    type: v.union(v.literal("RESEARCH"), v.literal("VERIFY")),
    priority: v.number(), // 0-3, lower = higher priority
    status: v.union(
      v.literal("PENDING"),
      v.literal("ASSIGNED"),
      v.literal("SUSPENDED"),
      v.literal("COMPLETED"),
      v.literal("FAILED"),
      v.literal("BLOCKED"),
    ),
    dependsOn: v.any(), // Id<"tasks">[]
    assignedTo: v.optional(v.id("users")),
    context: v.any(), // TaskContext object — assembled at claim time
    contextMarkdown: v.optional(v.string()), // Full TASK.md content — frozen at claim time
    savedState: v.optional(v.any()), // { sessionSnapshot, suspendedOnTicket, suspendedAt }
    result: v.optional(v.string()),
    estimatedTokens: v.optional(v.number()),
    createdAt: v.number(),
    completedAt: v.optional(v.number()),
  })
    .index("by_project", ["projectId"])
    .index("by_status", ["status"])
    .index("by_assignedTo", ["assignedTo"]),

  pendingFindings: defineTable({
    projectId: v.id("projects"),
    findingId: v.string(), // "PF-001"
    title: v.string(),
    confidence: v.union(
      v.literal("HIGH"),
      v.literal("MEDIUM"),
      v.literal("LOW"),
    ),
    source: v.string(),
    implications: v.string(),
    submittedByTask: v.id("tasks"),
    submittedBy: v.id("users"),
    submittedAt: v.number(),
    attempt: v.number(),
    previousAttemptId: v.optional(v.id("pendingFindings")),
    verifyTaskIds: v.any(), // Id<"tasks">[]
    votes: v.any(), // { verifier, verdict, notes, votedAt }[]
    status: v.union(
      v.literal("PENDING_VERIFICATION"),
      v.literal("VERIFIED"),
      v.literal("REJECTED"),
      v.literal("RE_RESEARCHING"),
    ),
    resolvedAt: v.optional(v.number()),
    rejectionContext: v.optional(v.string()),
  })
    .index("by_project", ["projectId"])
    .index("by_status", ["status"]),

  findings: defineTable({
    projectId: v.id("projects"),
    findingId: v.string(), // "F-001"
    title: v.string(),
    confidence: v.union(
      v.literal("HIGH"),
      v.literal("MEDIUM"),
      v.literal("LOW"),
    ),
    source: v.string(),
    implications: v.string(),
    createdByTask: v.id("tasks"),
    createdBy: v.id("users"),
    summaryL0: v.optional(v.string()), // 1-line compressed summary
    summaryL1: v.optional(v.string()), // 2-3 line summary
    createdAt: v.number(),
    conflictsWith: v.optional(v.any()), // Id<"findings">[]
  }).index("by_project", ["projectId"]),

  deadEnds: defineTable({
    projectId: v.id("projects"),
    deadEndId: v.string(), // "DE-001"
    what: v.string(),
    whyFailed: v.string(),
    iterationsSpent: v.number(),
    lesson: v.string(),
    createdByTask: v.id("tasks"),
    createdAt: v.number(),
  }).index("by_project", ["projectId"]),

  tickets: defineTable({
    type: v.union(
      v.literal("GPU_JOB"),
      v.literal("SCIENTIST_QUESTION"),
      v.literal("HUMAN_TASK"),
      v.literal("DATA_ACCESS"),
      v.literal("COMPUTE"),
    ),
    createdByTask: v.id("tasks"),
    priority: v.union(
      v.literal("URGENT"),
      v.literal("HIGH"),
      v.literal("NORMAL"),
    ),
    question: v.string(),
    context: v.string(),
    routingTags: v.any(), // string[]
    status: v.union(
      v.literal("OPEN"),
      v.literal("CLAIMED"),
      v.literal("RESOLVED"),
      v.literal("EXPIRED"),
    ),
    claimedBy: v.optional(v.id("users")),
    result: v.optional(v.string()),
    createdAt: v.number(),
    resolvedAt: v.optional(v.number()),
  })
    .index("by_status", ["status"])
    .index("by_project", ["createdByTask"]),

  hypotheses: defineTable({
    projectId: v.id("projects"),
    hypothesisId: v.string(), // "H-001"
    statement: v.string(),
    rationale: v.string(),
    testPlan: v.string(),
    basedOn: v.any(), // string[] — finding/hypothesis IDs
    status: v.union(
      v.literal("PROPOSED"),
      v.literal("TESTING"),
      v.literal("SUPPORTED"),
      v.literal("REFUTED"),
      v.literal("ABANDONED"),
    ),
    testTaskId: v.optional(v.id("tasks")),
    result: v.optional(v.string()),
    createdByTask: v.id("tasks"),
    createdBy: v.id("users"),
    createdAt: v.number(),
    resolvedAt: v.optional(v.number()),
  })
    .index("by_project", ["projectId"])
    .index("by_status", ["status"]),

  labNotebooks: defineTable({
    taskId: v.id("tasks"),
    projectId: v.id("projects"),
    entries: v.any(), // { timestamp, type, content }[]
    createdAt: v.number(),
  }).index("by_task", ["taskId"]),

  users: defineTable({
    displayName: v.string(),
    llmProvider: v.string(),
    capabilities: v.any(), // string[]
    projects: v.any(), // Id<"projects">[]
    tasksCompleted: v.number(),
    tokensContributed: v.number(),
    joinedAt: v.number(),
  }).index("by_displayName", ["displayName"]),
});
