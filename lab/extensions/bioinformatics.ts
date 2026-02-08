/**
 * Bioinformatics Extension
 *
 * Gives agents direct access to research APIs:
 * - iedb_query: Query IEDB for peptide-MHC binding predictions
 * - paper_search: Search PubMed for papers by keyword
 */

import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { Type } from "@sinclair/typebox";

export default function (pi: ExtensionAPI) {
  // --- IEDB MHC-I Binding Prediction ---
  pi.registerTool({
    name: "iedb_query",
    label: "IEDB Query",
    description:
      "Query the Immune Epitope Database (IEDB) for MHC-I peptide binding predictions. Returns predicted binding affinity for a peptide sequence against specified HLA alleles.",
    parameters: Type.Object({
      peptide: Type.String({
        description: "Peptide sequence (8-15 amino acids, e.g. 'GILGFVFTL')",
      }),
      allele: Type.String({
        description:
          "HLA allele (e.g. 'HLA-A*02:01'). Default: HLA-A*02:01",
        default: "HLA-A*02:01",
      }),
      method: Type.Optional(
        Type.String({
          description:
            "Prediction method: 'netmhcpan_ba' (binding affinity), 'netmhcpan_el' (eluted ligand), 'ann', 'smm'. Default: netmhcpan_ba",
        })
      ),
    }),
    execute: async (_toolCallId, params, signal) => {
      const method = params.method || "netmhcpan_ba";
      const allele = params.allele || "HLA-A*02:01";

      try {
        const resp = await fetch("https://tools-api.iedb.org/mhci/", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            method,
            sequence_text: params.peptide,
            allele,
            length: String(params.peptide.length),
          }),
          signal: signal || undefined,
        });

        if (!resp.ok) {
          return {
            content: [
              {
                type: "text" as const,
                text: `IEDB API error: ${resp.status} ${resp.statusText}`,
              },
            ],
            details: {},
          };
        }

        const text = await resp.text();
        return {
          content: [{ type: "text" as const, text }],
          details: {},
        };
      } catch (e: any) {
        return {
          content: [
            {
              type: "text" as const,
              text: `IEDB query failed: ${e.message}`,
            },
          ],
          details: {},
        };
      }
    },
  });

  // --- PubMed Paper Search ---
  pi.registerTool({
    name: "paper_search",
    label: "Paper Search",
    description:
      "Search PubMed for scientific papers. Returns paper IDs, titles, and abstracts. Use for literature review tasks.",
    parameters: Type.Object({
      query: Type.String({
        description:
          "Search query (e.g. 'neoantigen immunogenicity prediction machine learning')",
      }),
      max_results: Type.Optional(
        Type.Number({
          description: "Maximum results to return (default: 5, max: 20)",
          default: 5,
        })
      ),
    }),
    execute: async (_toolCallId, params, signal) => {
      const maxResults = Math.min(params.max_results || 5, 20);

      try {
        // Step 1: Search for paper IDs
        const searchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&retmode=json&retmax=${maxResults}&sort=relevance&term=${encodeURIComponent(params.query)}`;
        const searchResp = await fetch(searchUrl, {
          signal: signal || undefined,
        });
        const searchData = (await searchResp.json()) as any;
        const ids: string[] =
          searchData?.esearchresult?.idlist || [];

        if (ids.length === 0) {
          return {
            content: [
              {
                type: "text" as const,
                text: "No papers found for this query.",
              },
            ],
            details: {},
          };
        }

        // Step 2: Fetch abstracts for found IDs
        const fetchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pubmed&id=${ids.join(",")}&rettype=abstract&retmode=text`;
        const fetchResp = await fetch(fetchUrl, {
          signal: signal || undefined,
        });
        const abstracts = await fetchResp.text();

        return {
          content: [
            {
              type: "text" as const,
              text: `Found ${ids.length} papers (PubMed IDs: ${ids.join(", ")})\n\n${abstracts}`,
            },
          ],
          details: {},
        };
      } catch (e: any) {
        return {
          content: [
            {
              type: "text" as const,
              text: `PubMed search failed: ${e.message}`,
            },
          ],
          details: {},
        };
      }
    },
  });
}
