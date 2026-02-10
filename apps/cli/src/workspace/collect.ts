import { join } from "path";
import type { OpenLabClient } from "../convex";

/**
 * Collect results from a completed workspace:
 * 1. git add -A && git commit (capture agent's work)
 * 2. Create tarball of final workspace state
 * 3. Upload tarball to Convex file storage
 * 4. Mark task complete with result + workspace file ID
 */
export async function collectResults(
  workspaceDir: string,
  taskId: string,
  result: string,
  client: OpenLabClient,
): Promise<void> {
  // 1. Commit all changes the agent made
  await exec(["git", "add", "-A"], workspaceDir);

  // Check if there's anything to commit
  const status = await exec(["git", "status", "--porcelain"], workspaceDir);
  if (status.output.trim()) {
    await exec(
      ["git", "commit", "-m", "task complete"],
      workspaceDir,
    );
  }

  // 2. Create tarball (final state only, no git history)
  const tarballPath = join(workspaceDir, "..", `${taskId}.tar.gz`);
  const tarResult = await exec(
    [
      "tar",
      "czf",
      tarballPath,
      "--exclude",
      ".git",
      "-C",
      workspaceDir,
      ".",
    ],
    workspaceDir,
  );

  if (!tarResult.ok) {
    console.warn(`Warning: Failed to create tarball: ${tarResult.output}`);
  }

  // 3. Upload tarball to Convex file storage
  // TODO: Implement file upload when Convex HTTP file storage API is wired up
  // For now, the tarball is preserved locally at ~/.openlab/workspaces/<taskId>.tar.gz
  // const workspaceFileId = await client.uploadWorkspace(tarballPath);

  // 4. Mark task complete
  await client.completeTask(taskId, result);

  console.log(`  Workspace: ${workspaceDir}`);
  console.log(`  Tarball: ${tarballPath}`);
}

async function exec(
  cmd: string[],
  cwd: string,
): Promise<{ ok: boolean; output: string }> {
  const proc = Bun.spawn(cmd, { cwd, stdout: "pipe", stderr: "pipe" });
  const stdout = await new Response(proc.stdout).text();
  const stderr = await new Response(proc.stderr).text();
  const code = await proc.exited;
  return { ok: code === 0, output: stdout + stderr };
}
