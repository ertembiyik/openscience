export function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-lg border border-zinc-800 bg-zinc-900 p-4 ${className}`}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-3 border-b border-zinc-800 pb-2 text-sm font-medium text-zinc-400">
      {children}
    </div>
  );
}

export function CardBody({ children }: { children: React.ReactNode }) {
  return <div>{children}</div>;
}
