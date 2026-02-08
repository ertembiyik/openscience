# Convex Backend for Open Science

This package contains the Convex backend functions for the Open Science platform.

## Development
- `bun dev` runs `convex dev` for hot-reloading Convex functions
- Schema is in `convex/schema.ts`
- Functions go in `convex/*.ts`

## Architecture
All coordination happens through Convex:
- CLI agents call mutations to claim tasks, submit findings
- Web dashboard uses queries for real-time display
- File storage holds frozen agent sessions for suspension/continuation
