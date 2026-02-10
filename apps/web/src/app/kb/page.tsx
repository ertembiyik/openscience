import { Badge } from "../../components/ui/Badge";
import { Card, CardHeader, CardBody } from "../../components/ui/Card";
import { useAllFindings } from "../../lib/hooks";
import { projects } from "../../lib/mock-data";

export default function KnowledgeBasePage() {
  const findings = useAllFindings();

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Knowledge Base</h1>

      <Card>
        <CardHeader>Verified Findings ({findings.length})</CardHeader>
        <CardBody>
          <div className="space-y-3">
            {findings.map((f) => {
              const project = projects.find((p) => p._id === f.projectId);
              return (
                <div
                  key={f._id}
                  className="rounded border border-zinc-800 p-3"
                >
                  <div className="mb-1 flex items-center gap-2">
                    <Badge label={f.confidence} />
                    <span className="text-xs text-zinc-500">
                      {f.findingId}
                    </span>
                    {project && (
                      <span className="text-xs text-zinc-600">
                        {project.name}
                      </span>
                    )}
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
              );
            })}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
