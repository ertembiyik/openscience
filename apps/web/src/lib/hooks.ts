// TODO: Replace with Convex useQuery hooks when backend is connected
import {
  projects,
  tasks,
  findings,
  pendingFindings,
  deadEnds,
  hypotheses,
  contributors,
} from "./mock-data";

export function useProject(slug: string) {
  return projects.find((p) => p.slug === slug) ?? null;
}

export function useDashboard() {
  return {
    activeProjects: projects.length,
    tasksCompleted: tasks.filter((t) => t.status === "COMPLETED").length,
    verifiedFindings: findings.length,
    contributorCount: contributors.length,
    activeTasks: tasks.filter(
      (t) => t.status === "ASSIGNED" || t.status === "PENDING",
    ).length,
    pendingVerification: pendingFindings.filter(
      (pf) => pf.status === "PENDING_VERIFICATION",
    ).length,
    hypothesesTesting: hypotheses.filter((h) => h.status === "TESTING").length,
  };
}

export function useFindings(projectId: string) {
  return findings
    .filter((f) => f.projectId === projectId)
    .sort((a, b) => b.createdAt - a.createdAt);
}

export function usePendingFindings(projectId: string) {
  return pendingFindings
    .filter((pf) => pf.projectId === projectId)
    .sort((a, b) => b.submittedAt - a.submittedAt);
}

export function useTasks(projectId: string) {
  return tasks
    .filter((t) => t.projectId === projectId)
    .sort((a, b) => a.priority - b.priority);
}

export function useHypotheses(projectId: string) {
  return hypotheses
    .filter((h) => h.projectId === projectId)
    .sort((a, b) => b.createdAt - a.createdAt);
}

export function useContributors() {
  return [...contributors].sort((a, b) => b.tasksCompleted - a.tasksCompleted);
}

export function useDeadEnds(projectId: string) {
  return deadEnds.filter((d) => d.projectId === projectId);
}

export function useAllTasks() {
  return [...tasks].sort((a, b) => a.priority - b.priority);
}

export function useAllFindings() {
  return [...findings].sort((a, b) => b.createdAt - a.createdAt);
}
