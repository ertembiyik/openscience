import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const createTicket = mutation({
  args: {
    taskId: v.id("tasks"),
    type: v.union(
      v.literal("GPU_JOB"),
      v.literal("SCIENTIST_QUESTION"),
      v.literal("HUMAN_TASK"),
      v.literal("DATA_ACCESS"),
      v.literal("COMPUTE"),
    ),
    priority: v.union(
      v.literal("URGENT"),
      v.literal("HIGH"),
      v.literal("NORMAL"),
    ),
    question: v.string(),
    context: v.string(),
    routingTags: v.any(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("tickets", {
      type: args.type,
      createdByTask: args.taskId,
      priority: args.priority,
      question: args.question,
      context: args.context,
      routingTags: args.routingTags ?? [],
      status: "OPEN",
      createdAt: Date.now(),
    });
  },
});

export const resolveTicket = mutation({
  args: {
    ticketId: v.id("tickets"),
    result: v.string(),
    resolvedBy: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.ticketId, {
      status: "RESOLVED",
      result: args.result,
      claimedBy: args.resolvedBy,
      resolvedAt: Date.now(),
    });
  },
});
