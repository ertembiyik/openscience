import { internalMutation } from "./_generated/server";

export default internalMutation({
  args: {},
  handler: async (ctx) => {
    // Check if already seeded
    const existing = await ctx.db
      .query("projects")
      .withIndex("by_slug", (q) =>
        q.eq("slug", "oncology/neoantigen-immunogenicity"),
      )
      .first();
    if (existing) {
      console.log("Already seeded");
      return;
    }

    // Create project
    const projectId = await ctx.db.insert("projects", {
      slug: "oncology/neoantigen-immunogenicity",
      name: "Neoantigen Immunogenicity Prediction",
      description:
        "Given a cancer patient's tumor mutations and immune profile (HLA type), predict which mutated proteins (neoantigens) will actually trigger a T-cell immune response when encoded in an mRNA vaccine. This is the computational bottleneck in personalized mRNA cancer vaccines.",
      field: "oncology",
      isPublic: true,
    });

    const projectDesc =
      "Neoantigen immunogenicity prediction for personalized cancer vaccines";

    // Phase 1: Environment & Data (P0)
    const t001 = await ctx.db.insert("tasks", {
      projectId,
      type: "RESEARCH" as const,
      priority: 0,
      status: "PENDING" as const,
      dependsOn: [],
      context: {
        title: "Set up Python bioinformatics environment",
        description:
          "Create requirements.txt with PyTorch, BioPython, pandas, scikit-learn, transformers, mhcflurry. Verify install.",
        projectDescription: projectDesc,
      },
      createdAt: Date.now(),
    });

    const t002 = await ctx.db.insert("tasks", {
      projectId,
      type: "RESEARCH" as const,
      priority: 0,
      status: "PENDING" as const,
      dependsOn: [t001],
      context: {
        title: "Download and profile IEDB dataset",
        description:
          "Download IEDB bulk export. Document structure, size, key fields, data quality. Focus on T-cell assays.",
        skill: "run-experiment",
        projectDescription: projectDesc,
      },
      createdAt: Date.now(),
    });

    const t003 = await ctx.db.insert("tasks", {
      projectId,
      type: "RESEARCH" as const,
      priority: 0,
      status: "PENDING" as const,
      dependsOn: [],
      context: {
        title: "Investigate TESLA benchmark access",
        description:
          "Find out how to access TESLA benchmark data. Read Wells et al. 2020 supplementary. Check if data is on GEO/SRA.",
        skill: "literature-review",
        projectDescription: projectDesc,
      },
      createdAt: Date.now(),
    });

    const t004 = await ctx.db.insert("tasks", {
      projectId,
      type: "RESEARCH" as const,
      priority: 0,
      status: "PENDING" as const,
      dependsOn: [t002],
      context: {
        title: "Write data loading utilities",
        description:
          "Python utilities for loading and preprocessing IEDB data. Filtering, normalization, train/test split.",
        projectDescription: projectDesc,
      },
      createdAt: Date.now(),
    });

    const t005 = await ctx.db.insert("tasks", {
      projectId,
      type: "RESEARCH" as const,
      priority: 0,
      status: "PENDING" as const,
      dependsOn: [t004],
      context: {
        title: "Exploratory data analysis",
        description:
          "EDA on IEDB: peptide length distribution, allele frequency, assay type breakdown, class balance.",
        skill: "run-experiment",
        projectDescription: projectDesc,
      },
      createdAt: Date.now(),
    });

    // Phase 2: Baselines (P0)
    await ctx.db.insert("tasks", {
      projectId,
      type: "RESEARCH" as const,
      priority: 0,
      status: "PENDING" as const,
      dependsOn: [t004],
      context: {
        title: "Install and run MHCflurry baseline",
        description:
          "Install MHCflurry, run on IEDB/TESLA data, record AUC and other metrics.",
        skill: "reproduce-baseline",
        projectDescription: projectDesc,
      },
      createdAt: Date.now(),
    });

    await ctx.db.insert("tasks", {
      projectId,
      type: "RESEARCH" as const,
      priority: 0,
      status: "PENDING" as const,
      dependsOn: [t004],
      context: {
        title: "Install and run NetMHCpan baseline",
        description:
          "Install NetMHCpan (or use web API), run on same data, record metrics.",
        skill: "reproduce-baseline",
        projectDescription: projectDesc,
      },
      createdAt: Date.now(),
    });

    // Phase 3: Literature Deep Dives (P1)
    await ctx.db.insert("tasks", {
      projectId,
      type: "RESEARCH" as const,
      priority: 1,
      status: "PENDING" as const,
      dependsOn: [],
      context: {
        title: "Summarize NeoTImmuML paper",
        description:
          "Find and summarize the NeoTImmuML paper. Architecture, features, training data, results, limitations.",
        skill: "literature-review",
        projectDescription: projectDesc,
      },
      createdAt: Date.now(),
    });

    await ctx.db.insert("tasks", {
      projectId,
      type: "RESEARCH" as const,
      priority: 1,
      status: "PENDING" as const,
      dependsOn: [],
      context: {
        title: "Survey latest immunogenicity prediction (2024-2026)",
        description:
          "Find and summarize the most recent papers on immunogenicity prediction. What features matter most?",
        skill: "literature-review",
        projectDescription: projectDesc,
      },
      createdAt: Date.now(),
    });

    await ctx.db.insert("tasks", {
      projectId,
      type: "RESEARCH" as const,
      priority: 1,
      status: "PENDING" as const,
      dependsOn: [],
      context: {
        title: "Research ESM-2 for feature extraction",
        description:
          "How do others use ESM-2 embeddings for immunogenicity? Which layer, which pooling?",
        skill: "tool-evaluation",
        projectDescription: projectDesc,
      },
      createdAt: Date.now(),
    });

    console.log(
      `Seeded project ${projectId} with 10 tasks`,
    );
  },
});
