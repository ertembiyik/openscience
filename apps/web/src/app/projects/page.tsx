import Link from "next/link";
import { Badge } from "../../components/ui/Badge";
import { Card, CardBody } from "../../components/ui/Card";
import { projects } from "../../lib/mock-data";
import { useTasks, useFindings, useHypotheses } from "../../lib/hooks";

export default function ProjectsPage() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Projects</h1>
      <div className="space-y-4">
        {projects.map((p) => {
          const projectTasks = useTasks(p._id);
          const projectFindings = useFindings(p._id);
          const projectHypotheses = useHypotheses(p._id);
          return (
            <Link
              key={p._id}
              href={`/projects/${encodeURIComponent(p.slug)}`}
            >
              <Card className="transition-colors hover:border-zinc-700">
                <CardBody>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-semibold text-zinc-100">
                      {p.name}
                    </span>
                    <Badge label={p.field.toUpperCase()} />
                  </div>
                  <p className="mt-1 text-sm text-zinc-400">
                    {p.description}
                  </p>
                  <div className="mt-3 flex gap-4 text-xs text-zinc-500">
                    <span>{projectTasks.length} tasks</span>
                    <span>{projectFindings.length} findings</span>
                    <span>{projectHypotheses.length} hypotheses</span>
                  </div>
                </CardBody>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
