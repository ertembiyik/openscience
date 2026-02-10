import { ConvexHttpClient } from "convex/browser";

export class OpenScienceClient {
  private client: ConvexHttpClient;

  constructor(url: string) {
    this.client = new ConvexHttpClient(url);
  }

  async claimTask(contributorId: string) {
    return this.client.mutation("tasks:claimTask" as any, { contributorId });
  }

  async completeTask(taskId: string, result: string) {
    return this.client.mutation("tasks:completeTask" as any, {
      taskId,
      result,
    });
  }

  async listTasks(projectId?: string) {
    return this.client.query("queries:getAvailableTasks" as any, {
      projectId: projectId ?? undefined,
    });
  }

  async getStatus(projectId?: string) {
    return this.client.query("queries:getDashboard" as any, {
      projectId: projectId ?? undefined,
    });
  }

  async registerContributor(name: string, provider: string) {
    return this.client.mutation("users:getOrCreate" as any, {
      displayName: name,
      llmProvider: provider,
    });
  }

  async submitFinding(
    projectId: string,
    title: string,
    confidence: string,
    source: string,
    implications: string,
    taskId: string,
    userId: string,
  ) {
    return this.client.mutation("findings:submitFinding" as any, {
      projectId,
      title,
      confidence,
      source,
      implications,
      submittedByTask: taskId,
      submittedBy: userId,
    });
  }

  async recordDeadEnd(
    projectId: string,
    what: string,
    whyFailed: string,
    iterationsSpent: number,
    lesson: string,
    taskId: string,
  ) {
    return this.client.mutation("findings:recordDeadEnd" as any, {
      projectId,
      what,
      whyFailed,
      iterationsSpent,
      lesson,
      taskId,
    });
  }

  async submitHypothesis(
    projectId: string,
    statement: string,
    rationale: string,
    testPlan: string,
    basedOn: string[],
    taskId: string,
    userId: string,
  ) {
    return this.client.mutation("hypotheses:submitHypothesis" as any, {
      projectId,
      statement,
      rationale,
      testPlan,
      basedOn,
      taskId,
      userId,
    });
  }

  async castVote(
    pendingFindingId: string,
    verifierId: string,
    verdict: string,
    notes: string,
  ) {
    return this.client.mutation("findings:castVerifyVote" as any, {
      pendingFindingId,
      verifierId,
      verdict,
      notes,
    });
  }

  async expandFinding(projectId: string, findingId: string) {
    return this.client.query("queries:expandFinding" as any, {
      projectId,
      findingId,
    });
  }

  async appendLabNotebook(
    taskId: string,
    projectId: string,
    entry: { type: string; content: string },
  ) {
    return this.client.mutation("labNotebooks:appendEntry" as any, {
      taskId,
      projectId,
      entry,
    });
  }
}
