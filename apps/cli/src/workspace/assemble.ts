import { homedir } from "os";
import { join, resolve } from "path";
import { existsSync, mkdirSync, cpSync, readdirSync } from "fs";

interface AssembleOptions {
  taskId: string;
  taskType: "RESEARCH" | "VERIFY";
  contextMarkdown: string;
  seedDir: string; // e.g. seed/oncology-neoantigen-immunogenicity
  projectSlug: string;
}

const WORKSPACES_DIR = join(homedir(), ".openlab", "workspaces");

/**
 * Assemble an isolated git workspace for a task.
 *
 * Creates ~/.openlab/workspaces/<task-id>/ with:
 *   SOUL.md  — from seed/<project>/souls/<role>.md
 *   TASK.md  — from task.contextMarkdown (frozen at claim time)
 *   skills/  — role+domain scoped
 *   tools/   — project tools
 *
 * Returns the workspace directory path.
 */
export async function assembleWorkspace(
  opts: AssembleOptions,
): Promise<string> {
  const workspaceDir = join(WORKSPACES_DIR, opts.taskId);

  // Clean up if workspace already exists (re-claim)
  if (existsSync(workspaceDir)) {
    const { rmSync } = await import("fs");
    rmSync(workspaceDir, { recursive: true });
  }

  mkdirSync(workspaceDir, { recursive: true });

  // 1. git init
  await exec(["git", "init"], workspaceDir);

  // 2. Write SOUL.md from seed/<project>/souls/<role>.md
  const role = opts.taskType === "RESEARCH" ? "researcher" : "verifier";
  const soulSource = join(opts.seedDir, "souls", `${role}.md`);
  if (existsSync(soulSource)) {
    const content = await Bun.file(soulSource).text();
    await Bun.write(join(workspaceDir, "SOUL.md"), content);
  } else {
    console.warn(`Warning: Soul file not found at ${soulSource}`);
  }

  // 3. Write TASK.md from contextMarkdown
  await Bun.write(join(workspaceDir, "TASK.md"), opts.contextMarkdown);

  // 4. Copy skills/ — role+domain filtered
  const skillsDir = join(opts.seedDir, "skills");
  if (existsSync(skillsDir)) {
    const destSkills = join(workspaceDir, "skills");
    mkdirSync(destSkills, { recursive: true });

    // Copy all skills for now — role-based filtering can be refined later
    // when we have explicit skill-to-role mappings in the seed data
    cpSync(skillsDir, destSkills, { recursive: true });
  }

  // 5. Copy tools/
  const toolsDir = join(opts.seedDir, "tools");
  if (existsSync(toolsDir)) {
    const destTools = join(workspaceDir, "tools");
    mkdirSync(destTools, { recursive: true });
    cpSync(toolsDir, destTools, { recursive: true });
  }

  // 6. Initial commit
  await exec(["git", "add", "-A"], workspaceDir);
  await exec(
    ["git", "commit", "-m", "workspace setup"],
    workspaceDir,
  );

  return workspaceDir;
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

/**
 * Resolve the seed directory for a project slug.
 * Looks in the repo's seed/ directory.
 */
export function resolveSeedDir(projectSlug: string): string | null {
  // The seed dir is relative to the repo root — find it by walking up from CLI
  const candidates = [
    join(import.meta.dir, "..", "..", "..", "..", "seed", projectSlug),
    join(process.cwd(), "seed", projectSlug),
    join(homedir(), ".openlab", "seed", projectSlug),
  ];

  for (const candidate of candidates) {
    const resolved = resolve(candidate);
    if (existsSync(resolved)) return resolved;
  }

  return null;
}
