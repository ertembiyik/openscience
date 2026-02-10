# Web - Open Lab Public Dashboard

## What This Is
The public-facing dashboard for the Open Lab platform. Shows real-time research progress, knowledge base, task status, and contributor activity.

## Tech Stack
- **Next.js** (App Router) with TypeScript
- **Tailwind CSS** for styling
- **Convex** client for real-time data
- **Bun** as the runtime

## Development
- `bun dev` to start the development server
- Uses App Router with server components by default

## Architecture
The dashboard is read-heavy and real-time:
- Convex reactive queries for live updates
- Server components for initial data load
- Client components for interactive elements

## Structure
- `src/app/` - App Router pages and layouts
- `src/components/` - Reusable UI components
- `src/lib/` - Utilities and Convex client setup

## Key Pages (Planned)
- `/` - Overview: active projects, recent findings, contributor count
- `/projects/[slug]` - Project detail: KB, tasks, hypotheses
- `/kb` - Knowledge base browser
- `/tasks` - Task DAG visualization
- `/contributors` - Leaderboard and activity

## Principles
- Follow Vercel React best practices
- Server components by default, client only when needed
- Real-time updates via Convex subscriptions
- Accessible, fast, public -- no auth required to view
