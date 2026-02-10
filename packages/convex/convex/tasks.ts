import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { generateTaskMarkdown } from "./lib/task-markdown";

export const createTask = mutation({
  args: {
    projectId: v.id("projects"),
    parentId: v.optional(v.id("tasks")),
    type: v.union(v.literal("RESEARCH"), v.literal("VERIFY")),
    priority: v.number(),
    context: v.any(),
    dependsOn: v.optional(v.any()),
    estimatedTokens: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("tasks", {
      projectId: args.projectId,
      parentId: args.parentId,
      type: args.type,
      priority: args.priority,
      status: "PENDING",
      dependsOn: args.dependsOn ?? [],
      context: args.context,
      estimatedTokens: args.estimatedTokens,
      createdAt: Date.now(),
    });
  },
});

export const claimTask = mutation({
  args: {
    contributorId: v.id("users"),
    capabilities: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    // Get all PENDING tasks, ordered by priority (lower number = higher priority)
    const pendingTasks = await ctx.db
      .query("tasks")
      .withIndex("by_status", (q) => q.eq("status", "PENDING"))
      .collect();

    // Sort by priority (lower = more important)
    pendingTasks.sort((a, b) => a.priority - b.priority);

    for (const task of pendingTasks) {
      // Check dependencies are met
      const deps: string[] = task.dependsOn ?? [];
      let depsOk = true;
      for (const depId of deps) {
        const dep = await ctx.db.get(depId as any);
        if (!dep || dep.status !== "COMPLETED") {
          depsOk = false;
          break;
        }
      }
      if (!depsOk) continue;

      // For VERIFY tasks, enforce different-contributor rule
      if (task.type === "VERIFY" && task.context?.pendingFinding) {
        // Find the pending finding to check submitter
        const pendingFindings = await ctx.db
          .query("pendingFindings")
          .withIndex("by_project", (q) => q.eq("projectId", task.projectId))
          .collect();
        const pf = pendingFindings.find(
          (f) => f.findingId === task.context.pendingFinding?.findingId,
        );
        if (pf && pf.submittedBy === args.contributorId) continue;

        // Check that this contributor hasn't already voted
        if (pf) {
          const votes: any[] = pf.votes ?? [];
          if (votes.some((v: any) => v.verifier === args.contributorId))
            continue;
        }
      }

      // Assemble context: pull relevant findings, dead ends, dependency results
      const findings = await ctx.db
        .query("findings")
        .withIndex("by_project", (q) => q.eq("projectId", task.projectId))
        .collect();
      const deadEnds = await ctx.db
        .query("deadEnds")
        .withIndex("by_project", (q) => q.eq("projectId", task.projectId))
        .collect();

      const depResults: { taskId: string; result: string }[] = [];
      for (const depId of deps) {
        const dep = await ctx.db.get(depId as any);
        if (dep?.result) {
          depResults.push({ taskId: depId, result: dep.result });
        }
      }

      // Get parent result if applicable
      let parentResult: string | undefined;
      if (task.parentId) {
        const parent = await ctx.db.get(task.parentId);
        parentResult = parent?.result ?? undefined;
      }

      // Get project description
      const project = await ctx.db.get(task.projectId);

      // Pyramid summaries: L0 for all, L1 for recent/related, L2 for deps
      // Collect finding IDs from dependency tasks to serve at L2
      const depFindingIds = new Set<string>();
      for (const depId of deps) {
        const dep = await ctx.db.get(depId as any);
        if (dep?.result) {
          // Check if any finding was created by this dep task
          for (const f of findings) {
            if ((f.createdByTask as any) === depId) {
              depFindingIds.add(f.findingId);
            }
          }
        }
      }

      // L2 (full detail) for dependency findings
      const l2Findings = findings
        .filter((f) => depFindingIds.has(f.findingId))
        .map((f) => ({
          findingId: f.findingId,
          title: f.title,
          confidence: f.confidence,
          source: f.source,
          implications: f.implications,
          level: 2 as const,
        }));

      // L1 (2-3 line) for most recent findings (not already at L2)
      const l1Findings = findings
        .filter((f) => !depFindingIds.has(f.findingId))
        .sort((a, b) => b.createdAt - a.createdAt)
        .slice(0, 10)
        .map((f) => ({
          findingId: f.findingId,
          summary: f.summaryL1 ?? `${f.title}. ${f.implications}`,
          confidence: f.confidence,
          level: 1 as const,
        }));

      // L0 (1-line) for remaining findings
      const l1Ids = new Set(l1Findings.map((f) => f.findingId));
      const l0Findings = findings
        .filter((f) => !depFindingIds.has(f.findingId) && !l1Ids.has(f.findingId))
        .slice(0, 50)
        .map((f) => ({
          findingId: f.findingId,
          summary: f.summaryL0 ?? f.title,
          level: 0 as const,
        }));

      const assembledContext = {
        ...task.context,
        relevantFindings: [...l2Findings, ...l1Findings, ...l0Findings],
        relevantDeadEnds: deadEnds.slice(0, 10).map((d) => ({
          deadEndId: d.deadEndId,
          what: d.what,
          whyFailed: d.whyFailed,
        })),
        dependencyResults: depResults,
        parentResult,
        projectDescription: project?.description ?? "",
      };

      // Generate contextMarkdown (TASK.md content) — frozen at claim time
      const contextMarkdown = generateTaskMarkdown({
        _id: task._id as string,
        type: task.type,
        priority: task.priority,
        context: assembledContext,
        parentId: task.parentId as string | undefined,
      });

      // Claim the task
      await ctx.db.patch(task._id, {
        status: "ASSIGNED",
        assignedTo: args.contributorId,
        context: assembledContext,
        contextMarkdown,
      });

      return await ctx.db.get(task._id);
    }

    return null;
  },
});

export const completeTask = mutation({
  args: {
    taskId: v.id("tasks"),
    result: v.string(),
  },
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId);
    if (!task) throw new Error("Task not found");

    await ctx.db.patch(args.taskId, {
      status: "COMPLETED",
      result: args.result,
      completedAt: Date.now(),
    });

    // Update contributor stats
    if (task.assignedTo) {
      const user = await ctx.db.get(task.assignedTo);
      if (user) {
        await ctx.db.patch(task.assignedTo, {
          tasksCompleted: user.tasksCompleted + 1,
        });
      }
    }
  },
});

export const suspendTask = mutation({
  args: {
    taskId: v.id("tasks"),
    savedState: v.any(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.taskId, {
      status: "SUSPENDED",
      savedState: args.savedState,
    });
  },
});

export const getResumableTasks = query({
  args: {
    contributorId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const suspended = await ctx.db
      .query("tasks")
      .withIndex("by_status", (q) => q.eq("status", "SUSPENDED"))
      .collect();

    const resumable = [];
    for (const task of suspended) {
      if (task.assignedTo !== args.contributorId) continue;
      if (!task.savedState?.suspendedOnTicket) continue;

      const ticket = await ctx.db.get(task.savedState.suspendedOnTicket);
      if (ticket?.status === "RESOLVED") {
        resumable.push(task);
      }
    }
    return resumable;
  },
});
