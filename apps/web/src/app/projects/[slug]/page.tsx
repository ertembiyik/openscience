"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import { Badge } from "../../../components/ui/Badge";
import { StatCard } from "../../../components/ui/StatCard";
import { Card, CardHeader, CardBody } from "../../../components/ui/Card";
import {
  useProject,
  useFindings,
  useTasks,
  useHypotheses,
  useDeadEnds,
  usePendingFindings,
} from "../../../lib/hooks";

function timeAgo(ts: number) {
  const diff = Date.now() - ts;
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return "< 1h ago";
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

const tabList = ["Overview", "Knowledge Base", "Tasks", "Hypotheses"] as const;
type Tab = (typeof tabList)[number];

export default function ProjectDetailPage() {
  const params = useParams();
  const slug = decodeURIComponent(params.slug as string);
  const project = useProject(slug);
  const [activeTab, setActiveTab] = useState<Tab>("Overview");

  if (!project) {
    return <div className="text-zinc-400">Project not found: {slug}</div>;
  }

  const findings = useFindings(project._id);
  const pendingF = usePendingFindings(project._id);
  const tasks = useTasks(project._id);
  const hypotheses = useHypotheses(project._id);
  const deadEnds = useDeadEnds(project._id);

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">{project.name}</h1>
          <Badge label={project.field.toUpperCase()} />
        </div>
        <p className="mt-1 text-sm text-zinc-400">{project.description}</p>
      </div>

      <div className="mb-6 flex gap-1 border-b border-zinc-800">
        {tabList.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab
                ? "border-b-2 border-emerald-500 text-emerald-400"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === "Overview" && (
        <div>
          <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
            <StatCard label="Total Tasks" value={tasks.length} />
            <StatCard
              label="Completed"
              value={tasks.filter((t) => t.status === "COMPLETED").length}
            />
            <StatCard label="Verified Findings" value={findings.length} />
            <StatCard label="Hypotheses" value={hypotheses.length} />
          </div>
          <Card>
            <CardHeader>Recent Activity</CardHeader>
            <CardBody>
              <div className="space-y-2">
                {[
                  ...findings.map((f) => ({
                    label: `Finding: ${f.title}`,
                    ts: f.createdAt,
                  })),
                  ...tasks
                    .filter((t) => t.status === "COMPLETED")
                    .map((t) => ({
                      label: `Completed: ${t.context.title}`,
                      ts: t.completedAt ?? t.createdAt,
                    })),
                ]
                  .sort((a, b) => b.ts - a.ts)
                  .slice(0, 5)
                  .map((item, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 text-sm text-zinc-300"
                    >
                      <span className="text-xs text-zinc-600">
                        {timeAgo(item.ts)}
                      </span>
                      {item.label}
                    </div>
                  ))}
              </div>
            </CardBody>
          </Card>
        </div>
      )}

      {activeTab === "Knowledge Base" && (
        <div className="space-y-6">
          <Card>
            <CardHeader>Verified Findings ({findings.length})</CardHeader>
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
                    </div>
                    <div className="text-sm font-medium text-zinc-200">
                      {f.title}
                    </div>
                    <div className="mt-1 text-xs text-zinc-500">
                      {f.implications}
                    </div>
                    <div className="mt-1 text-xs text-zinc-600">
                      Source: {f.source}
                    </div>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>

          <details className="rounded-lg border border-zinc-800 bg-zinc-900">
            <summary className="cursor-pointer p-4 text-sm font-medium text-zinc-400">
              Dead Ends ({deadEnds.length})
            </summary>
            <div className="space-y-2 border-t border-zinc-800 p-4">
              {deadEnds.map((d) => (
                <div key={d._id} className="text-sm">
                  <div className="font-medium text-zinc-300">
                    {d.deadEndId}: {d.what}
                  </div>
                  <div className="text-xs text-zinc-500">{d.whyFailed}</div>
                  <div className="mt-1 text-xs text-emerald-500/70">
                    Lesson: {d.lesson}
                  </div>
                </div>
              ))}
            </div>
          </details>
        </div>
      )}

      {activeTab === "Tasks" && (
        <Card>
          <CardBody>
            <div className="space-y-2">
              {tasks.map((t) => (
                <div
                  key={t._id}
                  className="flex items-center gap-3 rounded border border-zinc-800 p-3"
                >
                  <Badge label={t.type} />
                  <Badge label={t.status} />
                  <span className="text-xs text-zinc-600">P{t.priority}</span>
                  <span className="text-sm text-zinc-200">
                    {t.context.title}
                  </span>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      )}

      {activeTab === "Hypotheses" && (
        <Card>
          <CardBody>
            <div className="space-y-3">
              {hypotheses.map((h) => (
                <div
                  key={h._id}
                  className="rounded border border-zinc-800 p-3"
                >
                  <div className="mb-1 flex items-center gap-2">
                    <Badge label={h.status} />
                    <span className="text-xs text-zinc-500">
                      {h.hypothesisId}
                    </span>
                  </div>
                  <div className="text-sm font-medium text-zinc-200">
                    {h.statement}
                  </div>
                  <div className="mt-1 text-xs text-zinc-500">
                    {h.rationale}
                  </div>
                  {h.result && (
                    <div className="mt-1 text-xs text-emerald-400">
                      Result: {h.result}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
