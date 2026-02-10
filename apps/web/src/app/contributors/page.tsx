import { Card, CardBody } from "../../components/ui/Card";
import { useContributors } from "../../lib/hooks";

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatTokens(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
}

export default function ContributorsPage() {
  const contributors = useContributors();

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Contributors</h1>

      <Card>
        <CardBody>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800 text-left text-xs text-zinc-500">
                <th className="pb-2 font-medium">Name</th>
                <th className="pb-2 font-medium">Provider</th>
                <th className="pb-2 text-right font-medium">Tasks</th>
                <th className="pb-2 text-right font-medium">Tokens</th>
                <th className="pb-2 text-right font-medium">Joined</th>
              </tr>
            </thead>
            <tbody>
              {contributors.map((c) => (
                <tr
                  key={c._id}
                  className="border-b border-zinc-800/50 last:border-0"
                >
                  <td className="py-2 text-zinc-200">{c.displayName}</td>
                  <td className="py-2 text-zinc-500">{c.llmProvider}</td>
                  <td className="py-2 text-right text-zinc-300">
                    {c.tasksCompleted}
                  </td>
                  <td className="py-2 text-right text-zinc-500">
                    {formatTokens(c.tokensContributed)}
                  </td>
                  <td className="py-2 text-right text-zinc-600">
                    {formatDate(c.joinedAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardBody>
      </Card>
    </div>
  );
}
