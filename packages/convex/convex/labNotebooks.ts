import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const appendEntry = mutation({
  args: {
    taskId: v.id("tasks"),
    projectId: v.id("projects"),
    entry: v.object({
      type: v.union(
        v.literal("OBSERVATION"),
        v.literal("REASONING"),
        v.literal("HYPOTHESIS"),
        v.literal("RESULT"),
        v.literal("DECISION"),
      ),
      content: v.string(),
    }),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("labNotebooks")
      .withIndex("by_task", (q) => q.eq("taskId", args.taskId))
      .first();

    const entryWithTimestamp = {
      ...args.entry,
      timestamp: Date.now(),
    };

    if (existing) {
      const entries: any[] = existing.entries ?? [];
      await ctx.db.patch(existing._id, {
        entries: [...entries, entryWithTimestamp],
      });
      return existing._id;
    } else {
      return await ctx.db.insert("labNotebooks", {
        taskId: args.taskId,
        projectId: args.projectId,
        entries: [entryWithTimestamp],
        createdAt: Date.now(),
      });
    }
  },
});

export const getNotebook = query({
  args: {
    taskId: v.id("tasks"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("labNotebooks")
      .withIndex("by_task", (q) => q.eq("taskId", args.taskId))
      .first();
  },
});
