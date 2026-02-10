import { StatCard } from "../components/ui/StatCard";
import { Card, CardHeader, CardBody } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import {
  useDashboard,
  useAllFindings,
  useAllTasks,
  usePendingFindings,
} from "../lib/hooks";

function timeAgo(ts: number) {
  const diff = Date.now() - ts;
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return "< 1h ago";
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function DashboardPage() {
  const stats = useDashboard();
  const findings = useAllFindings();
  const tasks = useAllTasks();
  const pending = usePendingFindings("project_1");

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Dashboard</h1>

      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Active Projects" value={stats.activeProjects} />
        <StatCard label="Tasks Completed" value={stats.tasksCompleted} />
        <StatCard label="Verified Findings" value={stats.verifiedFindings} />
        <StatCard label="Contributors" value={stats.contributorCount} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>Recent Verified Findings</CardHeader>
            <CardBody>
              <div className="space-y-3">
                {findings.map((f) => (
                  <div
                    key={f._id}
                    className="rounded border border-zinc-800 p-3"
                  >
                    <div className="mb-1 flex items-center gap-2">
                      <Badge label={f.confidence} />
                      <span className="text-xs text-zinc-500">
                        {f.findingId}
                      </span>
                      <span className="text-xs text-zinc-600">
                        {timeAgo(f.createdAt)}
                      </span>
                    </div>
                    <div className="text-sm font-medium text-zinc-200">
                      {f.title}
                    </div>
                    <div className="mt-1 text-xs text-zinc-500">
                      Source: {f.source}
                    </div>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>Pending Verification ({pending.length})</CardHeader>
            <CardBody>
              <div className="space-y-2">
                {pending.map((pf) => (
                  <div key={pf._id} className="text-sm">
                    <div className="flex items-center gap-2">
                      <Badge label={pf.status} />
                      <span className="text-xs text-zinc-500">
                        {pf.votes.length}/3 votes
                      </span>
                    </div>
                    <div className="mt-1 text-zinc-300">{pf.title}</div>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>Active Tasks</CardHeader>
            <CardBody>
              <div className="space-y-2">
                {tasks
                  .filter(
                    (t) => t.status === "PENDING" || t.status === "ASSIGNED",
                  )
                  .slice(0, 5)
                  .map((t) => (
                    <div key={t._id} className="text-sm">
                      <div className="flex items-center gap-2">
                        <Badge label={t.type} />
                        <Badge label={t.status} />
                      </div>
                      <div className="mt-1 text-zinc-300">
                        {t.context.title}
                      </div>
                    </div>
                  ))}
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
