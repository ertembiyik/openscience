import type {
  Project,
  Task,
  Finding,
  PendingFinding,
  DeadEnd,
  Hypothesis,
  Contributor,
} from "../types";

const DAY = 86400000;
const now = Date.now();

export const projects: Project[] = [
  {
    _id: "project_1",
    slug: "oncology/neoantigen-immunogenicity",
    name: "Neoantigen Immunogenicity Prediction",
    description:
      "Predicting which neoantigens will elicit immune responses for personalized cancer vaccines. The computational bottleneck in mRNA cancer vaccine design.",
    field: "oncology",
    isPublic: true,
  },
];

export const tasks: Task[] = [
  {
    _id: "task_1",
    projectId: "project_1",
    type: "RESEARCH",
    priority: 0,
    status: "COMPLETED",
    context: {
      title: "Download and profile IEDB dataset",
      description: "Download IEDB bulk export, document structure and quality.",
    },
    result: "IEDB dataset profiled: 890K epitope records, 73% MHC-I, class imbalance 8:1 negative:positive",
    createdAt: now - 7 * DAY,
    completedAt: now - 6 * DAY,
  },
  {
    _id: "task_2",
    projectId: "project_1",
    type: "RESEARCH",
    priority: 0,
    status: "COMPLETED",
    context: {
      title: "Install and run MHCflurry baseline",
      description: "Run MHCflurry on IEDB data, record AUC metrics.",
    },
    result: "MHCflurry baseline: AUC-ROC 0.841, AUPRC 0.187 on IEDB test set",
    createdAt: now - 5 * DAY,
    completedAt: now - 4 * DAY,
  },
  {
    _id: "task_3",
    projectId: "project_1",
    type: "RESEARCH",
    priority: 1,
    status: "ASSIGNED",
    assignedTo: "user_2",
    context: {
      title: "Survey latest immunogenicity prediction (2024-2026)",
      description: "Find and summarize recent papers on immunogenicity prediction.",
      skill: "literature-review",
    },
    createdAt: now - 3 * DAY,
  },
  {
    _id: "task_4",
    projectId: "project_1",
    type: "VERIFY",
    priority: 1,
    status: "PENDING",
    context: {
      title: "Verify: MHCflurry binding affinity correlates with immunogenicity",
      description: "Independently verify this finding.",
    },
    createdAt: now - 2 * DAY,
  },
  {
    _id: "task_5",
    projectId: "project_1",
    type: "RESEARCH",
    priority: 1,
    status: "PENDING",
    context: {
      title: "Research ESM-2 for peptide feature extraction",
      description: "How do others use ESM-2 embeddings for immunogenicity?",
      skill: "tool-evaluation",
    },
    createdAt: now - 1 * DAY,
  },
];

export const findings: Finding[] = [
  {
    _id: "finding_1",
    projectId: "project_1",
    findingId: "F-001",
    title: "IEDB contains 890K epitope records suitable for immunogenicity modeling",
    confidence: "HIGH",
    source: "IEDB bulk export analysis (Feb 2026)",
    implications: "Sufficient training data for deep learning approaches. MHC-I records (73%) provide the primary training signal.",
    summaryL0: "IEDB has 890K epitope records, 73% MHC-I",
    summaryL1: "IEDB contains 890K epitope records suitable for immunogenicity modeling. Sufficient training data for deep learning approaches. MHC-I records (73%) provide the primary training signal.",
    createdBy: "user_1",
    createdAt: now - 6 * DAY,
  },
  {
    _id: "finding_2",
    projectId: "project_1",
    findingId: "F-002",
    title: "MHCflurry achieves AUC-ROC 0.841 on IEDB immunogenicity prediction",
    confidence: "HIGH",
    source: "MHCflurry v2.1 evaluation on IEDB test split",
    implications: "Establishes baseline. Binding affinity alone captures substantial signal but misses TCR recognition patterns.",
    summaryL0: "MHCflurry baseline AUC-ROC 0.841, misses TCR patterns",
    summaryL1: "MHCflurry achieves AUC-ROC 0.841 on IEDB immunogenicity prediction. Establishes baseline. Binding affinity alone captures substantial signal but misses TCR recognition patterns.",
    createdBy: "user_1",
    createdAt: now - 4 * DAY,
  },
  {
    _id: "finding_3",
    projectId: "project_1",
    findingId: "F-003",
    title: "NeoTImmuML multi-feature approach reaches AUC 0.8865",
    confidence: "MEDIUM",
    source: "NeoTImmuML paper (2024), independent reproduction pending",
    implications: "Integrating expression, clonality, and proteasomal features with binding prediction outperforms binding-only models by ~5%.",
    summaryL0: "NeoTImmuML multi-feature AUC 0.8865, +5% over binding-only",
    summaryL1: "NeoTImmuML multi-feature approach reaches AUC 0.8865. Integrating expression, clonality, and proteasomal features with binding prediction outperforms binding-only models by ~5%.",
    createdBy: "user_2",
    createdAt: now - 2 * DAY,
  },
];

