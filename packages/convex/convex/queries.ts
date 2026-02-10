import { query } from "./_generated/server";
import { v } from "convex/values";

export const getDashboard = query({
  args: {
    projectId: v.optional(v.id("projects")),
  },
  handler: async (ctx, args) => {
    const allTasks = args.projectId
      ? await ctx.db
          .query("tasks")
          .withIndex("by_project", (q) => q.eq("projectId", args.projectId!))
          .collect()
      : await ctx.db.query("tasks").collect();

    const allFindings = args.projectId
      ? await ctx.db
          .query("findings")
          .withIndex("by_project", (q) => q.eq("projectId", args.projectId!))
          .collect()
      : await ctx.db.query("findings").collect();

    const allHypotheses = args.projectId
      ? await ctx.db
          .query("hypotheses")
          .withIndex("by_project", (q) => q.eq("projectId", args.projectId!))
          .collect()
      : await ctx.db.query("hypotheses").collect();

    const contributors = await ctx.db.query("users").collect();

    const activeTasks = allTasks.filter(
      (t) => t.status === "ASSIGNED" || t.status === "PENDING",
    ).length;
    const completedTasks = allTasks.filter(
      (t) => t.status === "COMPLETED",
    ).length;

    const recentFindings = allFindings
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 10);

    return {
      activeTasks,
      completedTasks,
      totalTasks: allTasks.length,
      verifiedFindings: allFindings.length,
      recentFindings,
      contributorCount: contributors.length,
      hypothesesTesting: allHypotheses.filter((h) => h.status === "TESTING")
        .length,
      hypothesesSupported: allHypotheses.filter(
        (h) => h.status === "SUPPORTED",
      ).length,
      hypothesesRefuted: allHypotheses.filter((h) => h.status === "REFUTED")
        .length,
    };
  },
});

export const getFindings = query({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("findings")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();
  },
});

export const getDeadEnds = query({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("deadEnds")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();
  },
});

export const getTaskTree = query({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("tasks")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();
  },
});

export const getPendingFindings = query({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("pendingFindings")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();
  },
});

export const getHypotheses = query({
  args: {
    projectId: v.id("projects"),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const all = await ctx.db
      .query("hypotheses")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();

    if (args.status) {
      return all.filter((h) => h.status === args.status);
    }
    return all;
  },
});

export const getOpenTickets = query({
  args: {
    routingTags: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const tickets = await ctx.db
      .query("tickets")
      .withIndex("by_status", (q) => q.eq("status", "OPEN"))
      .collect();

    if (args.routingTags && Array.isArray(args.routingTags)) {
      return tickets.filter((t) => {
        const tags: string[] = t.routingTags ?? [];
        return args.routingTags.some((tag: string) => tags.includes(tag));
      });
    }
    return tickets;
  },
});

export const getAvailableTasks = query({
  args: {
    projectId: v.optional(v.id("projects")),
  },
  handler: async (ctx, args) => {
    if (args.projectId) {
      const tasks = await ctx.db
        .query("tasks")
        .withIndex("by_project", (q) => q.eq("projectId", args.projectId!))
        .collect();
      return tasks.filter((t) => t.status === "PENDING");
    }
    return await ctx.db
      .query("tasks")
      .withIndex("by_status", (q) => q.eq("status", "PENDING"))
      .collect();
  },
});

export const getContributors = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("users").collect();
  },
});

export const expandFinding = query({
  args: {
    findingId: v.string(),
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    const findings = await ctx.db
      .query("findings")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();
    const finding = findings.find((f) => f.findingId === args.findingId);
    if (!finding) return null;

    // Return Level 2 (full detail)
    return {
      findingId: finding.findingId,
      title: finding.title,
      confidence: finding.confidence,
      source: finding.source,
      implications: finding.implications,
      summaryL0: finding.summaryL0,
      summaryL1: finding.summaryL1,
      createdAt: finding.createdAt,
    };
  },
});
