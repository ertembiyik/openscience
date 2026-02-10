import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const submitFinding = mutation({
  args: {
    projectId: v.id("projects"),
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
  },
  handler: async (ctx, args) => {
    // Generate findingId
    const existing = await ctx.db
      .query("pendingFindings")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();
    const findingId = `PF-${String(existing.length + 1).padStart(3, "0")}`;

    // Get submitter name for verify task context
    const submitter = await ctx.db.get(args.submittedBy);
    const submitterName = submitter?.displayName ?? "Unknown";

    // Create pending finding
    const pfId = await ctx.db.insert("pendingFindings", {
      projectId: args.projectId,
      findingId,
      title: args.title,
      confidence: args.confidence,
      source: args.source,
      implications: args.implications,
      submittedByTask: args.submittedByTask,
      submittedBy: args.submittedBy,
      submittedAt: Date.now(),
      attempt: 1,
      verifyTaskIds: [],
      votes: [],
      status: "PENDING_VERIFICATION",
    });

    // Auto-create 3 VERIFY tasks
    const verifyTaskIds = [];
    for (let i = 0; i < 3; i++) {
      const taskId = await ctx.db.insert("tasks", {
        projectId: args.projectId,
        type: "VERIFY",
        priority: 1, // High priority — verification blocks KB entry
        status: "PENDING",
        dependsOn: [],
        context: {
          title: `Verify: ${args.title}`,
          description: `Independently verify the following finding. Check sources, reproduce claims, cross-reference with known findings. Cast PASS or FAIL.`,
          pendingFinding: {
            findingId,
            title: args.title,
            confidence: args.confidence,
            source: args.source,
            implications: args.implications,
            submittedBy: submitterName,
          },
          pendingFindingDbId: pfId,
        },
        createdAt: Date.now(),
      });
      verifyTaskIds.push(taskId);
    }

    // Update pending finding with verify task IDs
    await ctx.db.patch(pfId, { verifyTaskIds });

    return pfId;
  },
});

export const castVerifyVote = mutation({
  args: {
    pendingFindingId: v.id("pendingFindings"),
    verifierId: v.id("users"),
    verdict: v.union(v.literal("PASS"), v.literal("FAIL")),
    notes: v.string(),
  },
  handler: async (ctx, args) => {
    const pf = await ctx.db.get(args.pendingFindingId);
    if (!pf) throw new Error("Pending finding not found");

    // Enforce different-contributor rule
    if (pf.submittedBy === args.verifierId) {
      throw new Error("Cannot verify your own finding");
    }
    const votes: any[] = pf.votes ?? [];
    if (votes.some((v: any) => v.verifier === args.verifierId)) {
      throw new Error("Already voted on this finding");
    }

    // Add vote
    const newVote = {
      verifier: args.verifierId,
      verdict: args.verdict,
      notes: args.notes,
      votedAt: Date.now(),
    };
    const updatedVotes = [...votes, newVote];

    await ctx.db.patch(args.pendingFindingId, { votes: updatedVotes });

    // Check if we have 3 votes
    if (updatedVotes.length === 3) {
      const allPass = updatedVotes.every((v: any) => v.verdict === "PASS");

      if (allPass) {
        // Promote to findings table
        const allFindings = await ctx.db
          .query("findings")
          .withIndex("by_project", (q) => q.eq("projectId", pf.projectId))
          .collect();
        const findingId = `F-${String(allFindings.length + 1).padStart(3, "0")}`;

        // Generate pyramid summaries
        // L0: title alone serves as the 1-line summary
        const summaryL0 = pf.title;
        // L1: title + implications for 2-3 line context
        const summaryL1 = `${pf.title}. ${pf.implications}`;

        await ctx.db.insert("findings", {
          projectId: pf.projectId,
          findingId,
          title: pf.title,
          confidence: pf.confidence,
          source: pf.source,
          implications: pf.implications,
          summaryL0,
          summaryL1,
          createdByTask: pf.submittedByTask,
          createdBy: pf.submittedBy,
          createdAt: Date.now(),
        });

        await ctx.db.patch(args.pendingFindingId, {
          status: "VERIFIED",
          resolvedAt: Date.now(),
        });
      } else {
        // Rejected — build rejection context
        const rejections = updatedVotes
          .filter((v: any) => v.verdict === "FAIL")
          .map((v: any) => {
            return `Verifier rejected: ${v.notes}`;
          });
        const rejectionContext = rejections.join("\n\n");

        await ctx.db.patch(args.pendingFindingId, {
          status: "REJECTED",
          resolvedAt: Date.now(),
          rejectionContext,
        });

        // Auto-create re-research task with rejection context
        await ctx.db.insert("tasks", {
          projectId: pf.projectId,
          type: "RESEARCH",
          priority: 1,
          status: "PENDING",
          dependsOn: [],
          context: {
            title: `Re-research: ${pf.title}`,
            description: `A previous finding was rejected during verification. Re-investigate and either fix the finding or record it as a dead end.`,
            rejectionContext: {
              previousAttemptId: pf.findingId,
              rejectionReasons: updatedVotes
                .filter((v: any) => v.verdict === "FAIL")
                .map((v: any) => ({
                  verifier: "anonymous",
                  reason: v.notes,
                })),
              attempt: pf.attempt + 1,
            },
          },
          createdAt: Date.now(),
        });
      }
    }
  },
});

export const recordDeadEnd = mutation({
  args: {
    projectId: v.id("projects"),
    what: v.string(),
    whyFailed: v.string(),
    iterationsSpent: v.number(),
    lesson: v.string(),
    taskId: v.id("tasks"),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("deadEnds")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();
    const deadEndId = `DE-${String(existing.length + 1).padStart(3, "0")}`;

    return await ctx.db.insert("deadEnds", {
      projectId: args.projectId,
      deadEndId,
      what: args.what,
      whyFailed: args.whyFailed,
      iterationsSpent: args.iterationsSpent,
      lesson: args.lesson,
      createdByTask: args.taskId,
      createdAt: Date.now(),
    });
  },
});
