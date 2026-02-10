import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const submitHypothesis = mutation({
  args: {
    projectId: v.id("projects"),
    statement: v.string(),
    rationale: v.string(),
    testPlan: v.string(),
    basedOn: v.any(), // string[]
    taskId: v.id("tasks"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Validate testability
    if (!args.statement.trim()) {
      throw new Error("Hypothesis statement is required");
    }
    if (!args.testPlan.trim()) {
      throw new Error("Test plan is required");
    }

    // Check for overlap with existing hypotheses
    const existing = await ctx.db
      .query("hypotheses")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();

    // Check dead ends
    const deadEnds = await ctx.db
      .query("deadEnds")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();

    // Simple overlap check — look for similar statements
    const normalizedStatement = args.statement.toLowerCase().trim();
    for (const h of existing) {
      if (
        h.status !== "ABANDONED" &&
        h.statement.toLowerCase().trim() === normalizedStatement
      ) {
        throw new Error(
          `Overlaps with existing hypothesis ${h.hypothesisId}: ${h.statement}`,
        );
      }
    }

    const hypothesisId = `H-${String(existing.length + 1).padStart(3, "0")}`;

    const hId = await ctx.db.insert("hypotheses", {
      projectId: args.projectId,
      hypothesisId,
      statement: args.statement,
      rationale: args.rationale,
      testPlan: args.testPlan,
      basedOn: args.basedOn ?? [],
      status: "PROPOSED",
      createdByTask: args.taskId,
      createdBy: args.userId,
      createdAt: Date.now(),
    });

    // Auto-create RESEARCH task to test this hypothesis
    const testTaskId = await ctx.db.insert("tasks", {
      projectId: args.projectId,
      type: "RESEARCH",
      priority: 2,
      status: "PENDING",
      dependsOn: [],
      context: {
        title: `Test hypothesis: ${args.statement}`,
        description: args.testPlan,
        hypothesis: {
          id: hypothesisId,
          statement: args.statement,
          rationale: args.rationale,
          testPlan: args.testPlan,
          basedOn: args.basedOn ?? [],
        },
      },
      createdAt: Date.now(),
    });

    // Update hypothesis with test task ID and status
    await ctx.db.patch(hId, {
      status: "TESTING",
      testTaskId,
    });

    return hId;
  },
});

export const resolveHypothesis = mutation({
  args: {
    hypothesisId: v.id("hypotheses"),
    verdict: v.union(
      v.literal("SUPPORTED"),
      v.literal("REFUTED"),
      v.literal("ABANDONED"),
    ),
    result: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.hypothesisId, {
      status: args.verdict,
      result: args.result,
      resolvedAt: Date.now(),
    });
  },
});
