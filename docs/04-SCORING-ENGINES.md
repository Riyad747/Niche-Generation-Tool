# 04 — Scoring & Analysis Engines

Every score is an **integer 0–100**. Each engine has a **deterministic core** (heuristics over
signals we can measure) blended with an **AI-assisted estimate** (Claude judgment where no hard
signal exists). Blending keeps outputs explainable and cheap to re-run while still capturing nuance.

General pattern per engine:
```
score = clamp( round( w_hard * hardSignal + w_ai * aiEstimate ), 0, 100 )
```
`hardSignal` and `aiEstimate` are each normalized to 0–100 first. Weights live in `src/config/weights.ts`
so they're tunable without code changes. Every score is stored with its `scoreBreakdown` (inputs,
weights, signal timestamps, model, version).

---

## Unified Opportunity Score

The spec formula, made bounded and stable:

```
raw = Demand + Trend + AiCompat + VectorCompat + CommercialSafety + ApprovalProbability
opportunityScore = clamp( round( (raw / 6) * competitionFactor * seasonalityFactor ), 0, 100 )

competitionFactor  = 1 - (competitionScore / 100) * COMP_WEIGHT   // high competition drags it down
seasonalityFactor  = 0.85 + 0.15 * (seasonalityScore / 100)       // mild seasonal boost
```
- Averaging the six positive scores keeps the result in 0–100 (the spec's bare `/Competition`
  division is unbounded and blows up near zero competition — we convert it to a bounded penalty).
- `COMP_WEIGHT` (default 0.9) tunes how punishing saturation is.
- A **pure-spec mode** is available for debugging: `sum(positives) / max(competitionScore,1)`.

Ranking = `ORDER BY opportunityScore DESC`. "Underserved" = high opportunityScore **and**
`saturation IN (GREEN, YELLOW)`.

---

## 1. Demand Score
Signals: stock-platform result *view/download* proxies, search volume (Google/Pinterest),
Reddit/community mention frequency, keyword commercial intent.
`hard` = normalized blended search+engagement volume. `ai` = Claude estimate of buyer demand for the niche.

## 2. Competition Score
Signals: result counts across Adobe/Shutterstock/Freepik/Creative Market/Envato for the niche's
canonical queries, contributor density, visual-similarity density (pgvector clustering of top results).
Higher = more saturated. Feeds Saturation Engine + Opportunity penalty.

## 3. Trend Score → see Trend Engine
## 4. Seasonality Score
Signals: 24-month trend autocorrelation / month-of-year peaks. Flags evergreen vs seasonal;
feeds `seasonalityFactor` and Content-Factory timing advice.

## 5. AI Compatibility Engine (`ai-compat.ts`)
Predicts how well MidJourney / Flux / ChatGPT Image / Stable Diffusion can produce the niche.
Factors (each 0–100, penalties): **complexity, text requirements, diagram requirements,
consistency requirements, object count, detail density**.
```
aiCompatScore = clamp(100 - Σ penalty_i * weight_i, 0, 100)
```
Text/diagram/consistency requirements are the biggest penalties (current models struggle with
in-image text, technical diagrams, and character consistency). Returns per-tool sub-scores too.

## 6. Vectorization Suitability Engine (`vectorization.ts`)
Predicts Vectorizer.ai success. Factors: **edge simplicity, shape separation, noise risk,
color simplicity, detail density**.
```
vectorCompatScore = clamp( wEdge*edge + wShape*shape + wColor*colorSimplicity
                           - wNoise*noise - wDetail*detail , 0, 100)
```
Flat, clean, few-color, high-contrast subjects score highest; photographic/noisy/gradient-heavy low.

## 7. Saturation Engine (`saturation.ts`)
Produces a heatmap. Inputs: search result count, visual-similarity density (pgvector), asset
repetition, style repetition.
```
saturationIndex 0-100 → level:
  0-25 GREEN (underserved) · 26-50 YELLOW · 51-75 ORANGE · 76-100 RED (overserved)
```
Output: per-niche level + a grid heatmap (niche × platform) for the UI.

## 8. Trend Engine (`trend.ts`)
Sources: Google Trends, Pinterest, Reddit, industry/technology feeds. Fits slope + acceleration on
normalized 24-month series.
```
GrowthState: EMERGING | RISING | EXPLOSIVE | STABLE | DECLINING
trendScore = f(recent slope, acceleration, absolute level)
```
Cached per term (12–24h). Shared globally across users.

## 9. Market Gap Detector (`gap-detector.ts`)
Cross-references demand vs competition across the niche tree (and, in Mode 4, vs the user's
portfolio embeddings). Buckets: **overserved, underserved, unexplored sub-niche, future**.
Underserved = high demand/trend + GREEN/YELLOW saturation + (Mode 4) not present in portfolio.

## 10. Content Factory Planner (`content-factory.ts`)
Per opportunity estimates: **production time** (from AI+vector compat & asset type),
**approval probability** (Approval Predictor), **sales potential** (Demand×Trend÷Competition),
**portfolio size needed**, **scaling potential** (how many variations the niche supports).

## 11. Prompt Generator Engine (`prompt-generator.ts`)
Generates MidJourney / Flux / Vector / Illustration prompts, variations, packs, templates, and
**expansion trees**. Claude-driven, seeded by niche + winning-style analysis; every prompt runs
through the Validator before it's stored.

## 12. Prompt Validator (`prompt-validator.ts`)
Checks commercial value, AI-friendliness (via AI-Compat), vector-friendliness (via Vectorization),
approval safety (via Compliance). Output: **PASS / WARNING / FAIL** with per-dimension 0–100.

## 13. Compliance Engine (`compliance.ts`)
Detects trademark, copyright, logo, brand, character, celebrity risk (keyword + AI judgment against
known-risk patterns). Output per-dimension + overall **SAFE / WARNING / HIGH_RISK**. Gate: HIGH_RISK
opportunities are flagged and down-ranked.

## 14. Adobe Approval Predictor (`approval-predictor.ts`)
Combines quality, competition, compliance, technical issues, similarity risk into
**approvalProbability 0–100**. Similarity risk uses pgvector distance to existing catalog/portfolio.

## 15. Keyword Engine (`keyword.ts`)
Generates primary/secondary/long-tail/semantic/commercial/intent + Adobe- & Shutterstock-tuned
keyword sets, each scored for commercial value; de-duplicated and ranked.

## 16. Title Engine (`title.ts`)
Generates SEO / Adobe / Shutterstock / Freepik / commercial titles honoring each platform's length
and style constraints.

---

## Signal sourcing & honesty
Several signals (exact platform download counts, private analytics) are **not publicly available**.
Where a hard signal is unavailable, the engine falls back to the **AI estimate** and the
`scoreBreakdown` marks the input as `estimated: true`. The UI shows a confidence indicator so
creators know which scores are measured vs inferred. This is deliberate — never present an inferred
number as a measured one.

## Re-scoring & versioning
`scoreVersion` on each row lets a formula change trigger a background re-score without losing
history. Weights and formulas are pure functions in `lib/engines`, unit-tested with fixture inputs
so score changes are reviewable in diffs.
