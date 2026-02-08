import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Projects (e.g., "oncology/neoantigen-immunogenicity")
  projects: defineTable({
    slug: v.string(),
    field: v.string(),
    name: v.string(),
    description: v.string(),
    status: v.union(v.literal("active"), v.literal("paused"), v.literal("completed")),
    createdAt: v.number(),
  }).index("by_slug", ["slug"]),

  // Research tasks
  tasks: defineTable({
    projectId: v.id("projects"),
    role: v.union(v.literal("RESEARCH"), v.literal("VERIFY")),
    title: v.string(),
    description: v.string(),
    status: v.union(
      v.literal("available"),
      v.literal("claimed"),
      v.literal("in_progress"),
      v.literal("suspended"),
      v.literal("completed"),
      v.literal("failed")
    ),
    priority: v.union(v.literal("critical"), v.literal("high"), v.literal("medium"), v.literal("low")),
    claimedBy: v.optional(v.id("contributors")),
    claimedAt: v.optional(v.number()),
    context: v.optional(v.string()),
    parentTaskId: v.optional(v.id("tasks")),
    verifyingFindingId: v.optional(v.id("findings")),
    completedAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_project", ["projectId"])
    .index("by_status", ["status"])
    .index("by_claimed", ["claimedBy"]),

  // Knowledge base findings
  findings: defineTable({
    projectId: v.id("projects"),
    taskId: v.id("tasks"),
    title: v.string(),
    content: v.string(),
    confidence: v.union(v.literal("HIGH"), v.literal("MEDIUM"), v.literal("LOW")),
    source: v.string(),
    status: v.union(
      v.literal("pending_verification"),
      v.literal("verified"),
      v.literal("rejected"),
      v.literal("dead_end")
    ),
    verificationCount: v.number(),
    passCount: v.number(),
    failCount: v.number(),
    createdAt: v.number(),
  })
    .index("by_project", ["projectId"])
    .index("by_status", ["status"]),

  // Verification votes
  verifications: defineTable({
    findingId: v.id("findings"),
    taskId: v.id("tasks"),
    contributorId: v.id("contributors"),
    verdict: v.union(v.literal("PASS"), v.literal("FAIL")),
    reasoning: v.string(),
    createdAt: v.number(),
  }).index("by_finding", ["findingId"]),

  // Hypotheses (scientific loop)
  hypotheses: defineTable({
    projectId: v.id("projects"),
    generatedByTaskId: v.id("tasks"),
    title: v.string(),
    description: v.string(),
    testable: v.boolean(),
    status: v.union(
      v.literal("proposed"),
      v.literal("testing"),
      v.literal("supported"),
      v.literal("refuted"),
      v.literal("inconclusive")
    ),
    testTaskId: v.optional(v.id("tasks")),
    createdAt: v.number(),
  })
    .index("by_project", ["projectId"])
    .index("by_status", ["status"]),

  // Lab notebooks (reasoning audit trail)
  labNotebooks: defineTable({
    taskId: v.id("tasks"),
    contributorId: v.id("contributors"),
    entries: v.string(), // JSON string of structured entries
    sessionFile: v.optional(v.id("_storage")), // Frozen pi-mono session
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_task", ["taskId"]),

  // Contributors
  contributors: defineTable({
    name: v.string(),
    machineId: v.string(),
    tasksCompleted: v.number(),
    findingsContributed: v.number(),
    verificationsCompleted: v.number(),
    joinedAt: v.number(),
    lastActiveAt: v.number(),
  }).index("by_machine", ["machineId"]),

  // Tickets (human escalation)
  tickets: defineTable({
    projectId: v.id("projects"),
    taskId: v.optional(v.id("tasks")),
    type: v.union(v.literal("NEED_GPU"), v.literal("NEED_SCIENTIST"), v.literal("NEED_DATA"), v.literal("BUG")),
    title: v.string(),
    description: v.string(),
    status: v.union(v.literal("open"), v.literal("in_progress"), v.literal("resolved")),
    createdAt: v.number(),
    resolvedAt: v.optional(v.number()),
  })
    .index("by_project", ["projectId"])
    .index("by_status", ["status"]),
});
