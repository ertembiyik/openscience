import { Badge } from "../../components/ui/Badge";
import { Card, CardBody } from "../../components/ui/Card";
import { useAllTasks } from "../../lib/hooks";

export default function TasksPage() {
  const tasks = useAllTasks();

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Tasks</h1>

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
                <span className="flex-1 text-sm text-zinc-200">
                  {t.context.title}
                </span>
                {t.context.skill && (
                  <span className="text-xs text-zinc-600">
                    {t.context.skill}
                  </span>
                )}
              </div>
            ))}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
