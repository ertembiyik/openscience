#!/bin/bash
# Ralph Loop -- Autonomous research agent for cancer treatment research
#
# Usage: ./ralph/run.sh [iterations]
#   iterations: number of loops (default: 10)
#
# Requirements:
#   - claude CLI installed and authenticated
#   - Git configured with push access to the repo
#
# What this does:
#   1. Runs Claude Code with the research PROMPT.md
#   2. Each iteration starts with CLEAN context (the whole point of Ralph)
#   3. Progress is serialized to ralph/progress.md between iterations
#   4. Results are committed and pushed to main
#   5. If all tasks are done, exits early

set -euo pipefail

ITERATIONS=${1:-10}
LOG_DIR="ralph/logs"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LOG_FILE="${LOG_DIR}/run_${TIMESTAMP}.log"

mkdir -p "$LOG_DIR"

echo "=== Ralph Loop Starting ===" | tee "$LOG_FILE"
echo "Iterations: $ITERATIONS" | tee -a "$LOG_FILE"
echo "Timestamp: $TIMESTAMP" | tee -a "$LOG_FILE"
echo "Log: $LOG_FILE" | tee -a "$LOG_FILE"
echo "===========================" | tee -a "$LOG_FILE"

for ((i=1; i<=$ITERATIONS; i++)); do
  echo "" | tee -a "$LOG_FILE"
  echo "--- Iteration $i/$ITERATIONS [$(date)] ---" | tee -a "$LOG_FILE"

  result=$(claude --print \
    --allowedTools "Edit,Write,Read,Bash,Grep,Glob,WebFetch,WebSearch" \
    --permission-mode acceptEdits \
    -p "$(cat ralph/PROMPT.md)

Read ralph/progress.md first. Then pick the next incomplete task and do it.
Update ralph/progress.md when done. Commit your changes with a descriptive message.
Push to origin main." 2>&1) || true

  echo "$result" | tee -a "$LOG_FILE"

  # Check for completion signals
  if [[ "$result" == *"<promise>COMPLETE</promise>"* ]]; then
    echo "" | tee -a "$LOG_FILE"
    echo "=== ALL TASKS COMPLETE after $i iterations ===" | tee -a "$LOG_FILE"
    exit 0
  fi

  if [[ "$result" == *"<promise>PHASE_1_2_COMPLETE</promise>"* ]]; then
    echo "" | tee -a "$LOG_FILE"
    echo "=== Phase 1-2 complete at iteration $i ===" | tee -a "$LOG_FILE"
  fi

  # Brief pause between iterations to avoid rate limits
  if [ $i -lt $ITERATIONS ]; then
    echo "Sleeping 30s before next iteration..." | tee -a "$LOG_FILE"
    sleep 30
  fi
done

echo "" | tee -a "$LOG_FILE"
echo "=== Ralph Loop finished $ITERATIONS iterations ===" | tee -a "$LOG_FILE"