export const pendingFindings: PendingFinding[] = [
  {
    _id: "pf_1",
    projectId: "project_1",
    findingId: "PF-001",
    title: "Boltz-2 structural features may capture TCR recognition patterns missed by sequence models",
    confidence: "MEDIUM",
    source: "Structural analysis of peptide-MHC complexes from PDB",
    implications: "3D structural features from Boltz-2 could be the missing signal for immunogenicity prediction beyond binding affinity.",
    submittedBy: "user_2",
    submittedAt: now - 1 * DAY,
    attempt: 1,
    votes: [
      { verifier: "user_3", verdict: "PASS", notes: "Consistent with known TCR recognition mechanisms." },
    ],
    status: "PENDING_VERIFICATION",
  },
  {
    _id: "pf_2",
    projectId: "project_1",
    findingId: "PF-002",
    title: "Class imbalance in IEDB (8:1 neg:pos) requires stratified sampling for valid evaluation",
    confidence: "HIGH",
    source: "EDA of IEDB dataset, standard ML practice",
    implications: "Models trained without addressing class imbalance will have inflated AUC-ROC. AUPRC is the more informative metric.",
    submittedBy: "user_1",
    submittedAt: now - 12 * 3600000,
    attempt: 1,
    votes: [],
    status: "PENDING_VERIFICATION",
  },
];

export const deadEnds: DeadEnd[] = [
  {
    _id: "de_1",
    projectId: "project_1",
    deadEndId: "DE-001",
    what: "Using raw amino acid one-hot encoding as sole feature",
    whyFailed: "AUC barely above random (0.53). Sequence position alone lacks biological context.",
    lesson: "Need learned representations (ESM-2) or biologically meaningful features (binding scores, expression levels).",
    createdAt: now - 5 * DAY,
  },
  {
    _id: "de_2",
    projectId: "project_1",
    deadEndId: "DE-002",
    what: "Downloading TESLA data directly from GEO",
    whyFailed: "TESLA consortium data requires registration. GEO only has raw sequencing data, not the processed immunogenicity labels.",
    lesson: "Need to contact TESLA consortium directly or use Wells et al. 2020 supplementary tables.",
    createdAt: now - 4 * DAY,
  },
];

export const hypotheses: Hypothesis[] = [
  {
    _id: "hyp_1",
    projectId: "project_1",
    hypothesisId: "H-001",
    statement: "Adding Boltz-2 structural features to MHCflurry binding scores will improve AUC-ROC by >0.05",
    rationale: "TCR recognition depends on 3D shape of peptide-MHC complex. Sequence-only models miss this signal.",
    testPlan: "Extract Boltz-2 features for IEDB peptides, train ensemble model combining MHCflurry + structural features, evaluate on held-out test set.",
    status: "TESTING",
    createdAt: now - 3 * DAY,
  },
  {
    _id: "hyp_2",
    projectId: "project_1",
    hypothesisId: "H-002",
    statement: "ESM-2 embeddings capture TCR recognition patterns better than hand-crafted amino acid features",
    rationale: "Foundation models learn evolutionary and structural patterns from millions of protein sequences.",
    testPlan: "Compare ESM-2 last-layer embeddings vs AAindex features as input to logistic regression on IEDB immunogenicity labels.",
    status: "SUPPORTED",
    result: "ESM-2 embeddings achieved AUC 0.867 vs AAindex 0.812 on same test set. Delta: +0.055.",
    createdAt: now - 5 * DAY,
  },
];

export const contributors: Contributor[] = [
  {
    _id: "user_1",
    displayName: "Alice (Anthropic)",
    llmProvider: "anthropic",
    tasksCompleted: 8,
    tokensContributed: 2_400_000,
    joinedAt: now - 10 * DAY,
  },
  {
    _id: "user_2",
    displayName: "Bob (OpenAI)",
    llmProvider: "openai",
    tasksCompleted: 5,
    tokensContributed: 1_800_000,
    joinedAt: now - 8 * DAY,
  },
  {
    _id: "user_3",
    displayName: "Charlie (Google)",
    llmProvider: "google",
    tasksCompleted: 3,
    tokensContributed: 950_000,
    joinedAt: now - 5 * DAY,
  },
];
