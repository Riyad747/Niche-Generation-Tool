/**
 * Prompt templates for the niche pipeline. Kept as pure functions so they're
 * easy to review, version, and snapshot-test independently of the model.
 */

const ANALYST_ROLE =
  'You are a microstock market analyst for AI creators who sell on Adobe Stock, Shutterstock, ' +
  'Freepik, Creative Market and Envato, generating with MidJourney, Flux, ChatGPT and Vectorizer.ai.';

export function expansionPrompt(niche: string, kindsWanted: number): { system: string; user: string } {
  return {
    system: ANALYST_ROLE,
    user: `Expand the niche "${niche}" into up to ${kindsWanted} concrete, commercially viable child niches.
Cover a spread across these kinds: sub, related, adjacent, emerging, future.
Prefer specific, sellable niches (e.g. "telemedicine app icons") over vague ones ("health").
For each, give a short description (why it sells / who buys it).
Return JSON: { "children": [ { "name", "description", "kind" } ] }.`,
  };
}

export function assessmentPrompt(niche: string, description?: string): { system: string; user: string } {
  return {
    system: ANALYST_ROLE,
    user: `Assess the microstock niche "${niche}"${description ? ` (${description})` : ''}.
Estimate each factor 0-100 based on your knowledge of the stock market and current AI tooling.

- demand: buyer demand / commercial search interest
- competition: how saturated the market already is (100 = extremely saturated)
- trend: momentum right now (100 = surging)
- seasonality: how strongly seasonal (0 = evergreen, 100 = highly seasonal)
- commercialSafety: freedom from trademark/brand/celebrity/IP risk (100 = totally safe)
- approvalProbability: likelihood Adobe Stock approves quality assets in this niche
- growthState: one of EMERGING | RISING | EXPLOSIVE | STABLE | DECLINING
- aiCompat: difficulty (0-100, higher = harder for text-to-image AI) for:
    complexity, textRequirements, diagramRequirements, consistencyRequirements, objectCount, detailDensity
- vector: suitability signals (0-100) for Vectorizer.ai:
    edgeSimplicity, shapeSeparation, colorSimplicity (higher = better),
    noiseRisk, detailDensity (higher = worse)

Return JSON matching exactly the fields above, plus "estimated": true.`,
  };
}

export function contentPrompt(niche: string, description?: string): { system: string; user: string } {
  return {
    system: ANALYST_ROLE,
    user: `For the niche "${niche}"${description ? ` (${description})` : ''}, generate microstock-ready content.

Return JSON:
{
  "keywords": [ { "term", "kind", "score" } ],   // ~18 keywords across kinds:
     // PRIMARY, SECONDARY, LONG_TAIL, SEMANTIC, COMMERCIAL, INTENT, ADOBE, SHUTTERSTOCK
     // score = commercial value 0-100
  "titles":   [ { "text", "kind" } ],            // ~8 titles across kinds:
     // SEO, ADOBE_STOCK, SHUTTERSTOCK, FREEPIK, COMMERCIAL (respect each platform's style)
  "ideas":    [ { "title", "assetType", "prompt" } ]  // ~10 asset ideas, assetType PNG|VECTOR|ILLUSTRATION,
     // prompt = a ready-to-use MidJourney/Flux prompt
}
Keep everything commercially safe (no brands, logos, celebrities, trademarked characters).`,
  };
}
