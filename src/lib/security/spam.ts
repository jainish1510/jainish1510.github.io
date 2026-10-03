/**
 * Lightweight, explainable spam heuristics. The score decides the initial
 * moderation status; nothing is auto-published without passing moderation.
 */
const SPAM_TERMS = [
  "viagra",
  "casino",
  "crypto giveaway",
  "free money",
  "seo services",
  "backlinks",
  "loan offer",
  "work from home",
  "click here",
  "buy followers",
  "escort",
];

export type SpamVerdict = { score: number; reasons: string[] };

export function scoreSpam(input: { name: string; content: string; email?: string | null }): SpamVerdict {
  const reasons: string[] = [];
  let score = 0;
  const text = `${input.name} ${input.content}`.toLowerCase();

  const links = (input.content.match(/https?:\/\/|www\./gi) ?? []).length;
  if (links >= 3) {
    score += 3;
    reasons.push("many links");
  } else if (links > 0) {
    score += 1;
    reasons.push("contains link");
  }
  for (const term of SPAM_TERMS) {
    if (text.includes(term)) {
      score += 3;
      reasons.push(`term: ${term}`);
    }
  }
  if (/(.)\1{9,}/.test(input.content)) {
    score += 2;
    reasons.push("repeated characters");
  }
  const letters = input.content.replace(/[^a-z]/gi, "");
  if (letters.length > 20 && letters.replace(/[^A-Z]/g, "").length / letters.length > 0.7) {
    score += 2;
    reasons.push("mostly uppercase");
  }
  if (/https?:\/\//i.test(input.name)) {
    score += 3;
    reasons.push("link in name");
  }
  if (input.content.trim().length < 2) {
    score += 2;
    reasons.push("empty");
  }
  return { score, reasons };
}

export const SPAM_THRESHOLD = 4;
