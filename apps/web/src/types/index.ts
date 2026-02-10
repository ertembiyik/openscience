export interface Project {
  _id: string;
  slug: string;
  name: string;
  description: string;
  field: string;
  isPublic: boolean;
}

export interface Task {
  _id: string;
  projectId: string;
  parentId?: string;
  type: "RESEARCH" | "VERIFY";
  priority: number;
  status:
    | "PENDING"
    | "ASSIGNED"
    | "SUSPENDED"
    | "COMPLETED"
    | "FAILED"
    | "BLOCKED";
  assignedTo?: string;
  context: {
    title: string;
    description: string;
    skill?: string;
  };
  result?: string;
  createdAt: number;
  completedAt?: number;
}

export interface Finding {
  _id: string;
  projectId: string;
  findingId: string;
  title: string;
  confidence: "HIGH" | "MEDIUM" | "LOW";
  source: string;
  implications: string;
  summaryL0?: string;
  summaryL1?: string;
  createdBy: string;
  createdAt: number;
}

export interface PendingFinding {
  _id: string;
  projectId: string;
  findingId: string;
  title: string;
  confidence: "HIGH" | "MEDIUM" | "LOW";
  source: string;
  implications: string;
  submittedBy: string;
  submittedAt: number;
  attempt: number;
  votes: { verifier: string; verdict: "PASS" | "FAIL"; notes: string }[];
  status:
    | "PENDING_VERIFICATION"
    | "VERIFIED"
    | "REJECTED"
    | "RE_RESEARCHING";
}

export interface DeadEnd {
  _id: string;
  projectId: string;
  deadEndId: string;
  what: string;
  whyFailed: string;
  lesson: string;
  createdAt: number;
}

export interface Hypothesis {
  _id: string;
  projectId: string;
  hypothesisId: string;
  statement: string;
  rationale: string;
  testPlan: string;
  status: "PROPOSED" | "TESTING" | "SUPPORTED" | "REFUTED" | "ABANDONED";
  result?: string;
  createdAt: number;
}

export interface Contributor {
  _id: string;
  displayName: string;
  llmProvider: string;
  tasksCompleted: number;
  tokensContributed: number;
  joinedAt: number;
}

export interface LabNotebookEntry {
  timestamp: number;
  type: "OBSERVATION" | "REASONING" | "HYPOTHESIS" | "RESULT" | "DECISION";
  content: string;
}
