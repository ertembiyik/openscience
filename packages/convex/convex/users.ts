import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const register = mutation({
  args: {
    displayName: v.string(),
    llmProvider: v.string(),
    capabilities: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("users", {
      displayName: args.displayName,
      llmProvider: args.llmProvider,
      capabilities: args.capabilities ?? ["cpu"],
      projects: [],
      tasksCompleted: 0,
      tokensContributed: 0,
      joinedAt: Date.now(),
    });
  },
});

export const getOrCreate = mutation({
  args: {
    displayName: v.string(),
    llmProvider: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_displayName", (q) =>
        q.eq("displayName", args.displayName),
      )
      .first();

    if (existing) return existing._id;

    return await ctx.db.insert("users", {
      displayName: args.displayName,
      llmProvider: args.llmProvider,
      capabilities: ["cpu"],
      projects: [],
      tasksCompleted: 0,
      tokensContributed: 0,
      joinedAt: Date.now(),
    });
  },
});

export const getAll = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("users").collect();
  },
});
