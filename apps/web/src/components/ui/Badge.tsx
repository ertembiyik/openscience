const variants: Record<string, string> = {
  // Confidence
  HIGH: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  MEDIUM: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  LOW: "bg-red-500/20 text-red-400 border-red-500/30",
  // Task status
  PENDING: "bg-zinc-500/20 text-zinc-400 border-zinc-500/30",
  ASSIGNED: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  COMPLETED: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  FAILED: "bg-red-500/20 text-red-400 border-red-500/30",
  SUSPENDED: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  BLOCKED: "bg-zinc-500/20 text-zinc-400 border-zinc-500/30",
  // Task type
  RESEARCH: "bg-violet-500/20 text-violet-400 border-violet-500/30",
  VERIFY: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  // Hypothesis status
  PROPOSED: "bg-zinc-500/20 text-zinc-400 border-zinc-500/30",
  TESTING: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  SUPPORTED: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  REFUTED: "bg-red-500/20 text-red-400 border-red-500/30",
  ABANDONED: "bg-zinc-600/20 text-zinc-500 border-zinc-600/30",
  // Verification
  PASS: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  FAIL: "bg-red-500/20 text-red-400 border-red-500/30",
  PENDING_VERIFICATION: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  VERIFIED: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  REJECTED: "bg-red-500/20 text-red-400 border-red-500/30",
};

export function Badge({ label }: { label: string }) {
  const style = variants[label] ?? "bg-zinc-500/20 text-zinc-400 border-zinc-500/30";
  return (
    <span
      className={`inline-block rounded border px-2 py-0.5 text-xs font-medium ${style}`}
    >
      {label}
    </span>
  );
}
