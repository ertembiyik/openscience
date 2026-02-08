Generate a daily progress update for the cancer treatment research project.

## Instructions

1. **Review today's work**: Read all files modified or created today. Check git log for today's commits. Read CLAUDE.md for project context and current goals.

2. **Create the update file**: Write a file at `updates/YYYY-MM-DD.md` (using today's date) with:
   - `# Progress Report: YYYY-MM-DD`
   - `## Summary` -- 2-3 sentence overview
   - `## What Was Done` -- Detailed breakdown with subsections for each area of work
   - `## Key Findings` -- Any important discoveries, insights, or results (if applicable)
   - `## Files Created/Modified` -- List of files touched with brief descriptions
   - `## Next Steps` -- What should happen tomorrow
   - `## Open Questions` -- Anything unresolved that needs input (if applicable)

3. **Update README.md**: Add a new row to the Daily Progress table in README.md:
   - Date: today's date
   - Summary: 1-line summary of the day's main achievement
   - Report: link to `updates/YYYY-MM-DD.md`
   The newest entry goes at the TOP of the table (right after the header row).

4. **Commit**: Stage the update file and the README change, commit with message: `daily update: YYYY-MM-DD`

## Style Guidelines
- Be specific about what was accomplished, not vague
- Include numbers and measurements where possible
- Flag any biology claims with uncertainty clearly
- Keep the 1-line README summary concrete and informative
- Don't bloat -- if it was a slow day, say so honestly
