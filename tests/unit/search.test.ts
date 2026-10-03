import { describe, expect, it } from "vitest";
import { SearchIndex, tokenize, withinOneEdit, type SearchDocument } from "@/lib/search/engine";

const docs: SearchDocument[] = [
  { id: "1", type: "post", title: "Understanding Variational Autoencoders", subtitle: "Experiments with VAE", url: "/blog/vae", tags: ["Generative Models"], category: "Research Notes", body: "The ELBO and the KL divergence term." },
  { id: "2", type: "post", title: "Multi-Cloud Deployment", subtitle: "Control loops", url: "/blog/cloud", tags: ["Cloud"], category: "Building", body: "Reconciling desired state across AWS and GCP." },
  { id: "3", type: "project", title: "VAE Benchmark", url: "/projects/vae", tags: ["PyTorch"], body: "Benchmarking autoencoders." },
  { id: "4", type: "research", title: "Brain MRI Harmonisation", url: "/research/mri", tags: ["Medical Imaging"], body: "Site effects in multicenter studies." },
];

describe("search engine", () => {
  const index = new SearchIndex(docs);

  it("tokenizes, lowercases and drops stop words", () => {
    expect(tokenize("The VAE and the ELBO!")).toEqual(["vae", "elbo"]);
  });

  it("matches across title, tags, category and body", () => {
    expect(index.search("vae").map((r) => r.id)).toEqual(expect.arrayContaining(["1", "3"]));
    expect(index.search("medical imaging")[0]?.id).toBe("4");
    expect(index.search("building")[0]?.id).toBe("2");
    expect(index.search("divergence")[0]?.id).toBe("1");
  });

  it("ranks title matches above body matches", () => {
    const results = index.search("autoencoders");
    expect(results[0]?.id).toBe("1");
  });

  it("supports prefix search while typing", () => {
    expect(index.search("autoenc").length).toBeGreaterThan(0);
  });

  it("tolerates a single typo for longer words", () => {
    expect(withinOneEdit("harmonisation", "harmonization")).toBe(true);
    expect(index.search("harmonization")[0]?.id).toBe("4");
  });

  it("requires every term to match (AND)", () => {
    expect(index.search("vae cloud")).toEqual([]);
  });

  it("filters by document type and returns snippets", () => {
    const results = index.search("vae", { types: ["project"] });
    expect(results.map((r) => r.id)).toEqual(["3"]);
    expect(results[0]?.snippet).toContain("Benchmarking");
  });

  it("returns nothing for empty queries", () => {
    expect(index.search("  ")).toEqual([]);
    expect(index.search("a")).toEqual([]);
  });
});
